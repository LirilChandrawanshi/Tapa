package co.thetapa.commerce;

import co.thetapa.common.NotFoundException;
import co.thetapa.common.ValidationFailedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class IssueControllerTest {

    private IssueReportRepository issues;
    private OrderRepository orders;
    private IssueController controller;

    @BeforeEach
    void setUp() {
        issues = Mockito.mock(IssueReportRepository.class);
        orders = Mockito.mock(OrderRepository.class);
        controller = new IssueController(issues, orders);
        when(issues.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Order order = new Order();
        order.setOrderNumber("TK-2026-0042");
        order.setPhone("+919812340001");
        when(orders.findByOrderNumber("TK-2026-0042")).thenReturn(Optional.of(order));
    }

    @Test
    void ownerCanReportAnIssue() {
        var res = controller.report("TK-2026-0042",
            new IssueController.IssueBody("9812340001", "ITEM_MISSING", "The diya is missing"));
        assertThat(res.data().status()).isEqualTo("NEW");
        assertThat(res.data().reason()).isEqualTo("ITEM_MISSING");
        assertThat(res.data().photoNote()).contains("WhatsApp");
        verify(issues).save(any());
    }

    @Test
    void wrongPhoneReadsAsNotFoundNeverAsForbidden() {
        assertThatThrownBy(() -> controller.report("TK-2026-0042",
            new IssueController.IssueBody("9899999999", "BOX_DAMAGED", "")))
            .isInstanceOf(NotFoundException.class);
        verify(issues, never()).save(any());
    }

    @Test
    void unknownReasonIsRejectedGently() {
        assertThatThrownBy(() -> controller.report("TK-2026-0042",
            new IssueController.IssueBody("9812340001", "NOT_A_REASON", "")))
            .isInstanceOf(ValidationFailedException.class)
            .hasMessageContaining("what went wrong");
    }
}
