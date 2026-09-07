package co.thetapa.search;

import co.thetapa.content.Article;
import co.thetapa.content.ArticleRepository;
import co.thetapa.content.ArticleStatus;
import co.thetapa.glossary.GlossaryRepository;
import co.thetapa.glossary.GlossaryTerm;
import co.thetapa.panchang.Observance;
import co.thetapa.panchang.ObservanceRepository;
import co.thetapa.search.SearchModels.Hit;
import co.thetapa.search.SearchModels.SearchResponse;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Mongo-backed search with the PRD's hard ranking rule baked in:
 * glossary definition → guides → pujas → dates → downloads → kits.
 * Knowledge first, commerce last (pujas and kits are flag-gated).
 *
 * Fuzziness is a normalized-token + edit-distance pass over a small corpus
 * (hundreds of documents) — plenty for Phase 1. A Typesense-backed provider
 * can replace the matching internals without touching the response contract.
 */
@Service
public class SearchService {

    /** transliteration variants folded into canonical spellings before matching */
    private static final Map<String, String> SYNONYMS = Map.ofEntries(
        Map.entry("pooja", "puja"),
        Map.entry("poojan", "pujan"),
        Map.entry("ekadasi", "ekadashi"),
        Map.entry("ekadashii", "ekadashi"),
        Map.entry("agyaras", "ekadashi"),
        Map.entry("chouth", "chauth"),
        Map.entry("karva", "karwa"),
        Map.entry("shrawan", "shravana"),
        Map.entry("sawan", "shravana"),
        Map.entry("saawan", "shravana"),
        Map.entry("vrata", "vrat"),
        Map.entry("fast", "vrat"),
        Map.entry("rudrabishek", "rudrabhishek"),
        Map.entry("diwali", "deepawali")
    );

    private final GlossaryRepository glossary;
    private final ArticleRepository articles;
    private final ObservanceRepository observances;
    private final SearchQueryRepository queryLog;
    private final PopularSearchRepository popular;
    private final co.thetapa.commerce.ProductRepository products;
    private final co.thetapa.booking.PujaTypeRepository pujaTypes;
    private final co.thetapa.flags.FeatureFlagService flags;

    public SearchService(GlossaryRepository glossary, ArticleRepository articles,
                         ObservanceRepository observances, SearchQueryRepository queryLog,
                         PopularSearchRepository popular,
                         co.thetapa.commerce.ProductRepository products,
                         co.thetapa.booking.PujaTypeRepository pujaTypes,
                         co.thetapa.flags.FeatureFlagService flags) {
        this.glossary = glossary;
        this.articles = articles;
        this.observances = observances;
        this.queryLog = queryLog;
        this.popular = popular;
        this.products = products;
        this.pujaTypes = pujaTypes;
        this.flags = flags;
    }

