package co.thetapa.content;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ArticleRepository extends MongoRepository<Article, String> {

    Optional<Article> findBySlugAndStatus(String slug, ArticleStatus status);

    Optional<Article> findBySlug(String slug);

    Page<Article> findByStatusAndCategory(ArticleStatus status, String category, Pageable pageable);

    Page<Article> findByStatusAndCategoryAndSubCategory(ArticleStatus status, String category, String subCategory, Pageable pageable);

    Page<Article> findByStatus(ArticleStatus status, Pageable pageable);

    List<Article> findByStatusAndIsFeaturedTrueOrderByHeroOrderAsc(ArticleStatus status);

    long countByStatusAndCategory(ArticleStatus status, String category);

    List<Article> findByLinkedObservanceSlug(String observanceSlug);
}
