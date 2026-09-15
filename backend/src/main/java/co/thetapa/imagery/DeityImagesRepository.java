package co.thetapa.imagery;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface DeityImagesRepository extends MongoRepository<DeityImages, String> {

    Optional<DeityImages> findByDeity(String deity);
}
