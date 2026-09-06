package co.thetapa.commerce;

import co.thetapa.feedback.FeedbackDocuments;
import co.thetapa.feedback.NotifyRequestRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * Restock notifications. Waitlist entries are notify_requests with
 * context "restock" and articleSlug = product slug (the PDP's sold-out
 * "Notify me" capture posts that shape). Delivery is a console stub until
 * the SMS/WhatsApp provider goes live — entries are consumed either way so
 * nobody is pinged twice.
 */
@Component
public class NotifyOnRestock {

    private static final Logger log = LoggerFactory.getLogger(NotifyOnRestock.class);

    private final NotifyRequestRepository notifyRequests;

    public NotifyOnRestock(NotifyRequestRepository notifyRequests) {
        this.notifyRequests = notifyRequests;
    }

    @Async
    public void onRestock(Product product) {
        var waiting = notifyRequests.findAll().stream()
            .filter(r -> "restock".equals(r.context) && product.getSlug().equals(r.articleSlug))
            .toList();
        for (FeedbackDocuments.NotifyRequest request : waiting) {
            log.info("[RESTOCK NOTIFY] {} → {} is back in stock (₹{})",
                request.phone, product.getTitle(), product.getPricePaise() / 100);
        }
        notifyRequests.deleteAll(waiting);
        if (!waiting.isEmpty()) {
            log.info("restock: notified {} waiting numbers for {}", waiting.size(), product.getSlug());
        }
    }
}
