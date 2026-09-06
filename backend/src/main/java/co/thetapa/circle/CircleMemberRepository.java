package co.thetapa.circle;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface CircleMemberRepository extends MongoRepository<CircleMember, String> {

    Optional<CircleMember> findByWaNumber(String waNumber);

    List<CircleMember> findByStatus(CircleMember.Status status);

    List<CircleMember> findByStatusOrderByJoinedAtDesc(CircleMember.Status status);

    long countByStatus(CircleMember.Status status);

    List<CircleMember> findByStatusAndDeleteRequestedAtBefore(CircleMember.Status status, Instant cutoff);
}
