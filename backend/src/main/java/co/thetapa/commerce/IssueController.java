package co.thetapa.commerce;

import co.thetapa.common.ApiResponse;
import co.thetapa.common.NotFoundException;
import co.thetapa.common.ValidationFailedException;
import co.thetapa.identity.otp.OtpService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Report-a-problem aftercare. Public submission is ownership-checked the same
 * way as tracking (order number + the phone the order was placed with);
 * the /admin/issues paths inherit the EDITOR/ADMIN role gate from SecurityConfig.
 */
@RestController
@RequestMapping("/api/v1")
public class IssueController {

    private final IssueReportRepository issues;
    private final OrderRepository orders;

    public IssueController(IssueReportRepository issues, OrderRepository orders) {
        this.issues = issues;
        this.orders = orders;
    }

    public record IssueBody(String phone, String reason, String details) {
    }

    public record IssueView(String id, String orderNumber, String reason, String details,
                            String photoNote, String status, String createdAt) {

        static IssueView of(IssueReport r) {
            return new IssueView(r.getId(), r.getOrderNumber(),
                r.getReason() == null ? null : r.getReason().name(), r.getDetails(),
                r.getPhotoNote(), r.getStatus().name(),
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
}
