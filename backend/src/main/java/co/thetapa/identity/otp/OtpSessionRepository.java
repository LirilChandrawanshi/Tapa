package co.thetapa.identity.otp;

import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.Instant;
import java.util.Optional;

public interface OtpSessionRepository extends MongoRepository<OtpSession, String> {

    Optional<OtpSession> findTopByPhoneOrderByCreatedAtDesc(String phone);

    long countByPhoneAndCreatedAtAfter(String phone, Instant after);

    void deleteByPhone(String phone);
}
