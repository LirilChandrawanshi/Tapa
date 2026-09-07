package co.thetapa.commerce;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * "Report a problem" on a delivered/dispatched kit order (launch-blocking
 * aftercare). No photo upload yet — photoNote records that we'll request
 * photos on WhatsApp instead. Resolution (item-level replacement or refund)
 * is the buyer's choice, handled by support within one working day.
 */
@Document("issue_reports")
public class IssueReport {

    public enum Reason { BOX_DAMAGED, ITEM_BROKEN, ITEM_MISSING, WRONG_ITEM, OTHER }

    public enum Status { NEW, IN_REVIEW, RESOLVED }

    @Id
    private String id;

    @Indexed
    private String orderNumber;

    /** normalized (+91…) — the phone the order was placed with */
    private String phone;

    private Reason reason;
    private String details;

    /** no upload path yet — plain-words note that photos come via WhatsApp */
    private String photoNote = "We'll request photos on WhatsApp if they help resolve this faster.";

    @Indexed
    private Status status = Status.NEW;

    @CreatedDate
    private Instant createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public Reason getReason() { return reason; }
    public void setReason(Reason reason) { this.reason = reason; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public String getPhotoNote() { return photoNote; }
    public void setPhotoNote(String photoNote) { this.photoNote = photoNote; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
