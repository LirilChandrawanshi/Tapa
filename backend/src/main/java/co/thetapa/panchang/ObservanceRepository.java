package co.thetapa.panchang;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ObservanceRepository extends MongoRepository<Observance, String> {

    Optional<Observance> findBySlug(String slug);

    List<Observance> findByDateGreaterThanEqualOrderByDateAsc(LocalDate from);

    List<Observance> findByDateBetweenOrderByDateAsc(LocalDate from, LocalDate to);

    List<Observance> findByTypeAndDateGreaterThanEqualOrderByDateAsc(Observance.Type type, LocalDate from);

    List<Observance> findBySeriesOrderByDateAsc(String series);
}
