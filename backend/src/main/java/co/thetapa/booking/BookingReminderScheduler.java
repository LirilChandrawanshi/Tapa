package co.thetapa.booking;

import co.thetapa.circle.WhatsAppProvider;
import co.thetapa.panchang.PanchangService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

/**
 * The spec's third what-happens-next line: a reminder the morning of the puja.
 * 7am IST, only CONFIRMED bookings for today. Goes through the WhatsApp
 * provider (console in dev; needs an approved UTILITY template in production —
 * order/booking messages are always-on by policy).
 */
@Component
public class BookingReminderScheduler {

    private static final Logger log = LoggerFactory.getLogger(BookingReminderScheduler.class);

    private final BookingRepository bookings;
    private final WhatsAppProvider whatsApp;

    public BookingReminderScheduler(BookingRepository bookings, WhatsAppProvider whatsApp) {
        this.bookings = bookings;
        this.whatsApp = whatsApp;
    }

    @Scheduled(cron = "0 0 7 * * *", zone = "Asia/Kolkata")
    public void morningOfReminders() {
        LocalDate today = LocalDate.now(PanchangService.IST);
        List<Booking> todays = bookings.findByStatusOrderByDateAsc(Booking.Status.CONFIRMED).stream()
            .filter(b -> today.equals(b.getDate()))
            .toList();
        for (Booking booking : todays) {
            try {
                whatsApp.sendText(booking.getPhone().replace("+", ""),
                    "Namaskar 🙏 " + booking.getPujaName() + " (" + booking.getVariantName()
                        + ") is today, " + booking.getSlotWindow() + ". "
                        + booking.getPurohitName() + " will arrive at the start of the window."
                        + (booking.isKitIncluded() ? " Your samagri kit should already be with you." : ""));
            } catch (Exception e) {
                log.warn("morning reminder failed for {}: {}", booking.getBookingNumber(), e.getMessage());
            }
        }
        if (!todays.isEmpty()) {
            log.info("sent {} morning-of booking reminders", todays.size());
        }
    }
}
