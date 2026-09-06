package co.thetapa.circle;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * The number a visitor typed on the site before tapping the wa.me deep link.
 *
 * <p>This is NOT consent and NOT a member. Consent happens only when an inbound
 * "JOIN" arrives on the business number. If no inbound message arrives within
 * 24 hours, Mongo's TTL monitor deletes the record automatically. If the inbound
 * JOIN arrives from a different number than the typed one, the sending number
 * wins and this record is simply left to expire.</p>
 */
@Document("circle_pending_joins")
public class PendingJoin {

    @Id
    private String id;

    /** E.164 normalized number the visitor typed. */
    @Indexed
    private String typedNumber;

    private String entryPointPage;

    /** TTL anchor: Mongo removes the document ~24h after this instant. */
    @Indexed(expireAfter = "24h")
    private Instant createdAt = Instant.now();

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getTypedNumber() { return typedNumber; }
    public void setTypedNumber(String typedNumber) { this.typedNumber = typedNumber; }
    public String getEntryPointPage() { return entryPointPage; }
    public void setEntryPointPage(String entryPointPage) { this.entryPointPage = entryPointPage; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
