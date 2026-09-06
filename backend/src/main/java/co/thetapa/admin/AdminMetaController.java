package co.thetapa.admin;

import co.thetapa.common.ApiResponse;
import co.thetapa.common.NotFoundException;
import co.thetapa.feedback.ApplicationRepository;
import co.thetapa.feedback.CorrectionReportRepository;
import co.thetapa.feedback.FeedbackDocuments;
import co.thetapa.feedback.NotifyRequestRepository;
import co.thetapa.flags.FeatureFlag;
import co.thetapa.flags.FeatureFlagRepository;
import co.thetapa.flags.FeatureFlagService;
import co.thetapa.identity.UserRepository;
import co.thetapa.search.PopularSearchRepository;
import co.thetapa.search.SearchModels;
import co.thetapa.search.SearchService;
import co.thetapa.taxonomy.Taxonomy;
import co.thetapa.taxonomy.TaxonomyService;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * The operational rest of the admin panel: editorial signals (zero-result
 * searches, corrections), inboxes (applications, notify list), curated
 * popular searches, feature flags and the nav taxonomy.
 */
@RestController
@RequestMapping("/api/v1/admin")
public class AdminMetaController {

    private static final Set<String> CORRECTION_STATUSES = Set.of("new", "triaged", "fixed", "rejected");

    private final SearchService searchService;
    private final PopularSearchRepository popularSearches;
    private final CorrectionReportRepository corrections;
    private final ApplicationRepository applications;
    private final NotifyRequestRepository notifyRequests;
    private final FeatureFlagService flagService;
    private final FeatureFlagRepository flags;
    private final TaxonomyService taxonomyService;
    private final UserRepository users;

    public AdminMetaController(SearchService searchService, PopularSearchRepository popularSearches,
                               CorrectionReportRepository corrections, ApplicationRepository applications,
                               NotifyRequestRepository notifyRequests, FeatureFlagService flagService,
                               FeatureFlagRepository flags, TaxonomyService taxonomyService,
                               UserRepository users) {
        this.searchService = searchService;
        this.popularSearches = popularSearches;
        this.corrections = corrections;
        this.applications = applications;
        this.notifyRequests = notifyRequests;
        this.flagService = flagService;
        this.flags = flags;
        this.taxonomyService = taxonomyService;
        this.users = users;
    }

    /* ---------- search signals ---------- */

    @GetMapping("/reports/zero-results")
    public ApiResponse<List<SearchModels.SearchQuery>> zeroResults(
        @RequestParam(defaultValue = "50") int limit) {
        return ApiResponse.ok(searchService.zeroResultQueries(limit));
    }

    @GetMapping("/popular-searches")
    public ApiResponse<List<SearchModels.PopularSearch>> popularSearches() {
        return ApiResponse.ok(popularSearches.findAll(Sort.by(Sort.Direction.ASC, "order")));
    }

    /** Full-list replace — the editor sends the curated set in display order. */
    @PutMapping("/popular-searches")
    public ApiResponse<List<SearchModels.PopularSearch>> replacePopularSearches(
        @RequestBody List<SearchModels.PopularSearch> body) {
        popularSearches.deleteAll();
        return ApiResponse.ok(popularSearches.saveAll(body));
    }

    /* ---------- corrections inbox ---------- */

    @GetMapping("/corrections")
    public ApiResponse<List<FeedbackDocuments.CorrectionReport>> listCorrections(
        @RequestParam(defaultValue = "new") String status) {
        if ("all".equals(status)) {
            return ApiResponse.ok(corrections.findAll(Sort.by(Sort.Direction.DESC, "createdAt")));
        }
        return ApiResponse.ok(corrections.findByStatusOrderByCreatedAtDesc(status));
    }

    @PostMapping("/corrections/{id}/status")
    public ApiResponse<FeedbackDocuments.CorrectionReport> setCorrectionStatus(
        @PathVariable String id, @RequestBody Map<String, String> body) {
        String status = body.get("status");
        if (status == null || !CORRECTION_STATUSES.contains(status)) {
            throw new IllegalArgumentException("status must be one of " + CORRECTION_STATUSES);
        }
        FeedbackDocuments.CorrectionReport report = corrections.findById(id)
            .orElseThrow(() -> new NotFoundException("correction report", id));
        report.status = status;
        return ApiResponse.ok(corrections.save(report));
    }

    /* ---------- applications + notify list ---------- */

    @GetMapping("/applications")
    public ApiResponse<List<FeedbackDocuments.Application>> listApplications(
        @RequestParam(required = false) String type) {
        if (type == null || type.isBlank()) {
            return ApiResponse.ok(applications.findAll(Sort.by(Sort.Direction.DESC, "createdAt")));
        }
        return ApiResponse.ok(applications.findByTypeOrderByCreatedAtDesc(type));
    }

    @GetMapping("/notify-requests")
    public ApiResponse<List<FeedbackDocuments.NotifyRequest>> listNotifyRequests() {
        return ApiResponse.ok(notifyRequests.findAll(Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    /* ---------- feature flags ---------- */

    @GetMapping("/flags")
    public ApiResponse<List<FeatureFlag>> allFlags() {
        return ApiResponse.ok(flags.findAll(Sort.by(Sort.Direction.ASC, "key")));
    }

    @GetMapping("/flags/{key}")
    public ApiResponse<FeatureFlag> getFlag(@PathVariable String key) {
        return ApiResponse.ok(flags.findByKey(key)
            .orElseThrow(() -> new NotFoundException("feature flag", key)));
    }

    /** Phase switches are data, not deploys — this is the PRD's launch lever. */
    @PutMapping("/flags/{key}")
    public ApiResponse<FeatureFlag> setFlag(@PathVariable String key,
                                            @RequestBody Map<String, Boolean> body,
                                            @AuthenticationPrincipal String userId) {
        Boolean value = body.get("value");
        if (value == null) {
            throw new IllegalArgumentException("body must carry a boolean 'value'");
        }
        String updatedBy = users.findById(userId == null ? "" : userId)
            .map(u -> u.getPhone())
            .orElse(userId == null ? "unknown" : userId);
        return ApiResponse.ok(flagService.set(key, value, updatedBy));
    }

    /* ---------- taxonomy ---------- */

    /** Full singleton replace; TaxonomyService.save evicts the nav cache. */
    @PutMapping("/taxonomy")
    public ApiResponse<Taxonomy> replaceTaxonomy(@RequestBody Taxonomy body) {
        if (body.getPillars() == null || body.getPillars().isEmpty()) {
            throw new IllegalArgumentException("taxonomy must carry at least one pillar");
        }
        return ApiResponse.ok(taxonomyService.save(body));
    }
}
