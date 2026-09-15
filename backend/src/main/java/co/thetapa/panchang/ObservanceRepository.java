package co.thetapa.panchang;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ObservanceRepository extends MongoRepository<Observance, String> {

    Optional<Observance> findBySlug(String slug);

    /** Reverse of the guide link — lets an article borrow its date's imagery. */
    Optional<Observance> findByArticleSlug(String articleSlug);

    List<Observance> findByDateGreaterThanEqualOrderByDateAsc(LocalDate from);

    List<Observance> findByDateBetweenOrderByDateAsc(LocalDate from, LocalDate to);

    List<Observance> findByTypeAndDateGreaterThanEqualOrderByDateAsc(Observance.Type type, LocalDate from);

    List<Observance> findBySeriesOrderByDateAsc(String series);
}
