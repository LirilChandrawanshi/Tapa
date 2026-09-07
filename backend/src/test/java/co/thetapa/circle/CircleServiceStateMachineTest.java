package co.thetapa.circle;

import co.thetapa.content.ArticleRepository;
import co.thetapa.panchang.Observance;
import co.thetapa.panchang.ObservanceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.after;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Inbound state machine per TapaCircle_WhatsApp_Spec_v2 — pure unit test,
 * mocked repositories and provider, no Mongo.
 */
class CircleServiceStateMachineTest {

    private CircleMemberRepository members;
    private PendingJoinRepository pendingJoins;
    private CircleSendRepository sends;
    private WhatsAppProvider provider;
    private ObservanceRepository observances;
    private ArticleRepository articles;
    private CircleApprovalRepository approvals;
    private CircleService service;

    private static final String NUMBER = "+919876543210";

    @BeforeEach
    void setUp() {
        members = mock(CircleMemberRepository.class);
        pendingJoins = mock(PendingJoinRepository.class);
        sends = mock(CircleSendRepository.class);
        provider = mock(WhatsAppProvider.class);
        observances = mock(ObservanceRepository.class);
        articles = mock(ArticleRepository.class);
        approvals = mock(CircleApprovalRepository.class);
        service = newService("");
        when(observances.findByDateGreaterThanEqualOrderByDateAsc(any()))
            .thenReturn(List.of(upcomingObservance()));
    }

    /**
     * JOIN-path tests need the repo mock to behave like Mongo: after the save,
     * findByWaNumber returns the saved member (the paced T1 re-checks the
     * member's status at send time and would otherwise skip).
     */
    private void memberLookupFollowsSaves(String number) {
        java.util.concurrent.atomic.AtomicReference<CircleMember> saved =
            new java.util.concurrent.atomic.AtomicReference<>();
        when(members.save(any())).thenAnswer(inv -> {
            saved.set(inv.getArgument(0));
            return inv.getArgument(0);
        });
        when(members.findByWaNumber(number))
            .thenAnswer(inv -> Optional.ofNullable(saved.get()));
    }

    private CircleService newService(String welcomeImageUrl) {
        CircleService s = new CircleService(members, pendingJoins, sends, provider, observances,
            articles, approvals, "919999999999", "https://thetapaco.com",
            "https://thetapaco.com/media", welcomeImageUrl);
        s.retryDelayMillis = 0;
        s.welcomePaceMillis = 0; // T1 pacing collapsed for tests; verified separately below
        return s;
    }

    private static Observance upcomingObservance() {
        Observance o = new Observance();
        o.setSlug("karwa-chauth-2026");
        o.setName("Karwa Chauth");
        o.setDate(LocalDate.of(2026, 10, 11));
        o.setVerified(true);
        return o;
    }

    private static CircleMember activeMember() {
        CircleMember m = new CircleMember();
        m.setId("m1");
        m.setWaNumber(NUMBER);
        m.setStatus(CircleMember.Status.ACTIVE);
        m.setJoinedAt(Instant.now().minus(Duration.ofDays(2)));
        return m;
    }

    /* JOIN — new number: member created at T+0, T1 welcome sent */

    @Test
    void joinCreatesMemberAndSendsWelcome() {
        memberLookupFollowsSaves(NUMBER);
        PendingJoin pending = new PendingJoin();
        pending.setTypedNumber(NUMBER);
        pending.setEntryPointPage("/ritual-guides/karwa-chauth");
        when(pendingJoins.findTopByTypedNumberOrderByCreatedAtDesc(NUMBER))
            .thenReturn(Optional.of(pending));

        String result = service.handleInbound("9876543210", "wamid.abc", "JOIN");

        assertThat(result).isEqualTo("JOINED");
        ArgumentCaptor<CircleMember> saved = ArgumentCaptor.forClass(CircleMember.class);
        verify(members).save(saved.capture());
        assertThat(saved.getValue().getWaNumber()).isEqualTo(NUMBER);
        assertThat(saved.getValue().getStatus()).isEqualTo(CircleMember.Status.ACTIVE);
        assertThat(saved.getValue().getConsentMessageId()).isEqualTo("wamid.abc");
        assertThat(saved.getValue().getEntryPointPage()).isEqualTo("/ritual-guides/karwa-chauth");
        assertThat(saved.getValue().getJoinedAt()).isNotNull();

        verify(pendingJoins).deleteByTypedNumber(NUMBER);
        // T1 is paced (async, welcomePaceMillis) — hence the timeout verifies
        verify(provider, timeout(2000)).sendTemplate(eq("tapa_circle_welcome"), eq(NUMBER), eq("en"),
            eq(Map.of("1", "Karwa Chauth", "2", "Sunday, 11 October")), isNull());

        ArgumentCaptor<CircleSend> send = ArgumentCaptor.forClass(CircleSend.class);
        verify(sends, timeout(2000)).save(send.capture());
        assertThat(send.getValue().getTemplateId()).isEqualTo(CircleSend.TemplateId.T1);
        assertThat(send.getValue().getOccasionSlug()).isEqualTo("welcome");
        assertThat(send.getValue().getStatus()).isEqualTo(CircleSend.Status.SENT);
    }