    public SearchResponse search(String rawQuery) {
        String query = rawQuery == null ? "" : rawQuery.trim();
        Set<String> tokens = tokenize(query);

        List<Hit> glossaryHits = new ArrayList<>();
        List<Hit> guideHits = new ArrayList<>();
        List<Hit> dateHits = new ArrayList<>();
        List<Hit> downloadHits = new ArrayList<>();

        if (!tokens.isEmpty()) {
            for (GlossaryTerm term : glossary.findAllByOrderByTermAsc()) {
                if (matches(tokens, term.getTerm(), term.getTransliteration(), term.getDefinition())) {
                    glossaryHits.add(new Hit(Hit.TYPE_GLOSSARY, term.getTerm(),
                        term.getDefinition(), "/glossary#" + term.getSlug(), "h-gold", "Definition"));
                }
            }
            for (Article a : articles.findByStatus(ArticleStatus.PUBLISHED,
                org.springframework.data.domain.Pageable.unpaged())) {
                var en = a.getLang().get("en");
                if (en == null) {
                    continue;
                }
                if (matches(tokens, en.title(), en.deck(), a.getSubCategory())) {
                    guideHits.add(new Hit(Hit.TYPE_GUIDE, en.title(),
                        "Vidhi, significance, samagri",
                        "/" + a.getCategory() + "/" + a.getSubCategory() + "/" + a.getSlug(),
                        a.getHueClass(),
                        a.getDpb() == null ? null : a.getDpb().classification().name()));
                }
                // every published ritual guide has a print-ready samagri card
                if (a.getType() == co.thetapa.content.ArticleType.RITUAL_GUIDE
                    && matches(tokens, en.title())) {
                    downloadHits.add(new Hit(Hit.TYPE_DOWNLOAD, en.title(),
                        "Samagri checklist card — PDF download",
                        "/api/v1/cards/" + a.getSlug() + ".pdf",
                        a.getHueClass(), "PDF"));
                }
            }
            LocalDate today = LocalDate.now(co.thetapa.panchang.PanchangService.IST);
            for (Observance o : observances.findByDateGreaterThanEqualOrderByDateAsc(today.minusDays(30))) {
                if (matches(tokens, o.getName(), o.getSeries(), o.getTithiLabel())) {
                    dateHits.add(new Hit(Hit.TYPE_DATE, o.getName(),
                        o.getDate() + (o.getTithiLabel() == null ? "" : " · " + o.getTithiLabel()),
                        "/panchang/o/" + o.getSlug(), "h-data", o.getType().name()));
                }
            }
        }

        // bookable pujas only surface once the purohit tab is live (flag-gated)
        List<Hit> pujaHits = new ArrayList<>();
        boolean purohitVisible = Boolean.TRUE.equals(flags.all().get(
            co.thetapa.flags.FeatureFlagService.PUROHIT_TAB_VISIBLE));
        if (purohitVisible && !tokens.isEmpty()) {
            for (var puja : pujaTypes.findByActiveTrueOrderByNameAsc()) {
                if (matches(tokens, puja.getName(), puja.getDescription())) {
                    long minPaise = puja.getVariants() == null ? 0
                        : puja.getVariants().stream()
                            .mapToLong(co.thetapa.booking.PujaType.Variant::pricePaise)
                            .min().orElse(0);
                    pujaHits.add(new Hit(Hit.TYPE_PUJA, puja.getName(),
                        (minPaise > 0 ? "From ₹" + (minPaise / 100) + " · " : "")
                            + "Purohit-led, at your home",
                        "/pujan-with-purohit/" + puja.getSlug(),
                        puja.getHueClass(), "Book"));
                }
            }
        }

        // kits are always the LAST group and only surface once the shelf is live
        List<Hit> kitHits = new ArrayList<>();
        boolean kitsLaunched = Boolean.TRUE.equals(flags.all().get(
            co.thetapa.flags.FeatureFlagService.KITS_LAUNCHED));
        if (kitsLaunched && !tokens.isEmpty()) {
            for (var product : products.findAllByOrderByFestivalDateAsc()) {
                if (product.getAvailability() == co.thetapa.commerce.Product.Availability.COMING_SOON) {
                    continue;
                }
                if (matches(tokens, product.getTitle(), product.getSeason(), product.getDescription())) {
                    kitHits.add(new Hit(Hit.TYPE_KIT, product.getTitle(),
                        "₹" + (product.getPricePaise() / 100) + " · "
                            + product.getItems().size() + " items",
                        "/ritual-pujans/p/" + product.getSlug(),
                        product.getHueClass(), product.getAvailability().name()));
                }
            }
        }

        int total = glossaryHits.size() + guideHits.size() + pujaHits.size()
            + dateHits.size() + downloadHits.size() + kitHits.size();
        List<String> didYouMean = total == 0 ? suggest(query) : List.of();

        logQuery(query, total);

        return new SearchResponse(query, total,
            cap(glossaryHits), cap(guideHits), cap(pujaHits),
            cap(dateHits), cap(downloadHits), cap(kitHits),
            didYouMean, relatedSearches(glossaryHits, tokens),
            popular.findByActiveTrueOrderByOrderAsc());
    }

    /**
     * Curated companion queries for a matched glossary term — cheap static
     * composition, no extra lookups (#123). Anchored on the hit whose NAME the
     * query actually mentions (a definition-only match is a weaker anchor);
     * empty when the query matched no term.
     */
    private static List<String> relatedSearches(List<Hit> glossaryHits, Set<String> queryTokens) {
        if (glossaryHits.isEmpty()) {
            return List.of();
        }
        String term = glossaryHits.stream()
            .filter(h -> tokenize(h.title()).stream().anyMatch(
                t -> queryTokens.stream().anyMatch(q -> t.contains(q) || q.contains(t))))
            .findFirst()
            .orElse(glossaryHits.get(0))
            .title();
        return List.of(term + " meaning", term + " vidhi",
            term + " dates 2026", term + " samagri");
    }

