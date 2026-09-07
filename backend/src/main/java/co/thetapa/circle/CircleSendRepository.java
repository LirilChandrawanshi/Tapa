package co.thetapa.circle;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface CircleSendRepository extends MongoRepository<CircleSend, String> {

    boolean existsByWaNumberAndOccasionSlugAndTemplateId(
        String waNumber, String occasionSlug, CircleSend.TemplateId templateId);

    List<CircleSend> findTop50ByOrderBySentAtDesc();

    List<CircleSend> findByStatusOrderBySentAtDesc(CircleSend.Status status);

    Optional<CircleSend> findTopByProviderMessageId(String providerMessageId);

    long countBySentAtAfter(Instant after);

    void deleteByWaNumber(String waNumber);
}
