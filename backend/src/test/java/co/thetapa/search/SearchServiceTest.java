package co.thetapa.search;

import co.thetapa.booking.PujaType;
import co.thetapa.booking.PujaTypeRepository;
import co.thetapa.commerce.Product;
import co.thetapa.commerce.ProductRepository;
import co.thetapa.content.Article;
import co.thetapa.content.ArticleRepository;
import co.thetapa.content.ArticleStatus;
import co.thetapa.content.ArticleType;
import co.thetapa.flags.FeatureFlagService;
import co.thetapa.glossary.GlossaryRepository;
import co.thetapa.glossary.GlossaryTerm;
import co.thetapa.panchang.ObservanceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * W2-B search upgrade: Devanagari folding (G38), the two new result groups
 * (pujas / downloads, #36 #48) with their flag gates, and related searches (#123).
 */
class SearchServiceTest {

    private GlossaryRepository glossary;
    private ArticleRepository articles;
    private ObservanceRepository observances;
    private ProductRepository products;
    private PujaTypeRepository pujaTypes;
    private FeatureFlagService flags;
    private SearchService service;

    @BeforeEach
    void setUp() {
        glossary = mock(GlossaryRepository.class);
        articles = mock(ArticleRepository.class);
        observances = mock(ObservanceRepository.class);
        products = mock(ProductRepository.class);
        pujaTypes = mock(PujaTypeRepository.class);
        flags = mock(FeatureFlagService.class);
        SearchQueryRepository queryLog = mock(SearchQueryRepository.class);
        PopularSearchRepository popular = mock(PopularSearchRepository.class);

        when(glossary.findAllByOrderByTermAsc()).thenReturn(List.of());
        when(articles.findByStatus(eq(ArticleStatus.PUBLISHED), any()))
            .thenReturn(new PageImpl<>(List.of()));
        when(observances.findByDateGreaterThanEqualOrderByDateAsc(any())).thenReturn(List.of());
        when(products.findAllByOrderByFestivalDateAsc()).thenReturn(List.of());
        when(pujaTypes.findByActiveTrueOrderByNameAsc()).thenReturn(List.of());
        when(flags.all()).thenReturn(Map.of());
        when(popular.findByActiveTrueOrderByOrderAsc()).thenReturn(List.of());

        service = new SearchService(glossary, articles, observances, queryLog, popular,
            products, pujaTypes, flags);
    }

    /* ── Devanagari folding (G38) ── */

    @Test
    void devanagariEkadashiFoldsToLatin() {
        assertTrue(SearchService.tokenize("एकादशी").contains("ekadashi"));
    }

    @Test
    void devanagariEkadashiQueryFindsLatinGlossaryTerm() {
        when(glossary.findAllByOrderByTermAsc()).thenReturn(List.of(
            term("ekadashi", "Ekadashi", "The eleventh tithi of each paksha, observed as a fast.")));

        var response = service.search("एकादशी");

        assertEquals(1, response.glossary().size());
        assertEquals("Ekadashi", response.glossary().get(0).title());
    }

    @Test
    void devanagariKarwaChauthMatchesRomanizedName() {
        assertTrue(service.matches(SearchService.tokenize("करवा चौथ"), "Karwa Chauth"));
    }

    /* ── group gating (#36 / #48) ── */

    @Test
    void pujaGroupIsEmptyWhileThePurohitFlagIsOff() {
        when(pujaTypes.findByActiveTrueOrderByNameAsc()).thenReturn(List.of(puja()));

        var response = service.search("rudrabhishek");

        assertTrue(response.pujas().isEmpty(), "flag off → no bookable pujas surface");
    }

    @Test
    void pujaGroupSurfacesOnceThePurohitFlagIsOn() {
        when(flags.all()).thenReturn(Map.of(FeatureFlagService.PUROHIT_TAB_VISIBLE, true));
        when(pujaTypes.findByActiveTrueOrderByNameAsc()).thenReturn(List.of(puja()));

        var response = service.search("rudrabhishek");

        assertEquals(1, response.pujas().size());
        var hit = response.pujas().get(0);
        assertEquals("/pujan-with-purohit/rudrabhishek", hit.href());
        assertTrue(hit.subtitle().contains("₹2100"));
    }

    @Test
    void kitGroupStaysGatedByTheKitsFlag() {
        when(products.findAllByOrderByFestivalDateAsc()).thenReturn(List.of(kit()));

        assertTrue(service.search("deepawali kit").kits().isEmpty());

        when(flags.all()).thenReturn(Map.of(FeatureFlagService.KITS_LAUNCHED, true));
        assertEquals(1, service.search("deepawali kit").kits().size());
    }

    /* ── downloads group (#36) ── */

    @Test
    void publishedRitualGuideSurfacesItsSamagriCardDownload() {
        when(articles.findByStatus(eq(ArticleStatus.PUBLISHED), any()))
            .thenReturn(new PageImpl<>(List.of(guide("ekadashi-vrat", "Ekadashi Vrat"))));

        var response = service.search("ekadashi");

        assertEquals(1, response.downloads().size());
        var hit = response.downloads().get(0);
        assertEquals("/api/v1/cards/ekadashi-vrat.pdf", hit.href());
        assertEquals("Samagri checklist card — PDF download", hit.subtitle());
    }

    /* ── related searches (#123) ── */

    @Test
    void relatedSearchesDeriveFromTheMatchedGlossaryTerm() {
        // Chaturmas sorts first and matches on its definition only — the
        // related-search anchor must still be the term the query names.
        when(glossary.findAllByOrderByTermAsc()).thenReturn(List.of(
            term("chaturmas", "Chaturmas", "Four months holding many an ekadashi fast."),
            term("ekadashi", "Ekadashi", "The eleventh tithi of each paksha.")));

        var response = service.search("ekadashi");

        assertEquals(List.of("Ekadashi meaning", "Ekadashi vidhi",
            "Ekadashi dates 2026", "Ekadashi samagri"), response.relatedSearches());
        assertFalse(!service.search("zzznotfound").relatedSearches().isEmpty(),
            "no glossary match → no related searches");
    }

    /* ── fixtures ── */

    private static GlossaryTerm term(String slug, String name, String definition) {
        GlossaryTerm t = new GlossaryTerm();
        t.setSlug(slug);
        t.setTerm(name);
        t.setDefinition(definition);
        return t;
    }

    private static PujaType puja() {
        PujaType p = new PujaType();
        p.setSlug("rudrabhishek");
        p.setName("Rudrabhishek");
        p.setDescription("Abhishek of Shiva with panchamrit, performed by a purohit at home.");
        p.setVariants(List.of(new PujaType.Variant("solo", "Single purohit", "2h", "home", 210000)));
        return p;
    }

    private static Product kit() {
        Product p = new Product();
        p.setSlug("deepawali-pujan-kit");
        p.setTitle("Deepawali Pujan Kit");
        p.setDescription("Everything for the Lakshmi pujan, in one box.");
        p.setAvailability(Product.Availability.LIVE);
        p.setPricePaise(129900);
        p.setItems(List.of());
        return p;
    }

    private static Article guide(String slug, String title) {
        Article a = new Article();
        a.setSlug(slug);
        a.setType(ArticleType.RITUAL_GUIDE);
        a.setStatus(ArticleStatus.PUBLISHED);
        a.setCategory("ritual-guides");
        a.setSubCategory("vrat-fasting");
        a.setLang(Map.of("en", new Article.ArticleContent(
            title, null, "How to observe the fast", null, List.of(), null)));
        return a;
    }
}
