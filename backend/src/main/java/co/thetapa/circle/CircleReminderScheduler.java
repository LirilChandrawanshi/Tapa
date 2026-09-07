package co.thetapa.circle;

import co.thetapa.panchang.Observance;
import co.thetapa.panchang.ObservanceRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * The Circle's only clocks.
 *
 * <p>T2: every evening 6pm IST, remind about tomorrow's Delhi-NCR observances —
 * the evening BEFORE, auto-triggered from the panchang records. Nothing is ever
 * sent on non-observance days: no weekly broadcast, no countdowns, no product
 * pushes. Two gates guard every fan-out: the observance must be VERIFIED (the
 * date is right) AND carry a {@link CircleApproval} row (G58 — a human reviewed
 * and approved the actual message via the admin queue). Missing either one →
 * logged and skipped; an unreviewed message must never reach a phone.</p>
 *
 * <p>Purge: daily, hard-delete members whose DELETE request is older than 7 days,
 * together with their entire send log — full record removal.</p>
 */
@Component
public class CircleReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(CircleReminderScheduler.class);

    private final ObservanceRepository observances;
    private final CircleService circleService;
    private final CircleMemberRepository members;
    private final CircleSendRepository sends;
    private final CircleApprovalRepository approvals;

    public CircleReminderScheduler(ObservanceRepository observances,
                                   CircleService circleService,
                                   CircleMemberRepository members,
                                   CircleSendRepository sends,
                                   CircleApprovalRepository approvals) {
        this.observances = observances;
        this.circleService = circleService;
        this.members = members;
        this.sends = sends;
        this.approvals = approvals;
    }

    @Scheduled(cron = "0 0 18 * * *", zone = "Asia/Kolkata")
    public void sendEveningBeforeReminders() {
        LocalDate tomorrow = LocalDate.now(CircleService.IST).plusDays(1);
        // NOTE: Spring Data MongoDB derives "Between" as EXCLUSIVE $gt/$lt —
        // Between(tomorrow, tomorrow) matches nothing, ever. Query >= and
        // filter for the exact day instead.
        List<Observance> tomorrows = observances
            .findByDateGreaterThanEqualOrderByDateAsc(tomorrow).stream()
            .filter(o -> tomorrow.equals(o.getDate()))
            .toList();
        if (tomorrows.isEmpty()) {
            return; // non-observance day → total silence
        }
        for (Observance occasion : tomorrows) {
            if (!occasion.isVerified()) {
                log.warn("Circle T2 skipped — observance '{}' on {} is not verified",
                    occasion.getSlug(), occasion.getDate());
                continue;
            }
            if (!approvals.existsByObservanceSlug(occasion.getSlug())) {
                log.warn("Circle T2 skipped — observance '{}' on {} has no G58 approval "
                        + "(approve it in /admin/circle before 6pm IST the evening before)",
                    occasion.getSlug(), occasion.getDate());
                continue;
            }
            log.info("Circle T2 fan-out for '{}' ({})", occasion.getSlug(), occasion.getDate());
            circleService.sendOccasionReminders(occasion);
        }
    }

    /** Runs 3:30am IST daily; 7 days after a DELETE the whole footprint goes. */
    @Scheduled(cron = "0 30 3 * * *", zone = "Asia/Kolkata")
    public void purgeDeleteRequests() {
        Instant cutoff = Instant.now().minus(Duration.ofDays(7));
        List<CircleMember> due = members.findByStatusAndDeleteRequestedAtBefore(
            CircleMember.Status.DELETE_REQUESTED, cutoff);
        for (CircleMember member : due) {
            sends.deleteByWaNumber(member.getWaNumber());
            members.delete(member);
            log.info("Circle DELETE purge completed for member {}", member.getId());
        }
    }
}