    /** Sending number wins: no matching PendingJoin is still a valid join. */
    @Test
    void joinFromUntypedNumberStillJoins() {
        memberLookupFollowsSaves(NUMBER);
        when(pendingJoins.findTopByTypedNumberOrderByCreatedAtDesc(NUMBER))
            .thenReturn(Optional.empty());

        String result = service.handleInbound(NUMBER, "wamid.x", "join");

        assertThat(result).isEqualTo("JOINED");
        ArgumentCaptor<CircleMember> saved = ArgumentCaptor.forClass(CircleMember.class);
        verify(members).save(saved.capture());
        assertThat(saved.getValue().getEntryPointPage()).isEqualTo("wa-direct");
        verify(pendingJoins, never()).deleteByTypedNumber(anyString());
        verify(provider, timeout(2000))
            .sendTemplate(eq("tapa_circle_welcome"), eq(NUMBER), anyString(), any(), isNull());
    }

    /* JOIN — already active: NO duplicate record, service ack naming next occasion */

    @Test
    void duplicateJoinSendsServiceAckWithoutNewRecord() {
        CircleMember member = activeMember();
        when(members.findByWaNumber(NUMBER)).thenReturn(Optional.of(member));

        String result = service.handleInbound(NUMBER, "wamid.dup", "JOIN");

        assertThat(result).isEqualTo("ALREADY_ACTIVE");
        // no template send, no new member — only the ack bookkeeping on the same record
        verify(provider, never()).sendTemplate(anyString(), anyString(), anyString(), any(), any());
        ArgumentCaptor<CircleMember> saved = ArgumentCaptor.forClass(CircleMember.class);
        verify(members).save(saved.capture());
        assertThat(saved.getValue()).isSameAs(member);
        assertThat(saved.getValue().getStatus()).isEqualTo(CircleMember.Status.ACTIVE);

        ArgumentCaptor<String> text = ArgumentCaptor.forClass(String.class);
        verify(provider).sendText(eq(NUMBER), text.capture());
        assertThat(text.getValue()).contains("Karwa Chauth").contains("Sunday, 11 October");
    }

    /* STOP → inactive immediately + T3, never contacted again */

    @Test
    void stopMarksStoppedAndSendsOptoutTemplate() {
        CircleMember member = activeMember();
        when(members.findByWaNumber(NUMBER)).thenReturn(Optional.of(member));

        String result = service.handleInbound(NUMBER, "wamid.s", "stop");

        assertThat(result).isEqualTo("STOPPED");
        assertThat(member.getStatus()).isEqualTo(CircleMember.Status.STOPPED);
        assertThat(member.getStoppedAt()).isNotNull();
        verify(members).save(member);
        verify(provider).sendTemplate(eq("tapa_circle_optout"), eq(NUMBER), eq("en"),
            eq(Map.of()), isNull());
    }

    @Test
    void devanagariStopWorksAndStoppedNumberStaysSilent() {
        CircleMember member = activeMember();
        when(members.findByWaNumber(NUMBER)).thenReturn(Optional.of(member));
        assertThat(service.handleInbound(NUMBER, "wamid.h", "रोकें")).isEqualTo("STOPPED");

        // now stopped: anything further → total silence
        assertThat(service.handleInbound(NUMBER, "wamid.h2", "stop")).isEqualTo("ALREADY_STOPPED");
        assertThat(service.handleInbound(NUMBER, "wamid.h3", "hello?")).isEqualTo("SILENT");
        verify(provider, never()).sendText(anyString(), anyString());
    }

    /* DELETE → DELETE_REQUESTED, purge happens later via scheduled job */

