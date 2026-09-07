package co.thetapa.commerce;

import co.thetapa.common.ApiResponse;
import co.thetapa.common.NotFoundException;
import co.thetapa.identity.otp.OtpService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class OrderController {

    private final CheckoutService checkout;
    private final OrderRepository orders;
    private final co.thetapa.identity.UserRepository users;
    private final OtpService otpService;

    public OrderController(CheckoutService checkout, OrderRepository orders,
                           co.thetapa.identity.UserRepository users, OtpService otpService) {
        this.checkout = checkout;
        this.orders = orders;
        this.users = users;
        this.otpService = otpService;
    }

    /** Guest-or-account checkout: userId attaches when a session cookie is present. */
    @PostMapping("/checkout")
    public ApiResponse<Map<String, Object>> checkout(@RequestBody CheckoutService.CheckoutRequest body,
                                                     @AuthenticationPrincipal String userId) {
        var result = checkout.checkout(body, userId);
        return ApiResponse.ok(Map.of(
            "orderNumber", result.order().getOrderNumber(),
            "totalPaise", result.order().getTotalPaise(),
            "payment", result.payment()
        ));
    }

    /** Dev/mock capture endpoint; a Razorpay webhook replaces this in production. */
    @PostMapping("/payments/mock/confirm")
    public ApiResponse<OrderView> mockConfirm(@RequestBody Map<String, Object> payload) {
        var order = checkout.confirmPayment((String) payload.get("providerRef"), payload);
        return ApiResponse.ok(OrderView.of(order));
    }

    /** Track without an account: order number + the phone it was placed with. */
    @GetMapping("/orders/{orderNumber}")
    public ApiResponse<OrderView> track(@PathVariable String orderNumber, @RequestParam String phone) {
        Order order = orders.findByOrderNumber(orderNumber)
            .orElseThrow(() -> new NotFoundException("order", orderNumber));
        if (!order.getPhone().equals(OtpService.normalize(phone))) {
            throw new NotFoundException("order", orderNumber);
        }
        return ApiResponse.ok(OrderView.of(order));
    }

    @PostMapping("/orders/{orderNumber}/cancel")
    public ApiResponse<OrderView> cancel(@PathVariable String orderNumber,
                                         @RequestBody Map<String, String> body) {
        String phone = OtpService.normalize(body.get("phone"));
        return ApiResponse.ok(OrderView.of(checkout.cancel(orderNumber, phone, body.get("reason"))));
    }

    /** Account order history (authed). */
    @GetMapping("/me/orders")
    public ApiResponse<List<OrderView>> myOrders(@AuthenticationPrincipal String userId) {
        var user = users.findById(userId).orElseThrow(() -> new NotFoundException("user", userId));
        // orders placed while signed in + guest orders on the same phone
        var byUser = orders.findByUserIdOrderByCreatedAtDesc(userId);
        var byPhone = orders.findByPhoneOrderByCreatedAtDesc(user.getPhone());
        return ApiResponse.ok(byPhone.stream()
            .filter(o -> byUser.stream().noneMatch(u -> u.getId().equals(o.getId())))
            .collect(java.util.stream.Collectors.toCollection(() -> new java.util.ArrayList<>(byUser)))
            .stream().map(OrderView::of).toList());
    }

    /**
     * Claim a guest order into the signed-in account: possible because phone is
     * the identity key on both sides. The WhatsApp tracking link lands here.
     */
    @PostMapping("/me/orders/claim")
    public ApiResponse<Map<String, Object>> claim(@AuthenticationPrincipal String userId) {
        var user = users.findById(userId).orElseThrow(() -> new NotFoundException("user", userId));
        var guestOrders = orders.findByPhoneOrderByCreatedAtDesc(user.getPhone()).stream()
            .filter(o -> o.getUserId() == null)
            .peek(o -> o.setUserId(userId))
            .toList();
        orders.saveAll(guestOrders);
        return ApiResponse.ok(Map.of("claimed", guestOrders.size()));
    }

    /** Buyer-facing order shape — never leaks internal ids or payment refs. */
    public record OrderView(String orderNumber, String status, String statusNote,
                            List<Order.Line> items, long subtotalPaise, long deliveryPaise,
                            long totalPaise, Order.Address address, String expectedDelivery,
                            String festivalDate, String cancellableUntil, String trackingId,
                            String courier, String createdAt, String cancelledAt,
                            String paymentMethod, Long refundPaise) {

        static OrderView of(Order o) {
            return new OrderView(o.getOrderNumber(), o.getStatus().name(), o.getStatusNote(),
                o.getItems(), o.getSubtotalPaise(), o.getDeliveryPaise(), o.getTotalPaise(),
                o.getAddress(),
                o.getExpectedDelivery() == null ? null : o.getExpectedDelivery().toString(),
                o.getFestivalDate() == null ? null : o.getFestivalDate().toString(),
                o.getCancellableUntil() == null ? null : o.getCancellableUntil().toString(),
                o.getTrackingId(), o.getCourier(),
                o.getCreatedAt() == null ? null : o.getCreatedAt().toString(),
                o.getCancelledAt() == null ? null : o.getCancelledAt().toString(),
                o.getPaymentMethod(), o.getRefundPaise());
        }
    }
}
