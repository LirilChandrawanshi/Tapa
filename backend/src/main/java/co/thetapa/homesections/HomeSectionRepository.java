package co.thetapa.homesections;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface HomeSectionRepository extends MongoRepository<HomeSection, String> {

    Optional<HomeSection> findByKey(String key);
}
