package co.thetapa.engagement;

import co.thetapa.booking.Booking;
import co.thetapa.booking.BookingRepository;
import co.thetapa.commerce.Order;
import co.thetapa.commerce.OrderRepository;
import co.thetapa.common.NotFoundException;
import co.thetapa.identity.User;
import co.thetapa.identity.UserRepository;
import co.thetapa.mandali.MandaliRequest;
import co.thetapa.mandali.MandaliRequestRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * DPDP delete (#182) — pure unit test, mocked repositories, no Mongo.
 * Retention semantics under test: orders/bookings/mandali are kept but the
 * account link is severed (userId → null, phone stays for invoice identity);
 * user + saved rituals + reminders are hard-deleted.
 */
class AccountDeletionServiceTest {

    private static final String USER_ID = "u1";
    private static final String PHONE = "+919812340077";

    private UserRepository users;
    private SavedRitualRepository saved;
    private ReminderRepository reminders;
    private OrderRepository orders;
    private BookingRepository bookings;
    private MandaliRequestRepository mandali;
    private AccountDeletionService service;

    @BeforeEach
    void setUp() {
        users = mock(UserRepository.class);
        saved = mock(SavedRitualRepository.class);
        reminders = mock(ReminderRepository.class);
        orders = mock(OrderRepository.class);
        bookings = mock(BookingRepository.class);
        mandali = mock(MandaliRequestRepository.class);
        service = new AccountDeletionService(users, saved, reminders, orders, bookings, mandali);

        User user = new User();
        user.setId(USER_ID);
        user.setPhone(PHONE);
        when(users.findById(USER_ID)).thenReturn(Optional.of(user));

        when(orders.findByUserIdOrderByCreatedAtDesc(USER_ID)).thenReturn(List.of());
        when(orders.findByPhoneOrderByCreatedAtDesc(PHONE)).thenReturn(List.of());
        when(bookings.findByUserIdOrderByCreatedAtDesc(USER_ID)).thenReturn(List.of());
        when(bookings.findByPhoneOrderByCreatedAtDesc(PHONE)).thenReturn(List.of());
        when(mandali.findByUserIdOrderByCreatedAtDesc(USER_ID)).thenReturn(List.of());
        when(mandali.findByPhoneOrderByCreatedAtDesc(PHONE)).thenReturn(List.of());
    }

    private static Order order(String id, String userId, Order.Status status) {
        Order o = new Order();
        o.setId(id);
        o.setUserId(userId);
        o.setPhone(PHONE);
        o.setStatus(status);
        return o;
    }

    private static Booking booking(String id, String userId) {
        Booking b = new Booking();
        b.setId(id);
        b.setUserId(userId);
        b.setPhone(PHONE);
        return b;
    }

    private static MandaliRequest request(String id, String userId) {
        MandaliRequest m = new MandaliRequest();
        m.setId(id);
        m.setUserId(userId);
        m.setPhone(PHONE);
        return m;
    }

    /* ---------- preview ---------- */

    @Test
    void previewItemisesCountsAndFlagsInFlightOrders() {
        when(saved.countByUserId(USER_ID)).thenReturn(3L);
        when(reminders.countByUserId(USER_ID)).thenReturn(2L);
        // one delivered (settled), one dispatched (in flight), one guest order on the same phone
        Order delivered = order("o1", USER_ID, Order.Status.DELIVERED);
        Order dispatched = order("o2", USER_ID, Order.Status.DISPATCHED);
        Order guest = order("o3", null, Order.Status.CONFIRMED);
        when(orders.findByUserIdOrderByCreatedAtDesc(USER_ID)).thenReturn(List.of(delivered, dispatched));
        when(orders.findByPhoneOrderByCreatedAtDesc(PHONE))
            .thenReturn(List.of(delivered, dispatched, guest)); // overlap must dedupe
        when(bookings.findByUserIdOrderByCreatedAtDesc(USER_ID)).thenReturn(List.of(booking("b1", USER_ID)));
        when(mandali.findByPhoneOrderByCreatedAtDesc(PHONE)).thenReturn(List.of(request("m1", null)));

        var p = service.preview(USER_ID);

        assertThat(p.savedRituals()).isEqualTo(3);
        assertThat(p.reminders()).isEqualTo(2);
        assertThat(p.orders()).isEqualTo(3);          // deduped union, not 5
        assertThat(p.bookings()).isEqualTo(1);
        assertThat(p.mandaliRequests()).isEqualTo(1);
        assertThat(p.inFlightOrders()).isEqualTo(2);  // DISPATCHED + CONFIRMED
    }

    @Test
    void previewOfUnknownUserThrowsNotFound() {
        when(users.findById("ghost")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.preview("ghost")).isInstanceOf(NotFoundException.class);
    }

    /* ---------- delete ---------- */

    @Test
    void deleteAnonymizesRetainedRecordsAndHardDeletesTheRest() {
        Order mine = order("o1", USER_ID, Order.Status.DELIVERED);
        when(orders.findByUserIdOrderByCreatedAtDesc(USER_ID)).thenReturn(List.of(mine));
        Booking b = booking("b1", USER_ID);
        when(bookings.findByUserIdOrderByCreatedAtDesc(USER_ID)).thenReturn(List.of(b));
        MandaliRequest m = request("m1", USER_ID);
        when(mandali.findByUserIdOrderByCreatedAtDesc(USER_ID)).thenReturn(List.of(m));

        var result = service.delete(USER_ID);

        // retained records: userId severed, phone kept (invoice identity)
        ArgumentCaptor<Order> savedOrder = ArgumentCaptor.forClass(Order.class);
        verify(orders).save(savedOrder.capture());
        assertThat(savedOrder.getValue().getUserId()).isNull();
        assertThat(savedOrder.getValue().getPhone()).isEqualTo(PHONE);

        ArgumentCaptor<Booking> savedBooking = ArgumentCaptor.forClass(Booking.class);
        verify(bookings).save(savedBooking.capture());
        assertThat(savedBooking.getValue().getUserId()).isNull();
        assertThat(savedBooking.getValue().getPhone()).isEqualTo(PHONE);

        ArgumentCaptor<MandaliRequest> savedRequest = ArgumentCaptor.forClass(MandaliRequest.class);
        verify(mandali).save(savedRequest.capture());
        assertThat(savedRequest.getValue().getUserId()).isNull();

        // hard deletes
        verify(saved).deleteByUserId(USER_ID);
        verify(reminders).deleteByUserId(USER_ID);
        ArgumentCaptor<User> deletedUser = ArgumentCaptor.forClass(User.class);
        verify(users).delete(deletedUser.capture());
        assertThat(deletedUser.getValue().getId()).isEqualTo(USER_ID);

        assertThat(result.retainedOrders()).isEqualTo(1);
        assertThat(result.retainedBookings()).isEqualTo(1);
        assertThat(result.retainedMandaliRequests()).isEqualTo(1);
    }

    @Test
    void deleteLeavesGuestRecordsUntouched() {
        // guest order on the same phone: userId already null — nothing to rewrite
        Order guest = order("o1", null, Order.Status.DELIVERED);
        when(orders.findByPhoneOrderByCreatedAtDesc(PHONE)).thenReturn(List.of(guest));

        var result = service.delete(USER_ID);

        verify(orders, never()).save(guest);
        assertThat(result.retainedOrders()).isEqualTo(1); // still counted as retained
        verify(users).delete(org.mockito.ArgumentMatchers.any(User.class));
    }
}
