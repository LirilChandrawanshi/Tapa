package co.thetapa.admin;

import co.thetapa.common.ApiResponse;
import co.thetapa.common.NotFoundException;
import co.thetapa.content.IntelligenceCard;
import co.thetapa.content.IntelligenceCardRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** CMS CRUD for the shared intelligence cards. */
@RestController
@RequestMapping("/api/v1/admin/intelligence-cards")
public class AdminIntelligenceCardController {

    private final IntelligenceCardRepository repository;

    public AdminIntelligenceCardController(IntelligenceCardRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ApiResponse<List<IntelligenceCard>> list() {
        return ApiResponse.ok(repository.findAllByOrderBySlugAsc());
    }

    @GetMapping("/{slug}")
    public ApiResponse<IntelligenceCard> one(@PathVariable String slug) {
        return ApiResponse.ok(find(slug));
    }

    @PostMapping
    public ApiResponse<IntelligenceCard> create(@RequestBody IntelligenceCard body) {
        body.setId(null);
        return ApiResponse.ok(repository.save(body));
    }

    @PutMapping("/{slug}")
    public ApiResponse<IntelligenceCard> update(@PathVariable String slug,
                                                @RequestBody IntelligenceCard body) {
        IntelligenceCard existing = find(slug);
        body.setId(existing.getId());
        body.setSlug(slug);
        body.setCreatedAt(existing.getCreatedAt());
        return ApiResponse.ok(repository.save(body));
    }

    @DeleteMapping("/{slug}")
    public ApiResponse<Void> delete(@PathVariable String slug) {
        repository.delete(find(slug));
        return ApiResponse.ok(null);
    }

    private IntelligenceCard find(String slug) {
        return repository.findBySlug(slug)
            .orElseThrow(() -> new NotFoundException("intelligence card", slug));
    }
}
