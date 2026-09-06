package co.thetapa.ritualcard;

import com.microsoft.playwright.Browser;
import com.microsoft.playwright.BrowserContext;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.Playwright;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Real-PDF smoke test. Excluded from the default surefire run (tag "pdf" is
 * in excludedGroups) and additionally env-guarded because Playwright needs its
 * downloaded Chromium bundle. Run with:
 * TAPA_PDF_TESTS=true mvn test -Dgroups=pdf -DexcludedGroups=
 */
@Tag("pdf")
@EnabledIfEnvironmentVariable(named = "TAPA_PDF_TESTS", matches = "true")
class RitualCardPdfTest {

    @Test
    void rendersSinglePageA5Pdf() {
        CardFixtures.Fixture fixture = CardFixtures.sawanSomwar();
        CardModel model = CardModelBuilder.build(fixture.article(), fixture.observance(), fixture.day());

        ClassLoaderTemplateResolver resolver = new ClassLoaderTemplateResolver();
        resolver.setPrefix("templates/");
        resolver.setSuffix(".html");
        resolver.setTemplateMode(TemplateMode.HTML);
        resolver.setCharacterEncoding("UTF-8");
        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.setTemplateResolver(resolver);

        Context context = new Context(Locale.ENGLISH);
        context.setVariable("card", model);
        context.setVariable("qr", QrCodes.dataUri(model.guideUrl(), 256));
        String html = engine.process("ritualcard/card", context);

        try (Playwright playwright = Playwright.create();
             Browser browser = playwright.chromium().launch();
             BrowserContext browserContext = browser.newContext()) {
            Page page = browserContext.newPage();
            page.setContent(html);
            byte[] pdf = page.pdf(new Page.PdfOptions()
                .setPreferCSSPageSize(true)
                .setWidth("105mm")
                .setHeight("148mm")
                .setPrintBackground(true));
            assertTrue(pdf.length > 1000, "PDF suspiciously small");
            assertTrue(new String(pdf, 0, 5, StandardCharsets.US_ASCII).startsWith("%PDF-"),
                "not a PDF header");
        }
    }
}
