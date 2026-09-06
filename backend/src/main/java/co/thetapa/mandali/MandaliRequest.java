package co.thetapa.mandali;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;

/**
 * A bhajan-mandali availability request. TM- prefix locked. Request-based:
 * no instant confirm, no upfront payment — the team confirms within 24 hours
 * with the final quote (CONFIRMED) or declines. Payment is collected offline
 * on the confirmation call in this phase.
 */
@Document("mandali_requests")
public class MandaliRequest {

    public enum Status { REQUESTED, CONFIRMED, DECLINED, COMPLETED, CANCELLED }

    public enum VenueType { HOME, TEMPLE }

    @Id
    private String id;

    @Indexed(unique = true)
    private String requestNumber;    // TM-2026-0001

    @Indexed
    private String phone;            // E.164, ownership key for tracking
    @Indexed
    private String userId;           // nullable — guests can request

    private String mandaliTypeSlug;
    private String mandaliName;

    private LocalDate date;          // min tomorrow (IST)
    private VenueType venueType;
    /** Bucket string: under-25 | 25-50 | 50-100 | 100-plus. */
    private String expectedGuests;

    private Address address;
    private String notes;            // ≤ 500 chars, optional

    private Status status = Status.REQUESTED;
    /** Set by admin on CONFIRMED — the final quote. Null while REQUESTED. */
    private Long quotedPricePaise;
    private String statusNote;

    private Instant cancelledAt;

    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;

    public record Address(String name, String phone, String line1, String line2,
                          String city, String state, String pincode) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getRequestNumber() { return requestNumber; }
    public void setRequestNumber(String requestNumber) { this.requestNumber = requestNumber; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getMandaliTypeSlug() { return mandaliTypeSlug; }
    public void setMandaliTypeSlug(String mandaliTypeSlug) { this.mandaliTypeSlug = mandaliTypeSlug; }
    public String getMandaliName() { return mandaliName; }
    public void setMandaliName(String mandaliName) { this.mandaliName = mandaliName; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public VenueType getVenueType() { return venueType; }
    public void setVenueType(VenueType venueType) { this.venueType = venueType; }
    public String getExpectedGuests() { return expectedGuests; }
    public void setExpectedGuests(String expectedGuests) { this.expectedGuests = expectedGuests; }
    public Address getAddress() { return address; }
    public void setAddress(Address address) { this.address = address; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public Long getQuotedPricePaise() { return quotedPricePaise; }
    public void setQuotedPricePaise(Long quotedPricePaise) { this.quotedPricePaise = quotedPricePaise; }
    public String getStatusNote() { return statusNote; }
    public void setStatusNote(String statusNote) { this.statusNote = statusNote; }
    public Instant getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(Instant cancelledAt) { this.cancelledAt = cancelledAt; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
