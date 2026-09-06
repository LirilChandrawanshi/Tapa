"use client";

/**
 * Booking wizard (P4-M2) — one page, top to bottom:
 *   (a) date  →  (b) purohit + slot  →  (c) kit + address  →
 *   (d) payment method + summary  →  Confirm & pay.
 *
 * Every 422 surfaces inline and fear-free; the slot-taken race re-fetches
 * availability so the freed/taken chips are always honest.
 */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  bookingTrack,
  confirmMockBookingPayment,
  fetchAvailability,
  formatDay,
  formatPaise,
  minBookingDate,
  slotLabel,
  slotWindow,
  submitBooking,
  type BookingPaymentMethod,
  type PujaType,
  type PurohitAvailability,
  type TimeSlot,
} from "@/lib/booking";
import { CIRCLE_WHATSAPP_NUMBER } from "@/lib/staticExtras";

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

/** Exact field labels are locked copy (same as checkout) — do not reword. */
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

const PAYMENT_METHODS: {
  value: BookingPaymentMethod;
  title: string;
  sub: string;
}[] = [
  { value: "upi", title: "UPI", sub: "GPay, PhonePe, Paytm, any UPI app" },
  { value: "card", title: "Credit or debit card", sub: "Visa, Mastercard, RuPay, Amex" },
  { value: "netbanking", title: "Net banking", sub: "All major banks" },
];
// No cash on delivery — services are prepaid, always.

const WA_ESCAPE_URL = `https://wa.me/${CIRCLE_WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Namaste — I'm booking a puja on Tapa and would like to talk it through first.",
)}`;

type AvailabilityState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; purohits: PurohitAvailability[] };

type Phase =
  | { kind: "form" }
  | { kind: "paying" }
  | { kind: "invalid"; issues: string[] }
  | { kind: "payment_failed"; providerRef: string; bookingNumber: string };