    @Test
    void deleteMarksDeleteRequested() {
        CircleMember member = activeMember();
        when(members.findByWaNumber(NUMBER)).thenReturn(Optional.of(member));

        String result = service.handleInbound(NUMBER, "wamid.d", "DELETE");

        assertThat(result).isEqualTo("DELETE_REQUESTED");
        assertThat(member.getStatus()).isEqualTo(CircleMember.Status.DELETE_REQUESTED);
        assertThat(member.getDeleteRequestedAt()).isNotNull();
        verify(members).save(member);
        verify(provider, never()).sendTemplate(anyString(), anyString(), anyString(), any(), any());
    }

    /* anything else → ONE canned service reply per 24h window */

    @Test
    void randomTextGetsOneServiceReplyPer24hWindow() {
        CircleMember member = activeMember();
        when(members.findByWaNumber(NUMBER)).thenReturn(Optional.of(member));

        assertThat(service.handleInbound(NUMBER, "wamid.r1", "what time is the puja?"))
            .isEqualTo("SERVICE_REPLY");
        assertThat(member.getLastServiceReplyAt()).isNotNull();
        verify(provider).sendText(eq(NUMBER), anyString());

        // second message inside the window → suppressed
        assertThat(service.handleInbound(NUMBER, "wamid.r2", "hello again"))
            .isEqualTo("RATE_LIMITED");
        verify(provider).sendText(eq(NUMBER), anyString()); // still exactly once

        // window elapsed → allowed again
        member.setLastServiceReplyAt(Instant.now().minus(Duration.ofHours(25)));
        assertThat(service.handleInbound(NUMBER, "wamid.r3", "namaste"))
            .isEqualTo("SERVICE_REPLY");
    }

    /* send failure → exactly ONE retry after the delay, then FAILED_FLAGGED */

    @Test
    void secondFailureIsFlaggedAndNeverRetriedAgain() {
        memberLookupFollowsSaves(NUMBER);
        when(pendingJoins.findTopByTypedNumberOrderByCreatedAtDesc(NUMBER))
            .thenReturn(Optional.empty());
        when(provider.sendTemplate(anyString(), anyString(), anyString(), any(), any()))
            .thenThrow(new WhatsAppProvider.WhatsAppSendException("gateway down"));

        service.handleInbound(NUMBER, "wamid.f", "JOIN");

        ArgumentCaptor<CircleSend> send = ArgumentCaptor.forClass(CircleSend.class);
        verify(sends, timeout(2000)).save(send.capture());
        assertThat(send.getValue().getStatus()).isEqualTo(CircleSend.Status.FAILED_FLAGGED);
        assertThat(send.getValue().getTemplateId()).isEqualTo(CircleSend.TemplateId.T1);
        assertThat(send.getValue().getFailureReason()).contains("gateway down"); // admin flag reason
        // exactly two attempts, never a third
        verify(provider, timeout(2000).times(2))
            .sendTemplate(anyString(), anyString(), anyString(), any(), any());
    }

    @Test
    void retrySuccessIsRecordedAsRetried() {
        memberLookupFollowsSaves(NUMBER);
        when(pendingJoins.findTopByTypedNumberOrderByCreatedAtDesc(NUMBER))
            .thenReturn(Optional.empty());
        when(provider.sendTemplate(anyString(), anyString(), anyString(), any(), any()))
            .thenThrow(new WhatsAppProvider.WhatsAppSendException("blip"))
            .thenReturn("wamid.out");

        service.handleInbound(NUMBER, "wamid.g", "JOIN");

        ArgumentCaptor<CircleSend> send = ArgumentCaptor.forClass(CircleSend.class);
        verify(sends, timeout(2000)).save(send.capture());
        assertThat(send.getValue().getStatus()).isEqualTo(CircleSend.Status.RETRIED);
        assertThat(send.getValue().getProviderMessageId()).isEqualTo("wamid.out");
    }

    /* non-Indian sender is ignored outright */

    @Test
    void foreignNumberIsIgnored() {
        assertThat(service.handleInbound("+14155550100", "wamid.us", "JOIN"))
            .isEqualTo("IGNORED_NON_IN");
        verify(members, never()).save(any());
    }

    /* broadened STOP matcher (#34) — every variant must classify as STOP */

