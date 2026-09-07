package co.thetapa.circle;

import co.thetapa.common.ApiResponse;
import jakarta.validation.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import co.thetapa.panchang.Observance;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Public Circle endpoints. SecurityConfig permits all of /api/v1/**, so the
 * webhook authenticates itself: the provider must send X-Webhook-Token matching
 * {@code tapa.circle.webhook-token} (constant-time compare, 401 on mismatch).
 */
@RestController
@RequestMapping("/api/v1/circle")
@Validated
public class CircleController {

    private final CircleService circleService;
    private final String webhookToken;

    public CircleController(CircleService circleService,
                            @Value("${tapa.circle.webhook-token:dev-webhook-token}") String webhookToken) {
        this.circleService = circleService;
        this.webhookToken = webhookToken;
    }

    public record JoinRequest(@NotBlank String phone, String entryPointPage) {
    }

    @PostMapping("/join")
    public ApiResponse<CircleService.JoinIntentResult> join(@RequestBody JoinRequest request) {
        return ApiResponse.ok(circleService.joinIntent(request.phone(), request.entryPointPage()));
    }

    /**
     * Waiting-page poll. When the number is ACTIVE the payload also carries
     * {@code firstOccasion {name, date}} — the first upcoming verified AND
     * G58-approved observance (i.e. the reminder that will actually arrive) —
     * or omits the key when nothing upcoming is approved yet.
     */
    @GetMapping("/status")
    public ApiResponse<Map<String, Object>> status(@RequestParam String phone) {
        CircleService.PollStatus status = circleService.status(phone);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("status", status.name());
        if (status == CircleService.PollStatus.ACTIVE) {
            Observance first = circleService.firstUpcomingApproved(LocalDate.now(CircleService.IST));
            if (first != null) {
                body.put("firstOccasion",
                    Map.of("name", first.getName(), "date", first.getDate().toString()));
            }
        }
        return ApiResponse.ok(body);
    }

    /**
     * Generic inbound shape a Gupshup/Interakt webhook adapter normalizes into.
     * Two variants share it (#33): a plain message ({@code from/messageId/text},
     * type absent) and a status callback ({@code type:"status"} with
     * {@code messageId, status:"delivered"|"failed"|"blocked", recipient}).
     */
    public record WebhookRequest(String type, String from, String messageId, String text,
                                 String status, String recipient) {
    }

    @PostMapping("/webhook")
    public ResponseEntity<ApiResponse<Map<String, String>>> webhook(
        @RequestHeader(value = "X-Webhook-Token", required = false) String token,
        @RequestBody WebhookRequest request) {

        if (token == null || !MessageDigest.isEqual(
            token.getBytes(StandardCharsets.UTF_8), webhookToken.getBytes(StandardCharsets.UTF_8))) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.fail("unauthorized", "Invalid webhook token"));
        }
        String result = "status".equalsIgnoreCase(request.type())
            ? circleService.handleStatusCallback(request.messageId(), request.status(), request.recipient())
            : circleService.handleInbound(request.from(), request.messageId(), request.text());
        return ResponseEntity.ok(ApiResponse.ok(Map.of("result", result)));
    }
}