/** "Pt. Keshav Shastri" → "KS" (honourifics don't make good initials). */
function initialsOf(name: string): string {
  const parts = name
    .replace(/\b(pt|pandit|shri|smt|dr)\.?\s+/gi, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const SECTION_CLS = "rounded-[14px] border border-border bg-card p-[18px]";
const H2_CLS = "mb-1 text-[15px] font-bold text-ink";

export function BookingWizard({
  puja,
  slots,
}: {
  puja: PujaType;
  slots: TimeSlot[];
}) {
  const router = useRouter();
  const params = useSearchParams();

  const variant =
    puja.variants.find((v) => v.key === params.get("variant")) ??
    puja.variants[0];

  const [date, setDate] = useState("");
  const [availability, setAvailability] = useState<AvailabilityState>({
    kind: "idle",
  });
  const [chosen, setChosen] = useState<{
    purohitSlug: string;
    slot: string;
  } | null>(null);
  const [kitIncluded, setKitIncluded] = useState(puja.kitIncludedDefault);
  const [address, setAddress] = useState<AddressForm>(EMPTY_ADDRESS);
  const [method, setMethod] = useState<BookingPaymentMethod>("upi");
  const [phase, setPhase] = useState<Phase>({ kind: "form" });
  const [slotNotice, setSlotNotice] = useState("");
  const minDate = useRef(minBookingDate());

  useEffect(() => {
    bookingTrack("checkout_started", {
      puja: puja.slug,
      variant: variant?.key,
    });
    // fire once per wizard entry
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAvailability = useCallback(
    async (day: string) => {
      setAvailability({ kind: "loading" });
      setChosen(null);
      const res = await fetchAvailability(puja.slug, day);
      if (res.ok) {
        setAvailability({ kind: "ready", purohits: res.data });
      } else {
        setAvailability({ kind: "error", message: res.message });
      }
    },
    [puja.slug],
  );

  function onDateChange(next: string) {
    setDate(next);
    setSlotNotice("");
    if (next) void loadAvailability(next);
    else setAvailability({ kind: "idle" });
  }

  const finishPayment = async (providerRef: string, bookingNumber: string) => {
    // ── In production the Razorpay modal opens here with providerRef; its
    //    success handler calls the confirm endpoint. Dev/mock confirms now. ──
    const confirmed = await confirmMockBookingPayment(providerRef);
    if (!confirmed.ok) {
      bookingTrack("payment_failed", { booking_number: bookingNumber });
      setPhase({ kind: "payment_failed", providerRef, bookingNumber });
      return;
    }
    bookingTrack("payment_completed", {
      booking_number: confirmed.data.bookingNumber,
      price_paise: confirmed.data.pricePaise,
      method,
    });
    router.push(
      `/pujan-with-purohit/confirmed?bn=${encodeURIComponent(confirmed.data.bookingNumber)}&phone=${encodeURIComponent(address.phone.trim())}`,
    );
  };

  const onPay = async () => {
    if (!variant || !date || !chosen) return;
    setPhase({ kind: "paying" });
    setSlotNotice("");
    const res = await submitBooking({
      pujaSlug: puja.slug,
      variantKey: variant.key,
      purohitSlug: chosen.purohitSlug,
      date,
      slot: chosen.slot,
      kitIncluded,
      address: {
        ...address,
        name: address.name.trim(),
        phone: address.phone.trim(),
      },
      paymentMethod: method,
      phone: address.phone.trim(),
    });
    if (!res.ok) {
      // The slot-taken race: someone booked this window while the form was
      // open. Refresh the chips so what's shown is true again.
      if (/no longer free/i.test(res.message)) {
        setSlotNotice(res.message);
        setPhase({ kind: "form" });
        await loadAvailability(date);
        return;
      }
      setPhase({
        kind: "invalid",
        issues: res.message
          .split("; ")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      return;
    }
    await finishPayment(res.data.payment.providerRef, res.data.bookingNumber);
  };

  const busy = phase.kind === "paying";
  const ready = variant !== undefined && date !== "" && chosen !== null;
  const purohitName =
    availability.kind === "ready" && chosen
      ? (availability.purohits.find((p) => p.slug === chosen.purohitSlug)
          ?.name ?? "")
      : "";

  return (
    <div className="mx-auto max-w-[680px] px-4 py-7 md:px-6">
      {/* what's being booked */}
      <div className="mb-5 flex items-baseline justify-between gap-3">
        <p className="text-[13.5px] text-body">
          <b className="text-ink">{puja.name}</b>
          {variant && (
            <>
              {" "}
              · {variant.name} ·{" "}
              <b className="text-ink">{formatPaise(variant.pricePaise)}</b>
            </>
          )}
        </p>
        <Link
          href={`/pujan-with-purohit/${puja.slug}`}
          className="shrink-0 text-[12px] font-semibold text-cta hover:underline"
        >
          Change variant
        </Link>
      </div>

      <div className="space-y-5">
        {/* ── (a) date ── */}
        <section className={SECTION_CLS}>
          <h2 className={H2_CLS}>When is the puja?</h2>
          <p className="mb-3 text-[12px] text-sub">
            Bookings need at least a day&apos;s notice — the purohit prepares,
            and the samagri travels ahead of him.
          </p>
          <input
            type="date"
            value={date}
            min={minDate.current}
            onChange={(e) => onDateChange(e.target.value)}
            aria-label="Puja date"
            className="w-full max-w-[260px] rounded-[9px] border border-border bg-bg px-[13px] py-[10px] text-[13.5px] text-ink outline-none focus:border-cta"
          />
        </section>

        {/* ── (b) purohit + slot ── */}
        {date && (
          <section className={SECTION_CLS}>
            <h2 className={H2_CLS}>Available purohits — Delhi NCR</h2>
            <p className="mb-3 text-[12px] text-sub">
              Pick a purohit, then the window that suits your home on{" "}
              {formatDay(date)}.
            </p>

            {slotNotice && (
              <p className="mb-3 rounded-[10px] border border-pratha-bd bg-pratha-bg px-3.5 py-2.5 text-[12.5px] leading-relaxed text-pratha-fg">
                {slotNotice} Nothing has been charged — the chips below are
                fresh.
              </p>
            )}

            {availability.kind === "loading" && (
              <p className="py-4 text-[13px] text-sub">
                Checking who&apos;s free…
              </p>
            )}
            {availability.kind === "error" && (
              <p className="rounded-[10px] border border-pratha-bd bg-pratha-bg px-3.5 py-2.5 text-[12.5px] leading-relaxed text-pratha-fg">
                {availability.message}
              </p>
            )}
            {availability.kind === "ready" &&
              availability.purohits.length === 0 && (
                <p className="py-3 text-[13px] leading-relaxed text-sub">
                  No purohit is free that day. Try the next day — or{" "}
                  <a
                    href={WA_ESCAPE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-cta hover:underline"
                  >
                    chat with us
                  </a>{" "}
                  and we&apos;ll arrange someone.
                </p>
              )}

            {availability.kind === "ready" && (
              <div className="space-y-3">
                {availability.purohits.map((p) => {
                  const selected = chosen?.purohitSlug === p.slug;
                  return (
                    <div
                      key={p.slug}
                      className={`rounded-[13px] border-2 p-3.5 ${
                        selected ? "border-cta" : "border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber/20 text-[13px] font-bold text-gold"
                        >
                          {initialsOf(p.name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13.5px] font-bold text-ink">
                            {p.name}
                          </p>
                          <p className="text-[11.5px] text-sub">
                            ★ {p.rating.toFixed(1)} · {p.pujaCount} pujas ·{" "}
                            {p.languages.join(", ")}
                          </p>
                          {p.lineageNote && (
                            <p className="mt-[2px] text-[11.5px] text-body">
                              {p.lineageNote}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {puja.allowedSlots.map((slotKey) => {
                          const free = p.freeSlots.includes(slotKey);
                          const on = selected && chosen?.slot === slotKey;
                          return (
                            <button
                              key={slotKey}
                              type="button"
                              disabled={!free || busy}
                              aria-pressed={on}
                              title={
                                free
                                  ? `${slotLabel(slotKey, slots)}, ${slotWindow(slotKey, slots)}`
                                  : "Already booked in this window"
                              }
                              onClick={() =>
                                setChosen({
                                  purohitSlug: p.slug,
                                  slot: slotKey,
                                })
                              }
                              className={`rounded-[9px] border px-3 py-[7px] text-[12px] font-bold ${
                                on
                                  ? "border-cta bg-cta text-white"
                                  : free
                                    ? "border-border bg-bg text-body hover:border-cta"
                                    : "cursor-not-allowed border-border-light bg-bg text-sub/50 line-through"
                              }`}
                            >
                              {slotLabel(slotKey, slots)} ·{" "}
                              {slotWindow(slotKey, slots)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {chosen && (
          <>
            {/* ── (c) kit + address ── */}
            <section className={SECTION_CLS}>
              <h2 className={H2_CLS}>Samagri</h2>
              <label className="mt-2 flex cursor-pointer items-start gap-2.5 text-[13px] text-body">
                <input
                  type="checkbox"
                  checked={kitIncluded}
                  onChange={(e) => setKitIncluded(e.target.checked)}
                  className="mt-[3px] accent-[#fd066d]"
                />
                <span>
                  <b>Include samagri kit</b> — {puja.kitNote}
                  <span className="mt-0.5 block text-[11.5px] text-sub">
                    Price unchanged either way — the kit is part of the seva.
                  </span>
                </span>
              </label>
            </section>

            <section className={SECTION_CLS}>
              <h2 className="mb-4 text-[15px] font-bold text-ink">
                Contact &amp; Puja address
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
            </section>

            {/* WhatsApp escape hatch — booking a purohit is a talk-first act */}
            <a
              href={WA_ESCAPE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-[13px] border border-wa/30 border-l-[3px] border-l-wa bg-card px-4 py-3 text-[13px] font-semibold text-body hover:bg-bg/60"
            >
              <span aria-hidden>💬</span>
              Wish to chat first? Ask us anything on WhatsApp — the slot stays
              yours while we talk.
              <span aria-hidden className="ml-auto text-sub">
                ›
              </span>
            </a>

            {/* ── (d) payment + summary ── */}
            <section className={SECTION_CLS}>
              <h2 className="mb-4 text-[15px] font-bold text-ink">
                Payment method
              </h2>
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
                        <span className="block text-[11.5px] text-sub">
                          {m.sub}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>

            <section className={SECTION_CLS}>
              <h2 className="mb-3 text-[15px] font-bold text-ink">
                Booking summary
              </h2>
              <dl className="space-y-[7px] text-[13px]">
                <div className="flex justify-between gap-3">
                  <dt className="text-sub">Puja</dt>
                  <dd className="text-right font-semibold text-ink">
                    {puja.name}
                    {variant ? ` · ${variant.name}` : ""}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-sub">Purohit</dt>
                  <dd className="text-right font-semibold text-ink">
                    {purohitName || "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-sub">Date &amp; window</dt>
                  <dd className="text-right font-semibold text-ink">
                    {formatDay(date)}, {slotWindow(chosen.slot, slots)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-sub">Samagri kit</dt>
                  <dd className="text-right font-semibold text-ink">
                    {kitIncluded ? "Included" : "Not included"}
                  </dd>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-[14.5px] font-bold text-ink">
                  <dt>Total</dt>
                  <dd>{variant ? formatPaise(variant.pricePaise) : "—"}</dd>
                </div>
              </dl>
              <p className="mt-2 text-[11.5px] text-sub">
                Inclusive of all charges. Free cancellation until 24 hours
                before the puja —{" "}
                <Link
                  href="/policies/cancellation"
                  className="font-semibold text-cta hover:underline"
                >
                  cancellation policy
                </Link>
                .
              </p>
            </section>

            {phase.kind === "invalid" && (
              <div className="rounded-[12px] border border-pratha-bd bg-pratha-bg px-4 py-3">
                <p className="mb-1 text-[13px] font-bold text-pratha-fg">
                  Nothing has been charged. A couple of details need another
                  look:
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
                  Your payment couldn&apos;t be completed. You haven&apos;t
                  been charged.
                </p>
                <p className="mb-2 text-[12.5px] text-sub">
                  Your slot selection is intact. Try the payment again whenever
                  you are ready.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    void finishPayment(phase.providerRef, phase.bookingNumber)
                  }
                  className="rounded-[9px] bg-ink px-5 py-[9px] text-[12.5px] font-bold text-white"
                >
                  Retry payment
                  {variant ? ` — ${formatPaise(variant.pricePaise)}` : ""}
                </button>
              </div>
            )}

            {phase.kind !== "payment_failed" && (
              <button
                type="button"
                onClick={() => void onPay()}
                disabled={busy || !ready}
                className="w-full rounded-[10px] bg-cta px-6 py-[13px] text-[14.5px] font-bold text-white hover:opacity-90 disabled:opacity-60"
              >
                {busy
                  ? "Taking you to payment…"
                  : `Confirm & pay${variant ? ` — ${formatPaise(variant.pricePaise)}` : ""}`}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
