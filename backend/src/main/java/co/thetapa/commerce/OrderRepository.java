package co.thetapa.commerce;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends MongoRepository<Order, String> {

    Optional<Order> findByOrderNumber(String orderNumber);

    List<Order> findByUserIdOrderByCreatedAtDesc(String userId);

    List<Order> findByPhoneOrderByCreatedAtDesc(String phone);

    List<Order> findByStatusOrderByCreatedAtDesc(Order.Status status);

    List<Order> findAllByOrderByCreatedAtDesc(org.springframework.data.domain.Pageable pageable);
}
