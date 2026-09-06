package co.thetapa.panchang;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

@Component
public class ManualPanchangProvider implements PanchangProvider {

    private final PanchangDayRepository days;
    private final ObservanceRepository observances;

    public ManualPanchangProvider(PanchangDayRepository days, ObservanceRepository observances) {
        this.days = days;
        this.observances = observances;
    }

    @Override
    public Optional<PanchangDay> forDate(LocalDate date, String city) {
        return days.findByDateAndCity(date, city);
    }

    @Override
    public List<Observance> observances(YearMonth month) {
        return observances.findByDateBetweenOrderByDateAsc(month.atDay(1), month.atEndOfMonth());
    }
}
