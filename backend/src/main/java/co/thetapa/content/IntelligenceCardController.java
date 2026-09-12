package co.thetapa.content;

import co.thetapa.common.ApiResponse;
import co.thetapa.common.NotFoundException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Public read of the shared intelligence cards. */
@RestController
@RequestMapping("/api/v1/intelligence-cards")
public class IntelligenceCardController {

    private final IntelligenceCardRepository repository;

    public IntelligenceCardController(IntelligenceCardRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ApiResponse<List<IntelligenceCard>> list(
        @RequestParam(required = false) List<String> slugs) {
        List<IntelligenceCard> all = repository.findAllByOrderBySlugAsc().stream()
            .filter(IntelligenceCard::isPublished)
            .toList();
        if (slugs == null || slugs.isEmpty()) {
            return ApiResponse.ok(all);
        }
        // Preserve the order the article asked for, not the repository's.
        return ApiResponse.ok(slugs.stream()
            .flatMap(slug -> all.stream().filter(c -> slug.equals(c.getSlug())))
            .toList());
    }

    @GetMapping("/{slug}")
    public ApiResponse<IntelligenceCard> one(@PathVariable String slug) {
        return ApiResponse.ok(repository.findBySlug(slug)
            .filter(IntelligenceCard::isPublished)
            .orElseThrow(() -> new NotFoundException("intelligence card", slug)));
    }
}
