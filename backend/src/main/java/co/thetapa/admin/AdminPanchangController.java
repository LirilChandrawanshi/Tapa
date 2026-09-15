package co.thetapa.admin;

import co.thetapa.common.ApiResponse;
import co.thetapa.common.NotFoundException;
import co.thetapa.panchang.Observance;
import co.thetapa.panchang.ObservanceRepository;
import co.thetapa.panchang.PanchangDay;
import co.thetapa.panchang.PanchangDayRepository;
import co.thetapa.ritualcard.PanchangDayUpdatedEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * Manual-first panchang data entry (the PRD's editorial verification loop).
 * Every day upsert re-fires {@link PanchangDayUpdatedEvent} for observances
 * falling on that date so linked ritual-card PDFs regenerate.
 */
@RestController
@RequestMapping("/api/v1/admin")
public class AdminPanchangController {

    private final PanchangDayRepository days;
    private final ObservanceRepository observances;
    private final ApplicationEventPublisher events;

    public AdminPanchangController(PanchangDayRepository days, ObservanceRepository observances,
                                   ApplicationEventPublisher events) {
        this.days = days;
        this.observances = observances;
        this.events = events;
    }

    /* ---------- panchang days ---------- */

    @GetMapping("/panchang/days")
    public ApiResponse<List<PanchangDay>> listDays(
        @RequestParam(required = false) LocalDate from,
        @RequestParam(required = false) LocalDate to,
        @RequestParam(defaultValue = PanchangDay.DEFAULT_CITY) String city) {
        LocalDate start = from != null ? from : LocalDate.now().withDayOfMonth(1);
        LocalDate end = to != null ? to : start.plusDays(31);
        return ApiResponse.ok(days.findByCityAndDateBetweenOrderByDateAsc(city, start, end));
    }

    /** Upsert one day (date+city is the natural key); verified flag taken as sent. */
    @CacheEvict(value = {"home", "deity-assignments"}, allEntries = true)
    @PutMapping("/panchang/days/{date}")
    public ApiResponse<PanchangDay> upsertDay(
        @PathVariable LocalDate date,
        @RequestParam(defaultValue = PanchangDay.DEFAULT_CITY) String city,
        @RequestBody PanchangDay body) {
        PanchangDay saved = upsert(date, city, body);
        fireObservanceEvents(date);
        return ApiResponse.ok(saved);
    }

    /** Bulk JSON import — an array of day documents, each carrying its own date. */
    @CacheEvict(value = {"home", "deity-assignments"}, allEntries = true)
    @PostMapping("/panchang/days/import")
    public ApiResponse<Map<String, Object>> importDays(@RequestBody List<PanchangDay> body) {
        int imported = 0;
        for (PanchangDay day : body) {
            if (day.getDate() == null) {
                throw new IllegalArgumentException("Every imported day needs a 'date'.");
            }
            String city = day.getCity() == null || day.getCity().isBlank()
                ? PanchangDay.DEFAULT_CITY : day.getCity();
            upsert(day.getDate(), city, day);
            fireObservanceEvents(day.getDate());
            imported++;
        }
        return ApiResponse.ok(Map.of("imported", imported));
    }

    private PanchangDay upsert(LocalDate date, String city, PanchangDay body) {
        body.setDate(date);
        body.setCity(city);
        days.findByDateAndCity(date, city).ifPresent(existing -> {
            body.setId(existing.getId());
            body.setCreatedAt(existing.getCreatedAt());
        });
        return days.save(body);
    }

    /** Ritual cards embed timings: nudge regeneration for observances on this date. */
    private void fireObservanceEvents(LocalDate date) {
        observances.findByDateBetweenOrderByDateAsc(date, date)
            .forEach(o -> events.publishEvent(new PanchangDayUpdatedEvent(o.getSlug())));
    }

    /* ---------- observances ---------- */

    @GetMapping("/observances")
    public ApiResponse<List<Observance>> listObservances(@RequestParam(required = false) Integer year) {
        int y = year != null ? year : LocalDate.now().getYear();
        return ApiResponse.ok(observances.findByDateBetweenOrderByDateAsc(
            LocalDate.of(y, 1, 1), LocalDate.of(y, 12, 31)));
    }

    @CacheEvict(value = {"home", "deity-assignments"}, allEntries = true)
    @PutMapping("/observances/{slug}")
    public ApiResponse<Observance> upsertObservance(@PathVariable String slug, @RequestBody Observance body) {
        body.setSlug(slug);
        observances.findBySlug(slug).ifPresent(existing -> {
            body.setId(existing.getId());
            body.setCreatedAt(existing.getCreatedAt());
        });
        Observance saved = observances.save(body);
        // timing/date edits feed the ritual card footer — regenerate linked articles
        events.publishEvent(new PanchangDayUpdatedEvent(saved.getSlug()));
        return ApiResponse.ok(saved);
    }

    @CacheEvict(value = {"home", "deity-assignments"}, allEntries = true)
    @PostMapping("/observances/{slug}/verify")
    public ApiResponse<Observance> toggleVerify(@PathVariable String slug) {
        Observance observance = observances.findBySlug(slug)
            .orElseThrow(() -> new NotFoundException("observance", slug));
        observance.setVerified(!observance.isVerified());
        return ApiResponse.ok(observances.save(observance));
    }
}
