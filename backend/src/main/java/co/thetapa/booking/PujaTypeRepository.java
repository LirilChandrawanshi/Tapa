package co.thetapa.booking;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface PujaTypeRepository extends MongoRepository<PujaType, String> {

    Optional<PujaType> findBySlug(String slug);

    List<PujaType> findByActiveTrueOrderByNameAsc();
}