    @Test
    void stopMatcherAcceptsAllSpecVariants() {
        String[] stops = {
            "stop", "STOP", " Stop ", "stop.", "STOP!!", "stop please", "Stop Please.",
            "unsubscribe", "UNSUBSCRIBE", "स्टॉप", "रोको", "रोकें", "रोकें।", "बंद", "बंद करो",
            // any message BEGINNING with a stop token
            "stop sending me these", "STOP all messages", "रोक दो", "रोकिए अब", "बंद करो please",
        };
        for (String text : stops) {
            assertThat(CircleService.classify(text))
                .as("'%s' must classify as STOP", text)
                .isEqualTo(CircleService.Inbound.STOP);
        }
    }

    @Test
    void stopMatcherDoesNotOverreach() {
        String[] notStops = {"stopping by later", "unstoppable", "s.t.o.p", "please advise",
            "join", "DELETE", "", "  ", "बंदरगाह"};
        for (String text : notStops) {
            assertThat(CircleService.classify(text))
                .as("'%s' must NOT classify as STOP", text)
                .isNotEqualTo(CircleService.Inbound.STOP);
        }
        assertThat(CircleService.classify(null)).isEqualTo(CircleService.Inbound.OTHER);
    }

    @Test
    void stopVariantWithTrailingWordsStopsThroughTheFullStateMachine() {
        CircleMember member = activeMember();
        when(members.findByWaNumber(NUMBER)).thenReturn(Optional.of(member));

        assertThat(service.handleInbound(NUMBER, "wamid.sv", "STOP sending me messages."))
            .isEqualTo("STOPPED");
        assertThat(member.getStatus()).isEqualTo(CircleMember.Status.STOPPED);
    }

    /* provider status callbacks (#33) */

    @Test
    void blockedStatusMarksMemberBlockedAndSilencesForever() {
        CircleMember member = activeMember();
        when(members.findByWaNumber(NUMBER)).thenReturn(Optional.of(member));

        assertThat(service.handleStatusCallback(null, "blocked", NUMBER)).isEqualTo("BLOCKED");
        assertThat(member.getStatus()).isEqualTo(CircleMember.Status.BLOCKED);
        assertThat(member.getStatusNote()).contains("blocked");
        verify(members).save(member);

        // any further inbound from the number → total silence, and a later STOP
        // must not resurrect a send
        assertThat(service.handleInbound(NUMBER, "wamid.b1", "hello")).isEqualTo("SILENT");
        assertThat(service.handleInbound(NUMBER, "wamid.b2", "stop")).isEqualTo("ALREADY_STOPPED");
        verify(provider, never()).sendText(anyString(), anyString());
        verify(provider, never()).sendTemplate(anyString(), anyString(), anyString(), any(), any());
    }

    @Test
    void blockedStatusForUnknownNumberCreatesBlockedTombstone() {
        memberLookupFollowsSaves(NUMBER);

        assertThat(service.handleStatusCallback("wamid.x", "blocked", NUMBER))
            .isEqualTo("BLOCKED_UNKNOWN");
        ArgumentCaptor<CircleMember> saved = ArgumentCaptor.forClass(CircleMember.class);
        verify(members).save(saved.capture());
        assertThat(saved.getValue().getStatus()).isEqualTo(CircleMember.Status.BLOCKED);
        assertThat(saved.getValue().getWaNumber()).isEqualTo(NUMBER);
    }

    @Test
    void blockedStatusKeepsDeleteRequestedSoPurgeStillRuns() {
        CircleMember member = activeMember();
        member.setStatus(CircleMember.Status.DELETE_REQUESTED);
        member.setDeleteRequestedAt(Instant.now());
        when(members.findByWaNumber(NUMBER)).thenReturn(Optional.of(member));

        assertThat(service.handleStatusCallback(null, "blocked", NUMBER)).isEqualTo("BLOCKED");
        assertThat(member.getStatus()).isEqualTo(CircleMember.Status.DELETE_REQUESTED);
        assertThat(member.getStatusNote()).contains("blocked");
    }

    @Test
    void deliveredAndFailedStatusesUpdateTheSendRowByProviderMessageId() {
        CircleSend send = new CircleSend();
        send.setProviderMessageId("wamid.out1");
        send.setStatus(CircleSend.Status.SENT);
        when(sends.findTopByProviderMessageId("wamid.out1")).thenReturn(Optional.of(send));

        assertThat(service.handleStatusCallback("wamid.out1", "delivered", null))
            .isEqualTo("DELIVERY_RECORDED");
        assertThat(send.getDeliveryStatus()).isEqualTo("DELIVERED");
        assertThat(send.getDeliveryUpdatedAt()).isNotNull();

        assertThat(service.handleStatusCallback("wamid.out1", "failed", null))
            .isEqualTo("DELIVERY_RECORDED");
        assertThat(send.getDeliveryStatus()).isEqualTo("FAILED");
        // submission status untouched — receipts never rewrite the retry outcome
        assertThat(send.getStatus()).isEqualTo(CircleSend.Status.SENT);
    }

