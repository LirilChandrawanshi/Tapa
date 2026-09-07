package co.thetapa.circle;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Webhook routing: token guard + the two payload shapes (#33). */
class CircleControllerWebhookTest {

    private CircleService circleService;
    private CircleController controller;

    @BeforeEach
    void setUp() {
        circleService = mock(CircleService.class);
        controller = new CircleController(circleService, "dev-webhook-token");
    }

    @Test
    void missingOrWrongTokenIs401ForBothShapes() {
        var message = new CircleController.WebhookRequest(
            null, "+919876543210", "wamid.a", "JOIN", null, null);
        assertThat(controller.webhook(null, message).getStatusCode())
            .isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(controller.webhook("wrong", message).getStatusCode())
            .isEqualTo(HttpStatus.UNAUTHORIZED);

        var status = new CircleController.WebhookRequest(
            "status", null, "wamid.a", null, "blocked", "+919876543210");
        assertThat(controller.webhook("wrong", status).getStatusCode())
            .isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(circleService, never()).handleInbound(anyString(), anyString(), anyString());
        verify(circleService, never()).handleStatusCallback(anyString(), anyString(), anyString());
    }

    @Test
    void messageShapeRoutesToInboundStateMachine() {
        when(circleService.handleInbound("+919876543210", "wamid.a", "JOIN")).thenReturn("JOINED");
        var request = new CircleController.WebhookRequest(
            null, "+919876543210", "wamid.a", "JOIN", null, null);

        var response = controller.webhook("dev-webhook-token", request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().data().get("result")).isEqualTo("JOINED");
        verify(circleService, never()).handleStatusCallback(anyString(), anyString(), anyString());
    }

    @Test
    void statusShapeRoutesToStatusCallback() {
        when(circleService.handleStatusCallback("wamid.b", "blocked", "+919876543210"))
            .thenReturn("BLOCKED");
        var request = new CircleController.WebhookRequest(
            "status", null, "wamid.b", null, "blocked", "+919876543210");

        var response = controller.webhook("dev-webhook-token", request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().data().get("result")).isEqualTo("BLOCKED");
        verify(circleService, never()).handleInbound(anyString(), anyString(), anyString());
    }
}
