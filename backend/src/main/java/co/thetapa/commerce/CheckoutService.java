package co.thetapa.commerce;

import co.thetapa.common.NotFoundException;
import co.thetapa.common.ValidationFailedException;
import co.thetapa.identity.otp.OtpService;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Year;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class CheckoutService {

    /** free delivery at/above ₹999, else ₹49 — admin-configurable via commerce config */
    static final long DEFAULT_FREE_ABOVE_PAISE = 99_900;
    static final long DEFAULT_DELIVERY_PAISE = 4_900;

    private final ProductRepository products;
    private final OrderRepository orders;
    private final PincodeRepository pincodes;
    private final PaymentProvider paymentProvider;
    private final MongoTemplate mongo;
    private final StockService stock;
    private final co.thetapa.flags.FeatureFlagService flags;

    public CheckoutService(ProductRepository products, OrderRepository orders,
                           PincodeRepository pincodes, PaymentProvider paymentProvider,
                           MongoTemplate mongo, StockService stock,
                           co.thetapa.flags.FeatureFlagService flags) {
        this.products = products;
        this.orders = orders;
        this.pincodes = pincodes;
        this.paymentProvider = paymentProvider;
        this.mongo = mongo;
        this.stock = stock;
        this.flags = flags;
    }

    public record CartLine(String productSlug, int qty) {
    }

    public record CheckoutRequest(List<CartLine> items, Order.Address address,
                                  String paymentMethod, String phone) {
    }

    public record CheckoutResult(Order order, Map<String, Object> payment) {
    }

    public CheckoutResult checkout(CheckoutRequest request, String userId) {
        // the phase gate is authoritative here, not just in the UI — no orders
        // exist until the marketing team flips kits_launched
        if (!Boolean.TRUE.equals(flags.all().get(co.thetapa.flags.FeatureFlagService.KITS_LAUNCHED))) {
            throw new ValidationFailedException(List.of(
                "Ritual Pujans has not opened for orders yet. Join the notify list and we'll tell you the moment pre-booking opens."));
        }
        List<String> errors = new ArrayList<>();

        if (request.items() == null || request.items().isEmpty()) {
            throw new ValidationFailedException(List.of("Your bag is empty."));
        }
        if (!List.of("upi", "card", "netbanking").contains(request.paymentMethod())) {
            errors.add("Choose a payment method."); // COD deliberately absent (PRD)
        }
        Order.Address address = request.address();
        if (address == null || isBlank(address.name()) || isBlank(address.line1())
            || isBlank(address.city()) || isBlank(address.state()) || isBlank(address.pincode())) {
            errors.add("Complete the delivery address.");
        }

        String phone = OtpService.normalize(
            request.phone() != null ? request.phone() : address == null ? "" : address.phone());

        // pincode gate
        Integer etaDays = null;
        if (address != null && address.pincode() != null) {
            var pin = pincodes.findByPincode(address.pincode());
            if (pin.isEmpty() || !pin.get().isServiceable()) {
                errors.add("We do not deliver to " + address.pincode() + " yet.");
            } else {
                etaDays = pin.get().getEtaDays();
            }
        }

        // server-side price + availability validation — the client's cart is a suggestion
        LocalDate today = LocalDate.now(co.thetapa.panchang.PanchangService.IST);
        List<Order.Line> lines = new ArrayList<>();
        long subtotal = 0;
        int minCancellationHours = Integer.MAX_VALUE;
        for (CartLine cartLine : request.items()) {
            Product product = products.findBySlug(cartLine.productSlug())
                .orElseThrow(() -> new NotFoundException("product", cartLine.productSlug()));
            if (cartLine.qty() < 1 || cartLine.qty() > 10) {
                errors.add(product.getTitle() + ": quantity must be between 1 and 10.");
                continue;
            }
            switch (product.getAvailability()) {
                case COMING_SOON -> errors.add(product.getTitle() + " has not opened for orders yet.");
                case SOLD_OUT -> errors.add(product.getTitle() + " is sold out.");
                case PREBOOK -> {
                    if (product.getOrderByDate() != null && today.isAfter(product.getOrderByDate())) {
                        errors.add(product.getTitle() + ": the order-by date ("
                            + product.getOrderByDate() + ") has passed.");
                    }
                }
                case LIVE -> {
                    if (product.getStock() != null && product.getStock() < cartLine.qty()) {
                        errors.add(product.getTitle() + ": only " + product.getStock() + " left.");
                    }
                }
            }
            lines.add(new Order.Line(product.getSlug(), product.getTitle(), cartLine.qty(),
                product.getPricePaise(), product.getOrderByDate(), product.getFestivalDate()));
            subtotal += product.getPricePaise() * cartLine.qty();
            minCancellationHours = Math.min(minCancellationHours, product.getCancellationHours());
        }

        if (!errors.isEmpty()) {
            throw new ValidationFailedException(errors);
        }

        long delivery = subtotal >= DEFAULT_FREE_ABOVE_PAISE ? 0 : DEFAULT_DELIVERY_PAISE;

        Order order = new Order();
        order.setOrderNumber(nextOrderNumber());
        order.setPhone(phone);
        order.setUserId(userId);
        order.setItems(lines);
        order.setSubtotalPaise(subtotal);
        order.setDeliveryPaise(delivery);
        order.setTotalPaise(subtotal + delivery);
        order.setAddress(address);
        order.setPaymentMethod(request.paymentMethod());
        order.setPaymentProvider(paymentProvider.name());
        order.setStatus(Order.Status.PENDING_PAYMENT);
        order.setStatusNote("Waiting for payment.");
        order.setCancellableUntil(Instant.now().plus(Duration.ofHours(minCancellationHours)));

        // dated kits deliver 3 days before the occasion; live kits by pincode ETA
        LocalDate festival = lines.stream().map(Order.Line::festivalDate)
            .filter(Objects::nonNull).min(Comparator.naturalOrder()).orElse(null);
        order.setFestivalDate(festival);
        order.setExpectedDelivery(festival != null
            ? festival.minusDays(3)
            : today.plusDays(etaDays == null ? 3 : etaDays));

        var intent = paymentProvider.createIntent(order.getOrderNumber(), order.getTotalPaise(),
            request.paymentMethod());
        order.setPaymentRef(intent.providerRef());
        orders.save(order);

        return new CheckoutResult(order, intent.clientPayload());
    }

    /** Gateway capture callback — flips PENDING_PAYMENT → CONFIRMED exactly once. */
    public Order confirmPayment(String providerRef, Map<String, Object> payload) {
        Order order = mongo.findOne(Query.query(Criteria.where("paymentRef").is(providerRef)), Order.class);
        if (order == null) {
            throw new NotFoundException("order for payment", providerRef);
        }
        if (order.getStatus() != Order.Status.PENDING_PAYMENT) {
            return order; // idempotent
        }
        if (!paymentProvider.verifyCapture(providerRef, payload)) {
            throw new ValidationFailedException(List.of(
                "Your payment couldn't be verified. You haven't been charged twice — contact help@thetapaco.com."));
        }
        // atomic stock reservation — the only moment inventory moves
        String failedSlug = stock.reserveAll(order.getItems());
        if (failedSlug != null) {
            order.setStatus(Order.Status.CANCELLED);
            order.setCancelledAt(Instant.now());
            order.setRefundPaise(order.getTotalPaise());
            order.setStatusNote("Sold out moments before payment — full refund initiated. Nothing more to do.");
            return orders.save(order);
        }
        order.setStatus(Order.Status.CONFIRMED);
        boolean prebook = order.getFestivalDate() != null;
        order.setStatusNote(prebook
            ? "Pre-booked · for " + order.getFestivalDate()
            : "Confirmed · packing soon");
        return orders.save(order);
    }

    public Order cancel(String orderNumber, String requesterPhone) {
        Order order = orders.findByOrderNumber(orderNumber)
            .orElseThrow(() -> new NotFoundException("order", orderNumber));
        if (!order.getPhone().equals(requesterPhone)) {
            throw new NotFoundException("order", orderNumber); // no ownership leak
        }
        if (order.getStatus() == Order.Status.DISPATCHED || order.getStatus() == Order.Status.DELIVERED) {
            throw new ValidationFailedException(List.of("This order has already been dispatched."));
        }
        if (order.getStatus() == Order.Status.CANCELLED) {
            return order;
        }
        if (order.getCancellableUntil() != null && Instant.now().isAfter(order.getCancellableUntil())) {
            throw new ValidationFailedException(List.of(
                "The free-cancellation window has closed. Write to help@thetapaco.com and we'll do our best."));
        }
        boolean stockWasReserved = order.getStatus() == Order.Status.CONFIRMED
            || order.getStatus() == Order.Status.PACKING;
        order.setStatus(Order.Status.CANCELLED);
        order.setCancelledAt(Instant.now());
        order.setRefundPaise(order.getTotalPaise());
        order.setStatusNote("Cancelled · full refund initiated");
        Order saved = orders.save(order);
        if (stockWasReserved) {
            stock.restoreAll(saved.getItems());
        }
        return saved;
    }

    /** TK-YYYY-NNNN via an atomic counter document. */
    String nextOrderNumber() {
        int year = Year.now(co.thetapa.panchang.PanchangService.IST).getValue();
        var query = Query.query(Criteria.where("_id").is("orders-" + year));
        var update = new Update().inc("seq", 1);
        var options = FindAndModifyOptions.options().returnNew(true).upsert(true);
        Map<?, ?> counter = mongo.findAndModify(query, update, options, Map.class, "counters");
        long seq = ((Number) counter.get("seq")).longValue();
        return "TK-%d-%04d".formatted(year, seq);
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
