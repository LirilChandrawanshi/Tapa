package co.thetapa.circle;

import co.thetapa.common.ApiResponse;
import co.thetapa.common.NotFoundException;
import co.thetapa.content.Article;
import co.thetapa.content.ArticleRepository;
import co.thetapa.identity.User;
import co.thetapa.identity.UserRepository;
import co.thetapa.panchang.Observance;
import co.thetapa.panchang.ObservanceRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Admin visibility + the G58 approval gate for the Circle. Role-gating
 * (EDITOR/ADMIN) is enforced by SecurityConfig on /api/v1/admin/**. The
 * failed-flagged list is the spec's "flag in admin dashboard and stop"
 * surface — nothing here ever re-sends.
 *
 * <p>Compliance: WhatsApp numbers are masked to their last 4 digits SERVER-SIDE
 * in every payload this controller returns — the full number never leaves the
 * backend through the admin API.</p>
 */
@RestController
@RequestMapping("/api/v1/admin/circle")
public class CircleAdminController {

    private final CircleMemberRepository members;
    private final CircleSendRepository sends;
    private final CircleApprovalRepository approvals;
    private final ObservanceRepository observances;
    private final ArticleRepository articles;
    private final UserRepository users;
    private final String siteBaseUrl;

    public CircleAdminController(CircleMemberRepository members,
                                 CircleSendRepository sends,
                                 CircleApprovalRepository approvals,
                                 ObservanceRepository observances,
                                 ArticleRepository articles,
                                 UserRepository users,
                                 @Value("${tapa.circle.site-base-url:https://thetapaco.com}") String siteBaseUrl) {
        this.members = members;
        this.sends = sends;
        this.approvals = approvals;
        this.observances = observances;
        this.articles = articles;
        this.users = users;
        this.siteBaseUrl = siteBaseUrl;
    }

    /** "+919876543210" → "••••••3210" — masking happens here, server-side, always. */
    static String mask(String waNumber) {
        if (waNumber == null || waNumber.length() < 4) {
            return "••••";
        }
        return "••••••" + waNumber.substring(waNumber.length() - 4);
    }

    /* ------------------------------------------------------------------ */
    /* Dashboard                                                           */
    /* ------------------------------------------------------------------ */

    public record SendRow(String waNumber, CircleSend.TemplateId templateId, String occasionSlug,
                          CircleSend.Status status, String deliveryStatus, String failureReason,
                          Instant sentAt) {
        static SendRow of(CircleSend s) {
            return new SendRow(mask(s.getWaNumber()), s.getTemplateId(), s.getOccasionSlug(),
                s.getStatus(), s.getDeliveryStatus(), s.getFailureReason(), s.getSentAt());
        }
    }

    @GetMapping("/dashboard")
    public ApiResponse<Map<String, Object>> dashboard() {
        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (CircleMember.Status s : CircleMember.Status.values()) {
            byStatus.put(s.name(), members.countByStatus(s));
        }

        // "today" and rolling 7 days, both anchored to IST midnight
        Instant istMidnight = LocalDate.now(CircleService.IST)
            .atStartOfDay(CircleService.IST).toInstant();
        Instant weekAgo = LocalDate.now(CircleService.IST).minusDays(6)
            .atStartOfDay(CircleService.IST).toInstant();

        List<SendRow> recent = sends.findTop50ByOrderBySentAtDesc().stream()
            .map(SendRow::of).toList();
        List<SendRow> failed = sends.findByStatusOrderBySentAtDesc(CircleSend.Status.FAILED_FLAGGED)
            .stream().map(SendRow::of).toList();

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("membersByStatus", byStatus);
        body.put("sendsToday", sends.countBySentAtAfter(istMidnight));
        body.put("sendsWeek", sends.countBySentAtAfter(weekAgo));
        body.put("recentSends", recent);
        body.put("failedFlagged", failed);
        return ApiResponse.ok(body);
    }

    public record MemberRow(String id, String waNumber, CircleMember.Status status,
                            Instant joinedAt, String entryPointPage, String statusNote,
                            Instant stoppedAt, Instant deleteRequestedAt) {
        static MemberRow of(CircleMember m) {
            return new MemberRow(m.getId(), mask(m.getWaNumber()), m.getStatus(), m.getJoinedAt(),
                m.getEntryPointPage(), m.getStatusNote(), m.getStoppedAt(), m.getDeleteRequestedAt());
        }
    }

    @GetMapping("/members")
    public ApiResponse<List<MemberRow>> members(
        @RequestParam(required = false) CircleMember.Status status) {
        List<CircleMember> list = status == null
            ? members.findAll()
            : members.findByStatusOrderByJoinedAtDesc(status);
        return ApiResponse.ok(list.stream().map(MemberRow::of).toList());
    }

