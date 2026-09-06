package co.thetapa.circle;

import co.thetapa.common.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Admin visibility for the Circle. Role-gating (EDITOR/ADMIN) is enforced by
 * SecurityConfig on /api/v1/admin/**. The failed-flagged list is the spec's
 * "flag in admin dashboard and stop" surface — nothing here ever re-sends.
 */
@RestController
@RequestMapping("/api/v1/admin/circle")
public class CircleAdminController {

    private final CircleMemberRepository members;
    private final CircleSendRepository sends;

    public CircleAdminController(CircleMemberRepository members, CircleSendRepository sends) {
        this.members = members;
        this.sends = sends;
    }

    public record SendRow(String waNumber, CircleSend.TemplateId templateId, String occasionSlug,
                          CircleSend.Status status, String providerMessageId, Instant sentAt) {
        static SendRow of(CircleSend s) {
            return new SendRow(s.getWaNumber(), s.getTemplateId(), s.getOccasionSlug(),
                s.getStatus(), s.getProviderMessageId(), s.getSentAt());
        }
    }

    @GetMapping("/dashboard")
    public ApiResponse<Map<String, Object>> dashboard() {
        Map<String, Long> byStatus = Map.of(
            "ACTIVE", members.countByStatus(CircleMember.Status.ACTIVE),
            "STOPPED", members.countByStatus(CircleMember.Status.STOPPED),
            "DELETE_REQUESTED", members.countByStatus(CircleMember.Status.DELETE_REQUESTED));

        List<SendRow> recent = sends.findTop50ByOrderBySentAtDesc().stream()
            .map(SendRow::of).toList();
        List<SendRow> failed = sends.findByStatusOrderBySentAtDesc(CircleSend.Status.FAILED_FLAGGED)
            .stream().map(SendRow::of).toList();

        return ApiResponse.ok(Map.of(
            "membersByStatus", byStatus,
            "recentSends", recent,
            "failedFlagged", failed));
    }

    public record MemberRow(String id, String waNumber, CircleMember.Status status,
                            Instant joinedAt, String entryPointPage,
                            Instant stoppedAt, Instant deleteRequestedAt) {
        static MemberRow of(CircleMember m) {
            return new MemberRow(m.getId(), m.getWaNumber(), m.getStatus(), m.getJoinedAt(),
                m.getEntryPointPage(), m.getStoppedAt(), m.getDeleteRequestedAt());
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
}
