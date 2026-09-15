package co.thetapa.feedback;

import co.thetapa.common.ApiResponse;
import co.thetapa.feedback.FeedbackDocuments.Application;
import co.thetapa.feedback.FeedbackDocuments.CorrectionReport;
import co.thetapa.feedback.FeedbackDocuments.NotifyRequest;
import co.thetapa.identity.UserRepository;
import jakarta.validation.constraints.NotBlank;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/v1")
public class FeedbackController {

    private final NotifyRequestRepository notifyRepo;
    private final CorrectionReportRepository correctionRepo;
    private final ApplicationRepository applicationRepo;
    private final UserRepository users;

    public FeedbackController(NotifyRequestRepository notifyRepo,
                              CorrectionReportRepository correctionRepo,
                              ApplicationRepository applicationRepo,
                              UserRepository users) {
        this.notifyRepo = notifyRepo;
        this.correctionRepo = correctionRepo;
        this.applicationRepo = applicationRepo;
        this.users = users;
    }

    /** Phone is optional for a signed-in caller — their account number wins. */
    public record NotifyBody(@NotBlank String context, String phone, String articleSlug) {
    }

    @PostMapping("/notify-me")
    public ApiResponse<Map<String, Object>> notifyMe(@AuthenticationPrincipal String userId,
                                                     @RequestBody NotifyBody body) {
        if (!Set.of("kits", "purohit", "restock").contains(body.context())) {
            throw new IllegalArgumentException("Unknown notify context.");
        }
        NotifyRequest req = new NotifyRequest();
        req.context = body.context();
        req.phone = resolvePhone(userId, body.phone());
        req.articleSlug = body.articleSlug();
        try {
            notifyRepo.save(req);
        } catch (DuplicateKeyException ignored) {
            // already on the list — idempotent
        }
        return ApiResponse.ok(Map.of("registered", true));
    }

    /**
     * A signed-in visitor is never asked for a number again: the session's own
     * verified phone is used, and anything posted in the body is ignored.
     * Signed out, the body phone is required (and must be a valid +91 mobile).
     */
    private String resolvePhone(String userId, String bodyPhone) {
        if (userId != null && !userId.isBlank()) {
            String sessionPhone = users.findById(userId).map(u -> u.getPhone()).orElse(null);
            if (sessionPhone != null && !sessionPhone.isBlank()) {
                return sessionPhone;
            }
        }
        return co.thetapa.identity.otp.OtpService.normalize(bodyPhone);
    }

    public record CorrectionBody(@NotBlank String pageUrl, @NotBlank String lineAsItStands,
                                 @NotBlank String whatItShouldSay, String source, boolean isPratha,
                                 @NotBlank String name, @NotBlank String email, String whatsapp) {
    }

    @PostMapping("/corrections")
    public ApiResponse<Map<String, Object>> correction(@RequestBody CorrectionBody body) {
        CorrectionReport report = new CorrectionReport();
        report.pageUrl = body.pageUrl();
        report.lineAsItStands = body.lineAsItStands();
        report.whatItShouldSay = body.whatItShouldSay();
        report.source = body.source();
        report.isPratha = body.isPratha();
        report.name = body.name();
        report.email = body.email();
        report.whatsapp = body.whatsapp();
        correctionRepo.save(report);
        return ApiResponse.ok(Map.of("received", true));
    }

    public record ApplicationBody(@NotBlank String type, Map<String, Object> fields) {
    }

    @PostMapping("/applications")
    public ApiResponse<Map<String, Object>> apply(@RequestBody ApplicationBody body) {
        if (!Set.of("team", "purohit", "retailer").contains(body.type())) {
            throw new IllegalArgumentException("Unknown application type.");
        }
        Application application = new Application();
        application.type = body.type();
        application.fields = body.fields();
        applicationRepo.save(application);
        return ApiResponse.ok(Map.of("received", true));
    }
}
