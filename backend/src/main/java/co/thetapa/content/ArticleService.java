package co.thetapa.content;

import co.thetapa.common.NotFoundException;
import co.thetapa.common.ValidationFailedException;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class ArticleService {

    private final ArticleRepository repository;
    private final DpbValidator dpbValidator;
    private final ApplicationEventPublisher events;

    public ArticleService(ArticleRepository repository, DpbValidator dpbValidator,
                          ApplicationEventPublisher events) {
        this.repository = repository;
        this.dpbValidator = dpbValidator;
        this.events = events;
    }

    public Article getPublished(String slug) {
        return repository.findBySlugAndStatus(slug, ArticleStatus.PUBLISHED)
            .orElseThrow(() -> new NotFoundException("article", slug));
    }

    public Page<Article> listPublished(String category, String subCategory, int page, int size) {
        var pageable = PageRequest.of(page, Math.min(size, 60), Sort.by(Sort.Direction.ASC, "observanceDate"));
        if (category != null && subCategory != null) {
            return repository.findByStatusAndCategoryAndSubCategory(ArticleStatus.PUBLISHED, category, subCategory, pageable);
        }
        if (category != null) {
            return repository.findByStatusAndCategory(ArticleStatus.PUBLISHED, category, pageable);
        }
        return repository.findByStatus(ArticleStatus.PUBLISHED, pageable);
    }

    public List<Article> featured() {
        return repository.findByStatusAndIsFeaturedTrueOrderByHeroOrderAsc(ArticleStatus.PUBLISHED);
    }

    public long publishedCount(String category) {
        return repository.countByStatusAndCategory(ArticleStatus.PUBLISHED, category);
    }

    /** Review→publish transition. The only path to PUBLISHED — DPB rules enforced here. */
    public Article publish(String slug) {
        Article article = repository.findBySlug(slug)
            .orElseThrow(() -> new NotFoundException("article", slug));
        List<String> errors = dpbValidator.validate(article);
        if (!errors.isEmpty()) {
            throw new ValidationFailedException(errors);
        }
        article.setStatus(ArticleStatus.PUBLISHED);
        article.setPublishedAt(Instant.now());
        Article saved = repository.save(article);
        events.publishEvent(new ArticlePublishedEvent(saved.getSlug()));
        return saved;
    }

    public record ArticlePublishedEvent(String slug) {
    }
}
