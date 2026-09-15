package co.thetapa.content;

import co.thetapa.common.ApiResponse;
import co.thetapa.flags.FeatureFlagService;
import co.thetapa.glossary.GlossaryRepository;
import co.thetapa.panchang.Observance;
import co.thetapa.panchang.ObservanceRepository;
import co.thetapa.panchang.PanchangService;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Composed payload for the homepage's locked 12-section order — one round trip.
 * Sections the frontend renders purely from copy (announce bar, trust badges,
 * method band, footer) carry no data here.
 */
@RestController
@RequestMapping("/api/v1/home")
public class HomeController {

    private final HomeService service;

    public HomeController(HomeService service) {
        this.service = service;
    }

    @GetMapping
    public ApiResponse<Map<String, Object>> home() {
        return ApiResponse.ok(service.payload());
    }

    @Service
    public static class HomeService {

        private final ArticleService articles;
        private final ArticleRepository articleRepo;
        private final PanchangService panchang;
        private final FeatureFlagService flags;
        private final GlossaryRepository glossary;
        private final co.thetapa.homesections.HomeSectionService homeSections;
        private final co.thetapa.homesections.HomePromoService homePromos;
        private final ObservanceRepository observances;
        private final co.thetapa.imagery.DeityImageService imagery;

        public HomeService(ArticleService articles, ArticleRepository articleRepo,
                           PanchangService panchang, FeatureFlagService flags,
                           GlossaryRepository glossary,
                           co.thetapa.homesections.HomeSectionService homeSections,
                           co.thetapa.homesections.HomePromoService homePromos,
                           ObservanceRepository observances,
                           co.thetapa.imagery.DeityImageService imagery) {
            this.imagery = imagery;
            this.homeSections = homeSections;
            this.homePromos = homePromos;
            this.observances = observances;
            this.articles = articles;
            this.articleRepo = articleRepo;
            this.panchang = panchang;
            this.flags = flags;
            this.glossary = glossary;
        }

        @Cacheable("home")
        public Map<String, Object> payload() {
            Map<String, Object> payload = new LinkedHashMap<>();
            LocalDate today = LocalDate.now(PanchangService.IST);
            Map<String, co.thetapa.homesections.HomeSection> sections = homeSections.publicMap();

            // 3a. the occasion leading the hero — today's festival, or the one
            //     close enough ahead to be worth preparing for. Derived, so it
            //     is right every morning without anyone touching the CMS.
            Map<String, Object> occasion = heroOccasion(sections, today);
            if (occasion != null) {
                payload.put("heroOccasion", occasion);
            }

            // 3b. hero — CMS-driven featured rotation. A guide tied to a date
            //     stops leading the page once that date has passed: it was
            //     featured for the occasion, and the occasion is over. Undated
            //     guides are evergreen and stay until un-featured.
            payload.put("hero", articles.featured().stream()
                .filter(a -> a.getObservanceDate() == null
                    || !a.getObservanceDate().isBefore(today))
                .limit(4)
                .map(HomeService::heroCard)
                .toList());
            // 5. panchang first fold — live with cached fallback baked into the service
            payload.put("panchangToday", panchang.today(null));
            payload.put("nextObservances", panchang.upcoming(4));
            // 8. from ritual guides rail — curated = featured beyond hero, else latest
            payload.put("guidesRail", articles.listPublished("ritual-guides", null, 0, 4).getContent()
                .stream()
                .peek(a -> a.setResolvedImageId(imagery.imageForArticle(a)))
                .map(HomeService::heroCard)
                .toList());
            // 11. explore-by-category live counts
            payload.put("counts", Map.of(
                "ritualGuides", articles.publishedCount("ritual-guides"),
                "dharmicConcepts", articles.publishedCount("dharmic-concepts"),
                "glossaryTerms", glossary.count()
            ));
            // 3/7/9/10/11. CMS-editable band copy, keyed by section
            payload.put("sections", sections);
            // editor-placed banners / offers / product pushes, keyed by slot
            payload.put("promos", homePromos.liveByPlacement());
            // 2/6/9. phase gates
            payload.put("flags", flags.all());
            return payload;
        }

