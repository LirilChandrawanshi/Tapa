package co.thetapa.panchang;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class PanchangService {

    public static final ZoneId IST = ZoneId.of("Asia/Kolkata");

    private final PanchangProvider provider;
    private final PanchangDayRepository days;
    private final ObservanceRepository observances;

    public PanchangService(PanchangProvider provider, PanchangDayRepository days,
                           ObservanceRepository observances) {
        this.provider = provider;
        this.days = days;
        this.observances = observances;
    }

    /**
     * Never-blank rule (PRD): if the requested day is missing, serve the nearest
     * prior day flagged stale rather than empty cells.
     */
    @Cacheable(value = "panchang", key = "'day:' + #date + ':' + #city")
    public DayPayload day(LocalDate date, String city) {
        String resolvedCity = city == null ? PanchangDay.DEFAULT_CITY : city;
        Optional<PanchangDay> exact = provider.forDate(date, resolvedCity);
        if (exact.isPresent()) {
            return new DayPayload(exact.get(), false, exact.get().isVerified());
        }
        return staleFallback(date, resolvedCity)
            .map(d -> new DayPayload(d, true, d.isVerified()))
            .orElse(new DayPayload(null, true, false));
    }

    private Optional<PanchangDay> staleFallback(LocalDate date, String city) {
        // nearest prior day, capped at 15 days back, keeps the fold populated without lying badly
        return days.findTopByDateLessThanEqualAndCityOrderByDateDesc(date, city)
            .filter(d -> ChronoUnit.DAYS.between(d.getDate(), date) <= 15);
    }

    public DayPayload today(String city) {
        return day(LocalDate.now(IST), city);
    }

    public List<UpcomingObservance> upcoming(int limit) {
        LocalDate today = LocalDate.now(IST);
        return observances.findByDateGreaterThanEqualOrderByDateAsc(today).stream()
            .limit(Math.min(limit, 30))
            .map(o -> UpcomingObservance.of(o, today))
            .toList();
    }

    public List<UpcomingObservance> calendar(YearMonth month) {
        LocalDate today = LocalDate.now(IST);
        return provider.observances(month).stream()
            .map(o -> UpcomingObservance.of(o, today))
            .toList();
    }

    public List<UpcomingObservance> byType(Observance.Type type) {
        LocalDate today = LocalDate.now(IST);
        return observances.findByTypeAndDateGreaterThanEqualOrderByDateAsc(type, today).stream()
            .map(o -> UpcomingObservance.of(o, today))
            .toList();
    }

    public List<UpcomingObservance> ekadashi() {
        LocalDate today = LocalDate.now(IST);
        return observances.findBySeriesOrderByDateAsc("ekadashi").stream()
            .map(o -> UpcomingObservance.of(o, today))
            .toList();
    }

    public Map<String, Object> festival(String slug) {
        Observance o = observances.findBySlug(slug)
            .orElseThrow(() -> new co.thetapa.common.NotFoundException("observance", slug));
        return Map.of(
            "observance", o,
            "countdownDays", ChronoUnit.DAYS.between(LocalDate.now(IST), o.getDate())
        );
    }

    public record DayPayload(PanchangDay day, boolean stale, boolean verified) {
    }

    /** Countdown is computed server-side against IST — the pill colour rule lives in the client. */
    public record UpcomingObservance(Observance observance, long countdownDays) {

        static UpcomingObservance of(Observance o, LocalDate today) {
            return new UpcomingObservance(o, ChronoUnit.DAYS.between(today, o.getDate()));
        }
    }
}