    public List<SearchModels.SearchQuery> zeroResultQueries(int limit) {
        return queryLog.findByResultCountOrderByAtDesc(0,
            org.springframework.data.domain.PageRequest.of(0, Math.min(limit, 200)));
    }

    private void logQuery(String query, int resultCount) {
        if (query.isBlank()) {
            return;
        }
        SearchModels.SearchQuery entry = new SearchModels.SearchQuery();
        entry.query = query;
        entry.normalizedQuery = normalize(query);
        entry.resultCount = resultCount;
        queryLog.save(entry);
    }

    private List<Hit> cap(List<Hit> hits) {
        return hits.size() > 12 ? hits.subList(0, 12) : hits;
    }

    /** did-you-mean: vocabulary words within edit distance 2 of any query token */
    private List<String> suggest(String query) {
        Set<String> vocab = new LinkedHashSet<>();
        glossary.findAllByOrderByTermAsc().forEach(t -> vocab.add(t.getTerm()));
        observances.findByDateGreaterThanEqualOrderByDateAsc(LocalDate.of(2000, 1, 1))
            .forEach(o -> vocab.add(o.getName()));
        articles.findByStatus(ArticleStatus.PUBLISHED, org.springframework.data.domain.Pageable.unpaged())
            .forEach(a -> vocab.add(a.getLang().get("en").title()));

        Set<String> queryTokens = tokenize(query);
        List<String> suggestions = new ArrayList<>();
        for (String candidate : vocab) {
            for (String candidateToken : tokenize(candidate)) {
                for (String queryToken : queryTokens) {
                    if (queryToken.length() >= 4 && editDistance(queryToken, candidateToken) <= 2
                        && !queryToken.equals(candidateToken)) {
                        suggestions.add(candidate);
                    }
                }
            }
        }
        return suggestions.stream().distinct().limit(5).toList();
    }

    boolean matches(Set<String> queryTokens, String... fields) {
        Set<String> fieldTokens = new LinkedHashSet<>();
        for (String field : fields) {
            if (field != null) {
                fieldTokens.addAll(tokenize(field));
            }
        }
        // every query token must appear (exactly or within edit distance 1)
        outer:
        for (String q : queryTokens) {
            for (String f : fieldTokens) {
                if (f.contains(q) || (q.length() >= 4 && editDistance(q, f) <= 1)) {
                    continue outer;
                }
            }
            return false;
        }
        return !queryTokens.isEmpty();
    }

    static Set<String> tokenize(String text) {
        Set<String> tokens = new LinkedHashSet<>();
        for (String token : normalize(text).split("[^a-z0-9\\u0900-\\u097F]+")) {
            token = foldDevanagari(token);
            if (token.length() >= 2) {
                tokens.add(SYNONYMS.getOrDefault(token, token));
            }
        }
        return tokens;
    }

    /* ── Devanagari → Latin folding (G38) ──────────────────────────────────
     * A pragmatic akshara table covering the seeded vocabulary, so "एकादशी"
     * matches "ekadashi" and "करवा चौथ" matches "karwa chauth" (व → "w" keeps
     * the folded form within edit distance 1 of common Hindi romanizations).
     * The inherent 'a' of a consonant is emitted only before another consonant
     * or nasal sign — word-final schwa is dropped, Hindi-style. */

