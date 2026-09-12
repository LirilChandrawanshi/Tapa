package co.thetapa.commerce;

import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentWebhookEventRepository extends MongoRepository<PaymentWebhookEvent, String> {

    List<PaymentWebhookEvent> findAllByOrderByReceivedAtDesc(Pageable pageable);

    List<PaymentWebhookEvent> findByOrderNumberOrderByReceivedAtDesc(String orderNumber);

    Optional<PaymentWebhookEvent> findFirstByEventIdAndOutcome(String eventId, PaymentWebhookEvent.Outcome outcome);
}
