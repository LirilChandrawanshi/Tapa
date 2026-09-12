"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { getMe, type Me } from "@/lib/auth";
import {
  createAddress,
  getAddresses,
  type SavedAddress,
} from "@/lib/orders";
import { OtpBottomSheet } from "@/components/auth/OtpBottomSheet";

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
  /** Mirrors CheckoutService: everything but `line2` is mandatory. */
  required?: boolean;
  autoComplete?: string;
}[] = [
  { key: "name", label: "Your name", required: true, autoComplete: "name" },
  {
    key: "phone",
    label: "Mobile number",
    inputMode: "numeric",
    maxLength: 10,
    required: true,
    autoComplete: "tel-national",
  },
  {
    key: "line1",
    label: "House, Flat, Building",
    required: true,
    autoComplete: "address-line1",
  },
  { key: "line2", label: "Area, Colony, Street", autoComplete: "address-line2" },
  { key: "city", label: "City", required: true, autoComplete: "address-level2" },
  { key: "state", label: "State", required: true, autoComplete: "address-level1" },
  {
    key: "pincode",
    label: "Pincode",
    inputMode: "numeric",
    maxLength: 6,
    required: true,
    autoComplete: "postal-code",
  },
];

type FieldErrors = Partial<Record<keyof AddressForm, string>>;

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

