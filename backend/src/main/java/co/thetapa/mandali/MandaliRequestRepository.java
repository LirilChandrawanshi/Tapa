package co.thetapa.mandali;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface MandaliRequestRepository extends MongoRepository<MandaliRequest, String> {

    Optional<MandaliRequest> findByRequestNumber(String requestNumber);

    List<MandaliRequest> findByPhoneOrderByCreatedAtDesc(String phone);

    List<MandaliRequest> findByUserIdOrderByCreatedAtDesc(String userId);

    List<MandaliRequest> findByStatusOrderByDateAsc(MandaliRequest.Status status);

    List<MandaliRequest> findAllByOrderByCreatedAtDesc(org.springframework.data.domain.Pageable pageable);
}
