package co.thetapa.admin;

import co.thetapa.common.ApiResponse;
import co.thetapa.common.NotFoundException;
import co.thetapa.glossary.GlossaryRepository;
import co.thetapa.glossary.GlossaryTerm;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Glossary CRUD. The PRD's 40-word ceiling on definitions is enforced here —
 * glossary is the one content type with no DPB tag, so brevity is the guardrail.
 */
@RestController
@RequestMapping("/api/v1/admin/glossary")
public class AdminGlossaryController {

    static final int MAX_DEFINITION_WORDS = 40;

    private final GlossaryRepository repository;

    public AdminGlossaryController(GlossaryRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ApiResponse<List<GlossaryTerm>> list() {
        return ApiResponse.ok(repository.findAllByOrderByTermAsc());
    }

    @PutMapping("/{slug}")
    public ApiResponse<GlossaryTerm> upsert(@PathVariable String slug, @RequestBody GlossaryTerm body) {
        if (body.getTerm() == null || body.getTerm().isBlank()) {
            throw new IllegalArgumentException("term is required");
        }
        int words = wordCount(body.getDefinition());
        if (words == 0) {
            throw new IllegalArgumentException("definition is required");
        }
        if (words > MAX_DEFINITION_WORDS) {
            throw new IllegalArgumentException(
                "Definition is " + words + " words — the ceiling is " + MAX_DEFINITION_WORDS + " (PRD).");
        }
        body.setSlug(slug);
        repository.findBySlug(slug).ifPresent(existing -> {
            body.setId(existing.getId());
            body.setCreatedAt(existing.getCreatedAt());
            body.setLookupCount(existing.getLookupCount());
        });
        return ApiResponse.ok(repository.save(body));
    }

    @DeleteMapping("/{slug}")
    public ApiResponse<Map<String, Object>> delete(@PathVariable String slug) {
        GlossaryTerm term = repository.findBySlug(slug)
            .orElseThrow(() -> new NotFoundException("glossary term", slug));
        repository.delete(term);
        return ApiResponse.ok(Map.of("deleted", true));
    }

    private int wordCount(String text) {
        if (text == null || text.isBlank()) {
            return 0;
        }
        return text.trim().split("\\s+").length;
    }
}
