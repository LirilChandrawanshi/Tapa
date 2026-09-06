package co.thetapa.panchang;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

/**
 * The PRD rule: the site never talks to a panchang source directly — everything
 * flows through this abstraction. Phase 1 is manual editorial data
 * ({@link ManualPanchangProvider}); a computed or API-backed provider can slot
 * in later without touching the public contract.
 */
public interface PanchangProvider {

    Optional<PanchangDay> forDate(LocalDate date, String city);

    List<Observance> observances(YearMonth month);
}
