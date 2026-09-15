package co.thetapa.admin;

import co.thetapa.common.ApiResponse;
import co.thetapa.content.ArticleTemplate;
import co.thetapa.content.ArticleType;
import co.thetapa.common.NotFoundException;
import co.thetapa.content.Article;
import co.thetapa.content.ArticleRepository;
import co.thetapa.content.ArticleService;
import co.thetapa.content.ArticleStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.cache.annotation.CacheEvict;
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
    private final org.springframework.context.ApplicationEventPublisher events;
    private final org.springframework.data.mongodb.core.MongoTemplate mongo;

    public AdminArticleController(ArticleRepository repository, ArticleService articleService,
                                  org.springframework.context.ApplicationEventPublisher events,
                                  org.springframework.data.mongodb.core.MongoTemplate mongo) {
        this.repository = repository;
        this.articleService = articleService;
        this.events = events;
        this.mongo = mongo;
    }

    /**
     * @param q optional search over slug and title. Applied in the query, not
     *          to the page that happens to be loaded — an editor searching for
     *          an article should not have to already know which page it is on.
     */
    @GetMapping
    public ApiResponse<Map<String, Object>> list(
        @RequestParam(required = false) ArticleStatus status,
        @RequestParam(required = false) String q,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "50") int size) {
        var pageable = PageRequest.of(page, Math.min(size, 100),
            Sort.by(Sort.Direction.DESC, "updatedAt"));
        Page<Article> result = (q == null || q.isBlank())
            ? (status == null
                ? repository.findAll(pageable)
                : repository.findByStatus(status, pageable))
            : searchPage(q.trim(), status, pageable);
        return ApiResponse.ok(Map.of(
            "items", result.getContent(),
            "page", result.getNumber(),
            "totalPages", result.getTotalPages(),
            "totalItems", result.getTotalElements()
        ));
    }

    /**
     * Case-insensitive substring over slug and both titles, paged in Mongo so
     * a search across every article costs the same as a page of the list.
     */
    private Page<Article> searchPage(String q, ArticleStatus status,
                                     org.springframework.data.domain.Pageable pageable) {
        var rx = java.util.regex.Pattern.compile(
            java.util.regex.Pattern.quote(q), java.util.regex.Pattern.CASE_INSENSITIVE);
        var match = new org.springframework.data.mongodb.core.query.Criteria().orOperator(
            org.springframework.data.mongodb.core.query.Criteria.where("slug").regex(rx),
            org.springframework.data.mongodb.core.query.Criteria.where("lang.en.title").regex(rx),
            org.springframework.data.mongodb.core.query.Criteria.where("lang.hi.title").regex(rx));
        var criteria = status == null
            ? match
            : new org.springframework.data.mongodb.core.query.Criteria()
                .andOperator(org.springframework.data.mongodb.core.query.Criteria
                    .where("status").is(status), match);

        var query = org.springframework.data.mongodb.core.query.Query.query(criteria);
        long total = mongo.count(query, Article.class);
        java.util.List<Article> items = mongo.find(query.with(pageable), Article.class);
        return new org.springframework.data.domain.PageImpl<>(items, pageable, total);
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
    @CacheEvict(value = "home", allEntries = true)
    @PutMapping("/{slug}")
    public ApiResponse<Article> update(@PathVariable String slug, @RequestBody Article body) {
        Article existing = find(slug);
        body.setId(existing.getId());
        body.setSlug(slug);
        body.setStatus(existing.getStatus());
        body.setPublishedAt(existing.getPublishedAt());
        body.setCreatedAt(existing.getCreatedAt());
        Article saved = repository.save(body);
        // Editing an already-live article has to purge the frontend's ISR cache
        // too — otherwise a hero image swapped in the CMS stays invisible until
        // the 1-hour TTL lapses. Publishing already fired this; updating did not.
        if (saved.getStatus() == ArticleStatus.PUBLISHED) {
            events.publishEvent(new ArticleService.ArticlePublishedEvent(saved.getSlug()));
        }
        return ApiResponse.ok(saved);
    }

    /**
     * The section recipe and this article's current gaps. The CMS draws its
     * checklist from here rather than keeping its own copy, so the editor and
     * the publish gate can never disagree about what "ready" means.
     */
    @GetMapping("/{slug}/completeness")
    public ApiResponse<Map<String, Object>> completeness(@PathVariable String slug) {
        Article article = find(slug);
        var recipe = ArticleTemplate.of(article.getType());
        return ApiResponse.ok(Map.of(
            "type", String.valueOf(article.getType()),
            "required", recipe.required().stream().map(Enum::name).toList(),
            "recommended", recipe.recommended().stream().map(Enum::name).toList(),
            "missingRequired", ArticleTemplate.missingSections(article).stream().map(Enum::name).toList(),
            "missingRecommended", ArticleTemplate.missingRecommended(article).stream().map(Enum::name).toList()
        ));
    }

    /** The recipe alone, for scaffolding a new article before it exists. */
    @GetMapping("/templates/{type}")
    public ApiResponse<Map<String, Object>> template(@PathVariable String type) {
        ArticleType parsed;
        try {
            parsed = ArticleType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unknown article type: " + type);
        }
        var recipe = ArticleTemplate.of(parsed);
        return ApiResponse.ok(Map.of(
            "type", parsed.name(),
            "required", recipe.required().stream().map(Enum::name).toList(),
            "recommended", recipe.recommended().stream().map(Enum::name).toList(),
            "scaffold", recipe.scaffold().stream().map(Enum::name).toList()
        ));
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
    @CacheEvict(value = "home", allEntries = true)
    @PostMapping("/{slug}/publish")
    public ApiResponse<Article> publish(@PathVariable String slug) {
        return ApiResponse.ok(articleService.publish(slug));
    }

    @CacheEvict(value = "home", allEntries = true)
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
