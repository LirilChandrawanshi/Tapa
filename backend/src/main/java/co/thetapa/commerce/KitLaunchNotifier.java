package co.thetapa.commerce;

import co.thetapa.circle.WhatsAppProvider;
import co.thetapa.feedback.FeedbackDocuments;
import co.thetapa.feedback.NotifyRequestRepository;
import co.thetapa.flags.FeatureFlagService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Kit-launch waitlist fan-out (G72). The pre-launch shelf captures
 * notify_requests with context "kits"; the moment the {@code kits_launched}
 * flag flips ON, every waiting number gets a one-off WhatsApp text and the
 * consumed requests are deleted so nobody is pinged twice — including on a
 * later flag flip-off/flip-on cycle.
 */
@Component
public class KitLaunchNotifier {

    static final String CONTEXT_KITS = "kits";
    static final String MESSAGE =
        "Ritual Pujans are open — pre-book at thetapaco.com/ritual-pujans";

    private static final Logger log = LoggerFactory.getLogger(KitLaunchNotifier.class);

    private final NotifyRequestRepository notifyRequests;
    private final WhatsAppProvider whatsApp;

    public KitLaunchNotifier(NotifyRequestRepository notifyRequests, WhatsAppProvider whatsApp) {
        this.notifyRequests = notifyRequests;
        this.whatsApp = whatsApp;
    }

    @Async
    @EventListener
    public void onFlagChanged(FeatureFlagService.FlagChangedEvent event) {
        if (!FeatureFlagService.KITS_LAUNCHED.equals(event.key()) || !event.value()) {
            return;
        }
        List<FeedbackDocuments.NotifyRequest> waiting = notifyRequests.findAll().stream()
            .filter(r -> CONTEXT_KITS.equals(r.context))
            .toList();
        for (FeedbackDocuments.NotifyRequest request : waiting) {
            try {
                whatsApp.sendText(request.phone, MESSAGE);
            } catch (RuntimeException e) {
                // one bad number must not strand the rest of the waitlist
                log.warn("kit launch: send failed for {}: {}", request.phone, e.getMessage());
            }
        }
        notifyRequests.deleteAll(waiting);
        log.info("kit launch: notified {} waitlisted numbers", waiting.size());
    }
}
