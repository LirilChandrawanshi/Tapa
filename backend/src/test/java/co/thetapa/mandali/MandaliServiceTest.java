package co.thetapa.mandali;

import co.thetapa.common.NotFoundException;
import co.thetapa.common.ValidationFailedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

class MandaliServiceTest {

    private MandaliTypeRepository types;
    private MandaliRequestRepository requests;
    private co.thetapa.flags.FeatureFlagService flags;
    private MandaliService service;

    private final LocalDate future = LocalDate.now(co.thetapa.panchang.PanchangService.IST).plusDays(5);

    private static final MandaliRequest.Address ADDRESS = new MandaliRequest.Address(
        "A", "9876543210", "x", null, "Delhi", "DL", "110001");

    @BeforeEach
    void setUp() {
        types = Mockito.mock(MandaliTypeRepository.class);
        requests = Mockito.mock(MandaliRequestRepository.class);
        MongoTemplate mongo = Mockito.mock(MongoTemplate.class);
        when(mongo.findAndModify(any(), any(), any(), eq(Map.class), eq("counters")))
            .thenReturn(Map.of("seq", 1));
        when(requests.save(any())).thenAnswer(inv -> inv.getArgument(0));
        flags = Mockito.mock(co.thetapa.flags.FeatureFlagService.class);
        when(flags.all()).thenReturn(Map.of("mandali_visible", true));
        service = new MandaliService(types, requests, mongo, flags);

        MandaliType sundarkand = new MandaliType();
        sundarkand.setSlug("sundarkand");
        sundarkand.setName("Sundarkand Path");
        sundarkand.setStartingPricePaise(450_000);
        sundarkand.setActive(true);
        when(types.findBySlug("sundarkand")).thenReturn(Optional.of(sundarkand));
    }

    private MandaliService.RequestInput input(LocalDate date, String guests) {
        return new MandaliService.RequestInput(
            "sundarkand", date, "HOME", guests, ADDRESS, "Please start after aarti", "9876543210");
    }

    @Test
    void requestRejectedWhileFlagOff() {
        when(flags.all()).thenReturn(Map.of("mandali_visible", false));
        assertThatThrownBy(() -> service.request(input(future, "25-50"), null))
            .isInstanceOf(ValidationFailedException.class)
            .hasMessageContaining("not opened yet");
    }

    @Test
    void happyPathRequestIsRequestedWithTmNumber() {
        var request = service.request(input(future, "25-50"), null);
        assertThat(request.getRequestNumber()).matches("TM-\\d{4}-0001");
        assertThat(request.getStatus()).isEqualTo(MandaliRequest.Status.REQUESTED);
        assertThat(request.getMandaliName()).isEqualTo("Sundarkand Path");
        assertThat(request.getPhone()).isEqualTo("+919876543210");
        assertThat(request.getQuotedPricePaise()).isNull();
    }

    @Test
    void sameDayRequestIsRejected() {
        assertThatThrownBy(() -> service.request(
            input(LocalDate.now(co.thetapa.panchang.PanchangService.IST), "25-50"), null))
            .isInstanceOf(ValidationFailedException.class)
            .hasMessageContaining("day's notice");
    }

    @Test
    void unknownGuestBucketIsRejected() {
        assertThatThrownBy(() -> service.request(input(future, "a-few"), null))
            .isInstanceOf(ValidationFailedException.class)
            .hasMessageContaining("guests");
    }

    @Test
    void overlongNotesAreRejected() {
        var longNotes = "x".repeat(501);
        assertThatThrownBy(() -> service.request(new MandaliService.RequestInput(
            "sundarkand", future, "HOME", "25-50", ADDRESS, longNotes, "9876543210"), null))
            .isInstanceOf(ValidationFailedException.class)
            .hasMessageContaining("500");
    }

    @Test
    void cancelRequiresTheRequestersPhone() {
        MandaliRequest existing = new MandaliRequest();
        existing.setRequestNumber("TM-2026-0001");
        existing.setPhone("+919876543210");
        existing.setStatus(MandaliRequest.Status.REQUESTED);
        when(requests.findByRequestNumber("TM-2026-0001")).thenReturn(Optional.of(existing));

        // a stranger's phone reads as "not found" — no existence leak
        assertThatThrownBy(() -> service.cancel("TM-2026-0001", "+919999999999"))
            .isInstanceOf(NotFoundException.class);

        var cancelled = service.cancel("TM-2026-0001", "+919876543210");
        assertThat(cancelled.getStatus()).isEqualTo(MandaliRequest.Status.CANCELLED);
        assertThat(cancelled.getCancelledAt()).isNotNull();
    }
}
