package co.thetapa.circle;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * Per-send delivery log — one row per (number, occasion, template) outcome.
 *
 * <p>The compound unique index on {@code {waNumber, occasionSlug, templateId}}
 * is the spec's "one send per occasion per member" guarantee. Mongo unique
 * indexes treat missing values as a single null key, so {@code occasionSlug}
 * is NEVER left null — non-occasion sends use documented pseudo-keys instead
 * of a partial index (pragmatic choice, keeps auto-index-creation simple):</p>
 * <ul>
 *   <li>T2 reminder  → the real observance slug (e.g. {@code "karwa-chauth-2026"})</li>
 *   <li>T1 welcome   → {@code "welcome"} (rejoin re-welcome uses {@code "welcome:rejoin:<date>"})</li>
 *   <li>T3 opt-out   → {@code "optout:<date>"} (a number may STOP, rejoin, STOP again)</li>
 *   <li>SERVICE      → {@code "service:<date>"} for the canned unmonitored-number reply
 *       (doubles as a per-calendar-day cap for numbers we hold no member record for)
 *       and {@code "service:join:<date>"} for the already-active JOIN acknowledgement</li>
 * </ul>
 */
@Document("circle_sends")
@CompoundIndex(name = "one_send_per_occasion",
    def = "{'waNumber': 1, 'occasionSlug': 1, 'templateId': 1}", unique = true)
public class CircleSend {

    /** T1 welcome, T2 occasion reminder, T3 opt-out confirmation, SERVICE free-text reply. */
    public enum TemplateId {
        T1("tapa_circle_welcome"),
        T2("tapa_circle_reminder"),
        T3("tapa_circle_optout"),
        SERVICE("service_text");

        private final String templateName;

        TemplateId(String templateName) { this.templateName = templateName; }

        public String templateName() { return templateName; }
    }

    /**
     * SENT = first attempt succeeded; RETRIED = first attempt failed, the single
     * +60s retry succeeded; FAILED_FLAGGED = both attempts failed — surfaced on
     * the admin dashboard, never retried again.
     */
    public enum Status { SENT, RETRIED, FAILED_FLAGGED }

    @Id
    private String id;

    private String memberId;
    private String waNumber;
    private TemplateId templateId;
    /** Real observance slug for T2, pseudo-key otherwise — see class javadoc. */
    private String occasionSlug;
    private String language;
    private Status status;
    private String providerMessageId;
    private Instant sentAt;

    /** Set only for FAILED_FLAGGED — the provider error that the admin sees as the flag reason. */
    private String failureReason;

    /**
     * Provider delivery receipt ("DELIVERED"/"FAILED"), reported later via the
     * webhook status callback and matched on {@code providerMessageId}.
     * Distinct from {@link Status}, which records the submission outcome.
     */
    private String deliveryStatus;
    private Instant deliveryUpdatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getMemberId() { return memberId; }
    public void setMemberId(String memberId) { this.memberId = memberId; }
    public String getWaNumber() { return waNumber; }
    public void setWaNumber(String waNumber) { this.waNumber = waNumber; }
    public TemplateId getTemplateId() { return templateId; }
    public void setTemplateId(TemplateId templateId) { this.templateId = templateId; }
    public String getOccasionSlug() { return occasionSlug; }
    public void setOccasionSlug(String occasionSlug) { this.occasionSlug = occasionSlug; }
    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public String getProviderMessageId() { return providerMessageId; }
    public void setProviderMessageId(String providerMessageId) { this.providerMessageId = providerMessageId; }
    public Instant getSentAt() { return sentAt; }
    public void setSentAt(Instant sentAt) { this.sentAt = sentAt; }
    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }
    public String getDeliveryStatus() { return deliveryStatus; }
    public void setDeliveryStatus(String deliveryStatus) { this.deliveryStatus = deliveryStatus; }
    public Instant getDeliveryUpdatedAt() { return deliveryUpdatedAt; }
    public void setDeliveryUpdatedAt(Instant deliveryUpdatedAt) { this.deliveryUpdatedAt = deliveryUpdatedAt; }
}
