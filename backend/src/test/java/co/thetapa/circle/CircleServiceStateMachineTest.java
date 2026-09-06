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
        service = new CircleService(members, pendingJoins, sends, provider, observances, articles,
            "919999999999", "https://thetapaco.com", "https://thetapaco.com/media");
        service.retryDelayMillis = 0;
        when(observances.findByDateGreaterThanEqualOrderByDateAsc(any()))
            .thenReturn(List.of(upcomingObservance()));
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
        when(members.findByWaNumber(NUMBER)).thenReturn(Optional.empty());
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
        verify(provider).sendTemplate(eq("tapa_circle_welcome"), eq(NUMBER), eq("en"),
            eq(Map.of("1", "Karwa Chauth", "2", "Sunday, 11 October")), isNull());

        ArgumentCaptor<CircleSend> send = ArgumentCaptor.forClass(CircleSend.class);
        verify(sends).save(send.capture());
        assertThat(send.getValue().getTemplateId()).isEqualTo(CircleSend.TemplateId.T1);
        assertThat(send.getValue().getOccasionSlug()).isEqualTo("welcome");
        assertThat(send.getValue().getStatus()).isEqualTo(CircleSend.Status.SENT);
    }

    /** Sending number wins: no matching PendingJoin is still a valid join. */
    @Test
    void joinFromUntypedNumberStillJoins() {
        when(members.findByWaNumber(NUMBER)).thenReturn(Optional.empty());
        when(pendingJoins.findTopByTypedNumberOrderByCreatedAtDesc(NUMBER))
            .thenReturn(Optional.empty());

        String result = service.handleInbound(NUMBER, "wamid.x", "join");

        assertThat(result).isEqualTo("JOINED");
        ArgumentCaptor<CircleMember> saved = ArgumentCaptor.forClass(CircleMember.class);
        verify(members).save(saved.capture());
        assertThat(saved.getValue().getEntryPointPage()).isEqualTo("wa-direct");
        verify(pendingJoins, never()).deleteByTypedNumber(anyString());
        verify(provider).sendTemplate(eq("tapa_circle_welcome"), eq(NUMBER), anyString(), any(), isNull());
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
        when(members.findByWaNumber(NUMBER)).thenReturn(Optional.empty());
        when(pendingJoins.findTopByTypedNumberOrderByCreatedAtDesc(NUMBER))
            .thenReturn(Optional.empty());
        when(provider.sendTemplate(anyString(), anyString(), anyString(), any(), any()))
            .thenThrow(new WhatsAppProvider.WhatsAppSendException("gateway down"));

        service.handleInbound(NUMBER, "wamid.f", "JOIN");

        ArgumentCaptor<CircleSend> send = ArgumentCaptor.forClass(CircleSend.class);
        verify(sends, timeout(2000)).save(send.capture());
        assertThat(send.getValue().getStatus()).isEqualTo(CircleSend.Status.FAILED_FLAGGED);
        assertThat(send.getValue().getTemplateId()).isEqualTo(CircleSend.TemplateId.T1);
        // exactly two attempts, never a third
        verify(provider, timeout(2000).times(2))
            .sendTemplate(anyString(), anyString(), anyString(), any(), any());
    }

    @Test
    void retrySuccessIsRecordedAsRetried() {
        when(members.findByWaNumber(NUMBER)).thenReturn(Optional.empty());
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
}
