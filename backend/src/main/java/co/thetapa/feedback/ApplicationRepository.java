package co.thetapa.feedback;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ApplicationRepository extends MongoRepository<FeedbackDocuments.Application, String> {

    List<FeedbackDocuments.Application> findByTypeOrderByCreatedAtDesc(String type);
}
