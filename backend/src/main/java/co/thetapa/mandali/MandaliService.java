package co.thetapa.mandali;

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

import java.time.Instant;
import java.time.LocalDate;
import java.time.Year;
import java.util.List;
import java.util.Map;
import java.util.Objects;

/**
 * Bhajan-mandali availability requests (Phase 5). Request-based model, locked
 * for this build (flagged for Komal): "Check availability" → REQUESTED, the
 * team confirms within 24h from admin with the final quote, or declines.
 * No payment happens here — collection is offline on the confirmation call.
 */
@Service
public class MandaliService {

    /** The guest buckets — data contract with the frontend select. */
    public static final List<String> GUEST_BUCKETS =
        List.of("under-25", "25-50", "50-100", "100-plus");

    static final int NOTES_MAX = 500;

    private final MandaliTypeRepository types;
    private final MandaliRequestRepository requests;
    private final MongoTemplate mongo;
    private final co.thetapa.flags.FeatureFlagService flags;

    public MandaliService(MandaliTypeRepository types, MandaliRequestRepository requests,
                          MongoTemplate mongo, co.thetapa.flags.FeatureFlagService flags) {
        this.types = types;
        this.requests = requests;
        this.mongo = mongo;
        this.flags = flags;
    }

    public record RequestInput(String mandaliTypeSlug, LocalDate date, String venueType,
                               String expectedGuests, MandaliRequest.Address address,
                               String notes, String phone) {
    }

    public MandaliRequest request(RequestInput input, String userId) {
        if (!Boolean.TRUE.equals(flags.all().get(
            co.thetapa.flags.FeatureFlagService.MANDALI_VISIBLE))) {
            throw new ValidationFailedException(List.of(
                "Mandali booking has not opened yet. Leave your number on the notify list and we'll message you first."));
        }
        MandaliType type = types.findBySlug(input.mandaliTypeSlug())
            .filter(MandaliType::isActive)
            .orElseThrow(() -> new NotFoundException("mandali", input.mandaliTypeSlug()));

        if (input.date() == null
            || input.date().isBefore(LocalDate.now(PanchangService.IST).plusDays(1))) {
            throw new ValidationFailedException(List.of(
                "Mandali requests need at least a day's notice — pick tomorrow or later."));
        }
        MandaliRequest.VenueType venue;
        try {
            venue = MandaliRequest.VenueType.valueOf(
                input.venueType() == null ? "" : input.venueType().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ValidationFailedException(List.of("Choose a venue — home or temple."));
        }
        if (!GUEST_BUCKETS.contains(input.expectedGuests())) {
            throw new ValidationFailedException(List.of("Choose the expected number of guests."));
        }
        if (input.notes() != null && input.notes().length() > NOTES_MAX) {
            throw new ValidationFailedException(List.of(
                "Notes can be at most " + NOTES_MAX + " characters."));
        }

        String phone = OtpService.normalize(input.phone() != null
            ? input.phone() : input.address() == null ? "" : input.address().phone());

        MandaliRequest request = new MandaliRequest();
        request.setRequestNumber(nextRequestNumber());
        request.setPhone(phone);
        request.setUserId(userId);
        request.setMandaliTypeSlug(type.getSlug());
        request.setMandaliName(type.getName());
        request.setDate(input.date());
        request.setVenueType(venue);
        request.setExpectedGuests(input.expectedGuests());
        request.setAddress(input.address());
        request.setNotes(input.notes() == null || input.notes().isBlank()
            ? null : input.notes().trim());
        request.setStatus(MandaliRequest.Status.REQUESTED);
        request.setStatusNote("We confirm availability and the final quote within 24 hours on WhatsApp.");
        return requests.save(request);
    }

    /** Ownership-guarded tracking — a wrong phone looks like a missing request. */
    public MandaliRequest status(String requestNumber, String requesterPhone) {
        MandaliRequest request = requests.findByRequestNumber(requestNumber)
            .orElseThrow(() -> new NotFoundException("mandali request", requestNumber));
        if (!Objects.equals(request.getPhone(), requesterPhone)) {
            throw new NotFoundException("mandali request", requestNumber);
        }
        return request;
    }

    /** Requester cancellation — free while REQUESTED/CONFIRMED (nothing was paid). */
    public MandaliRequest cancel(String requestNumber, String requesterPhone) {
        MandaliRequest request = status(requestNumber, requesterPhone);
        if (request.getStatus() == MandaliRequest.Status.CANCELLED) {
            return request;
        }
        if (request.getStatus() != MandaliRequest.Status.REQUESTED
            && request.getStatus() != MandaliRequest.Status.CONFIRMED) {
            throw new ValidationFailedException(List.of(
                "This request can no longer be cancelled here."));
        }
        request.setStatus(MandaliRequest.Status.CANCELLED);
        request.setCancelledAt(Instant.now());
        request.setStatusNote("Cancelled — nothing was charged.");
        return requests.save(request);
    }

    String nextRequestNumber() {
        int year = Year.now(PanchangService.IST).getValue();
        var query = Query.query(Criteria.where("_id").is("mandali-" + year));
        var update = new Update().inc("seq", 1);
        var options = FindAndModifyOptions.options().returnNew(true).upsert(true);
        Map<?, ?> counter = mongo.findAndModify(query, update, options, Map.class, "counters");
        long seq = ((Number) counter.get("seq")).longValue();
        return "TM-%d-%04d".formatted(year, seq);
    }
}
