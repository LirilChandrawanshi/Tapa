package co.thetapa.commerce;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

/**
 * Razorpay authenticates two different things with the same primitive —
 * HMAC-SHA256, hex-encoded — but with two different secrets:
 *
 * <ul>
 *   <li><b>Checkout handler:</b> {@code HMAC(order_id + "|" + payment_id, KEY_SECRET)}
 *       proves the browser's success callback really came from Razorpay.</li>
 *   <li><b>Webhook:</b> {@code HMAC(raw_request_body, WEBHOOK_SECRET)} proves the
 *       server-to-server event did. The body must be hashed <em>exactly</em> as
 *       received — re-serialising the parsed JSON changes whitespace and key
 *       order, and the signature stops matching.</li>
 * </ul>
 *
 * Kept free of Spring so it stays unit-testable on its own.
 */
public final class RazorpaySignatures {

    private RazorpaySignatures() {
    }

    public static String hmacSha256Hex(String payload, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("HMAC-SHA256 is unavailable on this JVM", e);
        }
    }

    /** Checkout success callback. */
    public static boolean verifyPayment(String orderId, String paymentId, String signature, String keySecret) {
        if (orderId == null || paymentId == null || signature == null) {
            return false;
        }
        return constantTimeEquals(hmacSha256Hex(orderId + "|" + paymentId, keySecret), signature);
    }

    /** Webhook delivery — hash the raw body, never a re-serialised copy. */
    public static boolean verifyWebhook(String rawBody, String signature, String webhookSecret) {
        if (rawBody == null || signature == null || webhookSecret == null || webhookSecret.isBlank()) {
            return false;
        }
        return constantTimeEquals(hmacSha256Hex(rawBody, webhookSecret), signature);
    }

    /**
     * A plain String.equals on a MAC leaks its prefix through timing. Cheap to
     * avoid, so avoid it.
     */
    private static boolean constantTimeEquals(String a, String b) {
        return MessageDigest.isEqual(
            a.getBytes(StandardCharsets.UTF_8), b.getBytes(StandardCharsets.UTF_8));
    }
}
