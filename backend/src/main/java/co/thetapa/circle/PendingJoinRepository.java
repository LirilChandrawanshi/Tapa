package co.thetapa.circle;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface PendingJoinRepository extends MongoRepository<PendingJoin, String> {

    Optional<PendingJoin> findTopByTypedNumberOrderByCreatedAtDesc(String typedNumber);

    void deleteByTypedNumber(String typedNumber);
}
