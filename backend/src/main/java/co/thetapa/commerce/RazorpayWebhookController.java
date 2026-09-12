package co.thetapa.commerce;

import co.thetapa.common.ApiResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * The two ways a Razorpay payment reaches us.
 *
 * <p><b>/verify</b> — the browser's success handler. Fast, but only fires if
 * the buyer's tab survives the redirect back from their UPI app. Treat it as an
 * optimisation for the confirmation screen, never as the source of truth.
 *
 * <p><b>/webhook</b> — server to server, retried by Razorpay for 24 hours until
 * we answer 2xx. This is the source of truth. It is deliberately generous about
 * what it answers 200 to: anything authentic is acknowledged so Razorpay stops
 * retrying, and the reason we did nothing is written to
 * {@link PaymentWebhookEvent} instead. Only an unverifiable signature gets a
 * 400 — that is not Razorpay talking.
 */
@RestController
@RequestMapping("/api/v1")
public class RazorpayWebhookController {

    private static final Logger log = LoggerFactory.getLogger(RazorpayWebhookController.class);

    /** Enough to debug a delivery; short of letting a hostile body fill the DB. */
    private static final int RAW_BODY_CAP = 20_000;

    private final CheckoutService checkout;
    private final OrderRepository orders;
    private final PaymentWebhookEventRepository events;
    private final RazorpayProperties props;
    private final ObjectMapper json;

    public RazorpayWebhookController(CheckoutService checkout, OrderRepository orders,
                                     PaymentWebhookEventRepository events,
                                     RazorpayProperties props, ObjectMapper json) {
        this.checkout = checkout;
        this.orders = orders;
        this.events = events;
        this.props = props;
        this.json = json;
    }

    /** Browser handler callback from checkout.js. */
    @PostMapping("/payments/razorpay/verify")
    public ApiResponse<OrderController.OrderView> verify(@RequestBody Map<String, Object> body) {
        var order = checkout.confirmPayment((String) body.get("razorpay_order_id"), body);
        return ApiResponse.ok(OrderController.OrderView.of(order));
    }

    /**
     * Razorpay → us. Consumes the body as a String on purpose: the signature is
     * computed over the exact bytes sent, so re-serialising a parsed object
     * would break verification.
     */
    @PostMapping(value = "/payments/razorpay/webhook", consumes = "application/json")
    public ResponseEntity<Map<String, Object>> webhook(
        @RequestBody String rawBody,
        @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature,
        @RequestHeader(value = "X-Razorpay-Event-Id", required = false) String eventId) {

        PaymentWebhookEvent record = new PaymentWebhookEvent();
        record.setEventId(eventId);
        record.setRawBody(rawBody.length() > RAW_BODY_CAP ? rawBody.substring(0, RAW_BODY_CAP) + "…(truncated)" : rawBody);

        if (!RazorpaySignatures.verifyWebhook(rawBody, signature, props.webhookSecret())) {
            record.setSignatureValid(false);
            record.setOutcome(PaymentWebhookEvent.Outcome.REJECTED_SIGNATURE);
            record.setNote(props.webhookSecret().isBlank()
                ? "tapa.razorpay.webhook-secret is not configured"
                : "X-Razorpay-Signature did not match the raw body");
            events.save(record);
            log.warn("[razorpay] rejected a webhook: {}", record.getNote());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("ok", false, "reason", "signature"));
        }
        record.setSignatureValid(true);

        JsonNode root;
        try {
            root = json.readTree(rawBody);
        } catch (Exception e) {
            record.setOutcome(PaymentWebhookEvent.Outcome.FAILED);
            record.setNote("Body passed the signature check but is not JSON: " + e.getMessage());
            events.save(record);
            return ResponseEntity.ok(Map.of("ok", true, "handled", false));
        }

        String event = root.path("event").asText();
        JsonNode payment = root.path("payload").path("payment").path("entity");
        record.setEvent(event);
        record.setProviderRef(text(payment, "order_id"));
        record.setPaymentId(text(payment, "id"));
        record.setMethod(text(payment, "method"));
        if (payment.hasNonNull("amount")) {
            record.setAmountPaise(payment.path("amount").asLong());
        }
        if (record.getProviderRef() != null) {
            orders.findByPaymentRef(record.getProviderRef())
                .ifPresent(o -> record.setOrderNumber(o.getOrderNumber()));
        }

