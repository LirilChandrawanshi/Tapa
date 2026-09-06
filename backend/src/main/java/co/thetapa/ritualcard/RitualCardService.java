package co.thetapa.ritualcard;

import co.thetapa.common.NotFoundException;
import co.thetapa.content.Article;
import co.thetapa.content.ArticleRepository;
import co.thetapa.content.ArticleStatus;
import co.thetapa.panchang.Observance;
import co.thetapa.panchang.ObservanceRepository;
import co.thetapa.panchang.PanchangDay;
import co.thetapa.panchang.PanchangDayRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.BrowserType;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HexFormat;
import java.util.Locale;

/**
 * Builds the ritual-card model, renders it to HTML (Thymeleaf) and to PDF
 * (Playwright/Chromium), stores the PDF under {@code {tapa.media.root}/cards/}
 * and tracks freshness in the {@code ritual_cards} collection via a sha256
 * variant hash of the CardModel JSON. Regeneration happens only when the hash
 * changes (lazy check on download, eager on publish/panchang events).
 */
@Service
public class RitualCardService {

    private static final Logger log = LoggerFactory.getLogger(RitualCardService.class);
    private static final String TEMPLATE = "ritualcard/card";
    private static final int QR_SIZE_PX = 256;

    private final ArticleRepository articles;
    private final ObservanceRepository observances;
    private final PanchangDayRepository panchangDays;
    private final RitualCardRepository cards;
    private final SpringTemplateEngine templateEngine;
    /** Own mapper: hash must be stable regardless of app-level Jackson config drift. */
    private final ObjectMapper hashMapper = new ObjectMapper();
    private final Path mediaRoot;

    /** Shared Playwright browser — expensive to launch, lazily created, closed on shutdown. */
    private final Object browserLock = new Object();
    private Playwright playwright;
    private Browser browser;

    public RitualCardService(ArticleRepository articles,
                             ObservanceRepository observances,
                             PanchangDayRepository panchangDays,
                             RitualCardRepository cards,
                             SpringTemplateEngine templateEngine,
                             @Value("${tapa.media.root:../media}") String mediaRoot) {
        this.articles = articles;
        this.observances = observances;
        this.panchangDays = panchangDays;
        this.cards = cards;
        this.templateEngine = templateEngine;
        this.mediaRoot = Path.of(mediaRoot);
    }

    // ---- model + html -------------------------------------------------------

    /** Assembles the card model for a (published) article, tolerating missing observance/panchang. */
    public CardModel buildModel(Article article) {
        Observance observance = article.getLinkedObservanceSlug() == null ? null
            : observances.findBySlug(article.getLinkedObservanceSlug()).orElse(null);
        LocalDate date = observance != null && observance.getDate() != null
            ? observance.getDate() : article.getObservanceDate();
        PanchangDay day = date == null ? null
            : panchangDays.findByDateAndCity(date, PanchangDay.DEFAULT_CITY).orElse(null);
        return CardModelBuilder.build(article, observance, day);
    }

    public String renderHtml(CardModel model) {
        Context context = new Context(Locale.ENGLISH);
        context.setVariable("card", model);
        context.setVariable("qr", QrCodes.dataUri(model.guideUrl(), QR_SIZE_PX));
        return templateEngine.process(TEMPLATE, context);
    }

    public String variantHash(CardModel model) {
        try {
            byte[] json = hashMapper.writeValueAsBytes(model);
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(json));
        } catch (NoSuchAlgorithmException | com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new IllegalStateException("variant hash computation failed", e);
        }
    }

    // ---- freshness + generation --------------------------------------------

    /**
     * Lazy freshness check used by the download endpoint: regenerates the PDF
     * only when the variant hash differs (or the file vanished), then returns
     * the on-disk path.
     */
    public Path ensureFresh(String articleSlug) {
        Article article = articles.findBySlugAndStatus(articleSlug, ArticleStatus.PUBLISHED)
            .orElseThrow(() -> new NotFoundException("article", articleSlug));
        CardModel model = buildModel(article);
        String hash = variantHash(model);

        RitualCard card = cards.findByArticleSlug(articleSlug).orElse(null);
        Path pdfPath = pdfPath(articleSlug);
        if (card != null && hash.equals(card.getVariantHash())
            && card.getPdfPath() != null && Files.exists(Path.of(card.getPdfPath()))) {
            return Path.of(card.getPdfPath());
        }

        byte[] pdf = renderPdf(renderHtml(model));
        try {
            Files.createDirectories(pdfPath.getParent());
            Files.write(pdfPath, pdf);
        } catch (IOException e) {
            throw new UncheckedIOException("failed to store ritual card PDF at " + pdfPath, e);
        }

        if (card == null) {
            card = new RitualCard();
            card.setArticleSlug(articleSlug);
        }
        card.setVariantHash(hash);
        card.setGeneratedAt(Instant.now());
        card.setPdfPath(pdfPath.toString());
        cards.save(card);
        log.info("ritual card regenerated: {} ({})", articleSlug, hash.substring(0, 12));
        return pdfPath;
    }

    /** Event-driven regeneration: never throws — logs and moves on. */
    public void regenerateQuietly(String articleSlug) {
        try {
            ensureFresh(articleSlug);
        } catch (NotFoundException e) {
            log.debug("ritual card regeneration skipped, article not published: {}", articleSlug);
        } catch (Exception e) {
            log.warn("ritual card regeneration failed for {}: {}", articleSlug, e.getMessage());
        }
    }

    private Path pdfPath(String slug) {
        return mediaRoot.resolve("cards").resolve(slug + ".pdf");
    }

    // ---- PDF via Playwright -------------------------------------------------

    /**
     * Renders HTML to a single-page PDF with a per-render browser context.
     * The spec mandates ONE sheet: width is fixed at A5 (105mm), height grows
     * with the content (390px CSS ≙ 105mm, so px→mm scales by 105/390).
     */
    public byte[] renderPdf(String html) {
        Browser b = sharedBrowser();
        try (BrowserContext context = b.newContext(
            new Browser.NewContextOptions().setViewportSize(390, 844))) {
            Page page = context.newPage();
            page.setContent(html, new Page.SetContentOptions()
                .setWaitUntil(com.microsoft.playwright.options.WaitUntilState.LOAD));
            double contentPx = ((Number) page.evaluate("document.documentElement.scrollHeight")).doubleValue();
            double heightMm = Math.max(148, Math.ceil(contentPx * 105.0 / 390.0) + 2);
            return page.pdf(new Page.PdfOptions()
                .setWidth("105mm")
                .setHeight(heightMm + "mm")
                .setPrintBackground(true));
        }
    }

    private Browser sharedBrowser() {
        synchronized (browserLock) {
            if (browser != null && browser.isConnected()) {
                return browser;
            }
            try {
                if (playwright == null) {
                    playwright = Playwright.create();
                }
                browser = playwright.chromium().launch(new BrowserType.LaunchOptions().setHeadless(true));
                return browser;
            } catch (RuntimeException e) {
                throw new IllegalStateException(
                    "Playwright Chromium launch failed — the browser bundle is probably not installed. "
                        + "Run: mvn exec:java -e -D exec.mainClass=com.microsoft.playwright.CLI "
                        + "-D exec.args=\"install chromium\" (cause: " + e.getMessage() + ")", e);
            }
        }
    }

    @PreDestroy
    void shutdown() {
        synchronized (browserLock) {
            if (browser != null) {
                try { browser.close(); } catch (RuntimeException ignored) { }
                browser = null;
            }
            if (playwright != null) {
                try { playwright.close(); } catch (RuntimeException ignored) { }
                playwright = null;
            }
        }
    }
}
