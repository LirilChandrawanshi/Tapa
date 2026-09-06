package co.thetapa.panchang;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PanchangDayRepository extends MongoRepository<PanchangDay, String> {

    Optional<PanchangDay> findByDateAndCity(LocalDate date, String city);

    Optional<PanchangDay> findTopByDateLessThanEqualAndCityOrderByDateDesc(LocalDate date, String city);

    List<PanchangDay> findByCityAndDateBetweenOrderByDateAsc(String city, LocalDate from, LocalDate to);
}