    @Test
    void unknownOrMalformedStatusCallbacksAreIgnored() {
        assertThat(service.handleStatusCallback("wamid.none", "delivered", null))
            .isEqualTo("UNKNOWN_MESSAGE");
        assertThat(service.handleStatusCallback(null, "delivered", null)).isEqualTo("IGNORED");
        assertThat(service.handleStatusCallback("id", "read", NUMBER)).isEqualTo("IGNORED");
        assertThat(service.handleStatusCallback(null, "blocked", "+14155550100"))
            .isEqualTo("IGNORED_NON_IN");
        verify(members, never()).save(any());
        verify(sends, never()).save(any());
    }

    /* T1 pacing (#23) + welcome header image (#25) */

    @Test
    void welcomeIsPacedNotImmediate() {
        service.welcomePaceMillis = 300;
        memberLookupFollowsSaves(NUMBER);
        when(pendingJoins.findTopByTypedNumberOrderByCreatedAtDesc(NUMBER))
            .thenReturn(Optional.empty());

        service.handleInbound(NUMBER, "wamid.p", "JOIN");

        // not sent inline with the webhook…
        verify(provider, never()).sendTemplate(anyString(), anyString(), anyString(), any(), any());
        // …but sent shortly after
        verify(provider, timeout(2000))
            .sendTemplate(eq("tapa_circle_welcome"), eq(NUMBER), anyString(), any(), isNull());
    }

    @Test
    void stopInsidePacingWindowSuppressesTheQueuedWelcome() {
        memberLookupFollowsSaves(NUMBER);
        when(pendingJoins.findTopByTypedNumberOrderByCreatedAtDesc(NUMBER))
            .thenReturn(Optional.empty());
        service.welcomePaceMillis = 300;

        service.handleInbound(NUMBER, "wamid.w1", "JOIN");
        service.handleInbound(NUMBER, "wamid.w2", "STOP"); // lands inside the pace window

        // T3 opt-out goes out (the member WAS active when STOP arrived)…
        verify(provider, timeout(2000)).sendTemplate(eq("tapa_circle_optout"), eq(NUMBER),
            anyString(), any(), isNull());
        // …but the queued welcome is dropped by the send-time status re-check
        verify(provider, after(1000).never()).sendTemplate(eq("tapa_circle_welcome"),
            anyString(), anyString(), any(), any());
    }

    @Test
    void welcomeCarriesConfiguredHeaderImage() {
        CircleService withImage = newService("https://thetapaco.com/media/welcome-800x418");
        memberLookupFollowsSaves(NUMBER);
        when(pendingJoins.findTopByTypedNumberOrderByCreatedAtDesc(NUMBER))
            .thenReturn(Optional.empty());

        withImage.handleInbound(NUMBER, "wamid.i", "JOIN");

        verify(provider, timeout(2000)).sendTemplate(eq("tapa_circle_welcome"), eq(NUMBER),
            anyString(), any(), eq("https://thetapaco.com/media/welcome-800x418"));
    }

    /* first upcoming APPROVED occasion (status endpoint enrichment, #20) */

    @Test
    void firstUpcomingApprovedRequiresVerificationAndApproval() {
        Observance unapproved = upcomingObservance();
        Observance approved = upcomingObservance();
        approved.setSlug("dev-uthani-ekadashi-2026");
        approved.setName("Dev Uthani Ekadashi");
        approved.setDate(LocalDate.of(2026, 11, 20));
        when(observances.findByDateGreaterThanEqualOrderByDateAsc(any()))
            .thenReturn(List.of(unapproved, approved));
        when(approvals.existsByObservanceSlug("karwa-chauth-2026")).thenReturn(false);
        when(approvals.existsByObservanceSlug("dev-uthani-ekadashi-2026")).thenReturn(true);

        Observance first = service.firstUpcomingApproved(LocalDate.of(2026, 10, 1));
        assertThat(first.getSlug()).isEqualTo("dev-uthani-ekadashi-2026");

        when(approvals.existsByObservanceSlug("dev-uthani-ekadashi-2026")).thenReturn(false);
        assertThat(service.firstUpcomingApproved(LocalDate.of(2026, 10, 1))).isNull();
    }
}
