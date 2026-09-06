package co.thetapa.feedback;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CorrectionReportRepository extends MongoRepository<FeedbackDocuments.CorrectionReport, String> {

    List<FeedbackDocuments.CorrectionReport> findByStatusOrderByCreatedAtDesc(String status);
}
