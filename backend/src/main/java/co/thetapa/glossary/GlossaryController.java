package co.thetapa.glossary;

import co.thetapa.common.ApiResponse;
import co.thetapa.common.NotFoundException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/glossary")
public class GlossaryController {

    private final GlossaryRepository repository;

    public GlossaryController(GlossaryRepository repository) {
        this.repository = repository;
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
    public ApiResponse<GlossaryTerm> get(@PathVariable String slug) {
        GlossaryTerm term = repository.findBySlug(slug)
            .orElseThrow(() -> new NotFoundException("glossary term", slug));
        term.setLookupCount(term.getLookupCount() + 1);
        repository.save(term);
        return ApiResponse.ok(term);
    }
}
