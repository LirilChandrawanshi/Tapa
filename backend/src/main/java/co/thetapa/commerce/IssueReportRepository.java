package co.thetapa.commerce;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface IssueReportRepository extends MongoRepository<IssueReport, String> {

    List<IssueReport> findAllByOrderByCreatedAtDesc();

    List<IssueReport> findByStatusOrderByCreatedAtDesc(IssueReport.Status status);

    List<IssueReport> findByOrderNumberOrderByCreatedAtDesc(String orderNumber);
}
