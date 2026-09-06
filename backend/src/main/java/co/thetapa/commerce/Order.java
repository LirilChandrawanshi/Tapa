package co.thetapa.commerce;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * A kit order. TK- prefix is locked (TP-/TM- reserved for purohit/mandali).
 * All money in integer paise. Full prepayment — no COD until Komal confirms.
 */
@Document("orders")
public class Order {

    public enum Status {
        PENDING_PAYMENT, CONFIRMED, PACKING, DISPATCHED, DELIVERED,
        CANCELLED, REFUND_INITIATED, REFUNDED
    }

    @Id
    private String id;

    @Indexed(unique = true)
    private String orderNumber;      // TK-2026-0001

    /** phone is the identity key — set for both guest and account orders */
    @Indexed
    private String phone;
    @Indexed
    private String userId;           // null for guest orders until claimed

    private List<Line> items;

    private long subtotalPaise;
    private long deliveryPaise;
    private long totalPaise;

    private Address address;

    private String paymentMethod;    // upi | card | netbanking
    private String paymentProvider;  // mock | razorpay
    private String paymentRef;       // gateway order/payment id

    private Status status = Status.PENDING_PAYMENT;
    private String statusNote;       // plain-words line shown to the buyer

    private LocalDate expectedDelivery;
    private LocalDate festivalDate;  // earliest dated item's occasion
    private Instant cancellableUntil;

    private String courier;
    private String trackingId;
    private Instant dispatchedAt;
    private Instant cancelledAt;
    private Long refundPaise;

    @CreatedDate
    private Instant createdAt;
    @LastModifiedDate
    private Instant updatedAt;

    public record Line(String productSlug, String title, int qty, long unitPricePaise,
                       LocalDate orderByDate, LocalDate festivalDate) {
    }

    public record Address(String name, String phone, String line1, String line2,
                          String city, String state, String pincode) {
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public List<Line> getItems() { return items; }
    public void setItems(List<Line> items) { this.items = items; }
    public long getSubtotalPaise() { return subtotalPaise; }
    public void setSubtotalPaise(long subtotalPaise) { this.subtotalPaise = subtotalPaise; }
    public long getDeliveryPaise() { return deliveryPaise; }
    public void setDeliveryPaise(long deliveryPaise) { this.deliveryPaise = deliveryPaise; }
    public long getTotalPaise() { return totalPaise; }
    public void setTotalPaise(long totalPaise) { this.totalPaise = totalPaise; }
    public Address getAddress() { return address; }
    public void setAddress(Address address) { this.address = address; }
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
    public LocalDate getExpectedDelivery() { return expectedDelivery; }
    public void setExpectedDelivery(LocalDate expectedDelivery) { this.expectedDelivery = expectedDelivery; }
    public LocalDate getFestivalDate() { return festivalDate; }
    public void setFestivalDate(LocalDate festivalDate) { this.festivalDate = festivalDate; }
    public Instant getCancellableUntil() { return cancellableUntil; }
    public void setCancellableUntil(Instant cancellableUntil) { this.cancellableUntil = cancellableUntil; }
    public String getCourier() { return courier; }
    public void setCourier(String courier) { this.courier = courier; }
    public String getTrackingId() { return trackingId; }
    public void setTrackingId(String trackingId) { this.trackingId = trackingId; }
    public Instant getDispatchedAt() { return dispatchedAt; }
    public void setDispatchedAt(Instant dispatchedAt) { this.dispatchedAt = dispatchedAt; }
    public Instant getCancelledAt() { return cancelledAt; }
    public void setCancelledAt(Instant cancelledAt) { this.cancelledAt = cancelledAt; }
    public Long getRefundPaise() { return refundPaise; }
    public void setRefundPaise(Long refundPaise) { this.refundPaise = refundPaise; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
