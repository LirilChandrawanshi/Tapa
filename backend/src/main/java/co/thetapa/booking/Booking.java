package co.thetapa.booking;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;

/**
 * A puja booking. TP- prefix locked. Prepaid via the shared PaymentProvider.
 * Free cancellation until 24 hours before the slot.
 */
@Document("bookings")
@CompoundIndex(name = "purohit_day_slot", def = "{'purohitSlug': 1, 'date': 1, 'slot': 1}")
public class Booking {

    public enum Status { PENDING_PAYMENT, CONFIRMED, COMPLETED, CANCELLED, REFUND_INITIATED, REFUNDED }

    @Id
    private String id;

    @Indexed(unique = true)
    private String bookingNumber;    // TP-2026-0001

    @Indexed
    private String phone;
    @Indexed
    private String userId;

    private String pujaTypeSlug;
    private String pujaName;
    private String variantKey;
    private String variantName;

    private String purohitSlug;
    private String purohitName;

    private LocalDate date;
    private String slot;             // slot key
    private String slotWindow;       // "6–9 am" denormalized for display

    private boolean kitIncluded;
    private Address address;

    private long pricePaise;
    private String paymentMethod;
    private String paymentProvider;
    private String paymentRef;

    private Status status = Status.PENDING_PAYMENT;
    private String statusNote;
    private Instant cancellableUntil;
    private Instant cancelledAt;
    private Long refundPaise;

    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;

    public record Address(String name, String phone, String line1, String line2,
                          String city, String state, String pincode) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getBookingNumber() { return bookingNumber; }
    public void setBookingNumber(String bookingNumber) { this.bookingNumber = bookingNumber; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getPujaTypeSlug() { return pujaTypeSlug; }
    public void setPujaTypeSlug(String pujaTypeSlug) { this.pujaTypeSlug = pujaTypeSlug; }
    public String getPujaName() { return pujaName; }
    public void setPujaName(String pujaName) { this.pujaName = pujaName; }
    public String getVariantKey() { return variantKey; }
    public void setVariantKey(String variantKey) { this.variantKey = variantKey; }
    public String getVariantName() { return variantName; }
    public void setVariantName(String variantName) { this.variantName = variantName; }
    public String getPurohitSlug() { return purohitSlug; }
    public void setPurohitSlug(String purohitSlug) { this.purohitSlug = purohitSlug; }
    public String getPurohitName() { return purohitName; }
    public void setPurohitName(String purohitName) { this.purohitName = purohitName; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public String getSlot() { return slot; }
    public void setSlot(String slot) { this.slot = slot; }
    public String getSlotWindow() { return slotWindow; }
    public void setSlotWindow(String slotWindow) { this.slotWindow = slotWindow; }
    public boolean isKitIncluded() { return kitIncluded; }
    public void setKitIncluded(boolean kitIncluded) { this.kitIncluded = kitIncluded; }
    public Address getAddress() { return address; }
    public void setAddress(Address address) { this.address = address; }
    public long getPricePaise() { return pricePaise; }
    public void setPricePaise(long pricePaise) { this.pricePaise = pricePaise; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getPaymentProvider() { return paymentProvider; }
    public void setPaymentProvider(String paymentProvider) { this.paymentProvider = paymentProvider; }
    public String getPaymentRef() { return paymentRef; }
    public void setPaymentRef(String paymentRef) { this.paymentRef = paymentRef; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public String getStatusNote() { return statusNote; }
    public void setStatusNote(String statusNote) { this.statusNote = statusNote; }
    public Instant getCancellableUntil() { return cancellableUntil; }
    public void setCancellableUntil(Instant cancellableUntil) { this.cancellableUntil = cancellableUntil; }
    public Instant getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(Instant cancelledAt) { this.cancelledAt = cancelledAt; }
    public Long getRefundPaise() { return refundPaise; }
    public void setRefundPaise(Long refundPaise) { this.refundPaise = refundPaise; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
