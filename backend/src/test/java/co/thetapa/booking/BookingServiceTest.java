package co.thetapa.booking;

import co.thetapa.commerce.MockPaymentProvider;
import co.thetapa.common.ValidationFailedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

class BookingServiceTest {

    private PujaTypeRepository pujaTypes;
    private PurohitRepository purohits;
    private BookingRepository bookings;
    private BookingService service;

    private final LocalDate future = LocalDate.now(co.thetapa.panchang.PanchangService.IST).plusDays(5);

    @BeforeEach
    void setUp() {
        pujaTypes = Mockito.mock(PujaTypeRepository.class);
        purohits = Mockito.mock(PurohitRepository.class);
        bookings = Mockito.mock(BookingRepository.class);
        MongoTemplate mongo = Mockito.mock(MongoTemplate.class);
        when(mongo.findAndModify(any(), any(), any(), eq(Map.class), eq("counters")))
            .thenReturn(Map.of("seq", 1));
        when(bookings.save(any())).thenAnswer(inv -> inv.getArgument(0));
        service = new BookingService(pujaTypes, purohits, bookings, new MockPaymentProvider(), mongo);

        PujaType rudra = new PujaType();
        rudra.setSlug("rudrabhishek");
        rudra.setName("Rudrabhishek");
        rudra.setVariants(List.of(new PujaType.Variant("sankshipt", "Sankshipt", "45 min", "core vidhi", 710_000)));
        rudra.setAllowedSlots(List.of("early-morning", "morning"));
        when(pujaTypes.findBySlug("rudrabhishek")).thenReturn(Optional.of(rudra));

        Purohit keshav = new Purohit();
        keshav.setSlug("keshav");
        keshav.setName("Pt. Keshav");
        keshav.setVerified(true);
        keshav.setActive(true);
        when(purohits.findBySlug("keshav")).thenReturn(Optional.of(keshav));
        when(purohits.findByActiveTrueAndVerifiedTrueAndPujaTypeSlugsContainingAndCitiesContaining(
            eq("rudrabhishek"), any())).thenReturn(List.of(keshav));
        when(bookings.findByPurohitSlugAndDateAndStatusIn(any(), any(), anyList()))
            .thenReturn(List.of());
    }

    @Test
    void availabilityRespectsPujaAllowedSlots() {
        var cards = service.availability("rudrabhishek", null, future);
        assertThat(cards).hasSize(1);
        assertThat(cards.get(0).freeSlots()).containsExactly("early-morning", "morning");
    }

    @Test
    void availabilityExcludesBookedSlots() {
        Booking taken = new Booking();
        taken.setSlot("early-morning");
        when(bookings.findByPurohitSlugAndDateAndStatusIn(eq("keshav"), eq(future), anyList()))
            .thenReturn(List.of(taken));
        var cards = service.availability("rudrabhishek", null, future);
        assertThat(cards.get(0).freeSlots()).containsExactly("morning");
    }

    @Test
    void availabilityRejectsSameDayBooking() {
        assertThatThrownBy(() -> service.availability("rudrabhishek", null,
            LocalDate.now(co.thetapa.panchang.PanchangService.IST)))
            .isInstanceOf(ValidationFailedException.class)
            .hasMessageContaining("day's notice");
    }

    @Test
    void bookingSlotOutsideAllowedIsRejected() {
        assertThatThrownBy(() -> service.book(new BookingService.BookingRequest(
            "rudrabhishek", "sankshipt", "keshav", future, "evening", true,
            new Booking.Address("A", "9876543210", "x", null, "Delhi", "DL", "110001"),
            "upi", "9876543210"), null))
            .isInstanceOf(ValidationFailedException.class)
            .hasMessageContaining("no longer free");
    }

    @Test
    void happyPathBookingIsPendingPaymentWithTpNumber() {
        var result = service.book(new BookingService.BookingRequest(
            "rudrabhishek", "sankshipt", "keshav", future, "morning", true,
            new Booking.Address("A", "9876543210", "x", null, "Delhi", "DL", "110001"),
            "upi", "9876543210"), null);
        assertThat(result.booking().getBookingNumber()).matches("TP-\\d{4}-0001");
        assertThat(result.booking().getStatus()).isEqualTo(Booking.Status.PENDING_PAYMENT);
        assertThat(result.booking().getPricePaise()).isEqualTo(710_000);
        assertThat(result.booking().getCancellableUntil()).isNotNull();
    }

    @Test
    void codIsRejected() {
        assertThatThrownBy(() -> service.book(new BookingService.BookingRequest(
            "rudrabhishek", "sankshipt", "keshav", future, "morning", true,
            new Booking.Address("A", "9876543210", "x", null, "Delhi", "DL", "110001"),
            "cod", "9876543210"), null))
            .isInstanceOf(ValidationFailedException.class)
            .hasMessageContaining("payment method");
    }
}