    private static final Map<Character, String> DEVANAGARI_CONSONANTS = Map.ofEntries(
        Map.entry('क', "k"), Map.entry('ख', "kh"), Map.entry('ग', "g"), Map.entry('घ', "gh"),
        Map.entry('ङ', "n"), Map.entry('च', "ch"), Map.entry('छ', "chh"), Map.entry('ज', "j"),
        Map.entry('झ', "jh"), Map.entry('ञ', "n"), Map.entry('ट', "t"), Map.entry('ठ', "th"),
        Map.entry('ड', "d"), Map.entry('ढ', "dh"), Map.entry('ण', "n"), Map.entry('त', "t"),
        Map.entry('थ', "th"), Map.entry('द', "d"), Map.entry('ध', "dh"), Map.entry('न', "n"),
        Map.entry('प', "p"), Map.entry('फ', "ph"), Map.entry('ब', "b"), Map.entry('भ', "bh"),
        Map.entry('म', "m"), Map.entry('य', "y"), Map.entry('र', "r"), Map.entry('ल', "l"),
        Map.entry('ळ', "l"), Map.entry('व', "w"), Map.entry('श', "sh"), Map.entry('ष', "sh"),
        Map.entry('स', "s"), Map.entry('ह', "h"),
        Map.entry('ज़', "z"), Map.entry('फ़', "f") // ज़ फ़ (precomposed)
    );

    /** independent vowels + dependent matras, folded to their short Latin form */
    private static final Map<Character, String> DEVANAGARI_VOWELS = Map.ofEntries(
        Map.entry('अ', "a"), Map.entry('आ', "a"), Map.entry('इ', "i"), Map.entry('ई', "i"),
        Map.entry('उ', "u"), Map.entry('ऊ', "u"), Map.entry('ऋ', "ri"), Map.entry('ए', "e"),
        Map.entry('ऐ', "ai"), Map.entry('ओ', "o"), Map.entry('औ', "au"),
        Map.entry('\u093E', "a"), Map.entry('\u093F', "i"), Map.entry('\u0940', "i"), Map.entry('\u0941', "u"),
        Map.entry('\u0942', "u"), Map.entry('\u0943', "ri"), Map.entry('\u0947', "e"), Map.entry('\u0948', "ai"),
        Map.entry('\u094B', "o"), Map.entry('\u094C', "au"), Map.entry('\u0949', "o"), Map.entry('\u0945', "a")
    );

    private static final char VIRAMA = '\u094D';
    private static final char ANUSVARA = '\u0902';
    private static final char CHANDRABINDU = '\u0901';
    private static final char VISARGA = '\u0903';
    private static final char NUKTA = '\u093C';

    static String foldDevanagari(String token) {
        boolean hasDevanagari = token.chars().anyMatch(c -> c >= 0x0900 && c <= 0x097F);
        if (!hasDevanagari) {
            return token;
        }
        StringBuilder out = new StringBuilder(token.length() + 4);
        boolean pendingA = false;
        for (char c : token.toCharArray()) {
            String consonant = DEVANAGARI_CONSONANTS.get(c);
            String vowel = DEVANAGARI_VOWELS.get(c);
            if (consonant != null) {
                if (pendingA) {
                    out.append('a');
                }
                out.append(consonant);
                pendingA = true;
            } else if (vowel != null) {
                out.append(vowel);
                pendingA = false;
            } else if (c == VIRAMA) {
                pendingA = false;
            } else if (c == ANUSVARA || c == CHANDRABINDU) {
                if (pendingA) {
                    out.append('a');
                }
                out.append('n');
                pendingA = false;
            } else if (c == VISARGA) {
                if (pendingA) {
                    out.append('a');
                }
                out.append('h');
                pendingA = false;
            } else if (c == NUKTA || (c >= 0x0900 && c <= 0x097F)) {
                // unknown Devanagari sign — drop, keep the fold lossy-but-stable
            } else {
                if (pendingA) {
                    out.append('a');
                    pendingA = false;
                }
                out.append(c);
            }
        }
        return out.toString();
    }

    private static String normalize(String text) {
        return Normalizer.normalize(text == null ? "" : text, Normalizer.Form.NFKC)
            .toLowerCase(Locale.ROOT).trim();
    }

    static int editDistance(String a, String b) {
        int[] prev = new int[b.length() + 1];
        int[] curr = new int[b.length() + 1];
        for (int j = 0; j <= b.length(); j++) {
            prev[j] = j;
        }
        for (int i = 1; i <= a.length(); i++) {
            curr[0] = i;
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                curr[j] = Math.min(Math.min(curr[j - 1] + 1, prev[j] + 1), prev[j - 1] + cost);
            }
            int[] tmp = prev;
            prev = curr;
            curr = tmp;
        }
        return prev[b.length()];
    }
}
