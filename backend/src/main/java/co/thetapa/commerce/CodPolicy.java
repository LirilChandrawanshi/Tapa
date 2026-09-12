package co.thetapa.commerce;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Cash-on-delivery eligibility, decided in one place.
 *
 * <p>COD ships switched OFF and stays off until it is enabled deliberately —
 * the PRD's position is full prepayment, so turning this on is a business
 * decision, not a deploy. Four independent gates must all pass:</p>
 *
 * <ol>
 *   <li>the master switch ({@code tapa.commerce.cod.enabled}),</li>
 *   <li>the delivery pincode's own {@code codAllowed} flag — COD rides the
 *       courier's cash-collection network, which is narrower than the
 *       delivery network, so it is granted per pincode by an admin,</li>
 *   <li>the order-value cap — unpaid orders are the ones that get refused at
 *       the door, and the loss scales with the basket,</li>
 *   <li>pre-booked festival kits are excluded: they are assembled for one
 *       fixed date, so a refusal leaves stock that cannot be resold.</li>
 * </ol>
 */
@Component
public class CodPolicy {

    /** The {@code paymentMethod} value that means cash on delivery. */
    public static final String METHOD = "cod";

    private static final String PICK_ANOTHER = " Please choose UPI, card or net banking.";

    private final boolean enabled;
    private final long maxOrderPaise;
    private final long feePaise;
    private final boolean allowPrebook;

    public CodPolicy(@Value("${tapa.commerce.cod.enabled:false}") boolean enabled,
                     @Value("${tapa.commerce.cod.max-order-paise:500000}") long maxOrderPaise,
                     @Value("${tapa.commerce.cod.fee-paise:0}") long feePaise,
                     @Value("${tapa.commerce.cod.allow-prebook:false}") boolean allowPrebook) {
        this.enabled = enabled;
        this.maxOrderPaise = maxOrderPaise;
        this.feePaise = feePaise;
        this.allowPrebook = allowPrebook;
    }

    public boolean isEnabled() {
        return enabled;
    }

    /** Handling fee added to a COD order's total. Zero unless configured. */
    public long feePaise() {
        return feePaise;
    }

    public long maxOrderPaise() {
        return maxOrderPaise;
    }

    public boolean allowsPrebook() {
        return allowPrebook;
    }

    /** True when the method string on a request/order means cash on delivery. */
    public static boolean isCod(String paymentMethod) {
        return METHOD.equals(paymentMethod);
    }

    /**
     * @param pin the delivery pincode's record, or null when unknown
     * @return null when this order may go COD, otherwise the buyer-facing
     *         reason it may not
     */
    public String rejectionReason(long subtotalPaise, boolean prebook, PincodeServiceability pin) {
        if (!enabled) {
            return "Cash on delivery isn't available yet." + PICK_ANOTHER;
        }
        if (pin == null || !pin.isCodAllowed()) {
            return "Cash on delivery isn't available for this pincode yet." + PICK_ANOTHER;
        }
        if (prebook && !allowPrebook) {
            return "Pre-booked kits are prepared for a fixed date, so they are paid for up front."
                + PICK_ANOTHER;
        }
        if (subtotalPaise > maxOrderPaise) {
            return "Cash on delivery is available on orders up to " + rupees(maxOrderPaise) + "."
                + PICK_ANOTHER;
        }
        return null;
    }

    /** Paise → "₹5,000" (en-IN grouping), for buyer-facing copy. */
    static String rupees(long paise) {
        long whole = paise / 100;
        String digits = Long.toString(Math.abs(whole));
        StringBuilder out = new StringBuilder();
        // en-IN grouping: last three digits, then pairs.
        int head = Math.max(0, digits.length() - 3);
        String tail = digits.substring(head);
        String rest = digits.substring(0, head);
        for (int i = 0; i < rest.length(); i++) {
            if (i > 0 && (rest.length() - i) % 2 == 0) {
                out.append(',');
            }
            out.append(rest.charAt(i));
        }
        if (!rest.isEmpty()) {
            out.append(',');
        }
        out.append(tail);
        return "₹" + (whole < 0 ? "-" : "") + out;
    }
}
