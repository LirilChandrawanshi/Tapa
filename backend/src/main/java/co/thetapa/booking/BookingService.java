package co.thetapa.booking;

import co.thetapa.commerce.PaymentProvider;
import co.thetapa.common.NotFoundException;
import co.thetapa.common.ValidationFailedException;
import co.thetapa.identity.otp.OtpService;
import co.thetapa.panchang.PanchangService;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class BookingService {

    private final PujaTypeRepository pujaTypes;
    private final PurohitRepository purohits;
    private final BookingRepository bookings;
    private final PaymentProvider paymentProvider;
    private final MongoTemplate mongo;

    public BookingService(PujaTypeRepository pujaTypes, PurohitRepository purohits,
                          BookingRepository bookings, PaymentProvider paymentProvider,
                          MongoTemplate mongo) {
        this.pujaTypes = pujaTypes;
        this.purohits = purohits;
        this.bookings = bookings;
        this.paymentProvider = paymentProvider;
        this.mongo = mongo;
    }

    private static final List<Booking.Status> BLOCKING =
        List.of(Booking.Status.PENDING_PAYMENT, Booking.Status.CONFIRMED);

    /** Public purohit card — never leaks the phone number. */
    public record PurohitCard(String slug, String name, double rating, int pujaCount,
                              List<String> languages, String lineageNote,
                              List<String> freeSlots) {
    }

    /**
     * Pandits able to serve a puja in a city on a date, with the slots each has
     * free. Slot legality = puja's allowedSlots ∩ purohit's serving slots minus
     * already-booked ones. Backend-enforced: the client renders exactly this.
     */
    public List<PurohitCard> availability(String pujaSlug, String city, LocalDate date) {
        PujaType puja = pujaTypes.findBySlug(pujaSlug)
            .orElseThrow(() -> new NotFoundException("puja", pujaSlug));
        if (date.isBefore(LocalDate.now(PanchangService.IST).plusDays(1))) {
            throw new ValidationFailedException(List.of(
                "Bookings need at least a day's notice — pick tomorrow or later."));
        }
        List<String> legalSlots = puja.getAllowedSlots() == null || puja.getAllowedSlots().isEmpty()
            ? PujaType.SLOTS.stream().map(PujaType.Slot::key).toList()
            : puja.getAllowedSlots();

        String resolvedCity = city == null || city.isBlank() ? "delhi-ncr" : city;
        List<PurohitCard> cards = new ArrayList<>();
        for (Purohit purohit : purohits
            .findByActiveTrueAndVerifiedTrueAndPujaTypeSlugsContainingAndCitiesContaining(
                pujaSlug, resolvedCity)) {
            if (purohit.getUnavailableDates() != null && purohit.getUnavailableDates().contains(date)) {
                continue;
            }
            List<String> taken = bookings
                .findByPurohitSlugAndDateAndStatusIn(purohit.getSlug(), date, BLOCKING)
                .stream().map(Booking::getSlot).toList();
            List<String> free = legalSlots.stream()
                .filter(slot -> purohit.getUnavailableSlots() == null
                    || !purohit.getUnavailableSlots().contains(slot))
                .filter(slot -> !taken.contains(slot))
                .toList();
            if (!free.isEmpty()) {
                cards.add(new PurohitCard(purohit.getSlug(), purohit.getName(), purohit.getRating(),
                    purohit.getPujaCount(), purohit.getLanguages(), purohit.getLineageNote(), free));
            }
        }
        return cards;
    }

    public record BookingRequest(String pujaSlug, String variantKey, String purohitSlug,
                                 LocalDate date, String slot, boolean kitIncluded,
                                 Booking.Address address, String paymentMethod, String phone) {
    }

    public record BookingResult(Booking booking, Map<String, Object> payment) {
    }

    public BookingResult book(BookingRequest request, String userId) {
        PujaType puja = pujaTypes.findBySlug(request.pujaSlug())
            .orElseThrow(() -> new NotFoundException("puja", request.pujaSlug()));
        PujaType.Variant variant = puja.getVariants().stream()
            .filter(v -> v.key().equals(request.variantKey())).findFirst()
            .orElseThrow(() -> new ValidationFailedException(List.of("Choose a variant.")));
        Purohit purohit = purohits.findBySlug(request.purohitSlug())
            .orElseThrow(() -> new NotFoundException("purohit", request.purohitSlug()));

        if (!List.of("upi", "card", "netbanking").contains(request.paymentMethod())) {
            throw new ValidationFailedException(List.of("Choose a payment method."));
        }
        PujaType.Slot slot = PujaType.SLOTS.stream()
            .filter(s -> s.key().equals(request.slot())).findFirst()
            .orElseThrow(() -> new ValidationFailedException(List.of("Choose a time slot.")));

        // re-validate the exact slot against live availability (rules + conflicts)
        boolean slotFree = availability(request.pujaSlug(), cityOf(request.address()), request.date())
            .stream()
            .anyMatch(c -> c.slug().equals(purohit.getSlug()) && c.freeSlots().contains(slot.key()));
        if (!slotFree) {
            throw new ValidationFailedException(List.of(
                purohit.getName() + " is no longer free in that window — pick another slot."));
        }

        String phone = OtpService.normalize(request.phone() != null
            ? request.phone() : request.address() == null ? "" : request.address().phone());

        Booking booking = new Booking();
        booking.setBookingNumber(nextBookingNumber());
        booking.setPhone(phone);
        booking.setUserId(userId);
        booking.setPujaTypeSlug(puja.getSlug());
        booking.setPujaName(puja.getName());
        booking.setVariantKey(variant.key());
        booking.setVariantName(variant.name());
        booking.setPurohitSlug(purohit.getSlug());
        booking.setPurohitName(purohit.getName());
        booking.setDate(request.date());
        booking.setSlot(slot.key());
        booking.setSlotWindow(slot.window());
        booking.setKitIncluded(request.kitIncluded());
        booking.setAddress(request.address());
        booking.setPricePaise(variant.pricePaise());
        booking.setPaymentMethod(request.paymentMethod());
        booking.setPaymentProvider(paymentProvider.name());
        booking.setStatus(Booking.Status.PENDING_PAYMENT);
        booking.setStatusNote("Waiting for payment.");
        // free cancellation until 24h before the slot's day starts
        booking.setCancellableUntil(request.date().atStartOfDay(PanchangService.IST)
            .minus(Duration.ofHours(24)).toInstant());

        var intent = paymentProvider.createIntent(booking.getBookingNumber(),
            booking.getPricePaise(), request.paymentMethod());
        booking.setPaymentRef(intent.providerRef());
        bookings.save(booking);
        return new BookingResult(booking, intent.clientPayload());
    }

    public Booking confirmPayment(String providerRef, Map<String, Object> payload) {
        Booking booking = mongo.findOne(
            Query.query(Criteria.where("paymentRef").is(providerRef)), Booking.class);
        if (booking == null) {
            throw new NotFoundException("booking for payment", providerRef);
        }
        if (booking.getStatus() != Booking.Status.PENDING_PAYMENT) {
            return booking;
        }
        if (!paymentProvider.verifyCapture(providerRef, payload)) {
            throw new ValidationFailedException(List.of(
                "Your payment couldn't be verified. You haven't been charged twice — contact help@thetapaco.com."));
        }
        booking.setStatus(Booking.Status.CONFIRMED);
        booking.setStatusNote("Confirmed · " + booking.getPurohitName() + " will call a day before.");
        return bookings.save(booking);
    }

    public Booking cancel(String bookingNumber, String requesterPhone) {
        Booking booking = bookings.findByBookingNumber(bookingNumber)
            .orElseThrow(() -> new NotFoundException("booking", bookingNumber));
        if (!Objects.equals(booking.getPhone(), requesterPhone)) {
            throw new NotFoundException("booking", bookingNumber);
        }
        if (booking.getStatus() == Booking.Status.CANCELLED) {
            return booking;
        }
        if (booking.getStatus() != Booking.Status.PENDING_PAYMENT
            && booking.getStatus() != Booking.Status.CONFIRMED) {
            throw new ValidationFailedException(List.of("This booking can no longer be cancelled here."));
        }
        if (booking.getCancellableUntil() != null && Instant.now().isAfter(booking.getCancellableUntil())) {
            throw new ValidationFailedException(List.of(
                "Free cancellation closed 24 hours before the puja. Write to help@thetapaco.com and we'll do our best."));
        }
        boolean wasPaid = booking.getStatus() == Booking.Status.CONFIRMED;
        booking.setStatus(Booking.Status.CANCELLED);
        booking.setCancelledAt(Instant.now());
        booking.setRefundPaise(wasPaid ? booking.getPricePaise() : 0L);
        booking.setStatusNote(wasPaid ? "Cancelled · full refund initiated" : "Cancelled");
        return bookings.save(booking);
    }

    private String cityOf(Booking.Address address) {
        return address == null || address.city() == null ? "delhi-ncr"
            : address.city().toLowerCase().contains("delhi") || address.city().toLowerCase().contains("noida")
              || address.city().toLowerCase().contains("gurugram") || address.city().toLowerCase().contains("gurgaon")
              || address.city().toLowerCase().contains("faridabad") || address.city().toLowerCase().contains("ghaziabad")
            ? "delhi-ncr" : address.city().toLowerCase();
    }

    String nextBookingNumber() {
        int year = Year.now(PanchangService.IST).getValue();
        var query = Query.query(Criteria.where("_id").is("bookings-" + year));
        var update = new Update().inc("seq", 1);
        var options = FindAndModifyOptions.options().returnNew(true).upsert(true);
        Map<?, ?> counter = mongo.findAndModify(query, update, options, Map.class, "counters");
        long seq = ((Number) counter.get("seq")).longValue();
        return "TP-%d-%04d".formatted(year, seq);
    }
}
