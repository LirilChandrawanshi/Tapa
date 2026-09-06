package co.thetapa.circle;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * A member of the free Tapa Circle WhatsApp list.
 *
 * <p>Data minimisation (TapaCircle_WhatsApp_Spec_v2): we store ONLY the WhatsApp
 * number, the inbound-JOIN timestamp, the id of the consent message, the page the
 * join started from, and lifecycle timestamps. No name, no email, no city, no
 * location, and never any inbound message content.</p>
 *
 * <p>A STOPPED record is retained solely so the number is never contacted again.
 * A DELETE_REQUESTED record is hard-purged (together with its send log) by the
 * scheduled purge job 7 days after the request.</p>
 */
@Document("circle_members")
public class CircleMember {

    public enum Status { ACTIVE, STOPPED, DELETE_REQUESTED }

    @Id
    private String id;

    /** E.164, e.g. "+919876543210" (normalized via {@code OtpService.normalize}). */
    @Indexed(unique = true)
    private String waNumber;

    @Indexed
    private Status status = Status.ACTIVE;

    /** Timestamp of the inbound JOIN message — the moment of consent (T+0). */
    private Instant joinedAt;

    /** Provider message id of the inbound JOIN — the consent proof. */
    private String consentMessageId;

    /** Page the join intent was typed on, e.g. "/ritual-guides/karwa-chauth". */
    private String entryPointPage;

    private Instant stoppedAt;

    /** Set on inbound DELETE; the purge job removes the record 7 days later. */
    private Instant deleteRequestedAt;

    /** Enforces the one-canned-service-reply-per-24h-window rule. */
    private Instant lastServiceReplyAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getWaNumber() { return waNumber; }
    public void setWaNumber(String waNumber) { this.waNumber = waNumber; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public Instant getJoinedAt() { return joinedAt; }
    public void setJoinedAt(Instant joinedAt) { this.joinedAt = joinedAt; }
    public String getConsentMessageId() { return consentMessageId; }
    public void setConsentMessageId(String consentMessageId) { this.consentMessageId = consentMessageId; }
    public String getEntryPointPage() { return entryPointPage; }
    public void setEntryPointPage(String entryPointPage) { this.entryPointPage = entryPointPage; }
    public Instant getStoppedAt() { return stoppedAt; }
    public void setStoppedAt(Instant stoppedAt) { this.stoppedAt = stoppedAt; }
    public Instant getDeleteRequestedAt() { return deleteRequestedAt; }
    public void setDeleteRequestedAt(Instant deleteRequestedAt) { this.deleteRequestedAt = deleteRequestedAt; }
    public Instant getLastServiceReplyAt() { return lastServiceReplyAt; }
    public void setLastServiceReplyAt(Instant lastServiceReplyAt) { this.lastServiceReplyAt = lastServiceReplyAt; }
}
