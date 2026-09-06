package co.thetapa.glossary;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface GlossaryRepository extends MongoRepository<GlossaryTerm, String> {

    Optional<GlossaryTerm> findBySlug(String slug);

    List<GlossaryTerm> findByCategoryOrderByTermAsc(GlossaryTerm.Category category);

    List<GlossaryTerm> findAllByOrderByTermAsc();

    List<GlossaryTerm> findTop8ByOrderByLookupCountDesc();
}
