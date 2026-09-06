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
 * glossary definition → guides → dates → kits. Knowledge before commerce.
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

    public SearchService(GlossaryRepository glossary, ArticleRepository articles,
                         ObservanceRepository observances, SearchQueryRepository queryLog,
                         PopularSearchRepository popular) {
        this.glossary = glossary;
        this.articles = articles;
        this.observances = observances;
        this.queryLog = queryLog;
        this.popular = popular;
    }

    public SearchResponse search(String rawQuery) {
        String query = rawQuery == null ? "" : rawQuery.trim();
        Set<String> tokens = tokenize(query);

        List<Hit> glossaryHits = new ArrayList<>();
        List<Hit> guideHits = new ArrayList<>();
        List<Hit> dateHits = new ArrayList<>();

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
                if (en != null && matches(tokens, en.title(), en.deck(), a.getSubCategory())) {
                    guideHits.add(new Hit(Hit.TYPE_GUIDE, en.title(),
                        "Vidhi, significance, samagri",
                        "/" + a.getCategory() + "/" + a.getSubCategory() + "/" + a.getSlug(),
                        a.getHueClass(),
                        a.getDpb() == null ? null : a.getDpb().classification().name()));
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

        int total = glossaryHits.size() + guideHits.size() + dateHits.size();
        List<String> didYouMean = total == 0 ? suggest(query) : List.of();

        logQuery(query, total);

        return new SearchResponse(query, total,
            cap(glossaryHits), cap(guideHits), cap(dateHits), List.of(),
            didYouMean, popular.findByActiveTrueOrderByOrderAsc());
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

    private boolean matches(Set<String> queryTokens, String... fields) {
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

    private static Set<String> tokenize(String text) {
        Set<String> tokens = new LinkedHashSet<>();
        for (String token : normalize(text).split("[^a-z0-9\\u0900-\\u097F]+")) {
            if (token.length() >= 2) {
                tokens.add(SYNONYMS.getOrDefault(token, token));
            }
        }
        return tokens;
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
