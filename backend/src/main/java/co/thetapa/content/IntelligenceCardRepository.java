package co.thetapa.content;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface IntelligenceCardRepository extends MongoRepository<IntelligenceCard, String> {

    Optional<IntelligenceCard> findBySlug(String slug);

    List<IntelligenceCard> findAllByOrderBySlugAsc();
}
