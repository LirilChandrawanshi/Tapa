package co.thetapa.engagement;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface SavedRitualRepository extends MongoRepository<SavedRitual, String> {

    List<SavedRitual> findByUserId(String userId);

    Optional<SavedRitual> findByUserIdAndArticleSlug(String userId, String articleSlug);

    long countByUserId(String userId);

    void deleteByUserId(String userId);
}
