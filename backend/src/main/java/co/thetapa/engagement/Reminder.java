package co.thetapa.engagement;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;

/**
 * A one-shot vrat reminder for a signed-in user. Delivered on WhatsApp the
 * evening before the observance (7:00 PM IST — same cadence as the Circle).
 * One reminder per user per observance; the send date is denormalized at
 * creation so listing needs no panchang lookups.
 */
@Document("reminders")
@CompoundIndex(name = "user_observance", def = "{'userId': 1, 'observanceSlug': 1}", unique = true)
public class Reminder {

    @Id
    private String id;

    private String userId;

    /** linked ritual guide, when the reminder was set from an article */
    private String articleSlug;
    /** the calendar entry this reminder fires for — always resolved at creation */
    private String observanceSlug;

    /** display name, denormalized from the observance/article */
    private String title;

    /** the day of the observance itself */
    private LocalDate observanceDate;

    /** evening before, 7:00 PM IST */
    private Instant sendAt;

    private String channel = "WHATSAPP";
    private boolean enabled = true;

    @CreatedDate
    private Instant createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getArticleSlug() { return articleSlug; }
    public void setArticleSlug(String articleSlug) { this.articleSlug = articleSlug; }
    public String getObservanceSlug() { return observanceSlug; }
    public void setObservanceSlug(String observanceSlug) { this.observanceSlug = observanceSlug; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public LocalDate getObservanceDate() { return observanceDate; }
    public void setObservanceDate(LocalDate observanceDate) { this.observanceDate = observanceDate; }
    public Instant getSendAt() { return sendAt; }
    public void setSendAt(Instant sendAt) { this.sendAt = sendAt; }
    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
