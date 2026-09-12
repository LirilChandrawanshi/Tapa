package co.thetapa.commerce;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Map;
import java.util.UUID;

/**
 * Dev fallback. Instantiated by {@link PaymentProviderConfig} when no Razorpay
 * key is configured — not component-scanned, so the choice of gateway is made
 * in exactly one place.
 */
public class MockPaymentProvider implements PaymentProvider {

    private static final Logger log = LoggerFactory.getLogger(MockPaymentProvider.class);

    @Override
    public String name() {
        return "mock";
    }

    @Override
    public PaymentIntent createIntent(String orderNumber, long amountPaise, String method) {
        String ref = "mockpay_" + UUID.randomUUID().toString().substring(0, 12);
        log.info("[MOCK PAYMENT] intent {} for {} — ₹{} via {}", ref, orderNumber, amountPaise / 100.0, method);
        return new PaymentIntent(ref, Map.of(
            "provider", "mock",
            "confirmUrl", "/api/v1/payments/mock/confirm",
            "providerRef", ref
        ));
    }

    @Override
    public boolean verifyCapture(String providerRef, Map<String, Object> callbackPayload) {
        // dev: any callback naming the ref counts as captured
        return providerRef != null && providerRef.equals(callbackPayload.get("providerRef"));
    }
}
