package co.thetapa.circle;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface CircleApprovalRepository extends MongoRepository<CircleApproval, String> {

    Optional<CircleApproval> findByObservanceSlug(String observanceSlug);

    boolean existsByObservanceSlug(String observanceSlug);
}
