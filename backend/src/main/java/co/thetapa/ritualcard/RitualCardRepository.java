package co.thetapa.ritualcard;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface RitualCardRepository extends MongoRepository<RitualCard, String> {

    Optional<RitualCard> findByArticleSlug(String articleSlug);
}
