package co.thetapa.feedback;

import co.thetapa.feedback.FeedbackDocuments.NotifyRequest;
import co.thetapa.identity.User;
import co.thetapa.identity.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** A signed-in visitor is never asked for a number they already verified. */
class FeedbackControllerNotifyTest {

    private NotifyRequestRepository notifyRepo;
    private UserRepository users;
    private FeedbackController controller;

    @BeforeEach
    void setUp() {
        notifyRepo = Mockito.mock(NotifyRequestRepository.class);
        users = Mockito.mock(UserRepository.class);
        controller = new FeedbackController(notifyRepo,
            Mockito.mock(CorrectionReportRepository.class),
            Mockito.mock(ApplicationRepository.class),
            users);
    }

    private NotifyRequest saved() {
        ArgumentCaptor<NotifyRequest> captor = ArgumentCaptor.forClass(NotifyRequest.class);
        verify(notifyRepo).save(captor.capture());
        return captor.getValue();
    }

    private static User withPhone(String phone) {
        User u = new User();
        u.setPhone(phone);
        return u;
    }

    @Test
    void signedInCallerNeedsNoPhoneInTheBody() {
        when(users.findById("u1")).thenReturn(Optional.of(withPhone("+919876543210")));

        controller.notifyMe("u1", new FeedbackController.NotifyBody("kits", null, null));

        assertThat(saved().phone).isEqualTo("+919876543210");
    }

    @Test
    void theSessionPhoneWinsOverAnythingPostedInTheBody() {
        when(users.findById("u1")).thenReturn(Optional.of(withPhone("+919876543210")));

        controller.notifyMe("u1", new FeedbackController.NotifyBody("kits", "9000000001", null));

        assertThat(saved().phone).isEqualTo("+919876543210");
    }

    @Test
    void signedOutCallerStillSuppliesAndNormalisesTheNumber() {
        controller.notifyMe(null, new FeedbackController.NotifyBody("kits", "98765 43210", "chhath-puja-kit"));

        NotifyRequest req = saved();
        assertThat(req.phone).isEqualTo("+919876543210");
        assertThat(req.articleSlug).isEqualTo("chhath-puja-kit");
    }

    @Test
    void signedOutCallerWithoutAPhoneIsRejected() {
        assertThatThrownBy(() ->
            controller.notifyMe(null, new FeedbackController.NotifyBody("kits", null, null)))
            .isInstanceOf(IllegalArgumentException.class);
    }
}
