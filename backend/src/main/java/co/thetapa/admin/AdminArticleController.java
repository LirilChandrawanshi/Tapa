package co.thetapa.admin;

import co.thetapa.common.ApiResponse;
import co.thetapa.common.NotFoundException;
import co.thetapa.content.Article;
import co.thetapa.content.ArticleRepository;
import co.thetapa.content.ArticleService;
import co.thetapa.content.ArticleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Editorial article workflow: draft → review → publish. Publishing delegates
 * to {@link ArticleService#publish} so the DPB rules stay enforced in exactly
 * one place (422 via ValidationFailedException → GlobalExceptionHandler).
 */
@RestController
@RequestMapping("/api/v1/admin/articles")
public class AdminArticleController {

    private final ArticleRepository repository;
    private final ArticleService articleService;

    public AdminArticleController(ArticleRepository repository, ArticleService articleService) {
        this.repository = repository;
        this.articleService = articleService;
    }

    @GetMapping
    public ApiResponse<Map<String, Object>> list(
        @RequestParam(required = false) ArticleStatus status,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "50") int size) {
        var pageable = PageRequest.of(page, Math.min(size, 100),
            Sort.by(Sort.Direction.DESC, "updatedAt"));
        Page<Article> result = status == null
            ? repository.findAll(pageable)
            : repository.findByStatus(status, pageable);
        return ApiResponse.ok(Map.of(
            "items", result.getContent(),
            "page", result.getNumber(),
            "totalPages", result.getTotalPages(),
            "totalItems", result.getTotalElements()
        ));
    }

    /** Any status — editors need drafts too. */
    @GetMapping("/{slug}")
    public ApiResponse<Article> get(@PathVariable String slug) {
        return ApiResponse.ok(find(slug));
    }

    @PostMapping
    public ApiResponse<Article> create(@RequestBody Article body) {
        if (body.getSlug() == null || body.getSlug().isBlank()) {
            throw new IllegalArgumentException("slug is required");
        }
        if (repository.findBySlug(body.getSlug()).isPresent()) {
            throw new IllegalArgumentException("An article with slug '" + body.getSlug() + "' already exists.");
        }
        body.setId(null);
        body.setStatus(ArticleStatus.DRAFT);
        body.setPublishedAt(null);
        return ApiResponse.ok(repository.save(body));
    }

    /** Full-document update; identity + workflow fields are preserved from the stored article. */
    @PutMapping("/{slug}")
    public ApiResponse<Article> update(@PathVariable String slug, @RequestBody Article body) {
        Article existing = find(slug);
        body.setId(existing.getId());
        body.setSlug(slug);
        body.setStatus(existing.getStatus());
        body.setPublishedAt(existing.getPublishedAt());
        body.setCreatedAt(existing.getCreatedAt());
        return ApiResponse.ok(repository.save(body));
    }

    @PostMapping("/{slug}/submit-review")
    public ApiResponse<Article> submitReview(@PathVariable String slug) {
        Article article = find(slug);
        if (article.getStatus() == ArticleStatus.PUBLISHED) {
            throw new IllegalArgumentException("Unpublish first — a published article cannot go back to review directly.");
        }
        article.setStatus(ArticleStatus.REVIEW);
        return ApiResponse.ok(repository.save(article));
    }

    /** The only path to PUBLISHED — DPB validation runs inside the service. */
    @PostMapping("/{slug}/publish")
    public ApiResponse<Article> publish(@PathVariable String slug) {
        return ApiResponse.ok(articleService.publish(slug));
    }

    @PostMapping("/{slug}/unpublish")
    public ApiResponse<Article> unpublish(@PathVariable String slug) {
        Article article = find(slug);
        article.setStatus(ArticleStatus.DRAFT);
        return ApiResponse.ok(repository.save(article));
    }

    private Article find(String slug) {
        return repository.findBySlug(slug)
            .orElseThrow(() -> new NotFoundException("article", slug));
    }
}
