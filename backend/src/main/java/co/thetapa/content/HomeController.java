package co.thetapa.content;

import co.thetapa.common.ApiResponse;
import co.thetapa.flags.FeatureFlagService;
import co.thetapa.glossary.GlossaryRepository;
import co.thetapa.panchang.PanchangService;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
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

        public HomeService(ArticleService articles, ArticleRepository articleRepo,
                           PanchangService panchang, FeatureFlagService flags,
                           GlossaryRepository glossary) {
            this.articles = articles;
            this.articleRepo = articleRepo;
            this.panchang = panchang;
            this.flags = flags;
            this.glossary = glossary;
        }

        @Cacheable("home")
        public Map<String, Object> payload() {
            Map<String, Object> payload = new LinkedHashMap<>();
            // 3. hero — CMS-driven featured rotation, never static
            payload.put("hero", articles.featured().stream().limit(4).map(HomeService::heroCard).toList());
            // 5. panchang first fold — live with cached fallback baked into the service
            payload.put("panchangToday", panchang.today(null));
            payload.put("nextObservances", panchang.upcoming(4));
            // 8. from ritual guides rail — curated = featured beyond hero, else latest
            payload.put("guidesRail", articles.listPublished("ritual-guides", null, 0, 4).getContent()
                .stream().map(HomeService::heroCard).toList());
            // 11. explore-by-category live counts
            payload.put("counts", Map.of(
                "ritualGuides", articles.publishedCount("ritual-guides"),
                "dharmicConcepts", articles.publishedCount("dharmic-concepts"),
                "glossaryTerms", glossary.count()
            ));
            // 2/6/9. phase gates
            payload.put("flags", flags.all());
            return payload;
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
            return card;
        }
    }
}
