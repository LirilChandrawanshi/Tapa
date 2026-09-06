package co.thetapa.identity.otp;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Document("otp_sessions")
public class OtpSession {

    @Id
    private String id;

    @Indexed
    private String phone;

    private String codeHash;

    /** TTL index — Mongo removes expired sessions itself */
    @Indexed(expireAfter = "0s")
    private Instant expiresAt;

    private int attempts;
    private Instant resendAvailableAt;
    private Instant createdAt = Instant.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getCodeHash() { return codeHash; }
    public void setCodeHash(String codeHash) { this.codeHash = codeHash; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
    public int getAttempts() { return attempts; }
    public void setAttempts(int attempts) { this.attempts = attempts; }
    public Instant getResendAvailableAt() { return resendAvailableAt; }
    public void setResendAvailableAt(Instant resendAvailableAt) { this.resendAvailableAt = resendAvailableAt; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
