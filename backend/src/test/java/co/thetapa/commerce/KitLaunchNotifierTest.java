package co.thetapa.commerce;

import co.thetapa.circle.WhatsAppProvider;
import co.thetapa.feedback.FeedbackDocuments;
import co.thetapa.feedback.NotifyRequestRepository;
import co.thetapa.flags.FeatureFlagService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * G72: flipping kits_launched ON drains the "kits" waitlist over WhatsApp
 * exactly once; every other flag change (and the OFF direction) is inert.
 */
class KitLaunchNotifierTest {

    private NotifyRequestRepository notifyRequests;
    private WhatsAppProvider whatsApp;
    private KitLaunchNotifier notifier;

    @BeforeEach
    void setUp() {
        notifyRequests = mock(NotifyRequestRepository.class);
        whatsApp = mock(WhatsAppProvider.class);
        notifier = new KitLaunchNotifier(notifyRequests, whatsApp);
    }

    private static FeedbackDocuments.NotifyRequest request(String context, String phone) {
        FeedbackDocuments.NotifyRequest r = new FeedbackDocuments.NotifyRequest();
        r.context = context;
        r.phone = phone;
        return r;
    }

    @Test
    void kitsLaunchDrainsTheKitsWaitlistAndConsumesIt() {
        var kits1 = request("kits", "+919876543210");
        var kits2 = request("kits", "+919812345678");
        var purohit = request("purohit", "+919899999999");
        when(notifyRequests.findAll()).thenReturn(List.of(kits1, purohit, kits2));

        notifier.onFlagChanged(new FeatureFlagService.FlagChangedEvent(
            FeatureFlagService.KITS_LAUNCHED, true));

        verify(whatsApp).sendText("+919876543210", KitLaunchNotifier.MESSAGE);
        verify(whatsApp).sendText("+919812345678", KitLaunchNotifier.MESSAGE);
        verify(whatsApp, never()).sendText(eq("+919899999999"), anyString());

        verify(notifyRequests).deleteAll(List.of(kits1, kits2));
    }

    @Test
    void flippingTheFlagOffDoesNothing() {
        notifier.onFlagChanged(new FeatureFlagService.FlagChangedEvent(
            FeatureFlagService.KITS_LAUNCHED, false));
        verifyNoInteractions(notifyRequests, whatsApp);
    }

    @Test
    void otherFlagChangesDoNothing() {
        notifier.onFlagChanged(new FeatureFlagService.FlagChangedEvent(
            FeatureFlagService.PUROHIT_TAB_VISIBLE, true));
        verifyNoInteractions(notifyRequests, whatsApp);
    }

    @Test
    void oneFailedSendDoesNotStrandTheRestOfTheWaitlist() {
        var bad = request("kits", "+910000000000");
        var good = request("kits", "+919876543210");
        when(notifyRequests.findAll()).thenReturn(List.of(bad, good));
        when(whatsApp.sendText(eq("+910000000000"), anyString()))
            .thenThrow(new WhatsAppProvider.WhatsAppSendException("provider down"));

        notifier.onFlagChanged(new FeatureFlagService.FlagChangedEvent(
            FeatureFlagService.KITS_LAUNCHED, true));

        verify(whatsApp).sendText("+919876543210", KitLaunchNotifier.MESSAGE);
        verify(notifyRequests).deleteAll(List.of(bad, good));
    }
}
