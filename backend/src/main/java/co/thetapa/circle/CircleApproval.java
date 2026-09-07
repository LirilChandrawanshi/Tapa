package co.thetapa.circle;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

/**
 * G58 approval gate: an occasion-level human sign-off that must exist before
 * the T2 evening reminder may fan out to the Circle. The scheduler checks for
 * this row in addition to {@code Observance.verified} — verification says the
 * DATE is right, approval says a human reviewed the actual message that will
 * reach every member's phone.
 *
 * <p>POLICY NOTE (two-person rule): the G58 policy intends the approver to be
 * a different admin than the editor who verified the observance. With a
 * single-admin dev reality we cannot enforce distinct identities yet, so this
 * record enforces the auditable half: {@code approvedBy} (the approver's
 * phone) must be non-null and is stored together with {@code createdBy} (the
 * raw principal id, null-safe) and {@code approvedAt}. Enforcing
 * approver != verifier becomes a one-line check here once multiple admin
 * accounts exist.</p>
 */
@Document("circle_approvals")
public class CircleApproval {

    @Id
    private String id;

    /** The observance this approval unlocks — one approval per occasion, ever. */
    @Indexed(unique = true)
    private String observanceSlug;

    /** Approver identity as a phone number (resolved from the principal). Never null. */
    private String approvedBy;

    /** Raw principal user id, kept null-safe ("" when unresolvable) for audit joins. */
    private String createdBy;

    private Instant approvedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getObservanceSlug() { return observanceSlug; }
    public void setObservanceSlug(String observanceSlug) { this.observanceSlug = observanceSlug; }
    public String getApprovedBy() { return approvedBy; }
    public void setApprovedBy(String approvedBy) { this.approvedBy = approvedBy; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Instant getApprovedAt() { return approvedAt; }
    public void setApprovedAt(Instant approvedAt) { this.approvedAt = approvedAt; }
}
