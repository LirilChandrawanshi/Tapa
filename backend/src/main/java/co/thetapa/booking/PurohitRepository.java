package co.thetapa.booking;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface PurohitRepository extends MongoRepository<Purohit, String> {

    Optional<Purohit> findBySlug(String slug);

    List<Purohit> findByActiveTrueAndVerifiedTrueAndPujaTypeSlugsContainingAndCitiesContaining(
        String pujaTypeSlug, String city);

    List<Purohit> findAllByOrderByNameAsc();
}
