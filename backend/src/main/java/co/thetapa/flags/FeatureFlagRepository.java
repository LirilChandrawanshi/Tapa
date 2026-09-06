package co.thetapa.flags;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface FeatureFlagRepository extends MongoRepository<FeatureFlag, String> {

    Optional<FeatureFlag> findByKey(String key);
}