    /* ------------------------------------------------------------------ */
    /* G58 approval queue                                                  */
    /* ------------------------------------------------------------------ */

    public record QueueRow(String slug, String name, LocalDate date, long memberCount,
                           Map<String, String> vars, String previewText,
                           boolean approved, String approvedBy, Instant approvedAt) {
    }

    /**
     * Verified observances in the next 7 days, each with its computed T2
     * variable set, a rendered preview and its approval state — the admin's
     * "Tomorrow's send" panel. Unverified dates never appear here: verify
     * first (in /admin/observances), then approve.
     */
    @GetMapping("/queue")
    public ApiResponse<List<QueueRow>> queue() {
        LocalDate today = LocalDate.now(CircleService.IST);
        LocalDate horizon = today.plusDays(7);
        long activeMembers = members.countByStatus(CircleMember.Status.ACTIVE);
        // ">= then filter" instead of Between — Spring Data Mongo's Between is
        // exclusive on both bounds and would drop today's and day-7 occasions.
        List<QueueRow> rows = observances
            .findByDateGreaterThanEqualOrderByDateAsc(today).stream()
            .filter(o -> !o.getDate().isAfter(horizon))
            .filter(Observance::isVerified)
            .map(o -> {
                Article guide = o.getArticleSlug() == null ? null
                    : articles.findBySlug(o.getArticleSlug()).orElse(null);
                Map<String, String> vars = CircleTemplateVars.reminderVars(o, guide, siteBaseUrl);
                Optional<CircleApproval> approval = approvals.findByObservanceSlug(o.getSlug());
                return new QueueRow(o.getSlug(), o.getName(), o.getDate(), activeMembers,
                    vars, previewText(vars),
                    approval.isPresent(),
                    approval.map(CircleApproval::getApprovedBy).orElse(null),
                    approval.map(CircleApproval::getApprovedAt).orElse(null));
            })
            .toList();
        return ApiResponse.ok(rows);
    }

    /**
     * Human-readable render of the T2 vars for the approval screen. The
     * authoritative template copy lives with the BSP (tapa_circle_reminder);
     * this mirrors its shape so the approver reads what members will read.
     */
    static String previewText(Map<String, String> vars) {
        StringBuilder sb = new StringBuilder();
        sb.append("Namaste 🙏 Tomorrow, ").append(vars.get("1"))
            .append(", is ").append(vars.get("2")).append(".\n");
        sb.append("Tithi: ").append(vars.get("3")).append(" – ").append(vars.get("4")).append(".\n");
        if (vars.containsKey("5")) {
            sb.append(vars.get("5")).append("\n");
        }
        sb.append("Guide: ").append(vars.get("6"));
        return sb.toString();
    }

    /**
     * Records the occasion-level human approval that unlocks the T2 fan-out
     * (see {@link CircleApproval} for the two-person-rule policy note).
     * Idempotent: approving an already-approved occasion returns the existing
     * row — an approval, once given, is never silently re-attributed.
     */
    @PostMapping("/queue/{observanceSlug}/approve")
    public ApiResponse<CircleApproval> approve(@PathVariable String observanceSlug,
                                               @AuthenticationPrincipal String userId) {
        Observance observance = observances.findBySlug(observanceSlug)
            .orElseThrow(() -> new NotFoundException("observance", observanceSlug));
        if (!observance.isVerified()) {
            throw new IllegalArgumentException(
                "Only a verified observance can be approved for send — verify it first.");
        }
        Optional<CircleApproval> existing = approvals.findByObservanceSlug(observanceSlug);
        if (existing.isPresent()) {
            return ApiResponse.ok(existing.get());
        }
        String approvedBy = users.findById(userId == null ? "" : userId)
            .map(User::getPhone)
            .orElse(userId);
        if (approvedBy == null || approvedBy.isBlank()) {
            throw new IllegalArgumentException("Approver identity could not be resolved.");
        }
        CircleApproval approval = new CircleApproval();
        approval.setObservanceSlug(observanceSlug);
        approval.setApprovedBy(approvedBy);
        approval.setCreatedBy(userId == null ? "" : userId); // null-safe by contract
        approval.setApprovedAt(Instant.now());
        try {
            return ApiResponse.ok(approvals.save(approval));
        } catch (DuplicateKeyException e) {
            // concurrent approval — first writer wins, return theirs
            return ApiResponse.ok(approvals.findByObservanceSlug(observanceSlug).orElse(approval));
        }
    }
}
