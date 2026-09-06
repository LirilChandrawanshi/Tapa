package co.thetapa.mandali;

import co.thetapa.common.ApiResponse;
import co.thetapa.common.NotFoundException;
import co.thetapa.common.ValidationFailedException;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminMandaliController {

    private final MandaliTypeRepository types;
    private final MandaliRequestRepository requests;

    public AdminMandaliController(MandaliTypeRepository types, MandaliRequestRepository requests) {
        this.types = types;
        this.requests = requests;
    }

    /* mandali types */

    @GetMapping("/mandali-types")
    public ApiResponse<List<MandaliType>> listTypes() {
        return ApiResponse.ok(types.findAllByOrderByNameAsc());
    }

    @GetMapping("/mandali-types/{slug}")
    public ApiResponse<MandaliType> getType(@PathVariable String slug) {
        return ApiResponse.ok(types.findBySlug(slug)
            .orElseThrow(() -> new NotFoundException("mandali type", slug)));
    }

    @PutMapping("/mandali-types/{slug}")
    public ApiResponse<MandaliType> upsertType(@PathVariable String slug,
                                               @RequestBody MandaliType body) {
        if (body.getStartingPricePaise() <= 0) {
            throw new ValidationFailedException(List.of(
                "The starting price needs to be a positive amount in paise."));
        }
        body.setSlug(slug);
        types.findBySlug(slug).ifPresent(existing -> body.setId(existing.getId()));
        return ApiResponse.ok(types.save(body));
    }

    /* requests */

    @GetMapping("/mandali-requests")
    public ApiResponse<List<MandaliRequest>> listRequests(
        @RequestParam(required = false) MandaliRequest.Status status,
        @RequestParam(defaultValue = "0") int page) {
        return ApiResponse.ok(status == null
            ? requests.findAllByOrderByCreatedAtDesc(PageRequest.of(page, 50))
            : requests.findByStatusOrderByDateAsc(status));
    }

    public record StatusChange(MandaliRequest.Status status, Long quotedPricePaise, String note) {
    }

    @PostMapping("/mandali-requests/{requestNumber}/status")
    public ApiResponse<MandaliRequest> changeStatus(@PathVariable String requestNumber,
                                                    @RequestBody StatusChange body) {
        MandaliRequest request = requests.findByRequestNumber(requestNumber)
            .orElseThrow(() -> new NotFoundException("mandali request", requestNumber));
        MandaliRequest.Status previous = request.getStatus();

        Map<MandaliRequest.Status, List<MandaliRequest.Status>> transitions = Map.of(
            MandaliRequest.Status.REQUESTED,
            List.of(MandaliRequest.Status.CONFIRMED, MandaliRequest.Status.DECLINED),
            MandaliRequest.Status.CONFIRMED,
            List.of(MandaliRequest.Status.COMPLETED, MandaliRequest.Status.CANCELLED)
        );
        List<MandaliRequest.Status> allowed = transitions.getOrDefault(previous, List.of());
        if (!allowed.contains(body.status())) {
            throw new ValidationFailedException(List.of(
                "Cannot move " + previous + " → " + body.status() + ". Allowed: " + allowed));
        }
        request.setStatus(body.status());
        switch (body.status()) {
            case CONFIRMED -> {
                if (body.quotedPricePaise() == null || body.quotedPricePaise() <= 0) {
                    throw new ValidationFailedException(List.of(
                        "Confirming needs the final quote in paise (positive)."));
                }
                request.setQuotedPricePaise(body.quotedPricePaise());
                request.setStatusNote(
                    "Confirmed · our team will collect payment on the confirmation call.");
            }
            case DECLINED -> request.setStatusNote(
                "We couldn't arrange a mandali for that date — try another date and we'll do our best.");
            case COMPLETED -> request.setStatusNote("Mandali completed · thank you");
            case CANCELLED -> {
                request.setCancelledAt(Instant.now());
                request.setStatusNote("Cancelled — nothing was charged.");
            }
            default -> {
            }
        }
        if (body.note() != null && !body.note().isBlank()) {
            request.setStatusNote(body.note());
        }
        return ApiResponse.ok(requests.save(request));
    }
}
