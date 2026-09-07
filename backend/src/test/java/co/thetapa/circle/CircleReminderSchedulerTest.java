package co.thetapa.circle;

import co.thetapa.panchang.Observance;
import co.thetapa.panchang.ObservanceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * The two T2 gates (G58): a fan-out requires the observance to be VERIFIED and
 * to carry a human approval row. Either one missing → nothing is sent.
 */
class CircleReminderSchedulerTest {

    private ObservanceRepository observances;
    private CircleService circleService;
    private CircleApprovalRepository approvals;
    private CircleReminderScheduler scheduler;

    @BeforeEach
    void setUp() {
        observances = mock(ObservanceRepository.class);
        circleService = mock(CircleService.class);
        approvals = mock(CircleApprovalRepository.class);
        scheduler = new CircleReminderScheduler(observances, circleService,
            mock(CircleMemberRepository.class), mock(CircleSendRepository.class), approvals);
    }

    private static Observance tomorrowObservance(boolean verified) {
        Observance o = new Observance();
        o.setSlug("karwa-chauth-2026");
        o.setName("Karwa Chauth");
        o.setDate(LocalDate.now(CircleService.IST).plusDays(1));
        o.setVerified(verified);
        return o;
    }

    @Test
    void verifiedAndApprovedObservanceFansOut() {
        Observance o = tomorrowObservance(true);
        when(observances.findByDateGreaterThanEqualOrderByDateAsc(any())).thenReturn(List.of(o));
        when(approvals.existsByObservanceSlug("karwa-chauth-2026")).thenReturn(true);

        scheduler.sendEveningBeforeReminders();

        verify(circleService).sendOccasionReminders(o);
    }

    @Test
    void verifiedButUnapprovedObservanceIsSkipped() {
        when(observances.findByDateGreaterThanEqualOrderByDateAsc(any()))
            .thenReturn(List.of(tomorrowObservance(true)));
        when(approvals.existsByObservanceSlug("karwa-chauth-2026")).thenReturn(false);

        scheduler.sendEveningBeforeReminders();

        verify(circleService, never()).sendOccasionReminders(any());
    }

    @Test
    void approvedButUnverifiedObservanceIsStillSkipped() {
        when(observances.findByDateGreaterThanEqualOrderByDateAsc(any()))
            .thenReturn(List.of(tomorrowObservance(false)));
        when(approvals.existsByObservanceSlug("karwa-chauth-2026")).thenReturn(true);

        scheduler.sendEveningBeforeReminders();

        verify(circleService, never()).sendOccasionReminders(any());
    }

    /** T2 is strictly "the evening before" — a day-after-tomorrow date must wait. */
    @Test
    void onlyTomorrowsObservancesAreConsidered() {
        Observance later = tomorrowObservance(true);
        later.setDate(LocalDate.now(CircleService.IST).plusDays(2));
        when(observances.findByDateGreaterThanEqualOrderByDateAsc(any()))
            .thenReturn(List.of(later));
        when(approvals.existsByObservanceSlug("karwa-chauth-2026")).thenReturn(true);

        scheduler.sendEveningBeforeReminders();

        verify(circleService, never()).sendOccasionReminders(any());
    }
}
