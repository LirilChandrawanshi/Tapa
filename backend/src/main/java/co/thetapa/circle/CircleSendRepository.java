package co.thetapa.circle;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CircleSendRepository extends MongoRepository<CircleSend, String> {

    boolean existsByWaNumberAndOccasionSlugAndTemplateId(
        String waNumber, String occasionSlug, CircleSend.TemplateId templateId);

    List<CircleSend> findTop50ByOrderBySentAtDesc();

    List<CircleSend> findByStatusOrderBySentAtDesc(CircleSend.Status status);

    void deleteByWaNumber(String waNumber);
}
