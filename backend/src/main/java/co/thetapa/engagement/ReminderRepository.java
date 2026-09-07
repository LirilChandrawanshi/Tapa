package co.thetapa.engagement;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ReminderRepository extends MongoRepository<Reminder, String> {

    List<Reminder> findByUserIdOrderByObservanceDateAsc(String userId);

    Optional<Reminder> findByIdAndUserId(String id, String userId);

    Optional<Reminder> findByUserIdAndObservanceSlug(String userId, String observanceSlug);

    long countByUserId(String userId);

    void deleteByUserId(String userId);
}
