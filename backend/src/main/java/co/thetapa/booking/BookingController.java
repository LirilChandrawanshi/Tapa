package co.thetapa.booking;

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

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class BookingController {

    private final PujaTypeRepository pujaTypes;
    private final BookingService service;
    private final BookingRepository bookings;
    private final co.thetapa.identity.UserRepository users;
    private final org.springframework.data.mongodb.core.MongoTemplate mongo;

    public BookingController(PujaTypeRepository pujaTypes, BookingService service,
                             BookingRepository bookings, co.thetapa.identity.UserRepository users,
                             org.springframework.data.mongodb.core.MongoTemplate mongo) {
        this.pujaTypes = pujaTypes;
        this.service = service;
        this.bookings = bookings;
        this.users = users;
        this.mongo = mongo;
    }

    @GetMapping("/pujas")
    public ApiResponse<Map<String, Object>> pujas() {
        return ApiResponse.ok(Map.of(
            "items", pujaTypes.findByActiveTrueOrderByNameAsc(),
            "slots", PujaType.SLOTS
        ));
    }

    @GetMapping("/pujas/{slug}")
    public ApiResponse<PujaType> puja(@PathVariable String slug) {
        return ApiResponse.ok(pujaTypes.findBySlug(slug)
            .filter(PujaType::isActive)
            .orElseThrow(() -> new NotFoundException("puja", slug)));
    }

    @GetMapping("/pujas/{slug}/availability")
    public ApiResponse<List<BookingService.PurohitCard>> availability(
        @PathVariable String slug,
        @RequestParam LocalDate date,
        @RequestParam(required = false) String city) {
        return ApiResponse.ok(service.availability(slug, city, date));
    }

    @PostMapping("/bookings")
    public ApiResponse<Map<String, Object>> book(@RequestBody BookingService.BookingRequest body,
                                                 @AuthenticationPrincipal String userId) {
        var result = service.book(body, userId);
        return ApiResponse.ok(Map.of(
            "bookingNumber", result.booking().getBookingNumber(),
            "pricePaise", result.booking().getPricePaise(),
            "payment", result.payment()
        ));
    }

    /** Dev/mock capture; the production gateway webhook replaces this. */
    @PostMapping("/bookings/payments/mock/confirm")
    public ApiResponse<BookingView> mockConfirm(@RequestBody Map<String, Object> payload) {
        String providerRef = (String) payload.get("providerRef");
        Booking booking = mongo.findOne(
            org.springframework.data.mongodb.core.query.Query.query(
                org.springframework.data.mongodb.core.query.Criteria.where("paymentRef").is(providerRef)), Booking.class);
        if (booking == null) {
            throw new co.thetapa.common.NotFoundException("booking for payment", providerRef);
        }
        // In dev/mock mode, skip actual payment verification and just confirm the booking.
        // Production uses webhooks (e.g., /api/v1/payments/razorpay/webhook) with real signatures.
        if (booking.getStatus() != Booking.Status.PENDING_PAYMENT) {
            return ApiResponse.ok(BookingView.of(booking));
        }
        booking.setStatus(Booking.Status.CONFIRMED);
        booking.setStatusNote("Confirmed · " + booking.getPurohitName() + " will call a day before.");
        return ApiResponse.ok(BookingView.of(bookings.save(booking)));
    }

    @GetMapping("/bookings/{bookingNumber}")
    public ApiResponse<BookingView> track(@PathVariable String bookingNumber,
                                          @RequestParam String phone) {
        Booking booking = bookings.findByBookingNumber(bookingNumber)
            .orElseThrow(() -> new NotFoundException("booking", bookingNumber));
        if (!booking.getPhone().equals(OtpService.normalize(phone))) {
            throw new NotFoundException("booking", bookingNumber);
        }
        return ApiResponse.ok(BookingView.of(booking));
    }

    @PostMapping("/bookings/{bookingNumber}/cancel")
    public ApiResponse<BookingView> cancel(@PathVariable String bookingNumber,
                                           @RequestBody Map<String, String> body) {
        return ApiResponse.ok(BookingView.of(
            service.cancel(bookingNumber, OtpService.normalize(body.get("phone")))));
    }

    @GetMapping("/me/bookings")
    public ApiResponse<List<BookingView>> myBookings(@AuthenticationPrincipal String userId) {
        var user = users.findById(userId).orElseThrow(() -> new NotFoundException("user", userId));
        var byUser = bookings.findByUserIdOrderByCreatedAtDesc(userId);
        var merged = new java.util.ArrayList<>(byUser);
        bookings.findByPhoneOrderByCreatedAtDesc(user.getPhone()).stream()
            .filter(b -> byUser.stream().noneMatch(u -> u.getId().equals(b.getId())))
            .forEach(merged::add);
        return ApiResponse.ok(merged.stream().map(BookingView::of).toList());
    }

    /** Buyer-facing shape — no internal ids, no payment refs, no purohit phone. */
    public record BookingView(String bookingNumber, String status, String statusNote,
                              String pujaName, String variantName, String purohitName,
                              String date, String slot, String slotWindow, boolean kitIncluded,
                              long pricePaise, Booking.Address address,
                              String cancellableUntil, String createdAt) {

        static BookingView of(Booking b) {
            return new BookingView(b.getBookingNumber(), b.getStatus().name(), b.getStatusNote(),
                b.getPujaName(), b.getVariantName(), b.getPurohitName(),
                b.getDate() == null ? null : b.getDate().toString(), b.getSlot(), b.getSlotWindow(),
                b.isKitIncluded(), b.getPricePaise(), b.getAddress(),
                b.getCancellableUntil() == null ? null : b.getCancellableUntil().toString(),
                b.getCreatedAt() == null ? null : b.getCreatedAt().toString());
        }
    }
}
