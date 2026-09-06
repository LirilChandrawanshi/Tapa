package co.thetapa.mandali;

import co.thetapa.common.ApiResponse;
import co.thetapa.common.NotFoundException;
import co.thetapa.identity.otp.OtpService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class MandaliController {

    private final MandaliTypeRepository types;
    private final MandaliService service;
    private final MandaliRequestRepository requests;
    private final co.thetapa.identity.UserRepository users;

    public MandaliController(MandaliTypeRepository types, MandaliService service,
                             MandaliRequestRepository requests,
                             co.thetapa.identity.UserRepository users) {
        this.types = types;
        this.service = service;
        this.requests = requests;
        this.users = users;
    }

    @GetMapping("/mandali")
    public ApiResponse<Map<String, Object>> mandaliTypes() {
        return ApiResponse.ok(Map.of(
            "items", types.findByActiveTrueOrderByNameAsc(),
            "guestBuckets", MandaliService.GUEST_BUCKETS
        ));
    }

    @GetMapping("/mandali/{slug}")
    public ApiResponse<MandaliType> mandaliType(@PathVariable String slug) {
        return ApiResponse.ok(types.findBySlug(slug)
            .filter(MandaliType::isActive)
            .orElseThrow(() -> new NotFoundException("mandali", slug)));
    }

    @PostMapping("/mandali/requests")
    public ApiResponse<MandaliRequestView> request(@RequestBody MandaliService.RequestInput body,
                                                   @AuthenticationPrincipal String userId) {
        return ApiResponse.ok(MandaliRequestView.of(service.request(body, userId)));
    }

    @GetMapping("/mandali/requests/{requestNumber}")
    public ApiResponse<MandaliRequestView> track(@PathVariable String requestNumber,
                                                 @RequestParam String phone) {
        return ApiResponse.ok(MandaliRequestView.of(
            service.status(requestNumber, OtpService.normalize(phone))));
    }

    @PostMapping("/mandali/requests/{requestNumber}/cancel")
    public ApiResponse<MandaliRequestView> cancel(@PathVariable String requestNumber,
                                                  @RequestBody Map<String, String> body) {
        return ApiResponse.ok(MandaliRequestView.of(
            service.cancel(requestNumber, OtpService.normalize(body.get("phone")))));
    }

    @GetMapping("/me/mandali")
    public ApiResponse<List<MandaliRequestView>> myRequests(@AuthenticationPrincipal String userId) {
        var user = users.findById(userId).orElseThrow(() -> new NotFoundException("user", userId));
        var byUser = requests.findByUserIdOrderByCreatedAtDesc(userId);
        var merged = new java.util.ArrayList<>(byUser);
        requests.findByPhoneOrderByCreatedAtDesc(user.getPhone()).stream()
            .filter(r -> byUser.stream().noneMatch(u -> u.getId().equals(r.getId())))
            .forEach(merged::add);
        return ApiResponse.ok(merged.stream().map(MandaliRequestView::of).toList());
    }

    /** Requester-facing shape — no internal ids, no userId. */
    public record MandaliRequestView(String requestNumber, String status, String statusNote,
                                     String mandaliTypeSlug, String mandaliName, String date,
                                     String venueType, String expectedGuests,
                                     MandaliRequest.Address address, String notes,
                                     Long quotedPricePaise, String createdAt) {

        static MandaliRequestView of(MandaliRequest r) {
            return new MandaliRequestView(r.getRequestNumber(), r.getStatus().name(),
                r.getStatusNote(), r.getMandaliTypeSlug(), r.getMandaliName(),
                r.getDate() == null ? null : r.getDate().toString(),
                r.getVenueType() == null ? null : r.getVenueType().name(),
                r.getExpectedGuests(), r.getAddress(), r.getNotes(),
                r.getQuotedPricePaise(),
                r.getCreatedAt() == null ? null : r.getCreatedAt().toString());
        }
    }
}
