package co.thetapa.circle;

import co.thetapa.common.NotFoundException;
import co.thetapa.content.ArticleRepository;
import co.thetapa.identity.User;
import co.thetapa.identity.UserRepository;
import co.thetapa.panchang.Observance;
import co.thetapa.panchang.ObservanceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** G58 approval endpoints + server-side number masking. */
class CircleAdminControllerTest {

    private CircleMemberRepository members;
    private CircleSendRepository sends;
    private CircleApprovalRepository approvals;
    private ObservanceRepository observances;
    private UserRepository users;
    private CircleAdminController controller;

    @BeforeEach
    void setUp() {
        members = mock(CircleMemberRepository.class);
        sends = mock(CircleSendRepository.class);
        approvals = mock(CircleApprovalRepository.class);
        observances = mock(ObservanceRepository.class);
        users = mock(UserRepository.class);
        controller = new CircleAdminController(members, sends, approvals, observances,
            mock(ArticleRepository.class), users, "https://thetapaco.com");
    }

    private static Observance verifiedObservance() {
        Observance o = new Observance();
        o.setSlug("karwa-chauth-2026");
        o.setName("Karwa Chauth");
        o.setDate(LocalDate.now(CircleService.IST).plusDays(1));
        o.setTithiStartsAt("2026-10-10T18:12");
        o.setTithiEndsAt("2026-10-11T20:04");
        o.setVerified(true);
        return o;
    }

    @Test
    void numbersAreMaskedToLastFourServerSide() {
        assertThat(CircleAdminController.mask("+919876543210")).isEqualTo("••••••3210");
        assertThat(CircleAdminController.mask(null)).isEqualTo("••••");
        assertThat(CircleAdminController.mask("91")).isEqualTo("••••");
        // and the row mappers apply it
        CircleSend s = new CircleSend();
        s.setWaNumber("+919876543210");
        assertThat(CircleAdminController.SendRow.of(s).waNumber()).isEqualTo("••••••3210");
        CircleMember m = new CircleMember();
        m.setWaNumber("+919876543210");
        assertThat(CircleAdminController.MemberRow.of(m).waNumber()).isEqualTo("••••••3210");
    }

    @Test
    void approveRecordsPrincipalPhoneAndTimestamp() {
        when(observances.findBySlug("karwa-chauth-2026"))
            .thenReturn(Optional.of(verifiedObservance()));
        when(approvals.findByObservanceSlug("karwa-chauth-2026")).thenReturn(Optional.empty());
        User admin = new User();
        admin.setPhone("+919876543210");
        when(users.findById("u1")).thenReturn(Optional.of(admin));
        when(approvals.save(any())).thenAnswer(inv -> inv.getArgument(0));

        controller.approve("karwa-chauth-2026", "u1");

        ArgumentCaptor<CircleApproval> saved = ArgumentCaptor.forClass(CircleApproval.class);
        verify(approvals).save(saved.capture());
        assertThat(saved.getValue().getObservanceSlug()).isEqualTo("karwa-chauth-2026");
        assertThat(saved.getValue().getApprovedBy()).isEqualTo("+919876543210");
        assertThat(saved.getValue().getCreatedBy()).isEqualTo("u1");
        assertThat(saved.getValue().getApprovedAt()).isNotNull();
    }

    @Test
    void approveIsIdempotentAndKeepsTheOriginalApprover() {
        when(observances.findBySlug("karwa-chauth-2026"))
            .thenReturn(Optional.of(verifiedObservance()));
        CircleApproval existing = new CircleApproval();
        existing.setObservanceSlug("karwa-chauth-2026");
        existing.setApprovedBy("+911111111111");
        existing.setApprovedAt(Instant.now());
        when(approvals.findByObservanceSlug("karwa-chauth-2026"))
            .thenReturn(Optional.of(existing));

        var response = controller.approve("karwa-chauth-2026", "u2");

        assertThat(response.data().getApprovedBy()).isEqualTo("+911111111111");
        verify(approvals, never()).save(any());
    }

    @Test
    void approveRejectsUnverifiedAndUnknownObservances() {
        Observance unverified = verifiedObservance();
        unverified.setVerified(false);
        when(observances.findBySlug("karwa-chauth-2026")).thenReturn(Optional.of(unverified));
        assertThatThrownBy(() -> controller.approve("karwa-chauth-2026", "u1"))
            .isInstanceOf(IllegalArgumentException.class);

        when(observances.findBySlug("nope")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> controller.approve("nope", "u1"))
            .isInstanceOf(NotFoundException.class);
        verify(approvals, never()).save(any());
    }

    @Test
    void approveEnforcesResolvableApproverIdentity() {
        when(observances.findBySlug("karwa-chauth-2026"))
            .thenReturn(Optional.of(verifiedObservance()));
        when(approvals.findByObservanceSlug("karwa-chauth-2026")).thenReturn(Optional.empty());
        when(users.findById(any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> controller.approve("karwa-chauth-2026", null))
            .isInstanceOf(IllegalArgumentException.class);
        verify(approvals, never()).save(any());
    }

    @Test
    void queueListsOnlyVerifiedUpcomingWithVarsPreviewAndApprovalState() {
        Observance verified = verifiedObservance();
        Observance unverified = verifiedObservance();
        unverified.setSlug("unverified-2026");
        unverified.setVerified(false);
        Observance beyondHorizon = verifiedObservance();
        beyondHorizon.setSlug("too-far-2026");
        beyondHorizon.setDate(LocalDate.now(CircleService.IST).plusDays(9));
        when(observances.findByDateGreaterThanEqualOrderByDateAsc(any()))
            .thenReturn(List.of(verified, unverified, beyondHorizon));
        when(members.countByStatus(CircleMember.Status.ACTIVE)).thenReturn(42L);
        CircleApproval approval = new CircleApproval();
        approval.setApprovedBy("+919876543210");
        approval.setApprovedAt(Instant.now());
        when(approvals.findByObservanceSlug("karwa-chauth-2026"))
            .thenReturn(Optional.of(approval));

        List<CircleAdminController.QueueRow> rows = controller.queue().data();

        assertThat(rows).hasSize(1); // unverified and beyond-7-days never reach the queue
        CircleAdminController.QueueRow row = rows.get(0);
        String expectedDate = verified.getDate().format(
            java.time.format.DateTimeFormatter.ofPattern("d MMMM", java.util.Locale.ENGLISH));
        assertThat(row.slug()).isEqualTo("karwa-chauth-2026");
        assertThat(row.memberCount()).isEqualTo(42L);
        assertThat(row.vars().get("1")).isEqualTo(expectedDate); // "d MMMM" — no weekday (#28)
        assertThat(row.previewText()).contains("Karwa Chauth").contains(expectedDate);
        assertThat(row.approved()).isTrue();
        assertThat(row.approvedBy()).isEqualTo("+919876543210");
    }

    @Test
    void previewTextOmitsTheTeaserLineWhenAbsent() {
        String withTeaser = CircleAdminController.previewText(Map.of(
            "1", "11 October", "2", "Karwa Chauth", "3", "6:12 PM, 10 October",
            "4", "8:04 PM", "5", "Moonrise fast", "6", "https://x/guide"));
        assertThat(withTeaser).contains("Moonrise fast");

        String withoutTeaser = CircleAdminController.previewText(Map.of(
            "1", "11 October", "2", "Karwa Chauth", "3", "6:12 PM",
            "4", "8:04 PM", "6", "https://x/guide"));
        assertThat(withoutTeaser).doesNotContain("null").contains("Guide: https://x/guide");
    }
}
