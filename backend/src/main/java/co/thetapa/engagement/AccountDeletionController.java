package co.thetapa.engagement;

import co.thetapa.common.ApiResponse;
import co.thetapa.identity.AuthCookies;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * DPDP right-to-erasure endpoints (#182). The heavy lifting and the retention
 * rationale live in {@link AccountDeletionService}.
 */
@RestController
@RequestMapping("/api/v1/me")
public class AccountDeletionController {

    private final AccountDeletionService deletion;

    public AccountDeletionController(AccountDeletionService deletion) {
        this.deletion = deletion;
    }

    /** Itemised counts for the confirmation screen. Read-only. */
    @GetMapping("/deletion-preview")
    public ApiResponse<Map<String, Object>> preview(@AuthenticationPrincipal String userId) {
        var p = deletion.preview(userId);
        return ApiResponse.ok(Map.of(
            "savedRituals", p.savedRituals(),
            "reminders", p.reminders(),
            "orders", p.orders(),
            "bookings", p.bookings(),
            "mandaliRequests", p.mandaliRequests(),
            "inFlightOrders", p.inFlightOrders()
        ));
    }

    /**
     * Deletes the account immediately. Clears the auth cookies on the same
     * response — the session is already dead server-side (the refresh tokens
     * were on the deleted user document).
     */
    @DeleteMapping
    public ApiResponse<Map<String, Object>> delete(@AuthenticationPrincipal String userId,
                                                   HttpServletResponse response) {
        var result = deletion.delete(userId);
        AuthCookies.clear(response);
        return ApiResponse.ok(Map.of(
            "deleted", true,
            "retained", Map.of(
                "orders", result.retainedOrders(),
                "bookings", result.retainedBookings()
            )
        ));
    }
}
