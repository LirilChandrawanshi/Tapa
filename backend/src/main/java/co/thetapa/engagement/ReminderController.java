package co.thetapa.engagement;

import co.thetapa.common.ApiResponse;
import co.thetapa.common.NotFoundException;
import co.thetapa.content.Article;
import co.thetapa.content.ArticleRepository;
import co.thetapa.panchang.Observance;
import co.thetapa.panchang.ObservanceRepository;
import co.thetapa.panchang.PanchangService;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

/**
 * Personal vrat reminders (#180). One WhatsApp nudge per reminder, sent the
 * evening before the observance at 7:00 PM IST — the same cadence the Tapa
 * Circle uses, so the two never contradict each other.
 */
@RestController
@RequestMapping("/api/v1/me/reminders")
public class ReminderController {

    /** Reminders go out the evening before, at 7:00 PM IST. */
    static final LocalTime SEND_TIME_IST = LocalTime.of(19, 0);

    private final ReminderRepository reminders;
    private final ObservanceRepository observances;
    private final ArticleRepository articles;

    public ReminderController(ReminderRepository reminders, ObservanceRepository observances,
                              ArticleRepository articles) {
        this.reminders = reminders;
        this.observances = observances;
        this.articles = articles;
    }

    @GetMapping
    public ApiResponse<List<Map<String, Object>>> list(@AuthenticationPrincipal String userId) {
        var items = reminders.findByUserIdOrderByObservanceDateAsc(userId).stream()
            .map(ReminderController::view)
            .toList();
        return ApiResponse.ok(items);
    }

    public record CreateRequest(String articleSlug, String observanceSlug) {
    }

    @PostMapping
    public ApiResponse<Map<String, Object>> create(@AuthenticationPrincipal String userId,
                                                   @RequestBody CreateRequest body) {
        LocalDate today = LocalDate.now(PanchangService.IST);
        Observance observance = resolveObservance(body, today);

        // idempotent — a second tap on the same vrat returns the existing reminder
        Optional<Reminder> existing = reminders.findByUserIdAndObservanceSlug(userId, observance.getSlug());
        if (existing.isPresent()) {
            return ApiResponse.ok(view(existing.get()));
        }

        Reminder reminder = new Reminder();
        reminder.setUserId(userId);
        reminder.setObservanceSlug(observance.getSlug());
        reminder.setArticleSlug(body.articleSlug() != null && !body.articleSlug().isBlank()
            ? body.articleSlug() : observance.getArticleSlug());
        reminder.setTitle(observance.getName());
        reminder.setObservanceDate(observance.getDate());
        reminder.setSendAt(observance.getDate().minusDays(1)
            .atTime(SEND_TIME_IST).atZone(PanchangService.IST).toInstant());
        try {
            reminder = reminders.save(reminder);
        } catch (DuplicateKeyException e) {
            // raced with another tab — return whichever won
            reminder = reminders.findByUserIdAndObservanceSlug(userId, observance.getSlug())
                .orElseThrow(() -> e);
        }
        return ApiResponse.ok(view(reminder));
    }

    public record ToggleRequest(Boolean enabled) {
    }

    @PutMapping("/{id}")
    public ApiResponse<Map<String, Object>> toggle(@AuthenticationPrincipal String userId,
                                                   @PathVariable String id,
                                                   @RequestBody ToggleRequest body) {
        Reminder reminder = reminders.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new NotFoundException("reminder", id));
        if (body.enabled() != null) {
            reminder.setEnabled(body.enabled());
            reminder = reminders.save(reminder);
        }
        return ApiResponse.ok(view(reminder));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Map<String, Object>> remove(@AuthenticationPrincipal String userId,
                                                   @PathVariable String id) {
        reminders.findByIdAndUserId(id, userId).ifPresent(reminders::delete);
        return ApiResponse.ok(Map.of("removed", true));
    }

    /**
     * Finds the observance the reminder should fire for. Direct slug wins;
     * an article resolves through its linked observance, then by matching
     * upcoming observances (calendar entries link back via articleSlug).
     * Always lands on a date from today onward — a reminder for a past date
     * would never send.
     */
    private Observance resolveObservance(CreateRequest body, LocalDate today) {
        String observanceSlug = trimToNull(body.observanceSlug());
        String articleSlug = trimToNull(body.articleSlug());
        if (observanceSlug == null && articleSlug == null) {
            throw new IllegalArgumentException("Pass articleSlug or observanceSlug.");
        }

        if (observanceSlug != null) {
            Observance direct = observances.findBySlug(observanceSlug)
                .orElseThrow(() -> new NotFoundException("observance", observanceSlug));
            if (!direct.getDate().isBefore(today)) {
                return direct;
            }
            // this year's entry has passed — fall through to the next in the same series
            String series = direct.getSeries();
            if (series != null && !series.isBlank()) {
                Optional<Observance> next = observances.findBySeriesOrderByDateAsc(series).stream()
                    .filter(o -> !o.getDate().isBefore(today))
                    .findFirst();
                if (next.isPresent()) {
                    return next.get();
                }
            }
            throw new NotFoundException("upcoming observance", observanceSlug);
        }

        Article article = articles.findBySlug(articleSlug)
            .orElseThrow(() -> new NotFoundException("article", articleSlug));
        String linked = trimToNull(article.getLinkedObservanceSlug());
        if (linked != null) {
            Optional<Observance> viaLink = observances.findBySlug(linked)
                .filter(o -> !o.getDate().isBefore(today));
            if (viaLink.isPresent()) {
                return viaLink.get();
            }
        }
        // next calendar entry that points back at this guide
        return observances.findByDateGreaterThanEqualOrderByDateAsc(today).stream()
            .filter(o -> Objects.equals(articleSlug, o.getArticleSlug()))
            .findFirst()
            .orElseThrow(() -> new NotFoundException("upcoming observance for article", articleSlug));
    }

    private static String trimToNull(String s) {
        if (s == null || s.isBlank()) {
            return null;
        }
        return s.trim();
    }

    static Map<String, Object> view(Reminder r) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", r.getId());
        m.put("title", Optional.ofNullable(r.getTitle()).orElse(r.getObservanceSlug()));
        m.put("articleSlug", Optional.ofNullable(r.getArticleSlug()).orElse(""));
        m.put("observanceSlug", r.getObservanceSlug());
        m.put("observanceDate", r.getObservanceDate().toString());
        m.put("sendAt", Optional.ofNullable(r.getSendAt()).map(Instant::toString).orElse(""));
        m.put("channel", r.getChannel());
        m.put("enabled", r.isEnabled());
        return m;
    }
}
