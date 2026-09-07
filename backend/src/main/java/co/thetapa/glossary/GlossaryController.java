package co.thetapa.glossary;

import co.thetapa.common.ApiResponse;
import co.thetapa.common.NotFoundException;
import co.thetapa.content.Article;
import co.thetapa.content.ArticleRepository;
import co.thetapa.content.ArticleStatus;
import co.thetapa.content.Block;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/glossary")
public class GlossaryController {

    private static final int APPEARS_IN_CAP = 6;

    private final GlossaryRepository repository;
    private final ArticleRepository articles;
    private final ObjectMapper mapper;

    public GlossaryController(GlossaryRepository repository, ArticleRepository articles,
                              ObjectMapper mapper) {
        this.repository = repository;
        this.articles = articles;
        this.mapper = mapper;
    }

    @GetMapping
    public ApiResponse<Map<String, Object>> list(@RequestParam(required = false) GlossaryTerm.Category category) {
        List<GlossaryTerm> terms = category == null
            ? repository.findAllByOrderByTermAsc()
            : repository.findByCategoryOrderByTermAsc(category);
        return ApiResponse.ok(Map.of(
            "items", terms,
            "mostLookedUp", repository.findTop8ByOrderByLookupCountDesc()
        ));
    }

    @GetMapping("/{slug}")
    public ApiResponse<Map<String, Object>> get(@PathVariable String slug) {
        GlossaryTerm term = repository.findBySlug(slug)
            .orElseThrow(() -> new NotFoundException("glossary term", slug));
        term.setLookupCount(term.getLookupCount() + 1);
        repository.save(term);
        // term fields stay top-level (backwards compatible); appearsIn is additive (#117)
        Map<String, Object> body = new LinkedHashMap<>(
            mapper.convertValue(term, new TypeReference<Map<String, Object>>() { }));
        body.put("appearsIn", appearsIn(term.getTerm()));
        return ApiResponse.ok(body);
    }

    /**
     * Published articles whose English title, intro or step titles mention the
     * term — a cheap case-insensitive scan over a small corpus, capped at
     * {@value APPEARS_IN_CAP} (#117).
     */
    private List<Map<String, String>> appearsIn(String rawTerm) {
        // "Shravana (Sawan)" → match on the bare head word
        String needle = rawTerm.replaceAll("\\s*\\(.*?\\)", "").trim().toLowerCase(Locale.ROOT);
        List<Map<String, String>> out = new ArrayList<>();
        if (needle.isEmpty()) {
            return out;
        }
        for (Article a : articles.findByStatus(ArticleStatus.PUBLISHED, Pageable.unpaged())) {
            var en = a.getLang() == null ? null : a.getLang().get("en");
            if (en == null || en.title() == null) {
                continue;
            }
            if (mentions(en, needle)) {
                out.add(Map.of(
                    "slug", a.getSlug(),
                    "title", en.title(),
                    "category", a.getCategory() == null ? "" : a.getCategory(),
                    "subCategory", a.getSubCategory() == null ? "" : a.getSubCategory()));
                if (out.size() >= APPEARS_IN_CAP) {
                    break;
                }
            }
        }
        return out;
    }

    private static boolean mentions(Article.ArticleContent en, String needle) {
        if (containsIgnoreCase(en.title(), needle) || containsIgnoreCase(en.introHtml(), needle)) {
            return true;
        }
        if (en.blocks() == null) {
            return false;
        }
        for (Block block : en.blocks()) {
            if (containsIgnoreCase(block.title(), needle)) {
                return true;
            }
            if (block.steps() != null) {
                for (Block.VidhiStep step : block.steps()) {
                    if (containsIgnoreCase(step.title(), needle)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private static boolean containsIgnoreCase(String haystack, String needle) {
        return haystack != null && haystack.toLowerCase(Locale.ROOT).contains(needle);
    }
}
