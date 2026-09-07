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
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Set;
import java.util.function.Function;

/**
 * DPDP account deletion (#182).
 *
 * <p>What is deleted immediately: the user document (which carries the refresh
 * tokens, so every session dies with it), saved rituals, and reminders.
 *
 * <p>What is retained: orders, puja bookings and mandali requests. These are
 * commercial records — the tax invoice behind each one must be preserved for
 * the statutory retention period under GST law and the Consumer Protection
 * (E-Commerce) Rules. We anonymize the account link (userId → null) but keep
 * the phone number on the record, because the phone is the invoice's customer
 * identity and the only key a buyer can use to pursue a refund or warranty
 * claim after the account is gone. Once the statutory period lapses the
 * records can be purged by the ops retention job (Phase 2+).
 *
 * <p>Tapa Circle membership is deliberately untouched: the Circle is
 * account-less by design (keyed on the WhatsApp number), and DPDP erasure for
 * it is exercised by replying DELETE on WhatsApp. The delete screen points
 * the user there.
 */
@Service
public class AccountDeletionService {

    /** An order in any other status still needs fulfilment or refund work. */
    private static final Set<Order.Status> SETTLED_ORDER_STATUSES =
        Set.of(Order.Status.DELIVERED, Order.Status.CANCELLED, Order.Status.REFUNDED);

    private final UserRepository users;
    private final SavedRitualRepository saved;
    private final ReminderRepository reminders;
    private final OrderRepository orders;
    private final BookingRepository bookings;
    private final MandaliRequestRepository mandaliRequests;

    public AccountDeletionService(UserRepository users, SavedRitualRepository saved,
                                  ReminderRepository reminders, OrderRepository orders,
                                  BookingRepository bookings, MandaliRequestRepository mandaliRequests) {
        this.users = users;
        this.saved = saved;
        this.reminders = reminders;
        this.orders = orders;
        this.bookings = bookings;
        this.mandaliRequests = mandaliRequests;
    }

    /** Itemised counts for the confirmation screen — nothing is changed. */
    public record Preview(long savedRituals, long reminders, long orders, long bookings,
                          long mandaliRequests, long inFlightOrders) {
    }

    public Preview preview(String userId) {
        User user = requireUser(userId);
        List<Order> myOrders = myOrders(userId, user.getPhone());
        long inFlight = myOrders.stream()
            .filter(o -> !SETTLED_ORDER_STATUSES.contains(o.getStatus()))
            .count();
        return new Preview(
            saved.countByUserId(userId),
            reminders.countByUserId(userId),
            myOrders.size(),
            myBookings(userId, user.getPhone()).size(),
            myMandaliRequests(userId, user.getPhone()).size(),
            inFlight
        );
    }

    public record Result(long retainedOrders, long retainedBookings, long retainedMandaliRequests) {
    }

    /**
     * Hard-deletes the account and its personal engagement data; anonymizes
     * the account link on retained commercial records (see class comment for
     * the retention rationale).
     */
    public Result delete(String userId) {
        User user = requireUser(userId);
        String phone = user.getPhone();

        // Retained records: sever the account link, keep phone for invoice identity.
        List<Order> myOrders = myOrders(userId, phone);
        for (Order o : myOrders) {
            if (userId.equals(o.getUserId())) {
                o.setUserId(null);
                orders.save(o);
            }
        }
        List<Booking> myBookings = myBookings(userId, phone);
        for (Booking b : myBookings) {
            if (userId.equals(b.getUserId())) {
                b.setUserId(null);
                bookings.save(b);
            }
        }
        List<MandaliRequest> myMandali = myMandaliRequests(userId, phone);
        for (MandaliRequest m : myMandali) {
            if (userId.equals(m.getUserId())) {
                m.setUserId(null);
                mandaliRequests.save(m);
            }
        }

        // Deleted immediately: engagement data, then the user document itself
        // (refresh tokens live on the user doc, so all sessions end here).
        saved.deleteByUserId(userId);
        reminders.deleteByUserId(userId);
        users.delete(user);

        return new Result(myOrders.size(), myBookings.size(), myMandali.size());
    }

    private User requireUser(String userId) {
        return users.findById(userId)
            .orElseThrow(() -> new NotFoundException("user", userId));
    }

    /** Same semantics as GET /me/orders: placed while signed in + guest records on the phone. */
    private List<Order> myOrders(String userId, String phone) {
        return union(orders.findByUserIdOrderByCreatedAtDesc(userId),
            orders.findByPhoneOrderByCreatedAtDesc(phone), Order::getId);
    }

    private List<Booking> myBookings(String userId, String phone) {
        return union(bookings.findByUserIdOrderByCreatedAtDesc(userId),
            bookings.findByPhoneOrderByCreatedAtDesc(phone), Booking::getId);
    }

    private List<MandaliRequest> myMandaliRequests(String userId, String phone) {
        return union(mandaliRequests.findByUserIdOrderByCreatedAtDesc(userId),
            mandaliRequests.findByPhoneOrderByCreatedAtDesc(phone), MandaliRequest::getId);
    }

    private static <T> List<T> union(List<T> a, List<T> b, Function<T, String> id) {
        var byId = new LinkedHashMap<String, T>();
        for (T t : a) {
            byId.put(id.apply(t), t);
        }
        for (T t : b) {
            byId.putIfAbsent(id.apply(t), t);
        }
        return List.copyOf(byId.values());
    }
}