        /**
         * The observance that should lead the hero, or null when none is close
         * enough. "Close enough" is {@code leadDays} from the hero-occasion
         * section — 0 is the day itself, 1 also catches tomorrow's festival the
         * morning before, which is when people actually prepare for it.
         *
         * <p>Everything the slide needs is resolved here, including the guide's
         * real path: the observance stores only a slug, and the article's own
         * sub-category is what makes the canonical URL.</p>
         */
        private Map<String, Object> heroOccasion(
            Map<String, co.thetapa.homesections.HomeSection> sections, LocalDate today) {

            co.thetapa.homesections.HomeSection cfg = sections.get("hero-occasion");
            if (cfg == null || !cfg.isPublished()) {
                return null;
            }
            if (!"true".equalsIgnoreCase(field(cfg, "enabled", "true"))) {
                return null;
            }
            int leadDays = parseLeadDays(field(cfg, "leadDays", "1"));

            // Verified only — the same bar the Circle applies before it will
            // send a date to anyone's phone (CircleReminderScheduler). It would
            // be incoherent to refuse an unverified date over WhatsApp and then
            // make it the largest thing on the homepage, under a panchang card
            // that says every date is checked by hand.
            List<Observance> upcoming =
                observances.findByDateGreaterThanEqualOrderByDateAsc(today);
            Observance next = upcoming.stream()
                .filter(Observance::isVerified)
                .filter(o -> !o.getDate().isAfter(today.plusDays(leadDays)))
                .findFirst()
                .orElse(null);
            if (next == null) {
                return null;
            }

            Map<String, Object> out = new LinkedHashMap<>();
            out.put("slug", next.getSlug());
            out.put("name", next.getName());
            out.put("nameHi", next.getNameHi());
            out.put("date", next.getDate().toString());
            out.put("tithiLabel", next.getTithiLabel());
            out.put("blurb", next.getBlurb());
            out.put("deity", next.getDeity());
            out.put("countdownDays", (int) today.until(next.getDate()).getDays());
            out.put("verified", next.isVerified());

            // A linked guide gives the canonical article path; without one the
            // occasion's own page is the honest destination.
            String articleSlug = next.getArticleSlug();
            Article guide = articleSlug == null || articleSlug.isBlank()
                ? null
                : articleRepo.findBySlug(articleSlug).orElse(null);
            if (guide != null) {
                out.put("articleSlug", guide.getSlug());
                out.put("href", articlePath(guide));
            } else {
                out.put("href", "/panchang/o/" + next.getSlug());
            }
            return out;
        }

        /** Canonical article path — mirrors the frontend's articleHref. */
        private static String articlePath(Article a) {
            String base = "dharmic-concepts".equals(a.getCategory())
                ? "/dharmic-concepts"
                : "/ritual-guides";
            String sub = a.getSubCategory() == null ? "all" : a.getSubCategory();
            return base + "/" + sub + "/" + a.getSlug();
        }

        private static String field(co.thetapa.homesections.HomeSection s,
                                    String key, String fallback) {
            String v = s.getFields().get(key);
            return v == null || v.isBlank() ? fallback : v;
        }

        /** A bad value in the CMS must not take the hero down. */
        private static int parseLeadDays(String raw) {
            try {
                return Math.max(0, Math.min(30, Integer.parseInt(raw.trim())));
            } catch (NumberFormatException e) {
                return 1;
            }
        }

        private static Map<String, Object> heroCard(Article a) {
            var en = a.getLang().get("en");
            Map<String, Object> card = new LinkedHashMap<>();
            card.put("slug", a.getSlug());
            card.put("title", en.title());
            card.put("subtitle", en.heroSubtitle());
            card.put("category", a.getCategory());
            card.put("subCategory", a.getSubCategory());
            card.put("hueClass", a.getHueClass());
            card.put("readMinutes", a.getReadMinutes());
            card.put("observanceDate", a.getObservanceDate());
            card.put("dpbTag", a.getDpb() == null ? null : a.getDpb().classification());
            card.put("dpbScore", a.getDpb() == null ? null : a.getDpb().confidenceScore());
            // the hero's "Listen instead" button is pointless without one
            card.put("hasAudio", en.audioGuideMediaId() != null
                && !en.audioGuideMediaId().isBlank());
            card.put("imageId", a.getResolvedImageId());
            return card;
        }
    }
}
