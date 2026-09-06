package co.thetapa.booking;

import co.thetapa.common.ApiResponse;
import co.thetapa.common.NotFoundException;
import co.thetapa.common.ValidationFailedException;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.DeleteMapping;
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
public class AdminBookingController {

    private final PujaTypeRepository pujaTypes;
    private final PurohitRepository purohits;
    private final BookingRepository bookings;

    public AdminBookingController(PujaTypeRepository pujaTypes, PurohitRepository purohits,
                                  BookingRepository bookings) {
        this.pujaTypes = pujaTypes;
        this.purohits = purohits;
        this.bookings = bookings;
    }

    /* puja types */

    @GetMapping("/pujas")
    public ApiResponse<List<PujaType>> listPujas() {
        return ApiResponse.ok(pujaTypes.findAll());
    }

    @PutMapping("/pujas/{slug}")
    public ApiResponse<PujaType> upsertPuja(@PathVariable String slug, @RequestBody PujaType body) {
        if (body.getVariants() == null || body.getVariants().isEmpty()
            || body.getVariants().stream().anyMatch(v -> v.pricePaise() <= 0)) {
            throw new ValidationFailedException(List.of("Every variant needs a positive price in paise."));
        }
        body.setSlug(slug);
        pujaTypes.findBySlug(slug).ifPresent(existing -> body.setId(existing.getId()));
        return ApiResponse.ok(pujaTypes.save(body));
    }

    /* purohits */

    @GetMapping("/purohits")
    public ApiResponse<List<Purohit>> listPurohits() {
        return ApiResponse.ok(purohits.findAllByOrderByNameAsc());
    }

    @PutMapping("/purohits/{slug}")
    public ApiResponse<Purohit> upsertPurohit(@PathVariable String slug, @RequestBody Purohit body) {
        body.setSlug(slug);
        purohits.findBySlug(slug).ifPresent(existing -> body.setId(existing.getId()));
        return ApiResponse.ok(purohits.save(body));
    }

    @DeleteMapping("/purohits/{slug}")
    public ApiResponse<Map<String, Object>> deletePurohit(@PathVariable String slug) {
        purohits.findBySlug(slug).ifPresent(purohits::delete);
        return ApiResponse.ok(Map.of("deleted", true));
    }

    /* bookings */

    @GetMapping("/bookings")
    public ApiResponse<List<Booking>> listBookings(@RequestParam(required = false) Booking.Status status,
                                                   @RequestParam(defaultValue = "0") int page) {
        return ApiResponse.ok(status == null
            ? bookings.findAllByOrderByCreatedAtDesc(PageRequest.of(page, 50))
            : bookings.findByStatusOrderByDateAsc(status));
    }

    public record StatusChange(Booking.Status status, String note) {
    }

    @PostMapping("/bookings/{bookingNumber}/status")
    public ApiResponse<Booking> changeStatus(@PathVariable String bookingNumber,
                                             @RequestBody StatusChange body) {
        Booking booking = bookings.findByBookingNumber(bookingNumber)
            .orElseThrow(() -> new NotFoundException("booking", bookingNumber));
        Booking.Status previous = booking.getStatus();

        Map<Booking.Status, List<Booking.Status>> transitions = Map.of(
            Booking.Status.PENDING_PAYMENT, List.of(Booking.Status.CANCELLED),
            Booking.Status.CONFIRMED, List.of(Booking.Status.COMPLETED, Booking.Status.CANCELLED),
            Booking.Status.CANCELLED, List.of(Booking.Status.REFUND_INITIATED),
            Booking.Status.REFUND_INITIATED, List.of(Booking.Status.REFUNDED)
        );
        List<Booking.Status> allowed = transitions.getOrDefault(previous, List.of());
        if (!allowed.contains(body.status())) {
            throw new ValidationFailedException(List.of(
                "Cannot move " + previous + " → " + body.status() + ". Allowed: " + allowed));
        }
        booking.setStatus(body.status());
        switch (body.status()) {
            case COMPLETED -> booking.setStatusNote("Puja completed · thank you");
            case CANCELLED -> {
                booking.setCancelledAt(Instant.now());
                booking.setRefundPaise(previous == Booking.Status.CONFIRMED ? booking.getPricePaise() : 0L);
                booking.setStatusNote("Cancelled · full refund initiated");
            }
            case REFUND_INITIATED -> booking.setStatusNote("Refund on its way (3–5 working days)");
            case REFUNDED -> booking.setStatusNote("Refunded in full");
            default -> {
            }
        }
        if (body.note() != null && !body.note().isBlank()) {
            booking.setStatusNote(body.note());
        }
        return ApiResponse.ok(bookings.save(booking));
    }
}