/** SavedAddress → the checkout's address shape (phone falls back to the account). */
function fromSaved(a: SavedAddress, accountPhone: string): AddressForm {
  return {
    name: a.name,
    phone: (a.phone || accountPhone).replace(/^\+91/, "").replace(/\D/g, ""),
    line1: a.line1,
    line2: a.line2 ?? "",
    city: a.city,
    state: a.state,
    pincode: a.pincode,
  };
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

  // ── guest-or-account fork (#163) + saved addresses (#158) ──
  const [me, setMe] = useState<Me | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [guestMode, setGuestMode] = useState(false);
  const [otpOpen, setOtpOpen] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedSavedId, setSelectedSavedId] = useState<string | null>(null);
  const [saveToBook, setSaveToBook] = useState(false);

  // ── required-field validation ──
  // Pay sits below the fold on both m-web and desktop, so a buyer who taps it
  // with an empty form never sees an error that renders in place. Everything
  // below exists to move them back up to the first field that needs them.
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const addressRef = useRef<HTMLElement>(null);
  const issuesRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<Partial<Record<keyof AddressForm, HTMLInputElement | null>>>(
    {},
  );

  const loadAccount = async () => {
    const meRes = await getMe();
    setAuthChecked(true);
    if (!meRes.ok) {
      setMe(null);
      return;
    }
    setMe(meRes.data);
    const addrRes = await getAddresses();
    if (addrRes.ok && addrRes.data.length > 0) {
      setSavedAddresses(addrRes.data);
      const usable = addrRes.data.find((a) => a.isDefault && a.serviceable)
        ?? addrRes.data.find((a) => a.serviceable);
      setSelectedSavedId(usable?.id ?? null);
    }
  };

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
    void loadAccount();
  }, []);

  // Inline pincode validation — the same checker the PDP uses (manual entry only).
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

  // The server validates again (prices, stock, cut-offs) and its verdict can
  // name things no client check can. Bring the buyer to it rather than leaving
  // it to render silently under the fold.
  useEffect(() => {
    if (phase.kind !== "invalid") return;
    issuesRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [phase]);

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
        <h2 className="mb-2 text-xl font-bold text-ink">Your cart is empty</h2>
        <p className="mb-5 text-[13.5px] text-sub">
          Add a pujan to the cart before checking out.
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

  const selectedSaved =
    selectedSavedId === null
      ? null
      : (savedAddresses.find((a) => a.id === selectedSavedId) ?? null);
  const effectiveAddress =
    selectedSaved && me ? fromSaved(selectedSaved, me.phone) : address;
  const manualEntry = selectedSaved === null;

  // earliest pre-book cut-off in the cart — the failure banner promises the hold
  const earliestOrderBy = resolved
    .map((l) => l.product.orderByDate)
    .filter((d): d is string => Boolean(d))
    .sort()[0];

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
      `/orders/confirmed?on=${encodeURIComponent(confirmed.data.orderNumber)}&phone=${encodeURIComponent(effectiveAddress.phone.trim())}`,
    );
  };

  /**
   * Mirrors CheckoutService's address rules so the buyer is told what is
   * missing before a network round-trip — and before any payment sheet opens.
   */
  const validateAddress = (a: AddressForm): FieldErrors => {
    const errs: FieldErrors = {};
    for (const f of FIELDS) {
      if (!f.required) continue;
      const value = a[f.key].trim();
      if (!value) {
        errs[f.key] = `${f.label} is required.`;
        continue;
      }
      if (f.key === "phone" && !/^\d{10}$/.test(value)) {
        errs.phone = "Enter a valid 10-digit mobile number.";
      }
      if (f.key === "pincode" && !/^\d{6}$/.test(value)) {
        errs.pincode = "Enter a valid 6-digit pincode.";
      }
    }
    // An unserviceable pincode is a field problem, not a payment problem —
    // the server would reject it anyway, so say so at the field.
    if (!errs.pincode && pin.kind === "result" && !pin.info.serviceable) {
      errs.pincode = "We do not deliver to this pincode yet.";
    }
    return errs;
  };

  /**
   * Scroll the first offending field into the middle of the viewport and focus
   * it. `preventScroll` keeps the browser's own focus-scroll from fighting the
   * smooth one, which on m-web otherwise lands the field under the keyboard.
   */
  const focusFirstError = (errs: FieldErrors) => {
    const first = FIELDS.find((f) => errs[f.key]);
    if (!first) return;
    // one frame so the messages have painted before the viewport moves to them
    requestAnimationFrame(() => {
      const el = inputRefs.current[first.key];
      (el ?? addressRef.current)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      el?.focus({ preventScroll: true });
    });
  };

  const onPay = async () => {
    // Saved addresses were already validated when they entered the book.
    if (manualEntry) {
      const errs = validateAddress(address);
      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs);
        setPhase({ kind: "form" });
        focusFirstError(errs);
        return;
      }
    }
    setFieldErrors({});
    setPhase({ kind: "paying" });
    const payloadAddress = {
      ...effectiveAddress,
      name: effectiveAddress.name.trim(),
      phone: effectiveAddress.phone.trim(),
    };
    const r = await submitCheckout({
      items: resolved.map((l) => ({ productSlug: l.productSlug, qty: l.qty })),
      address: payloadAddress,
      paymentMethod: method,
      phone: payloadAddress.phone,
    });
    if (!r.ok) {
      setPhase({
        kind: "invalid",
        issues: r.message.split("; ").map((s) => s.trim()).filter(Boolean),
      });
      return;
    }
    // manual entry + "save this address" → into the book, best-effort
    if (me && selectedSaved === null && saveToBook) {
      void createAddress({
        name: payloadAddress.name,
        phone: payloadAddress.phone,
        line1: payloadAddress.line1.trim(),
        line2: payloadAddress.line2.trim(),
        city: payloadAddress.city.trim(),
        state: payloadAddress.state.trim(),
        pincode: payloadAddress.pincode.trim(),
      });
    }
    await finishPayment(r.data.payment.providerRef, r.data.orderNumber);
  };

  const busy = phase.kind === "paying";
  const showFork = authChecked && me === null && !guestMode;
  const errorCount = Object.keys(fieldErrors).length;

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
        {/* ── guest-or-account fork (#163) — never a wall, guest is primary ── */}
        {showFork && (
          <section className="rounded-[14px] border border-border bg-card p-[18px]">
            <h2 className="mb-1 text-[15px] font-bold text-ink">
              Check out your way
            </h2>
            <p className="mb-4 text-[12.5px] leading-relaxed text-sub">
              No account needed — order number + phone always tracks your
              order. Signing in just fills your saved addresses for you.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setGuestMode(true)}
                className="rounded-[10px] bg-cta px-5 py-[11px] text-[13.5px] font-bold text-white hover:opacity-90"
              >
                Continue as guest
              </button>
              <button
                type="button"
                onClick={() => setOtpOpen(true)}
                className="rounded-[10px] border border-border bg-bg px-5 py-[11px] text-[13.5px] font-bold text-body hover:border-cta/60"
              >
                Sign in with OTP
              </button>
            </div>
          </section>
        )}

        {/* ── (a) Contact & Delivery address — never "Shipping address" ── */}
        <section
          ref={addressRef}
          className="scroll-mt-24 rounded-[14px] border border-border bg-card p-[18px]"
        >
          <h2 className="mb-4 text-[15px] font-bold text-ink">
            Contact &amp; Delivery address
          </h2>

          {/* Counts what is missing without repeating every message — the
              fields themselves carry the detail. role=alert so a screen reader
              hears it at the same moment the viewport jumps. */}
          {errorCount > 0 && (
            <div
              role="alert"
              className="mb-4 rounded-[10px] border border-bhranti-bd bg-bhranti-bg px-[13px] py-[10px] text-[12.5px] font-semibold text-cta"
            >
              {errorCount === 1
                ? "One detail is still needed before you can pay."
                : `${errorCount} details are still needed before you can pay.`}{" "}
              Nothing has been charged.
            </div>
          )}

          {/* saved addresses as radio cards, for signed-in buyers */}
          {me && savedAddresses.length > 0 && (
            <div className="mb-4 space-y-2">
              {savedAddresses.map((a) => {
                const on = selectedSavedId === a.id;
                return (
                  <label
                    key={a.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-[11px] border px-4 py-[11px] ${
                      on ? "border-cta bg-bhranti-bg" : "border-border bg-bg"
                    } ${a.serviceable ? "" : "opacity-70"}`}
                  >
                    <input
                      type="radio"
                      name="saved-address"
                      checked={on}
                      disabled={!a.serviceable}
                      onChange={() => setSelectedSavedId(a.id)}
                      className="mt-1 accent-[var(--color-cta)]"
                    />
                    <span className="min-w-0">
                      <span className="block text-[13.5px] font-bold text-ink">
                        {a.name}
                        {a.isDefault && (
                          <span className="ml-2 rounded-[5px] border border-border bg-card px-[6px] py-[1px] text-[9.5px] font-bold tracking-[0.4px] text-sub">
                            DEFAULT
                          </span>
                        )}
                      </span>
                      <span className="block text-[12px] leading-relaxed text-sub">
                        {a.line1}
                        {a.line2 ? `, ${a.line2}` : ""}, {a.city} — {a.pincode}
                      </span>
                      <span
                        className={`block text-[11.5px] font-semibold ${
                          a.serviceable ? "text-dharma-fg" : "text-pratha-fg"
                        }`}
                      >
                        {a.serviceable
                          ? `✓ We deliver here · ~${a.etaDays ?? 3} days`
                          : "Not on the delivery list yet — pick another address"}
                      </span>
                    </span>
                  </label>
                );
              })}
              <button
                type="button"
                onClick={() =>
                  setSelectedSavedId(selectedSavedId === null ? (savedAddresses.find((a) => a.serviceable)?.id ?? null) : null)
                }
                className="text-[12.5px] font-bold text-cta"
              >
                {manualEntry ? "‹ Back to saved addresses" : "Use a different address"}
              </button>
            </div>
          )}

          {manualEntry && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {FIELDS.map((f) => {
                  const err = fieldErrors[f.key];
                  return (
                    <label
                      key={f.key}
                      className={`block scroll-mt-24 ${f.key === "line1" || f.key === "line2" ? "sm:col-span-2" : ""}`}
                    >
                      <span className="mb-1 block text-[10.5px] font-bold tracking-[0.6px] text-sub uppercase">
                        {f.label}
                        {f.required && (
                          <span aria-hidden className="ml-[3px] text-cta">
                            *
                          </span>
                        )}
                      </span>
                      <input
                        ref={(el) => {
                          inputRefs.current[f.key] = el;
                        }}
                        type="text"
                        inputMode={f.inputMode}
                        maxLength={f.maxLength}
                        autoComplete={f.autoComplete}
                        aria-required={f.required}
                        aria-invalid={err ? true : undefined}
                        aria-describedby={err ? `err-${f.key}` : undefined}
                        value={address[f.key]}
                        onChange={(e) => {
                          const next =
                            f.inputMode === "numeric"
                              ? e.target.value.replace(/\D/g, "")
                              : e.target.value;
                          setAddress((a) => ({ ...a, [f.key]: next }));
                          // Clear as they type — an error that outlives its
                          // cause just nags.
                          setFieldErrors((prev) => {
                            if (!prev[f.key]) return prev;
                            const { [f.key]: _gone, ...rest } = prev;
                            return rest;
                          });
                        }}
                        className={`w-full rounded-[9px] border bg-bg px-[13px] py-[10px] text-[13.5px] text-ink outline-none ${
                          err
                            ? "border-cta ring-1 ring-cta/40 focus:border-cta"
                            : "border-border focus:border-cta"
                        }`}
                      />
                      {err && (
                        <span
                          id={`err-${f.key}`}
                          className="mt-1 block text-[11.5px] font-semibold text-cta"
                        >
                          {err}
                        </span>
                      )}
                    </label>
                  );
                })}
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
              {me && (
                <label className="mt-3 flex cursor-pointer items-center gap-2 text-[12.5px] text-body">
                  <input
                    type="checkbox"
                    checked={saveToBook}
                    onChange={(e) => setSaveToBook(e.target.checked)}
                    className="accent-[var(--color-cta)]"
                  />
                  Save this address to my account for next time
                </label>
              )}
            </>
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
            Prepaid only. Pre-booked items cancel free within 72 hours,
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
          <div
            ref={issuesRef}
            role="alert"
            className="scroll-mt-24 rounded-[12px] border border-pratha-bd bg-pratha-bg px-4 py-3"
          >
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
            <p className="mb-1 text-[12.5px] text-sub">
              Your cart is intact.
              {earliestOrderBy
                ? ` Your pre-booking is held until ${formatDateMedium(earliestOrderBy)} — there is no rush, try again whenever you are ready.`
                : " Try the payment again whenever you are ready."}
            </p>
            <p className="mb-2 text-[12.5px] text-sub">
              If money left your account, it returns on its own within 5
              working days — you will not be charged twice.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  void finishPayment(phase.providerRef, phase.orderNumber)
                }
                className="rounded-[9px] bg-ink px-5 py-[9px] text-[12.5px] font-bold text-white"
              >
                Retry payment — {formatPaise(total)}
              </button>
              <button
                type="button"
                onClick={() => setPhase({ kind: "form" })}
                className="rounded-[9px] border border-border bg-card px-5 py-[9px] text-[12.5px] font-bold text-body"
              >
                Use a different method
              </button>
            </div>
          </div>
        )}

        {phase.kind !== "payment_failed" && (
          <>
            <button
              type="button"
              onClick={onPay}
              disabled={busy}
              className="w-full rounded-[10px] bg-cta px-6 py-[13px] text-[14.5px] font-bold text-white hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "Processing your payment…" : `Pay ${formatPaise(total)}`}
            </button>
            {busy && (
              <p className="mt-2 text-center text-[11.5px] text-sub">
                Do not close this screen.
              </p>
            )}
          </>
        )}
      </div>

      {/* ── (c) Order summary — inline right on desktop ── */}
      <aside className="hidden rounded-[14px] border border-border bg-card p-[18px] md:sticky md:top-4 md:block">
        <h2 className="mb-3 text-[15px] font-bold text-ink">Order summary</h2>
        {summaryRows}
      </aside>

      <OtpBottomSheet
        open={otpOpen}
        context="signin"
        heading="Sign in to use your saved addresses"
        onClose={() => setOtpOpen(false)}
        onSuccess={() => {
          setOtpOpen(false);
          void loadAccount();
        }}
      />
    </div>
  );
}
