package co.thetapa.commerce;

import co.thetapa.common.ApiResponse;
import co.thetapa.common.NotFoundException;
import co.thetapa.common.ValidationFailedException;
import co.thetapa.identity.otp.OtpService;
import co.thetapa.media.MediaService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Report-a-problem aftercare. Public submission is ownership-checked the same
 * way as tracking (order number + the phone the order was placed with);
 * the /admin/issues paths inherit the EDITOR/ADMIN role gate from SecurityConfig.
 */
@RestController
@RequestMapping("/api/v1")
public class IssueController {

    private static final int MAX_PHOTOS = 4;

    private final IssueReportRepository issues;
    private final OrderRepository orders;
    private final MediaService media;

    public IssueController(IssueReportRepository issues, OrderRepository orders, MediaService media) {
        this.issues = issues;
        this.orders = orders;
        this.media = media;
    }

    public record IssueBody(String phone, String reason, String details) {
    }

    public record IssueView(String id, String orderNumber, String reason, String details,
                            List<String> photoIds, String status, String resolution,
                            String couponCode, String createdAt) {

        static IssueView of(IssueReport r) {
            return new IssueView(r.getId(), r.getOrderNumber(),
                r.getReason() == null ? null : r.getReason().name(), r.getDetails(),
                r.getPhotoIds(), r.getStatus().name(),
                r.getResolution() == null ? null : r.getResolution().name(),
                r.getCouponCode(),
                r.getCreatedAt() == null ? null : r.getCreatedAt().toString());
        }
    }

    @PostMapping("/orders/{orderNumber}/issues")
    public ApiResponse<IssueView> report(@PathVariable String orderNumber,
                                         @RequestBody IssueBody body) {
        Order order = orders.findByOrderNumber(orderNumber)
            .orElseThrow(() -> new NotFoundException("order", orderNumber));
        // ownership: same rule as tracking — no leak on mismatch
        if (!order.getPhone().equals(OtpService.normalize(body.phone()))) {
            throw new NotFoundException("order", orderNumber);
        }
        IssueReport.Reason reason;
        try {
            reason = IssueReport.Reason.valueOf(body.reason() == null ? "" : body.reason());
        } catch (IllegalArgumentException e) {
            throw new ValidationFailedException(List.of("Choose what went wrong."));
        }
        IssueReport report = new IssueReport();
        report.setOrderNumber(order.getOrderNumber());
        report.setPhone(order.getPhone());
        report.setReason(reason);
        report.setDetails(body.details() == null ? "" : body.details().trim());
        return ApiResponse.ok(IssueView.of(issues.save(report)));
    }

    /** Attach a photo (up to four) to an already-submitted report — same ownership check. */
    @PostMapping("/orders/{orderNumber}/issues/{issueId}/photos")
    public ApiResponse<IssueView> addPhoto(@PathVariable String orderNumber, @PathVariable String issueId,
                                           @RequestParam String phone,
                                           @RequestParam("file") MultipartFile file) {
        Order order = orders.findByOrderNumber(orderNumber)
            .orElseThrow(() -> new NotFoundException("order", orderNumber));
        if (!order.getPhone().equals(OtpService.normalize(phone))) {
            throw new NotFoundException("order", orderNumber);
        }
        IssueReport report = issues.findById(issueId)
            .orElseThrow(() -> new NotFoundException("issue", issueId));
        if (!report.getOrderNumber().equals(order.getOrderNumber())) {
            throw new NotFoundException("issue", issueId);
        }
        if (report.getPhotoIds().size() >= MAX_PHOTOS) {
            throw new ValidationFailedException(List.of("Up to four photos."));
        }
        try {
            var uploaded = media.upload(file.getOriginalFilename(), file.getContentType(), file.getBytes());
            report.getPhotoIds().add(uploaded.id());
        } catch (IOException e) {
            throw new UncheckedIOException("could not read upload", e);
        }
        return ApiResponse.ok(IssueView.of(issues.save(report)));
    }

    /* ---- admin (role-gated by the /api/v1/admin/** matcher) ---- */

    @GetMapping("/admin/issues")
    public ApiResponse<List<IssueReport>> list(@RequestParam(required = false) IssueReport.Status status) {
        return ApiResponse.ok(status == null
            ? issues.findAllByOrderByCreatedAtDesc()
            : issues.findByStatusOrderByCreatedAtDesc(status));
    }

    @PostMapping("/admin/issues/{id}/status")
    public ApiResponse<IssueReport> changeStatus(@PathVariable String id,
                                                 @RequestBody Map<String, String> body) {
        IssueReport report = issues.findById(id)
            .orElseThrow(() -> new NotFoundException("issue", id));
        IssueReport.Status next;
        try {
            next = IssueReport.Status.valueOf(body.getOrDefault("status", ""));
        } catch (IllegalArgumentException e) {
            throw new ValidationFailedException(List.of("Status must be NEW, IN_REVIEW or RESOLVED."));
        }
        report.setStatus(next);
        return ApiResponse.ok(issues.save(report));
    }

    /**
     * Resolve a report: item-level replacement first; a coupon code is
     * generated only when the item can't be replaced. Never a cash refund
     * on a damage claim.
     */
    @PostMapping("/admin/issues/{id}/resolve")
    public ApiResponse<IssueReport> resolve(@PathVariable String id,
                                            @RequestBody Map<String, String> body) {
        IssueReport report = issues.findById(id)
            .orElseThrow(() -> new NotFoundException("issue", id));
        IssueReport.Resolution resolution;
        try {
            resolution = IssueReport.Resolution.valueOf(body.getOrDefault("resolution", ""));
        } catch (IllegalArgumentException e) {
            throw new ValidationFailedException(List.of("Resolution must be REPLACEMENT or COUPON."));
        }
        report.setResolution(resolution);
        if (resolution == IssueReport.Resolution.COUPON) {
            report.setCouponCode("SORRY-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase());
        }
        report.setStatus(IssueReport.Status.RESOLVED);
        return ApiResponse.ok(issues.save(report));
    }
}
