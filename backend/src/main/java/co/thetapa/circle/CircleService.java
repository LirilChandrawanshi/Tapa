package co.thetapa.circle;

import co.thetapa.content.Article;
import co.thetapa.content.ArticleRepository;
import co.thetapa.identity.otp.OtpService;
import co.thetapa.panchang.Observance;
import co.thetapa.panchang.ObservanceRepository;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * Tapa Circle core: join intent, the inbound state machine, status polling and
 * all outbound sends with the one-retry rule (TapaCircle_WhatsApp_Spec_v2).
 *
 * <h2>Inbound state machine (per sender number)</h2>
 * <pre>
 * JOIN   no record          → create ACTIVE member at T+0, consume matching PendingJoin
 *                             (SENDING NUMBER WINS — a mismatched typed number is simply
 *                             left to its 24h TTL), send T1 welcome.
 *        ACTIVE             → no duplicate record; one service ack per day naming the
 *                             next occasion.
 *        STOPPED / DELETE_REQUESTED
 *                           → rejoin (the T3 Rejoin button): back to ACTIVE, fresh
 *                             consentMessageId/joinedAt, deleteRequestedAt cleared,
 *                             re-welcome under a dated pseudo-key.
 * STOP   ACTIVE / DELETE_REQUESTED → STOPPED immediately + T3; number retained solely
 *                             to prevent re-sends.
 *        STOPPED            → silence (never contact again).
 *        no record          → create a STOPPED tombstone, send nothing.
 * DELETE ACTIVE / STOPPED   → DELETE_REQUESTED + deleteRequestedAt; purge job removes
 *                             everything after 7 days; one plain-text ack.
 * other  (incl. media)      → ONE canned reply per 24h window; content NEVER stored.
 * </pre>
 */
@Service
public class CircleService {

    private static final Logger log = LoggerFactory.getLogger(CircleService.class);
    static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    static final String DEFAULT_LANGUAGE = "en";

    private static final String CANNED_SERVICE_REPLY =
        "Namaste! This number sends Tapa Circle calendar reminders and is not monitored. "
            + "Reply STOP to opt out. Visit https://thetapaco.com for guides.";

    private final CircleMemberRepository members;
    private final PendingJoinRepository pendingJoins;
    private final CircleSendRepository sends;
    private final WhatsAppProvider provider;
    private final ObservanceRepository observances;
    private final ArticleRepository articles;

    private final String businessWaNumber;
    private final String siteBaseUrl;
    private final String mediaBaseUrl;

    /** Single retry +60s; package-private for tests. */
    long retryDelayMillis = 60_000;

    private final ScheduledExecutorService retryExecutor =
        Executors.newSingleThreadScheduledExecutor(r -> {
            Thread t = new Thread(r, "circle-wa-retry");
            t.setDaemon(true);
            return t;
        });

    public CircleService(CircleMemberRepository members,
                         PendingJoinRepository pendingJoins,
                         CircleSendRepository sends,
                         WhatsAppProvider provider,
                         ObservanceRepository observances,
                         ArticleRepository articles,
                         @Value("${tapa.circle.wa-number:919999999999}") String businessWaNumber,
                         @Value("${tapa.circle.site-base-url:https://thetapaco.com}") String siteBaseUrl,
                         @Value("${tapa.circle.media-base-url:https://thetapaco.com/media}") String mediaBaseUrl) {
        this.members = members;
        this.pendingJoins = pendingJoins;
        this.sends = sends;
        this.provider = provider;
        this.observances = observances;
        this.articles = articles;
        this.businessWaNumber = businessWaNumber;
        this.siteBaseUrl = siteBaseUrl;
        this.mediaBaseUrl = mediaBaseUrl;
    }

    @PreDestroy
    void shutdown() {
        retryExecutor.shutdown();
    }

    /* ------------------------------------------------------------------ */
    /* Join intent + polling                                               */
    /* ------------------------------------------------------------------ */

    public record JoinIntentResult(String deepLink, String status) {
    }

