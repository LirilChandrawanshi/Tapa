package co.thetapa.feedback;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface NotifyRequestRepository extends MongoRepository<FeedbackDocuments.NotifyRequest, String> {
}
