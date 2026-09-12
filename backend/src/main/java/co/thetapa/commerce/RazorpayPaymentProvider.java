package co.thetapa.commerce;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Razorpay Standard Checkout.
 *
 * <p>The flow this implements, end to end:
 * <ol>
 *   <li>{@link #createIntent} calls Razorpay's Orders API and returns the
 *       {@code order_xxx} id. We store it as the order's {@code paymentRef},
 *       so it is the join key for everything that comes back later.</li>
 *   <li>The browser opens Razorpay's checkout.js modal with that id. The buyer
 *       pays by UPI / card / netbanking inside Razorpay's own iframe — no card
 *       or UPI credential ever touches our origin or our servers.</li>
 *   <li>Razorpay's success handler posts three values back to us, which
 *       {@link #verifyCapture} checks against an HMAC of the key secret. That
 *       is the fast path: the buyer sees their confirmation immediately.</li>
 *   <li>Independently, Razorpay POSTs a {@code payment.captured} webhook to
 *       {@code /api/v1/payments/razorpay/webhook}. That is the path of record —
 *       it arrives even if the buyer closes the tab mid-redirect, which the
 *       handler callback does not.</li>
 * </ol>
 *
 * <p>Deliberately written against {@code java.net.http} rather than the
 * Razorpay SDK: the surface we need is one POST and two HMACs, and this keeps
 * the dependency tree (and its CVE feed) unchanged.
 */
public class RazorpayPaymentProvider implements PaymentProvider {

    private static final Logger log = LoggerFactory.getLogger(RazorpayPaymentProvider.class);

    private final RazorpayProperties props;
    private final ObjectMapper json;
    private final HttpClient http;

    public RazorpayPaymentProvider(RazorpayProperties props, ObjectMapper json) {
        this.props = props;
        this.json = json;
        this.http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    }

    @Override
    public String name() {
        return "razorpay";
    }

    @Override
    public PaymentIntent createIntent(String orderNumber, long amountPaise, String method) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("amount", amountPaise);          // Razorpay counts in paise too
        body.put("currency", "INR");
        body.put("receipt", orderNumber);         // our TK-2026-0001, echoed back on every event
        body.put("payment_capture", 1);           // auto-capture; no separate capture call
        body.put("notes", Map.of("tapa_order", orderNumber, "preferred_method", method));

        JsonNode created = post("/v1/orders", body);
        String razorpayOrderId = created.path("id").asText();
        if (razorpayOrderId.isBlank()) {
            throw new IllegalStateException("Razorpay returned no order id for " + orderNumber);
        }
        log.info("[razorpay] order {} → {} (₹{}, {} mode)",
            orderNumber, razorpayOrderId, amountPaise / 100.0, props.testMode() ? "TEST" : "LIVE");

        // Everything checkout.js needs. The key *id* is public by design — it
        // is in the page source of every Razorpay integration. The secret is
        // not here and must never be.
        Map<String, Object> clientPayload = new LinkedHashMap<>();
        clientPayload.put("provider", "razorpay");
        clientPayload.put("keyId", props.keyId());
        clientPayload.put("razorpayOrderId", razorpayOrderId);
        clientPayload.put("amountPaise", amountPaise);
        clientPayload.put("currency", "INR");
        clientPayload.put("orderNumber", orderNumber);
        clientPayload.put("preferredMethod", method);
        clientPayload.put("testMode", props.testMode());
        clientPayload.put("verifyUrl", "/api/v1/payments/razorpay/verify");
        return new PaymentIntent(razorpayOrderId, clientPayload);
    }

    /**
     * Checks the checkout.js callback. {@code providerRef} is the Razorpay
     * order id we stored, so a signature computed over some *other* order
     * cannot confirm this one.
     */
    @Override
    public boolean verifyCapture(String providerRef, Map<String, Object> callbackPayload) {
        String orderId = str(callbackPayload.get("razorpay_order_id"));
        String paymentId = str(callbackPayload.get("razorpay_payment_id"));
        String signature = str(callbackPayload.get("razorpay_signature"));

        if (providerRef == null || !providerRef.equals(orderId)) {
            log.warn("[razorpay] callback order id {} does not match the stored ref {}", orderId, providerRef);
            return false;
        }
        // A webhook-driven confirm has no handler signature — the webhook
        // controller has already verified its own, stronger one.
        if ("webhook".equals(callbackPayload.get("source"))) {
            return true;
        }
        boolean ok = RazorpaySignatures.verifyPayment(orderId, paymentId, signature, props.keySecret());
        if (!ok) {
            log.warn("[razorpay] signature mismatch for order {} / payment {}", orderId, paymentId);
        }
        return ok;
    }

    private JsonNode post(String path, Map<String, Object> body) {
        try {
            String auth = Base64.getEncoder().encodeToString(
                (props.keyId() + ":" + props.keySecret()).getBytes(StandardCharsets.UTF_8));
            HttpRequest request = HttpRequest.newBuilder(URI.create(props.baseUrl() + path))
                .timeout(Duration.ofSeconds(20))
                .header("Authorization", "Basic " + auth)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(json.writeValueAsString(body)))
                .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() / 100 != 2) {
                // Razorpay's error body names the offending field — worth keeping.
                throw new IllegalStateException(
                    "Razorpay " + path + " failed (HTTP " + response.statusCode() + "): " + response.body());
            }
            return json.readTree(response.body());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Razorpay call interrupted", e);
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("Razorpay " + path + " call failed", e);
        }
    }

    private static String str(Object o) {
        return o == null ? null : o.toString();
    }
}
