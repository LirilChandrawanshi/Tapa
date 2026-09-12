package co.thetapa.commerce;

import co.thetapa.common.ValidationFailedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.mongodb.core.MongoTemplate;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

class CheckoutServiceTest {

    private ProductRepository products;
    private OrderRepository orders;
    private PincodeRepository pincodes;
    private StockService stock;
    private CodPolicy codPolicy;
    private CheckoutService service;

    private final Order.Address address = new Order.Address(
        "Asha", "9876543210", "12 Lajpat Nagar", null, "New Delhi", "Delhi", "110024");

    @BeforeEach
    void setUp() {
        products = Mockito.mock(ProductRepository.class);
        orders = Mockito.mock(OrderRepository.class);
        pincodes = Mockito.mock(PincodeRepository.class);
        MongoTemplate mongo = Mockito.mock(MongoTemplate.class);
        when(mongo.findAndModify(any(), any(), any(), eq(Map.class), eq("counters")))
            .thenReturn(Map.of("seq", 7));
        when(orders.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(pincodes.findByPincode("110024"))
            .thenReturn(Optional.of(new PincodeServiceability("110024", true, 3, "Lajpat Nagar")));
        StockService stockService = Mockito.mock(StockService.class);
        when(stockService.reserveAll(any())).thenReturn(null);
        co.thetapa.flags.FeatureFlagService flags = Mockito.mock(co.thetapa.flags.FeatureFlagService.class);
        when(flags.all()).thenReturn(Map.of("kits_launched", true, "purohit_tab_visible", true));
        stock = stockService;
        codPolicy = new CodPolicy(false, 500_000L, 0L, false);
        service = new CheckoutService(products, orders, pincodes, new MockPaymentProvider(), mongo, stockService, flags, codPolicy);
    }

    private Product live(String slug, long pricePaise) {
        Product p = new Product();
        p.setSlug(slug);
        p.setTitle(slug);
        p.setPricePaise(pricePaise);
        p.setAvailability(Product.Availability.LIVE);
        return p;
    }

    @Test
    void deliveryIsFreeAtOrAbove999() {
        when(products.findBySlug("kit")).thenReturn(Optional.of(live("kit", 99_900)));
        var result = service.checkout(new CheckoutService.CheckoutRequest(
            List.of(new CheckoutService.CartLine("kit", 1)), address, "upi", "9876543210"), null);
        assertThat(result.order().getDeliveryPaise()).isZero();
        assertThat(result.order().getOrderNumber()).matches("TK-\\d{4}-0007");
    }

    @Test
    void deliveryCharges49Below999() {
        when(products.findBySlug("diya")).thenReturn(Optional.of(live("diya", 75_100)));
        var result = service.checkout(new CheckoutService.CheckoutRequest(
            List.of(new CheckoutService.CartLine("diya", 1)), address, "upi", "9876543210"), null);
        assertThat(result.order().getDeliveryPaise()).isEqualTo(4_900);
        assertThat(result.order().getTotalPaise()).isEqualTo(80_000);
    }

    @Test
    void prebookPastOrderByDateIsRejected() {
        Product p = live("navratri", 175_100);
        p.setAvailability(Product.Availability.PREBOOK);
        p.setOrderByDate(LocalDate.now(co.thetapa.panchang.PanchangService.IST).minusDays(1));
        when(products.findBySlug("navratri")).thenReturn(Optional.of(p));
        assertThatThrownBy(() -> service.checkout(new CheckoutService.CheckoutRequest(
            List.of(new CheckoutService.CartLine("navratri", 1)), address, "upi", "9876543210"), null))
            .isInstanceOf(ValidationFailedException.class)
            .hasMessageContaining("order-by date");
    }

    @Test
    void unserviceablePincodeIsRejected() {
        when(products.findBySlug("kit")).thenReturn(Optional.of(live("kit", 99_900)));
        when(pincodes.findByPincode("560001")).thenReturn(Optional.empty());
        var farAddress = new Order.Address("Asha", "9876543210", "1 MG Road", null,
            "Bengaluru", "Karnataka", "560001");
        assertThatThrownBy(() -> service.checkout(new CheckoutService.CheckoutRequest(
            List.of(new CheckoutService.CartLine("kit", 1)), farAddress, "upi", "9876543210"), null))
            .isInstanceOf(ValidationFailedException.class)
            .hasMessageContaining("do not deliver");
    }

    @Test
    void codIsRefusedByDefault() {
        // the default fixture policy is disabled — COD must not slip through
        when(products.findBySlug("kit")).thenReturn(Optional.of(live("kit", 99_900)));
        assertThatThrownBy(() -> service.checkout(new CheckoutService.CheckoutRequest(
            List.of(new CheckoutService.CartLine("kit", 1)), address, "cod", "9876543210"), null))
            .isInstanceOf(ValidationFailedException.class)
            .hasMessageContaining("Cash on delivery isn't available");
    }

    @Test
    void anUnknownPaymentMethodIsStillRejected() {
        when(products.findBySlug("kit")).thenReturn(Optional.of(live("kit", 99_900)));
        assertThatThrownBy(() -> service.checkout(new CheckoutService.CheckoutRequest(
            List.of(new CheckoutService.CartLine("kit", 1)), address, "bitcoin", "9876543210"), null))
            .isInstanceOf(ValidationFailedException.class)
            .hasMessageContaining("payment method");
    }

    @Test
    void soldOutIsRejected() {
        Product p = live("kit", 99_900);
        p.setAvailability(Product.Availability.SOLD_OUT);
        when(products.findBySlug("kit")).thenReturn(Optional.of(p));
        assertThatThrownBy(() -> service.checkout(new CheckoutService.CheckoutRequest(
            List.of(new CheckoutService.CartLine("kit", 1)), address, "upi", "9876543210"), null))
            .isInstanceOf(ValidationFailedException.class)
            .hasMessageContaining("sold out");
    }

    @Test
    void datedKitDeliversThreeDaysBeforeFestival() {
        Product p = live("navratri", 175_100);
        p.setAvailability(Product.Availability.PREBOOK);
        p.setOrderByDate(LocalDate.now(co.thetapa.panchang.PanchangService.IST).plusDays(10));
        p.setFestivalDate(LocalDate.of(2026, 10, 12));
        when(products.findBySlug("navratri")).thenReturn(Optional.of(p));
        var result = service.checkout(new CheckoutService.CheckoutRequest(
            List.of(new CheckoutService.CartLine("navratri", 1)), address, "upi", "9876543210"), null);
        assertThat(result.order().getExpectedDelivery()).isEqualTo(LocalDate.of(2026, 10, 9));
        assertThat(result.order().getStatus()).isEqualTo(Order.Status.PENDING_PAYMENT);
    }

    /* ── cash on delivery ──────────────────────────────────────────────── */

    /** Rebuilds the service with a COD policy of the given shape. */
    private void withCod(boolean enabled, long maxPaise, long feePaise, boolean allowPrebook) {
        codPolicy = new CodPolicy(enabled, maxPaise, feePaise, allowPrebook);
        service = new CheckoutService(products, orders, pincodes, new MockPaymentProvider(),
            Mockito.mock(MongoTemplate.class), stock, flagsStub(), codPolicy);
        MongoTemplate m = Mockito.mock(MongoTemplate.class);
        when(m.findAndModify(any(), any(), any(), eq(Map.class), eq("counters")))
            .thenReturn(Map.of("seq", 7));
        service = new CheckoutService(products, orders, pincodes, new MockPaymentProvider(),
            m, stock, flagsStub(), codPolicy);
    }

    private co.thetapa.flags.FeatureFlagService flagsStub() {
        var f = Mockito.mock(co.thetapa.flags.FeatureFlagService.class);
        when(f.all()).thenReturn(Map.of("kits_launched", true, "purohit_tab_visible", true));
        return f;
    }

    /** Marks 110024 as a COD-serviceable pincode. */
    private void codPincode() {
        PincodeServiceability p = new PincodeServiceability("110024", true, 3, "Lajpat Nagar");
        p.setCodAllowed(true);
        when(pincodes.findByPincode("110024")).thenReturn(Optional.of(p));
    }

    private CheckoutService.CheckoutRequest codRequest(String slug) {
        return new CheckoutService.CheckoutRequest(
            List.of(new CheckoutService.CartLine(slug, 1)), address, "cod", "9876543210");
    }

    @Test
    void codIsRejectedWhileTheMasterSwitchIsOff() {
        when(products.findBySlug("kit")).thenReturn(Optional.of(live("kit", 50_000)));
        codPincode();
        withCod(false, 500_000, 0, false);
        assertThatThrownBy(() -> service.checkout(codRequest("kit"), null))
            .isInstanceOf(ValidationFailedException.class)
            .hasMessageContaining("isn't available yet");
    }

    @Test
    void codIsRejectedForAPincodeThatDoesNotCarryIt() {
        when(products.findBySlug("kit")).thenReturn(Optional.of(live("kit", 50_000)));
        // default fixture pincode has codAllowed = false
        withCod(true, 500_000, 0, false);
        assertThatThrownBy(() -> service.checkout(codRequest("kit"), null))
            .isInstanceOf(ValidationFailedException.class)
            .hasMessageContaining("available for this pincode");
    }

    @Test
    void codIsRejectedAboveTheOrderCap() {
        when(products.findBySlug("kit")).thenReturn(Optional.of(live("kit", 600_000)));
        codPincode();
        withCod(true, 500_000, 0, false);
        assertThatThrownBy(() -> service.checkout(codRequest("kit"), null))
            .isInstanceOf(ValidationFailedException.class)
            .hasMessageContaining("orders up to ₹5,000");
    }

    @Test
    void codOrderIsConfirmedAtPlacementAndReservesStockThere() {
        when(products.findBySlug("kit")).thenReturn(Optional.of(live("kit", 50_000)));
        codPincode();
        withCod(true, 500_000, 0, false);

        var result = service.checkout(codRequest("kit"), null);
        Order order = result.order();

        // no gateway leg at all
        assertThat(order.getStatus()).isEqualTo(Order.Status.CONFIRMED);
        assertThat(order.getPaymentRef()).isNull();
        assertThat(order.getPaymentProvider()).isEqualTo("cod");
        assertThat(order.isCod()).isTrue();
        // stock moves at placement, not at a capture that never happens
        Mockito.verify(stock).reserveAll(order.getItems());
        assertThat(result.payment()).containsEntry("amountDuePaise", order.getTotalPaise());
    }

    @Test
    void codFeeIsAddedToTheTotal() {
        when(products.findBySlug("kit")).thenReturn(Optional.of(live("kit", 50_000)));
        codPincode();
        withCod(true, 500_000, 3_000, false);

        Order order = service.checkout(codRequest("kit"), null).order();
        assertThat(order.getCodFeePaise()).isEqualTo(3_000);
        assertThat(order.getTotalPaise())
            .isEqualTo(order.getSubtotalPaise() + order.getDeliveryPaise() + 3_000);
    }

    @Test
    void cancellingACodOrderPromisesNoRefund() {
        when(products.findBySlug("kit")).thenReturn(Optional.of(live("kit", 50_000)));
        codPincode();
        withCod(true, 500_000, 0, false);
        Order placed = service.checkout(codRequest("kit"), null).order();
        when(orders.findByOrderNumber(placed.getOrderNumber())).thenReturn(Optional.of(placed));

        Order cancelled = service.cancel(placed.getOrderNumber(), "+919876543210");

        assertThat(cancelled.getStatus()).isEqualTo(Order.Status.CANCELLED);
        assertThat(cancelled.getRefundPaise()).isNull();
        assertThat(cancelled.getStatusNote()).contains("nothing was charged");
        Mockito.verify(stock).restoreAll(placed.getItems());
    }

    @Test
    void aFailedReservationDoesNotCreateACodOrder() {
        when(products.findBySlug("kit")).thenReturn(Optional.of(live("kit", 50_000)));
        codPincode();
        withCod(true, 500_000, 0, false);
        when(stock.reserveAll(any())).thenReturn("kit");

        assertThatThrownBy(() -> service.checkout(codRequest("kit"), null))
            .isInstanceOf(ValidationFailedException.class);
        Mockito.verify(orders, Mockito.never()).save(any());
    }
}
