package co.thetapa.config;

import co.thetapa.content.ArticleService;
import co.thetapa.ritualcard.PanchangDayUpdatedEvent;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Pushes on-demand ISR revalidation to the Next.js frontend whenever content
 * changes: article publish → {@code articles}, {@code article:{slug}} and
 * {@code home}; panchang day update → {@code panchang} and {@code home}.
 *
 * <p>Fire-and-forget by design: runs {@code @Async} (enabled in
 * {@code RitualCardConfig}), times out after 3 seconds, and logs a WARN on any
 * failure — a dead frontend must never affect publishing. The stale page
 * simply expires via its normal ISR window instead.
 */
@Component
public class RevalidationNotifier {

    private static final Logger log = LoggerFactory.getLogger(RevalidationNotifier.class);
    private static final Duration TIMEOUT = Duration.ofSeconds(3);

    private final HttpClient http = HttpClient.newBuilder()
        .connectTimeout(TIMEOUT)
        .build();

    private final String endpoint;
    private final String token;

    public RevalidationNotifier(
        @Value("${tapa.frontend.base-url:http://localhost:3000}") String frontendBaseUrl,
        @Value("${tapa.revalidate.token:dev-revalidate-token}") String token
    ) {
        this.endpoint = frontendBaseUrl.replaceAll("/+$", "") + "/api/revalidate";
        this.token = token;
    }

    @Async
    @EventListener
    public void onArticlePublished(ArticleService.ArticlePublishedEvent event) {
        notifyFrontend(List.of("articles", "article:" + event.slug(), "home"));
    }

    @Async
    @EventListener
    public void onPanchangDayUpdated(PanchangDayUpdatedEvent event) {
        notifyFrontend(List.of("panchang", "home"));
    }

    private void notifyFrontend(List<String> tags) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .timeout(TIMEOUT)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload(tags)))
                .build();
            HttpResponse<String> response =
                http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                log.warn("Frontend revalidation for tags {} returned HTTP {}",
                    tags, response.statusCode());
            } else {
                log.debug("Frontend revalidated tags {}", tags);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("Frontend revalidation for tags {} interrupted", tags);
        } catch (Exception e) {
            log.warn("Frontend revalidation for tags {} failed: {}", tags, e.toString());
        }
    }

    private String payload(List<String> tags) {
        String tagArray = tags.stream()
            .map(RevalidationNotifier::jsonString)
            .collect(Collectors.joining(","));
        return "{\"token\":" + jsonString(token) + ",\"tags\":[" + tagArray + "]}";
    }

    /** Minimal JSON string escaping — tags/tokens are slugs, but stay safe. */
    private static String jsonString(String value) {
        StringBuilder sb = new StringBuilder("\"");
        for (char c : value.toCharArray()) {
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                default -> {
                    if (c < 0x20) sb.append(String.format("\\u%04x", (int) c));
                    else sb.append(c);
                }
            }
        }
        return sb.append('"').toString();
    }
}
