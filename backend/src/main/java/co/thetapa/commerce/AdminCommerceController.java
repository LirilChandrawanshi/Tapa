package co.thetapa.commerce;

import co.thetapa.common.ApiResponse;
import co.thetapa.common.NotFoundException;
import co.thetapa.common.ValidationFailedException;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminCommerceController {

    private final ProductRepository products;
    private final OrderRepository orders;
    private final PincodeRepository pincodes;
    private final StockService stock;
    private final co.thetapa.circle.WhatsAppProvider whatsApp;

    public AdminCommerceController(ProductRepository products, OrderRepository orders,
                                   PincodeRepository pincodes, StockService stock,
                                   co.thetapa.circle.WhatsAppProvider whatsApp) {
        this.products = products;
        this.orders = orders;
        this.pincodes = pincodes;
        this.stock = stock;
        this.whatsApp = whatsApp;
    }

    /** stock at or under 10 units, for the restock run */
    @GetMapping("/reports/low-stock")
    public ApiResponse<List<Product>> lowStock() {
        return ApiResponse.ok(products.findAllByOrderByFestivalDateAsc().stream()
            .filter(p -> p.getStock() != null && p.getStock() <= 10)
            .toList());
    }

    /* products */

    @GetMapping("/products")
    public ApiResponse<List<Product>> listProducts() {
        return ApiResponse.ok(products.findAllByOrderByFestivalDateAsc());
    }

    @PutMapping("/products/{slug}")
    public ApiResponse<Product> upsertProduct(@PathVariable String slug, @RequestBody Product body) {
        if (body.getPricePaise() <= 0) {
            throw new ValidationFailedException(List.of("Price must be positive (in paise)."));
        }
        body.setSlug(slug);
        products.findBySlug(slug).ifPresent(existing -> body.setId(existing.getId()));
        return ApiResponse.ok(products.save(body));
    }

    @DeleteMapping("/products/{slug}")
    public ApiResponse<Map<String, Object>> deleteProduct(@PathVariable String slug) {
        products.findBySlug(slug).ifPresent(products::delete);
        return ApiResponse.ok(Map.of("deleted", true));
    }

    /* orders */

    private static final Map<Order.Status, List<Order.Status>> TRANSITIONS = Map.of(
        Order.Status.PENDING_PAYMENT, List.of(Order.Status.CANCELLED),
        Order.Status.CONFIRMED, List.of(Order.Status.PACKING, Order.Status.CANCELLED),
        Order.Status.PACKING, List.of(Order.Status.DISPATCHED, Order.Status.CANCELLED),
        Order.Status.DISPATCHED, List.of(Order.Status.DELIVERED, Order.Status.DELAYED),
        Order.Status.DELAYED, List.of(Order.Status.DELIVERED, Order.Status.CANCELLED),
        Order.Status.CANCELLED, List.of(Order.Status.REFUND_INITIATED),
        Order.Status.REFUND_INITIATED, List.of(Order.Status.REFUNDED)
    );

    @GetMapping("/orders")
    public ApiResponse<List<Order>> listOrders(@RequestParam(required = false) Order.Status status,
                                               @RequestParam(defaultValue = "0") int page) {
        return ApiResponse.ok(status == null
            ? orders.findAllByOrderByCreatedAtDesc(PageRequest.of(page, 50))
            : orders.findByStatusOrderByCreatedAtDesc(status));
    }

    public record StatusChange(Order.Status status, String trackingId, String courier, String note,
                               java.time.LocalDate revisedDeliveryDate) {
    }

    @PostMapping("/orders/{orderNumber}/status")
    public ApiResponse<Order> changeStatus(@PathVariable String orderNumber,
                                           @RequestBody StatusChange body) {
        Order order = orders.findByOrderNumber(orderNumber)
            .orElseThrow(() -> new NotFoundException("order", orderNumber));
        Order.Status previous = order.getStatus();
        List<Order.Status> allowed = TRANSITIONS.getOrDefault(previous, List.of());
        if (!allowed.contains(body.status())) {
            throw new ValidationFailedException(List.of(
                "Cannot move " + previous + " → " + body.status()
                    + ". Allowed: " + allowed));
        }
        order.setStatus(body.status());
        switch (body.status()) {
            case DISPATCHED -> {
                order.setDispatchedAt(Instant.now());
                order.setTrackingId(body.trackingId());
                order.setCourier(body.courier());
                order.setStatusNote("Dispatched · expected by " + order.getExpectedDelivery());
                notifyDispatch(order);
            }
            case DELIVERED -> order.setStatusNote("Delivered");
            case PACKING -> order.setStatusNote("Being packed");
            case DELAYED -> {
                order.setRevisedDeliveryDate(body.revisedDeliveryDate());
                order.setStatusNote(body.revisedDeliveryDate() == null
                    ? "Running late — new delivery date to follow"
                    : "Running late — now expected by " + body.revisedDeliveryDate());
                notifyDelay(order);
            }
            case CANCELLED -> {
                boolean stockWasReserved = previous != Order.Status.PENDING_PAYMENT;
                order.setCancelledAt(Instant.now());
                order.setRefundPaise(order.getTotalPaise());
                order.setStatusNote(previous == Order.Status.DELAYED
                    ? "Refused at the door · full refund initiated"
                    : "Cancelled · full refund initiated");
                if (stockWasReserved) {
                    stock.restoreAll(order.getItems());
                }
            }
            case REFUND_INITIATED -> order.setStatusNote("Refund on its way (3–5 working days)");
            case REFUNDED -> order.setStatusNote("Refunded in full");
            default -> {
            }
        }
        if (body.note() != null && !body.note().isBlank()) {
            order.setStatusNote(body.note());
        }
        return ApiResponse.ok(orders.save(order));
    }

    /**
     * Dispatch notification stub: goes out through the WhatsApp provider
     * (console in dev). In production this needs an approved UTILITY template —
     * order/delivery messages are always-on per the notification-prefs policy.
     */
    private void notifyDispatch(Order order) {
        try {
            whatsApp.sendText(order.getPhone().replace("+", ""),
                "Your order " + order.getOrderNumber() + " is on its way — expected by "
                    + order.getExpectedDelivery() + ". Track: https://thetapaco.com/orders/track?on="
                    + order.getOrderNumber() + (order.getTrackingId() == null ? ""
                    : " · " + order.getCourier() + " " + order.getTrackingId()));
        } catch (Exception e) {
            // notification failure never blocks the dispatch itself
            org.slf4j.LoggerFactory.getLogger(AdminCommerceController.class)
                .warn("dispatch notification failed for {}: {}", order.getOrderNumber(), e.getMessage());
        }
    }

    /** Delay notification — sent proactively, before the buyer works it out themselves. */
    private void notifyDelay(Order order) {
        try {
            whatsApp.sendText(order.getPhone().replace("+", ""),
                "Your order " + order.getOrderNumber() + " is running a little late — now expected by "
                    + (order.getRevisedDeliveryDate() == null ? "a revised date we'll confirm shortly"
                    : order.getRevisedDeliveryDate())
                    + ". You can keep the order or refuse it at the door — details here: "
                    + "https://thetapaco.com/orders/track?on=" + order.getOrderNumber());
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(AdminCommerceController.class)
                .warn("delay notification failed for {}: {}", order.getOrderNumber(), e.getMessage());
        }
    }

    /* pincodes */

    @GetMapping("/pincodes")
    public ApiResponse<List<PincodeServiceability>> listPincodes() {
        return ApiResponse.ok(pincodes.findAll());
    }

    @PutMapping("/pincodes/{pincode}")
    public ApiResponse<PincodeServiceability> upsertPincode(@PathVariable String pincode,
                                                            @RequestBody PincodeServiceability body) {
        body.setPincode(pincode);
        pincodes.findByPincode(pincode).ifPresent(existing -> body.setId(existing.getId()));
        return ApiResponse.ok(pincodes.save(body));
    }
}