    /**
     * The site posted a typed number. This is NOT consent — we hold a PendingJoin
     * for 24h (TTL) and hand back the wa.me deep link; the member exists only
     * after an inbound JOIN.
     */
    public JoinIntentResult joinIntent(String typedPhone, String entryPointPage) {
        String phone = OtpService.normalize(typedPhone);
        String status = status(phone).name();

        if (!"ACTIVE".equals(status)) {
            pendingJoins.deleteByTypedNumber(phone); // re-typed → reset the 24h TTL
            PendingJoin pending = new PendingJoin();
            pending.setTypedNumber(phone);
            pending.setEntryPointPage(entryPointPage);
            pending.setCreatedAt(Instant.now());
            pendingJoins.save(pending);
            status = "PENDING";
        }
        String deepLink = "https://wa.me/" + businessWaNumber + "?text=JOIN";
        return new JoinIntentResult(deepLink, status);
    }

    public enum PollStatus { NONE, PENDING, ACTIVE, STOPPED }

    /** Powers the waiting-page poll; confirmation appears only after inbound JOIN. */
    public PollStatus status(String phone) {
        String normalized = OtpService.normalize(phone);
        Optional<CircleMember> member = members.findByWaNumber(normalized);
        if (member.isPresent()) {
            return member.get().getStatus() == CircleMember.Status.ACTIVE
                ? PollStatus.ACTIVE : PollStatus.STOPPED;
        }
        return pendingJoins.findTopByTypedNumberOrderByCreatedAtDesc(normalized).isPresent()
            ? PollStatus.PENDING : PollStatus.NONE;
    }

    /* ------------------------------------------------------------------ */
    /* Inbound state machine                                               */
    /* ------------------------------------------------------------------ */

    enum Inbound { JOIN, STOP, DELETE, OTHER }

    /** Case-insensitive keyword classification; the raw text is never persisted. */
    static Inbound classify(String text) {
        String t = text == null ? "" : text.strip();
        if (t.equalsIgnoreCase("join")) {
            return Inbound.JOIN;
        }
        if (t.equalsIgnoreCase("stop") || t.equals("रोकें") || t.equals("बंद")) {
            return Inbound.STOP;
        }
        if (t.equalsIgnoreCase("delete")) {
            return Inbound.DELETE;
        }
        return Inbound.OTHER;
    }

    /** @return a short outcome label for logging/webhook echo — never message content. */
    public String handleInbound(String fromNumber, String messageId, String text) {
        String from;
        try {
            from = OtpService.normalize(fromNumber);
        } catch (IllegalArgumentException e) {
            log.info("Circle inbound from non-Indian number ignored");
            return "IGNORED_NON_IN";
        }

        Optional<CircleMember> existing = members.findByWaNumber(from);
        return switch (classify(text)) {
            case JOIN -> handleJoin(from, messageId, existing);
            case STOP -> handleStop(from, existing);
            case DELETE -> handleDelete(existing);
            case OTHER -> handleOther(from, existing);
        };
    }

    private String handleJoin(String from, String messageId, Optional<CircleMember> existing) {
        if (existing.isPresent() && existing.get().getStatus() == CircleMember.Status.ACTIVE) {
            // already in the Circle — service ack naming the next occasion, NO duplicate record
            sendServiceReply(existing.get(), from, joinAckText(), "service:join:" + LocalDate.now(IST));
            return "ALREADY_ACTIVE";
        }

        boolean rejoin = existing.isPresent();
        CircleMember member = existing.orElseGet(CircleMember::new);
        member.setWaNumber(from);
        member.setStatus(CircleMember.Status.ACTIVE);
        member.setJoinedAt(Instant.now());
        member.setConsentMessageId(messageId);
        member.setDeleteRequestedAt(null);

        // SENDING NUMBER WINS: the pending typed number only contributes entryPointPage
        // when it matches the sender; any mismatched PendingJoin is discarded via TTL.
        Optional<PendingJoin> pending = pendingJoins.findTopByTypedNumberOrderByCreatedAtDesc(from);
        if (member.getEntryPointPage() == null) {
            member.setEntryPointPage(pending.map(PendingJoin::getEntryPointPage).orElse("wa-direct"));
        }
        try {
            members.save(member);
        } catch (DuplicateKeyException e) {
            log.info("Concurrent JOIN for the same number — keeping the existing record");
            return "ALREADY_ACTIVE";
        }
        pending.ifPresent(p -> pendingJoins.deleteByTypedNumber(from));

        // T1 within 5s. First welcome dedupes on "welcome"; a rejoin re-welcome
        // uses a dated pseudo-key so it isn't blocked by the original send.
        String occasionKey = rejoin ? "welcome:rejoin:" + LocalDate.now(IST) : "welcome";
        Observance next = firstUpcomingVerified(LocalDate.now(IST));
        sendTemplateWithRetry(member.getId(), from, CircleSend.TemplateId.T1, occasionKey,
            CircleTemplateVars.welcomeVars(next), null);
        return rejoin ? "REJOINED" : "JOINED";
    }

