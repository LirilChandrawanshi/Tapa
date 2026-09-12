package co.thetapa.commerce;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * "Report a problem" on a delivered/dispatched kit order (launch-blocking
 * aftercare). Up to four photos may be attached (media asset ids). Resolution
 * is item-level replacement first; a coupon code is issued only when the
 * item can't be replaced — never a cash refund on a damage claim.
 */
@Document("issue_reports")
public class IssueReport {

    public enum Reason { BOX_DAMAGED, ITEM_BROKEN, ITEM_MISSING, WRONG_ITEM, OTHER }

    public enum Status { NEW, IN_REVIEW, RESOLVED }

    public enum Resolution { REPLACEMENT, COUPON }

    @Id
    private String id;

    @Indexed
    private String orderNumber;

    /** normalized (+91…) — the phone the order was placed with */
    private String phone;

    private Reason reason;
    private String details;

    /** media asset ids — up to four, uploaded after the report is created */
    private List<String> photoIds = new ArrayList<>();

    @Indexed
    private Status status = Status.NEW;

    /** set by support on resolve: replacement first, coupon only if the item can't be replaced */
    private Resolution resolution;
    /** generated only when resolution == COUPON */
    private String couponCode;

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
    public List<String> getPhotoIds() { return photoIds; }
    public void setPhotoIds(List<String> photoIds) { this.photoIds = photoIds; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public Resolution getResolution() { return resolution; }
    public void setResolution(Resolution resolution) { this.resolution = resolution; }
    public String getCouponCode() { return couponCode; }
    public void setCouponCode(String couponCode) { this.couponCode = couponCode; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
