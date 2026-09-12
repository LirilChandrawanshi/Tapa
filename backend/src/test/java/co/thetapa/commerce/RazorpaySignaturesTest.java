package co.thetapa.commerce;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class RazorpaySignaturesTest {

    private static final String KEY_SECRET = "test_key_secret_abcdef";
    private static final String WEBHOOK_SECRET = "test_webhook_secret_123";

    /**
     * A fixed vector, computed independently (python hmac/sha256). Pins the
     * algorithm *and* the encoding — swapping hex for base64 would still
     * "work" against a self-referential assertion, and would fail every real
     * Razorpay callback.
     */
    @Test
    void hmacMatchesAnIndependentlyComputedVector() {
        assertThat(RazorpaySignatures.hmacSha256Hex(
            "order_IEIaMR65cu6nz0|pay_IEImwhBlmP1FY0", "EnLs21M47BllR3X8PSFtjtbd"))
            .isEqualTo("46108a57bb739679122f41174b1d6a85b8ddf722ae433f917be95599f523df76");
    }

    @Test
    void hmacIsLowercaseHexAndStable() {
        String mac = RazorpaySignatures.hmacSha256Hex("order_A|pay_B", KEY_SECRET);
        assertThat(mac).hasSize(64).matches("[0-9a-f]{64}");
        assertThat(RazorpaySignatures.hmacSha256Hex("order_A|pay_B", KEY_SECRET)).isEqualTo(mac);
    }

    @Test
    void acceptsAGenuineCheckoutCallback() {
        String signature = RazorpaySignatures.hmacSha256Hex("order_A|pay_B", KEY_SECRET);
        assertThat(RazorpaySignatures.verifyPayment("order_A", "pay_B", signature, KEY_SECRET)).isTrue();
    }

    @Test
    void rejectsASignatureMintedForADifferentOrder() {
        // the attack this check exists for: replay a real signature from a
        // cheap order onto an expensive one
        String otherOrdersSignature = RazorpaySignatures.hmacSha256Hex("order_CHEAP|pay_B", KEY_SECRET);
        assertThat(RazorpaySignatures.verifyPayment("order_EXPENSIVE", "pay_B", otherOrdersSignature, KEY_SECRET))
            .isFalse();
    }

    @Test
    void rejectsASignatureMintedWithTheWrongSecret() {
        String forged = RazorpaySignatures.hmacSha256Hex("order_A|pay_B", "not-our-secret");
        assertThat(RazorpaySignatures.verifyPayment("order_A", "pay_B", forged, KEY_SECRET)).isFalse();
    }

    @Test
    void rejectsMissingCallbackFields() {
        assertThat(RazorpaySignatures.verifyPayment(null, "pay_B", "sig", KEY_SECRET)).isFalse();
        assertThat(RazorpaySignatures.verifyPayment("order_A", null, "sig", KEY_SECRET)).isFalse();
        assertThat(RazorpaySignatures.verifyPayment("order_A", "pay_B", null, KEY_SECRET)).isFalse();
    }

    @Test
    void acceptsAGenuineWebhookBody() {
        String body = "{\"event\":\"payment.captured\",\"payload\":{}}";
        String signature = RazorpaySignatures.hmacSha256Hex(body, WEBHOOK_SECRET);
        assertThat(RazorpaySignatures.verifyWebhook(body, signature, WEBHOOK_SECRET)).isTrue();
    }

    @Test
    void rejectsAWebhookBodyChangedByOneByte() {
        String body = "{\"event\":\"payment.captured\",\"payload\":{\"amount\":100}}";
        String signature = RazorpaySignatures.hmacSha256Hex(body, WEBHOOK_SECRET);
        String tampered = body.replace("100", "900");
        assertThat(RazorpaySignatures.verifyWebhook(tampered, signature, WEBHOOK_SECRET)).isFalse();
    }

    /**
     * Guards the mistake that costs an afternoon: re-serialising the parsed
     * JSON before hashing. Same data, different bytes, no match.
     */
    @Test
    void rejectsAReserialisedCopyOfTheSameJson() {
        String asSent = "{\"event\":\"payment.captured\",\"payload\":{\"a\":1}}";
        String reserialised = "{\n  \"event\" : \"payment.captured\",\n  \"payload\" : { \"a\" : 1 }\n}";
        String signature = RazorpaySignatures.hmacSha256Hex(asSent, WEBHOOK_SECRET);
        assertThat(RazorpaySignatures.verifyWebhook(reserialised, signature, WEBHOOK_SECRET)).isFalse();
    }

    /**
     * A blank secret must be a refusal, never an accident that verifies. The
     * guard has to sit *before* the HMAC too — a zero-length HMAC key throws.
     */
    @Test
    void anUnsetWebhookSecretRejectsEverything() {
        String body = "{\"event\":\"payment.captured\"}";
        assertThat(RazorpaySignatures.verifyWebhook(body, "anything", "")).isFalse();
        assertThat(RazorpaySignatures.verifyWebhook(body, "anything", null)).isFalse();
        assertThat(RazorpaySignatures.verifyWebhook(body, null, WEBHOOK_SECRET)).isFalse();
        assertThat(RazorpaySignatures.verifyWebhook(null, "anything", WEBHOOK_SECRET)).isFalse();
    }

    /* ── provider-level checks ── */

    private RazorpayPaymentProvider provider() {
        return new RazorpayPaymentProvider(
            new RazorpayProperties("rzp_test_abc", KEY_SECRET, WEBHOOK_SECRET, null),
            new com.fasterxml.jackson.databind.ObjectMapper());
    }

    @Test
    void providerVerifiesAGenuineHandlerCallback() {
        String signature = RazorpaySignatures.hmacSha256Hex("order_A|pay_B", KEY_SECRET);
        assertThat(provider().verifyCapture("order_A", Map.of(
            "razorpay_order_id", "order_A",
            "razorpay_payment_id", "pay_B",
            "razorpay_signature", signature))).isTrue();
    }

    @Test
    void providerRefusesACallbackNamingAnotherOrder() {
        String signature = RazorpaySignatures.hmacSha256Hex("order_OTHER|pay_B", KEY_SECRET);
        assertThat(provider().verifyCapture("order_A", Map.of(
            "razorpay_order_id", "order_OTHER",
            "razorpay_payment_id", "pay_B",
            "razorpay_signature", signature))).isFalse();
    }

    /** The webhook controller already verified the stronger signature. */
    @Test
    void providerTrustsAWebhookSourcedConfirmForTheMatchingOrder() {
        assertThat(provider().verifyCapture("order_A", Map.of(
            "razorpay_order_id", "order_A",
            "razorpay_payment_id", "pay_B",
            "source", "webhook"))).isTrue();
        // …but still not for a different order
        assertThat(provider().verifyCapture("order_A", Map.of(
            "razorpay_order_id", "order_Z",
            "source", "webhook"))).isFalse();
    }

    @Test
    void propertiesDecideWhetherTheGatewayIsBoundAtAll() {
        assertThat(new RazorpayProperties("", "", "", null).enabled()).isFalse();
        assertThat(new RazorpayProperties("rzp_test_x", "", "", null).enabled()).isFalse();
        assertThat(new RazorpayProperties("rzp_test_x", "s", "", null).enabled()).isTrue();
        assertThat(new RazorpayProperties("rzp_test_x", "s", "", null).testMode()).isTrue();
        assertThat(new RazorpayProperties("rzp_live_x", "s", "", null).testMode()).isFalse();
        assertThat(new RazorpayProperties("k", "s", "w", null).baseUrl())
            .isEqualTo("https://api.razorpay.com");
    }
}