    private String handleStop(String from, Optional<CircleMember> existing) {
        if (existing.isEmpty()) {
            // never contact again — retain ONLY the number, as a tombstone; no send
            CircleMember tombstone = new CircleMember();
            tombstone.setWaNumber(from);
            tombstone.setStatus(CircleMember.Status.STOPPED);
            tombstone.setStoppedAt(Instant.now());
            try {
                members.save(tombstone);
            } catch (DuplicateKeyException ignored) {
                // concurrent insert — the number is recorded either way
            }
            return "STOPPED_UNKNOWN";
        }
        CircleMember member = existing.get();
        if (member.getStatus() == CircleMember.Status.STOPPED) {
            return "ALREADY_STOPPED"; // silence
        }
        member.setStatus(CircleMember.Status.STOPPED);
        member.setStoppedAt(Instant.now());
        members.save(member);
        sendTemplateWithRetry(member.getId(), from, CircleSend.TemplateId.T3,
            "optout:" + LocalDate.now(IST), Map.of(), null);
        return "STOPPED";
    }

    private String handleDelete(Optional<CircleMember> existing) {
        if (existing.isEmpty()) {
            return "NO_RECORD"; // nothing to delete, nothing stored
        }
        CircleMember member = existing.get();
        member.setStatus(CircleMember.Status.DELETE_REQUESTED);
        member.setDeleteRequestedAt(Instant.now());
        members.save(member);
        // plain service-window ack; purge job hard-deletes after 7 days
        trySendText(member.getWaNumber(),
            "Your Tapa Circle data will be fully deleted within 7 working days. "
                + "You will receive no further messages.");
        return "DELETE_REQUESTED";
    }

    private String handleOther(String from, Optional<CircleMember> existing) {
        if (existing.isPresent() && existing.get().getStatus() != CircleMember.Status.ACTIVE) {
            return "SILENT"; // stopped/deleting numbers are never contacted
        }
        if (existing.isPresent()) {
            CircleMember member = existing.get();
            Instant last = member.getLastServiceReplyAt();
            if (last != null && last.isAfter(Instant.now().minus(Duration.ofHours(24)))) {
                return "RATE_LIMITED"; // one canned reply per 24h window
            }
            sendServiceReply(member, from, CANNED_SERVICE_REPLY, "service:" + LocalDate.now(IST));
            return "SERVICE_REPLY";
        }
        // unknown number: no member record may be created (data minimisation);
        // the unique {waNumber, "service:<date>", SERVICE} send row caps replies at one/day
        if (recordSend(null, from, CircleSend.TemplateId.SERVICE,
            "service:" + LocalDate.now(IST), CircleSend.Status.SENT, null, true)) {
            trySendText(from, CANNED_SERVICE_REPLY);
            return "SERVICE_REPLY";
        }
        return "RATE_LIMITED";
    }

    private void sendServiceReply(CircleMember member, String from, String text, String occasionKey) {
        if (!recordSend(member.getId(), from, CircleSend.TemplateId.SERVICE, occasionKey,
            CircleSend.Status.SENT, null, true)) {
            return; // already replied under this key today
        }
        member.setLastServiceReplyAt(Instant.now());
        members.save(member);
        trySendText(from, text);
    }

    /** Service replies are best-effort session messages — no retry rule applies. */
    private void trySendText(String waNumber, String text) {
        try {
            provider.sendText(waNumber, text);
        } catch (RuntimeException e) {
            log.warn("Circle service reply failed for {}: {}", waNumber, e.getMessage());
        }
    }

