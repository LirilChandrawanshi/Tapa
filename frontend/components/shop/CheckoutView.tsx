"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  checkPincode,
  clearCart,
  confirmMockPayment,
  deliveryPaiseFor,
  fetchProducts,
  formatDateMedium,
  formatPaise,
  readCart,
  shopTrack,
  submitCheckout,
  type CartLine,
  type PaymentMethod,
  type PincodeInfo,
  type Product,
} from "@/lib/shop";

interface AddressForm {
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
}

const EMPTY_ADDRESS: AddressForm = {
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

/** Exact field labels are locked copy — do not reword. */
const FIELDS: {
  key: keyof AddressForm;
  label: string;
  inputMode?: "numeric" | "text";
  maxLength?: number;
}[] = [
  { key: "name", label: "Your name" },
  { key: "phone", label: "Mobile number", inputMode: "numeric", maxLength: 10 },
  { key: "line1", label: "House, Flat, Building" },
  { key: "line2", label: "Area, Colony, Street" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "pincode", label: "Pincode", inputMode: "numeric", maxLength: 6 },
];

const PAYMENT_METHODS: { value: PaymentMethod; title: string; sub: string }[] =
  [
    { value: "upi", title: "UPI", sub: "GPay, PhonePe, Paytm, any UPI app" },
    { value: "card", title: "Credit or debit card", sub: "Visa, Mastercard, RuPay, Amex" },
    { value: "netbanking", title: "Net banking", sub: "All major banks" },
  ];
// No cash on delivery, on anything — dated and all-year alike.

type Phase =
  | { kind: "form" }
  | { kind: "paying" }
  | { kind: "invalid"; issues: string[] }
  | { kind: "payment_failed"; providerRef: string; orderNumber: string };

function etaIso(etaDays: number): string {
  return new Date(Date.now() + etaDays * 86_400_000).toISOString();
}

/** One-page checkout: Contact & Delivery address · Payment method · Summary. */
export function CheckoutView() {
  const router = useRouter();
  const [lines, setLines] = useState<CartLine[] | null>(null);
  const [products, setProducts] = useState<Map<string, Product> | null>(null);
  const [address, setAddress] = useState<AddressForm>(EMPTY_ADDRESS);
  const [method, setMethod] = useState<PaymentMethod>("upi");
  const [pin, setPin] = useState<
    { kind: "idle" } | { kind: "checking" } | { kind: "result"; info: PincodeInfo }
  >({ kind: "idle" });
  const [phase, setPhase] = useState<Phase>({ kind: "form" });

  useEffect(() => {
    const cart = readCart();
    setLines(cart);
    shopTrack("checkout_started", {
      lines: cart.length,
      units: cart.reduce((n, l) => n + l.qty, 0),
    });
    void fetchProducts().then((all) =>
      setProducts(new Map(all.map((p) => [p.slug, p]))),
    );
  }, []);

  // Inline pincode validation — the same checker the PDP uses.
  useEffect(() => {
    if (!/^\d{6}$/.test(address.pincode)) {
      setPin({ kind: "idle" });
      return;
    }
    let stale = false;
    setPin({ kind: "checking" });
    void checkPincode(address.pincode).then((r) => {
      if (stale) return;
      setPin(r.ok ? { kind: "result", info: r.data } : { kind: "idle" });
    });
    return () => {
      stale = true;
    };
  }, [address.pincode]);

  const resolved = useMemo(() => {
    if (!lines || !products) return null;
    return lines
      .map((l) => {
        const product = products.get(l.productSlug);
        return product ? { ...l, product } : null;
      })
      .filter((l): l is CartLine & { product: Product } => l !== null);
  }, [lines, products]);

  if (lines !== null && lines.length === 0 && phase.kind === "form") {
    return (
      <div className="mx-auto max-w-[420px] py-14 text-center">
        <h2 className="mb-2 text-xl font-bold text-ink">Your bag is empty</h2>
        <p className="mb-5 text-[13.5px] text-sub">
          Add a pujan to the bag before checking out.
        </p>
        <Link
          href="/ritual-pujans"
          className="inline-block rounded-[10px] bg-cta px-6 py-[11px] text-[13.5px] font-bold text-white"
        >
          Browse Ritual Pujans ›
        </Link>
      </div>
    );
  }

  if (!resolved) {
    return <p className="py-14 text-center text-[13.5px] text-sub">Preparing checkout…</p>;
  }

  const subtotal = resolved.reduce((n, l) => n + l.product.pricePaise * l.qty, 0);
  const delivery = deliveryPaiseFor(subtotal);
  const total = subtotal + delivery;

  const finishPayment = async (providerRef: string, orderNumber: string) => {
    // ── In production the Razorpay modal opens here with payment.providerRef;
    //    its success handler then calls the confirm endpoint. In the dev/mock
    //    flow we confirm immediately. ──
    const confirmed = await confirmMockPayment(providerRef);
    if (!confirmed.ok) {
      shopTrack("payment_failed", { order_number: orderNumber });
      setPhase({ kind: "payment_failed", providerRef, orderNumber });
      return;
    }
    shopTrack("payment_completed", {
      order_number: confirmed.data.orderNumber,
      total_paise: confirmed.data.totalPaise,
      method,
    });
    clearCart();
    router.push(
      `/orders/confirmed?on=${encodeURIComponent(confirmed.data.orderNumber)}&phone=${encodeURIComponent(address.phone.trim())}`,
    );
  };

  const onPay = async () => {
    setPhase({ kind: "paying" });
    const r = await submitCheckout({
      items: resolved.map((l) => ({ productSlug: l.productSlug, qty: l.qty })),
      address: { ...address, name: address.name.trim(), phone: address.phone.trim() },
      paymentMethod: method,
      phone: address.phone.trim(),
    });
    if (!r.ok) {
      setPhase({
        kind: "invalid",
        issues: r.message.split("; ").map((s) => s.trim()).filter(Boolean),
      });
      return;
    }
    await finishPayment(r.data.payment.providerRef, r.data.orderNumber);
  };

  const busy = phase.kind === "paying";

  const summaryRows = (
    <>
      <ul className="mb-3 space-y-2 text-[13px]">
        {resolved.map(({ product: p, qty }) => (
          <li key={p.slug} className="flex justify-between gap-3">
            <span className="text-body">
              {p.title}
              {qty > 1 && <span className="text-sub"> × {qty}</span>}
            </span>
            <span className="font-semibold whitespace-nowrap text-ink">
              {formatPaise(p.pricePaise * qty)}
            </span>
          </li>
        ))}
      </ul>
      <dl className="space-y-[7px] border-t border-border pt-3 text-[13px]">
        <div className="flex justify-between">
          <dt className="text-sub">Subtotal</dt>
          <dd className="font-semibold text-ink">{formatPaise(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-sub">Delivery</dt>
          <dd className={delivery === 0 ? "font-bold text-dharma-fg" : "font-semibold text-ink"}>
            {delivery === 0 ? "Free" : formatPaise(delivery)}
          </dd>
        </div>
        <div className="flex justify-between border-t border-border pt-2 text-[14.5px] font-bold text-ink">
          <dt>Total</dt>
          <dd>{formatPaise(total)}</dd>
        </div>
      </dl>
      <p className="mt-1 text-[11.5px] text-sub">Inclusive of all taxes</p>
    </>
  );

  return (
    <div className="grid items-start gap-6 md:grid-cols-[1.6fr_1fr]">
      <div className="space-y-5">
        {/* ── (a) Contact & Delivery address — never "Shipping address" ── */}
        <section className="rounded-[14px] border border-border bg-card p-[18px]">
          <h2 className="mb-4 text-[15px] font-bold text-ink">
            Contact &amp; Delivery address
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <label
                key={f.key}
                className={`block ${f.key === "line1" || f.key === "line2" ? "sm:col-span-2" : ""}`}
              >
                <span className="mb-1 block text-[10.5px] font-bold tracking-[0.6px] text-sub uppercase">
                  {f.label}
                </span>
                <input
                  type="text"
                  inputMode={f.inputMode}
                  maxLength={f.maxLength}
                  value={address[f.key]}
                  onChange={(e) =>
                    setAddress((a) => ({
                      ...a,
                      [f.key]:
                        f.inputMode === "numeric"
                          ? e.target.value.replace(/\D/g, "")
                          : e.target.value,
                    }))
                  }
                  className="w-full rounded-[9px] border border-border bg-bg px-[13px] py-[10px] text-[13.5px] text-ink outline-none focus:border-cta"
                />
              </label>
            ))}
          </div>
          {pin.kind === "checking" && (
            <p className="mt-2 text-[12.5px] text-sub">Checking your pincode…</p>
          )}
          {pin.kind === "result" && pin.info.serviceable && (
            <p className="mt-2 text-[12.5px] font-semibold text-dharma-fg">
              ✓ Delivers by {formatDateMedium(etaIso(pin.info.etaDays ?? 3))}
              {pin.info.area ? ` · ${pin.info.area}` : ""}
            </p>
          )}
          {pin.kind === "result" && !pin.info.serviceable && (
            <p className="mt-2 text-[12.5px] font-semibold text-pratha-fg">
              We do not deliver to this pincode yet. Nothing has been charged —
              try a different address, or leave your number on the pujan page
              and we&apos;ll message you when your area opens.
            </p>
          )}
        </section>

        {/* ── (b) Payment method — prepaid only, no COD row anywhere ── */}
        <section className="rounded-[14px] border border-border bg-card p-[18px]">
          <h2 className="mb-4 text-[15px] font-bold text-ink">Payment method</h2>
          <div className="space-y-2">
            {PAYMENT_METHODS.map((m) => {
              const on = method === m.value;
              return (
                <label
                  key={m.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-[11px] border px-4 py-[11px] ${
                    on ? "border-cta bg-bhranti-bg" : "border-border bg-bg"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment-method"
                    value={m.value}
                    checked={on}
                    onChange={() => setMethod(m.value)}
                    className="accent-[var(--color-cta)]"
                  />
                  <span>
                    <span className="block text-[13.5px] font-bold text-ink">
                      {m.title}
                    </span>
                    <span className="block text-[11.5px] text-sub">{m.sub}</span>
                  </span>
                </label>
              );
            })}
          </div>
          <p className="mt-3 text-[11.5px] text-sub">
            Prepaid only. Pre-booked items cancel free within 48 hours,
            in-stock items within 24 — stated again on your confirmation.
          </p>
        </section>

        {/* Mobile order summary — accordion above the CTA. */}
        <details className="rounded-[14px] border border-border bg-card p-[18px] md:hidden">
          <summary className="cursor-pointer text-[14px] font-bold text-ink">
            Order summary — {formatPaise(total)}
          </summary>
          <div className="mt-3">{summaryRows}</div>
        </details>

        {phase.kind === "invalid" && (
          <div className="rounded-[12px] border border-pratha-bd bg-pratha-bg px-4 py-3">
            <p className="mb-1 text-[13px] font-bold text-pratha-fg">
              Nothing has been charged. A couple of details need another look:
            </p>
            <ul className="list-disc pl-5 text-[12.5px] leading-relaxed text-pratha-fg">
              {phase.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </div>
        )}

        {phase.kind === "payment_failed" && (
          <div className="rounded-[12px] border border-bhranti-bd bg-bhranti-bg px-4 py-3">
            <p className="mb-1 text-[13px] font-bold text-ink">
              Your payment couldn&apos;t be completed. You haven&apos;t been
              charged.
            </p>
            <p className="mb-2 text-[12.5px] text-sub">
              Your bag is intact. Try the payment again whenever you are ready.
            </p>
            <button
              type="button"
              onClick={() =>
                void finishPayment(phase.providerRef, phase.orderNumber)
              }
              className="rounded-[9px] bg-ink px-5 py-[9px] text-[12.5px] font-bold text-white"
            >
              Retry payment — {formatPaise(total)}
            </button>
          </div>
        )}

        {phase.kind !== "payment_failed" && (
          <button
            type="button"
            onClick={onPay}
            disabled={busy}
            className="w-full rounded-[10px] bg-cta px-6 py-[13px] text-[14.5px] font-bold text-white hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Taking you to payment…" : `Pay ${formatPaise(total)}`}
          </button>
        )}
      </div>

      {/* ── (c) Order summary — inline right on desktop ── */}
      <aside className="hidden rounded-[14px] border border-border bg-card p-[18px] md:sticky md:top-4 md:block">
        <h2 className="mb-3 text-[15px] font-bold text-ink">Order summary</h2>
        {summaryRows}
      </aside>
    </div>
  );
}
