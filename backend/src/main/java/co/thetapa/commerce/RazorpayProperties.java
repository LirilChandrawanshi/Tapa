package co.thetapa.commerce;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Razorpay credentials. Never committed: set them in {@code backend/config/
 * application.yml} (gitignored, auto-loaded by Spring Boot) or as env vars
 * TAPA_RAZORPAY_KEY_ID / _KEY_SECRET / _WEBHOOK_SECRET.
 *
 * With {@link #keyId()} blank the whole gateway stays off and
 * {@link MockPaymentProvider} handles checkout exactly as it does today —
 * that is what keeps `make backend` working on a laptop with no credentials.
 */
@ConfigurationProperties(prefix = "tapa.razorpay")
public record RazorpayProperties(
    String keyId,
    String keySecret,
    /** Set separately in the Razorpay Dashboard when you create the webhook. */
    String webhookSecret,
    String baseUrl
) {

    public RazorpayProperties {
        keyId = keyId == null ? "" : keyId.trim();
        keySecret = keySecret == null ? "" : keySecret.trim();
        webhookSecret = webhookSecret == null ? "" : webhookSecret.trim();
        baseUrl = (baseUrl == null || baseUrl.isBlank()) ? "https://api.razorpay.com" : baseUrl.trim();
    }

    public boolean enabled() {
        return !keyId.isBlank() && !keySecret.isBlank();
    }

    /** Razorpay's own convention: test keys are prefixed rzp_test_. */
    public boolean testMode() {
        return keyId.startsWith("rzp_test");
    }
}