    private String joinAckText() {
        Observance next = firstUpcomingVerified(LocalDate.now(IST));
        if (next == null) {
            return "You are already in the Tapa Circle. We will remind you the evening before the next occasion.";
        }
        return "You are already in the Tapa Circle. Next up: " + next.getName()
            + " on " + next.getDate().format(CircleTemplateVars.OCCASION_DATE) + ".";
    }

    Observance firstUpcomingVerified(LocalDate from) {
        return observances.findByDateGreaterThanEqualOrderByDateAsc(from).stream()
            .filter(Observance::isVerified)
            .findFirst().orElse(null);
    }

    /* ------------------------------------------------------------------ */
    /* T2 reminder fan-out (called by CircleReminderScheduler)             */
    /* ------------------------------------------------------------------ */

    /** Sends the T2 reminder for one observance to every ACTIVE member — once, ever. */
    public void sendOccasionReminders(Observance occasion) {
        Article guide = occasion.getArticleSlug() == null ? null
            : articles.findBySlug(occasion.getArticleSlug()).orElse(null);
        Map<String, String> vars = CircleTemplateVars.reminderVars(occasion, guide, siteBaseUrl);
        String headerImageUrl = CircleTemplateVars.headerImageUrl(guide, mediaBaseUrl);

        for (CircleMember member : members.findByStatus(CircleMember.Status.ACTIVE)) {
            sendTemplateWithRetry(member.getId(), member.getWaNumber(),
                CircleSend.TemplateId.T2, occasion.getSlug(), vars, headerImageUrl);
        }
    }

    /* ------------------------------------------------------------------ */
    /* Outbound with the one-retry rule                                    */
    /* ------------------------------------------------------------------ */

    /**
     * Template send honoring the spec's failure policy: send → on exception ONE
     * retry after 60s → on second failure record FAILED_FLAGGED (admin dashboard)
     * and stop. The unique send index makes each (number, occasionKey, template)
     * fire at most once.
     */
    void sendTemplateWithRetry(String memberId, String waNumber, CircleSend.TemplateId templateId,
                               String occasionKey, Map<String, String> vars, String headerImageUrl) {
        if (sends.existsByWaNumberAndOccasionSlugAndTemplateId(waNumber, occasionKey, templateId)) {
            return;
        }
        try {
            String pmid = provider.sendTemplate(templateId.templateName(), waNumber,
                DEFAULT_LANGUAGE, vars, headerImageUrl);
            recordSend(memberId, waNumber, templateId, occasionKey, CircleSend.Status.SENT, pmid, false);
        } catch (RuntimeException first) {
            log.warn("Circle {} send to {} failed, retrying once in {}ms: {}",
                templateId, waNumber, retryDelayMillis, first.getMessage());
            retryExecutor.schedule(() -> {
                try {
                    String pmid = provider.sendTemplate(templateId.templateName(), waNumber,
                        DEFAULT_LANGUAGE, vars, headerImageUrl);
                    recordSend(memberId, waNumber, templateId, occasionKey,
                        CircleSend.Status.RETRIED, pmid, false);
                } catch (RuntimeException second) {
                    log.error("Circle {} send to {} failed twice — flagged, no more retries: {}",
                        templateId, waNumber, second.getMessage());
                    recordSend(memberId, waNumber, templateId, occasionKey,
                        CircleSend.Status.FAILED_FLAGGED, null, false);
                }
            }, retryDelayMillis, TimeUnit.MILLISECONDS);
        }
    }

    /** @return false when the unique (waNumber, occasionSlug, templateId) row already exists. */
    private boolean recordSend(String memberId, String waNumber, CircleSend.TemplateId templateId,
                               String occasionSlug, CircleSend.Status status,
                               String providerMessageId, boolean quiet) {
        CircleSend send = new CircleSend();
        send.setMemberId(memberId);
        send.setWaNumber(waNumber);
        send.setTemplateId(templateId);
        send.setOccasionSlug(occasionSlug);
        send.setLanguage(DEFAULT_LANGUAGE);
        send.setStatus(status);
        send.setProviderMessageId(providerMessageId);
        send.setSentAt(Instant.now());
        try {
            sends.save(send);
            return true;
        } catch (DuplicateKeyException e) {
            if (!quiet) {
                log.info("Duplicate Circle send suppressed: {} {} {}", waNumber, occasionSlug, templateId);
            }
            return false;
        }
    }
}
