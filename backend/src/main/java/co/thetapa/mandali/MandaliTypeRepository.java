package co.thetapa.mandali;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface MandaliTypeRepository extends MongoRepository<MandaliType, String> {

    Optional<MandaliType> findBySlug(String slug);

    List<MandaliType> findByActiveTrueOrderByNameAsc();

    List<MandaliType> findAllByOrderByNameAsc();
}
