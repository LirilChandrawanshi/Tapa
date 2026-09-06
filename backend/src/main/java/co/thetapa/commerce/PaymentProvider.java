package co.thetapa.commerce;

import java.util.Map;

/**
 * Gateway abstraction. Production binds Razorpay (recommended in the PRD);
 * dev runs {@link MockPaymentProvider}. The order is created PENDING_PAYMENT,
 * the client completes payment against {@code clientPayload}, and the gateway's
 * capture callback (or the mock confirm endpoint) flips it to CONFIRMED.
 */
public interface PaymentProvider {

    record PaymentIntent(String providerRef, Map<String, Object> clientPayload) {
    }

    String name();

    PaymentIntent createIntent(String orderNumber, long amountPaise, String method);

    /** true when the callback payload is authentic and the payment captured */
    boolean verifyCapture(String providerRef, Map<String, Object> callbackPayload);
}