        // Razorpay retries until it gets a 2xx, so the same event id can land
        // more than once. confirmPayment is idempotent anyway; this just keeps
        // the audit trail honest about which delivery did the work.
        if (eventId != null && events.findFirstByEventIdAndOutcome(
                eventId, PaymentWebhookEvent.Outcome.APPLIED).isPresent()) {
            record.setOutcome(PaymentWebhookEvent.Outcome.DUPLICATE);
            record.setNote("Already applied under the same X-Razorpay-Event-Id");
            events.save(record);
            return ResponseEntity.ok(Map.of("ok", true, "handled", false, "duplicate", true));
        }

        switch (event) {
            case "payment.captured", "order.paid" -> apply(record);
            case "payment.failed" -> {
                record.setOutcome(PaymentWebhookEvent.Outcome.IGNORED);
                record.setNote("Payment failed at the gateway — the order stays PENDING_PAYMENT "
                    + "so the buyer can retry from their cart.");
            }
            default -> {
                record.setOutcome(PaymentWebhookEvent.Outcome.IGNORED);
                record.setNote("No handler for " + event);
            }
        }
        events.save(record);
        return ResponseEntity.ok(Map.of(
            "ok", true,
            "handled", record.getOutcome() == PaymentWebhookEvent.Outcome.APPLIED));
    }

    private void apply(PaymentWebhookEvent record) {
        if (record.getProviderRef() == null || record.getProviderRef().isBlank()) {
            record.setOutcome(PaymentWebhookEvent.Outcome.FAILED);
            record.setNote("Event carried no payload.payment.entity.order_id");
            return;
        }
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("razorpay_order_id", record.getProviderRef());
            payload.put("razorpay_payment_id", record.getPaymentId());
            // Tells the provider the authenticity check already happened, at the
            // webhook's own (stronger) signature rather than the handler's.
            payload.put("source", "webhook");
            payload.put("providerRef", record.getProviderRef()); // mock provider's key
            var order = checkout.confirmPayment(record.getProviderRef(), payload);
            record.setOrderNumber(order.getOrderNumber());
            record.setOutcome(PaymentWebhookEvent.Outcome.APPLIED);
            record.setNote("Order is now " + order.getStatus());
            log.info("[razorpay] {} → order {} is {}", record.getEvent(),
                order.getOrderNumber(), order.getStatus());
        } catch (Exception e) {
            record.setOutcome(PaymentWebhookEvent.Outcome.FAILED);
            record.setNote(e.getMessage());
            log.error("[razorpay] could not apply {} for {}", record.getEvent(), record.getProviderRef(), e);
        }
    }

    /** Admin view — what actually arrived, newest first. */
    @GetMapping("/admin/payments/webhooks")
    public ApiResponse<List<Map<String, Object>>> recent(
        @RequestParam(defaultValue = "50") int limit,
        @RequestParam(required = false) String orderNumber) {

        List<PaymentWebhookEvent> found = orderNumber != null && !orderNumber.isBlank()
            ? events.findByOrderNumberOrderByReceivedAtDesc(orderNumber.trim())
            : events.findAllByOrderByReceivedAtDesc(PageRequest.of(0, Math.min(Math.max(limit, 1), 200)));

        return ApiResponse.ok(found.stream().map(e -> {
            Map<String, Object> view = new LinkedHashMap<>();
            view.put("receivedAt", e.getReceivedAt());
            view.put("event", e.getEvent());
            view.put("outcome", e.getOutcome());
            view.put("signatureValid", e.isSignatureValid());
            view.put("orderNumber", e.getOrderNumber());
            view.put("providerRef", e.getProviderRef());
            view.put("paymentId", e.getPaymentId());
            view.put("amountPaise", e.getAmountPaise());
            view.put("method", e.getMethod());
            view.put("note", e.getNote());
            return view;
        }).toList());
    }

    private static String text(JsonNode node, String field) {
        return node.hasNonNull(field) ? node.path(field).asText() : null;
    }
}
