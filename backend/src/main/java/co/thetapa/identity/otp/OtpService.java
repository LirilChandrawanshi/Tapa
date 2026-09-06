package co.thetapa.identity.otp;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.HexFormat;

@Service
public class OtpService {

    public static final int RATE_LIMIT_PER_HOUR = 5;

    private final OtpSessionRepository sessions;
    private final SmsProvider smsProvider;
    private final SecureRandom random = new SecureRandom();

    @Value("${tapa.otp.ttl-minutes}")
    private int ttlMinutes;
    @Value("${tapa.otp.resend-seconds}")
    private int resendSeconds;
    @Value("${tapa.otp.max-attempts}")
    private int maxAttempts;

    public OtpService(OtpSessionRepository sessions, SmsProvider smsProvider) {
        this.sessions = sessions;
        this.smsProvider = smsProvider;
    }

    public record RequestResult(int resendAfterSeconds) {
    }

    public RequestResult request(String phone) {
        String normalized = normalize(phone);

        var latest = sessions.findTopByPhoneOrderByCreatedAtDesc(normalized);
        if (latest.isPresent() && Instant.now().isBefore(latest.get().getResendAvailableAt())) {
            long wait = Duration.between(Instant.now(), latest.get().getResendAvailableAt()).getSeconds();
            throw new OtpThrottledException("Resend available in " + wait + "s", wait);
        }
        if (sessions.countByPhoneAndCreatedAtAfter(normalized, Instant.now().minus(Duration.ofHours(1)))
            >= RATE_LIMIT_PER_HOUR) {
            throw new OtpThrottledException("Too many OTP requests. Try again later.", 3600);
        }

        String code = "%06d".formatted(random.nextInt(1_000_000));
        OtpSession session = new OtpSession();
        session.setPhone(normalized);
        session.setCodeHash(sha256(code + normalized));
        session.setExpiresAt(Instant.now().plus(Duration.ofMinutes(ttlMinutes)));
        session.setResendAvailableAt(Instant.now().plusSeconds(resendSeconds));
        sessions.save(session);

        smsProvider.sendOtp(normalized, code);
        return new RequestResult(resendSeconds);
    }

    /** Returns the normalized phone on success; throws otherwise. */
    public String verify(String phone, String code) {
        String normalized = normalize(phone);
        OtpSession session = sessions.findTopByPhoneOrderByCreatedAtDesc(normalized)
            .orElseThrow(() -> new OtpInvalidException("No OTP requested for this number."));

        if (Instant.now().isAfter(session.getExpiresAt())) {
            throw new OtpInvalidException("OTP expired. Request a new one.");
        }
        if (session.getAttempts() >= maxAttempts) {
            throw new OtpInvalidException("Too many wrong attempts. Request a new OTP.");
        }
        if (!sha256(code + normalized).equals(session.getCodeHash())) {
            session.setAttempts(session.getAttempts() + 1);
            sessions.save(session);
            throw new OtpInvalidException("Incorrect OTP.");
        }
        sessions.deleteByPhone(normalized);
        return normalized;
    }

    /** Accepts "9876543210", "+919876543210", "919876543210" → "+919876543210". */
    public static String normalize(String phone) {
        String digits = phone == null ? "" : phone.replaceAll("[^0-9]", "");
        if (digits.length() == 10) {
            return "+91" + digits;
        }
        if (digits.length() == 12 && digits.startsWith("91")) {
            return "+" + digits;
        }
        throw new IllegalArgumentException("Enter a valid 10-digit Indian mobile number.");
    }

    private static String sha256(String value) {
        try {
            return HexFormat.of().formatHex(
                MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    public static class OtpThrottledException extends RuntimeException {
        private final long retryAfterSeconds;

        public OtpThrottledException(String message, long retryAfterSeconds) {
            super(message);
            this.retryAfterSeconds = retryAfterSeconds;
        }

        public long getRetryAfterSeconds() {
            return retryAfterSeconds;
        }
    }

    public static class OtpInvalidException extends RuntimeException {
        public OtpInvalidException(String message) {
            super(message);
        }
    }
}
