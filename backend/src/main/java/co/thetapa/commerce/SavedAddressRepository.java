package co.thetapa.commerce;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface SavedAddressRepository extends MongoRepository<SavedAddress, String> {

    List<SavedAddress> findByUserIdOrderByCreatedAtAsc(String userId);

    Optional<SavedAddress> findByIdAndUserId(String id, String userId);
}
