package co.thetapa.feedback;

import co.thetapa.feedback.FeedbackDocuments.CorrectionReport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

class CorrectionLogControllerTest {

    private CorrectionReportRepository repo;
    private CorrectionLogController controller;

    @BeforeEach
    void setUp() {
        repo = Mockito.mock(CorrectionReportRepository.class);
        controller = new CorrectionLogController(repo);
    }

    private static CorrectionReport fixed(String pageUrl, String shouldSay, Instant createdAt) {
        CorrectionReport r = new CorrectionReport();
        r.pageUrl = pageUrl;
        r.whatItShouldSay = shouldSay;
        r.status = "fixed";
        r.createdAt = createdAt;
        return r;
    }

    @Test
    void onlyFixedReportsForTheSlugAppearDated() {
        when(repo.findByStatusOrderByCreatedAtDesc("fixed")).thenReturn(List.of(
            fixed("https://thetapaco.com/ritual-guides/all-year-pujans/aja-ekadashi",
                "The parana window opens at sunrise, not at moonrise.",
                Instant.parse("2026-09-01T10:00:00Z")),
            fixed("https://thetapaco.com/ritual-guides/festive-pujans/hariyali-teej",
                "Unrelated page.", Instant.parse("2026-08-01T10:00:00Z"))
        ));

        var entries = controller.forArticle("aja-ekadashi").data();

        assertThat(entries).hasSize(1);
        assertThat(entries.get(0).date()).isEqualTo("2026-09-01");
        assertThat(entries.get(0).note()).contains("parana window");
    }

    @Test
    void longNotesAreTruncatedAndNullsSurvive() {
        String longNote = "x".repeat(500);
        CorrectionReport noDate = fixed("/ritual-guides/all/aja-ekadashi", longNote, null);
        when(repo.findByStatusOrderByCreatedAtDesc("fixed")).thenReturn(List.of(noDate));

        var entries = controller.forArticle("aja-ekadashi").data();

        assertThat(entries).hasSize(1);
        assertThat(entries.get(0).date()).isNull();
        assertThat(entries.get(0).note()).hasSizeLessThanOrEqualTo(180).endsWith("…");
    }

    @Test
    void noMatchesMeansAnEmptyListNotAnError() {
        when(repo.findByStatusOrderByCreatedAtDesc("fixed")).thenReturn(List.of());
        assertThat(controller.forArticle("aja-ekadashi").data()).isEmpty();
    }
}
