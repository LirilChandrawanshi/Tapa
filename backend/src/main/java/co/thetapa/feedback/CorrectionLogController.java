package co.thetapa.feedback;

import co.thetapa.common.ApiResponse;
import co.thetapa.feedback.FeedbackDocuments.CorrectionReport;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

/**
 * Public corrections log (#71/#134): every reader-reported correction that the
 * RI team marked "fixed" for a given article, dated, so the page can show a
 * transparent "Corrections — dated" list at its foot.
 *
 * Matching is by page URL substring — correction reports capture the full
 * page URL, which always contains the article slug.
 */
@RestController
@RequestMapping("/api/v1/articles")
public class CorrectionLogController {

    static final ZoneId IST = ZoneId.of("Asia/Kolkata");
    private static final int NOTE_MAX = 180;

    private final CorrectionReportRepository corrections;

    public CorrectionLogController(CorrectionReportRepository corrections) {
        this.corrections = corrections;
    }

    public record CorrectionEntry(String date, String note) {
    }

    @GetMapping("/{slug}/corrections")
    public ApiResponse<List<CorrectionEntry>> forArticle(@PathVariable String slug) {
        List<CorrectionEntry> entries = corrections.findByStatusOrderByCreatedAtDesc("fixed").stream()
            .filter(r -> r.pageUrl != null && r.pageUrl.contains(slug))
            .map(CorrectionLogController::toEntry)
            .toList();
        return ApiResponse.ok(entries);
    }

    private static CorrectionEntry toEntry(CorrectionReport report) {
        LocalDate date = report.createdAt == null
            ? null
            : report.createdAt.atZone(IST).toLocalDate();
        return new CorrectionEntry(date == null ? null : date.toString(), truncate(report.whatItShouldSay));
    }

    private static String truncate(String text) {
        if (text == null) {
            return "";
        }
        String trimmed = text.strip();
        if (trimmed.length() <= NOTE_MAX) {
            return trimmed;
        }
        return trimmed.substring(0, NOTE_MAX - 1).stripTrailing() + "…";
    }
}
