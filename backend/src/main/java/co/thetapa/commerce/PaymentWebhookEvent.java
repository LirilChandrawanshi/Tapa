package co.thetapa.commerce;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Every gateway webhook we receive, kept whether or not we acted on it.
 *
 * <p>A payment gateway is the one integration where "it silently did nothing"
 * is indistinguishable from "it never arrived" unless you write down what
 * turned up. This collection is the audit trail behind
 * {@code GET /api/v1/admin/payments/webhooks}: signature verdict, event type,
 * the order it matched, and what we did about it.
 */
@Document("payment_webhook_events")
public class PaymentWebhookEvent {

    public enum Outcome {
        /** Signature failed — payload ignored entirely. */
        REJECTED_SIGNATURE,
        /** Authentic, but not an event we act on. */
        IGNORED,
        /** Authentic and already processed under the same gateway event id. */
        DUPLICATE,
        /** Authentic, matched an order, order advanced. */
        APPLIED,
        /** Authentic but could not be applied (no such order, etc.). */
        FAILED
    }

    @Id
    private String id;

    private String provider = "razorpay";
    /** Gateway's own delivery id (x-razorpay-event-id) — the dedupe key. */
    @Indexed
    private String eventId;
    private String event;            // payment.captured, payment.failed, order.paid…
    @Indexed
    private String providerRef;      // razorpay order id — joins to Order.paymentRef
    private String paymentId;        // pay_xxx
    private String orderNumber;      // our TK-…, once resolved
    private Long amountPaise;
    private String method;           // upi | card | netbanking, as Razorpay reports it
    private boolean signatureValid;
    private Outcome outcome;
    private String note;
    /** Raw body as received — the only thing the signature was ever computed over. */
    private String rawBody;
    @Indexed
    private Instant receivedAt = Instant.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }
    public String getEvent() { return event; }
    public void setEvent(String event) { this.event = event; }
    public String getProviderRef() { return providerRef; }
    public void setProviderRef(String providerRef) { this.providerRef = providerRef; }
    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }
    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
    public Long getAmountPaise() { return amountPaise; }
    public void setAmountPaise(Long amountPaise) { this.amountPaise = amountPaise; }
    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }
    public boolean isSignatureValid() { return signatureValid; }
    public void setSignatureValid(boolean signatureValid) { this.signatureValid = signatureValid; }
    public Outcome getOutcome() { return outcome; }
    public void setOutcome(Outcome outcome) { this.outcome = outcome; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
    public String getRawBody() { return rawBody; }
    public void setRawBody(String rawBody) { this.rawBody = rawBody; }
    public Instant getReceivedAt() { return receivedAt; }
    public void setReceivedAt(Instant receivedAt) { this.receivedAt = receivedAt; }
}
