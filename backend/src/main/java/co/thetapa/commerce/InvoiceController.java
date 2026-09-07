package co.thetapa.commerce;

import co.thetapa.common.NotFoundException;
import co.thetapa.identity.otp.OtpService;
import co.thetapa.ritualcard.RitualCardService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Minimal tax invoice download (#165). Ownership is the tracking rule (order
 * number + phone). Deliberately basic: order facts, GSTIN placeholder, rendered
 * through the existing Playwright HTML→PDF pipeline (RitualCardService.renderPdf).
 */
@RestController
@RequestMapping("/api/v1")
public class InvoiceController {

    private final OrderRepository orders;
    private final RitualCardService ritualCards;

    public InvoiceController(OrderRepository orders, RitualCardService ritualCards) {
        this.orders = orders;
        this.ritualCards = ritualCards;
    }

    @GetMapping("/orders/{orderNumber}/invoice")
    public ResponseEntity<byte[]> invoice(@PathVariable String orderNumber,
                                          @RequestParam String phone) {
        Order order = orders.findByOrderNumber(orderNumber)
            .orElseThrow(() -> new NotFoundException("order", orderNumber));
        if (!order.getPhone().equals(OtpService.normalize(phone))) {
            throw new NotFoundException("order", orderNumber);
        }
        byte[] pdf = ritualCards.renderPdf(invoiceHtml(order));
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"tapa-invoice-" + order.getOrderNumber() + ".pdf\"")
            .body(pdf);
    }

    /* ---- rendering ---- */

    private static final DateTimeFormatter DAY =
        DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.ENGLISH)
            .withZone(ZoneId.of("Asia/Kolkata"));

    /** integer paise → "₹1,751" / "₹1,751.50" with en-IN (lakh/crore) grouping */
    static String rupees(long paise) {
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.ENGLISH);
        String pattern = paise % 100 == 0 ? "##,##,##0" : "##,##,##0.00";
        return "₹" + new DecimalFormat(pattern, symbols).format(paise / 100.0);
    }

    private static String esc(String s) {
        return s == null ? "" : s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }

    private String invoiceHtml(Order order) {
        StringBuilder rows = new StringBuilder();
        for (Order.Line line : order.getItems()) {
            rows.append("<tr><td>").append(esc(line.title()))
                .append("</td><td class=\"n\">").append(line.qty())
                .append("</td><td class=\"n\">").append(rupees(line.unitPricePaise()))
                .append("</td><td class=\"n\">").append(rupees(line.unitPricePaise() * line.qty()))
                .append("</td></tr>");
        }
        Order.Address a = order.getAddress();
        String placed = order.getCreatedAt() == null ? "" : DAY.format(order.getCreatedAt());
        return """
            <!doctype html><html><head><meta charset="utf-8"><style>
              body { font-family: Georgia, 'Times New Roman', serif; color: #1f1a17; margin: 28px; font-size: 13px; }
              h1 { font-size: 16px; margin: 0 0 2px; letter-spacing: 0.4px; }
              .muted { color: #6f6660; font-size: 11.5px; }
              .head { border-bottom: 2px solid #1f1a17; padding-bottom: 10px; margin-bottom: 14px; }
              table { width: 100%%; border-collapse: collapse; margin-top: 12px; }
              th { text-align: left; font-size: 10.5px; letter-spacing: 1px; text-transform: uppercase;
                   color: #6f6660; border-bottom: 1px solid #d9d2cb; padding: 6px 4px; }
              td { padding: 7px 4px; border-bottom: 1px solid #efe9e3; }
              td.n, th.n { text-align: right; }
              .totals td { border-bottom: none; padding: 3px 4px; }
              .totals .grand td { border-top: 2px solid #1f1a17; font-weight: bold; padding-top: 7px; }
              .foot { margin-top: 22px; font-size: 11px; color: #6f6660; border-top: 1px solid #d9d2cb; padding-top: 10px; }
            </style></head><body>
            <div class="head">
              <h1>Tapa · thetapaco.com</h1>
              <div class="muted">Tax invoice · %s</div>
              <div class="muted">GSTIN: [to be assigned] · Prices inclusive of all taxes</div>
            </div>
            <div><b>Order:</b> %s &nbsp;·&nbsp; <b>Placed:</b> %s &nbsp;·&nbsp; <b>Paid via:</b> %s (prepaid in full)</div>
            <div style="margin-top:6px"><b>Billed &amp; delivered to:</b> %s · %s<br>%s%s, %s, %s — %s</div>
            <table>
              <tr><th>Item</th><th class="n">Qty</th><th class="n">Unit price</th><th class="n">Amount</th></tr>
              %s
            </table>
            <table class="totals">
              <tr><td></td><td class="n" style="width:110px">Subtotal</td><td class="n" style="width:110px">%s</td></tr>
              <tr><td></td><td class="n">Delivery</td><td class="n">%s</td></tr>
              <tr class="grand"><td></td><td class="n">Total paid</td><td class="n">%s</td></tr>
            </table>
            <div class="foot">
              All amounts are inclusive of GST. This is a computer-generated invoice — no signature required.<br>
              Questions? help@thetapaco.com — reply within one working day.
            </div>
            </body></html>
            """.formatted(
            esc(order.getOrderNumber()), esc(order.getOrderNumber()), esc(placed),
            esc(order.getPaymentMethod() == null ? "online payment" : label(order.getPaymentMethod())),
            esc(a.name()), esc(a.phone()), esc(a.line1()),
            a.line2() == null || a.line2().isBlank() ? "" : ", " + esc(a.line2()),
            esc(a.city()), esc(a.state()), esc(a.pincode()),
            rows.toString(),
            rupees(order.getSubtotalPaise()),
            order.getDeliveryPaise() == 0 ? "Free" : rupees(order.getDeliveryPaise()),
            rupees(order.getTotalPaise()));
    }

    private static String label(String method) {
        return switch (method) {
            case "upi" -> "UPI";
            case "card" -> "Card";
            case "netbanking" -> "Net banking";
            default -> method;
        };
    }
}
