"use client";

/**
 * The "Check availability" form (Phase 5, request-based model). No payment,
 * no instant confirm: submitting creates a TM- request in REQUESTED and the
 * team confirms availability + the final quote within 24 hours. 422s from
 * the backend surface inline, fear-free.
 */

import { useState } from "react";
import Link from "next/link";
import {
  GUEST_BUCKET_KEYS,
  guestBucketLabel,
  minRequestDate,
  submitMandaliRequest,
  type GuestBucket,
  type MandaliRequestView,
  type MandaliType,
  type MandaliVenue,
} from "@/lib/mandali";

const NOTES_MAX = 500;

const FIELD_LABEL =
  "mb-1 block text-[11px] font-bold tracking-[0.6px] text-sub uppercase";
const INPUT_CLS =
  "w-full rounded-[10px] border border-border bg-card px-3.5 py-2.5 text-[13.5px] text-ink outline-none focus:border-cta";

export function MandaliRequestForm({ type }: { type: MandaliType }) {
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState<MandaliVenue>("HOME");
  const [guests, setGuests] = useState<GuestBucket | "">("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");
  const [notes, setNotes] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<MandaliRequestView | null>(null);

  const minDate = minRequestDate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError("");

    const missing: string[] = [];
    if (!date) missing.push("the date");
    if (!guests) missing.push("expected guests");
    if (!name.trim()) missing.push("your name");
    if (!/^\d{10}$/.test(phone.replace(/\D/g, "").slice(-10)) || phone.trim() === "")
      missing.push("a 10-digit mobile number");
    if (!line1.trim()) missing.push("the address");
    if (!city.trim()) missing.push("the city");
    if (!state.trim()) missing.push("the state");
    if (!/^\d{6}$/.test(pincode.trim())) missing.push("a 6-digit pincode");
    if (missing.length > 0) {
      setError(`Please add ${missing.join(", ")}.`);
      return;
    }

    setBusy(true);
    const res = await submitMandaliRequest({
      mandaliTypeSlug: type.slug,
      date,
      venueType: venue,
      expectedGuests: guests as GuestBucket,
      address: {
        name: name.trim(),
        phone: phone.trim(),
        line1: line1.trim(),
        line2: line2.trim() || null,
        city: city.trim(),
        state: state.trim(),
        pincode: pincode.trim(),
      },
      notes: notes.trim() || undefined,
      phone: phone.trim(),
    });
    setBusy(false);
    if (res.ok) {
      setCreated(res.data);
    } else {
      setError(res.message);
    }
  }

  if (created) {
    return (
      <section className="mt-4 rounded-[14px] border border-border bg-card p-6 text-center">
        <p aria-hidden className="text-[28px]">
          🙏
        </p>
        <h2 className="mt-2 text-[19px] font-bold text-ink">
          Request received — {created.requestNumber}
        </h2>
        <p className="mx-auto mt-2 max-w-[420px] text-[13.5px] leading-relaxed text-body">
          We confirm availability and the final quote within 24 hours on
          WhatsApp. Nothing has been charged — payment happens only after we
          confirm.
        </p>
        <p className="mt-3 text-[12.5px] text-sub">
          Keep the number <b className="font-mono">{created.requestNumber}</b>{" "}
          handy — it tracks this request.
        </p>
        <Link
          href={`/bhajan-mandali/track?tm=${encodeURIComponent(created.requestNumber)}`}
          className="mt-5 inline-block rounded-[10px] bg-cta px-6 py-2.5 text-[13.5px] font-bold text-white hover:opacity-90"
        >
          Track this request ›
        </Link>
      </section>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4" noValidate>
      <section className="rounded-[14px] border border-border bg-card p-5">
        <p className="mb-4 text-[11px] font-bold tracking-[0.8px] text-sub uppercase">
          Your gathering
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="m-date" className={FIELD_LABEL}>
              Date
            </label>
            <input
              id="m-date"
              type="date"
              min={minDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={INPUT_CLS}
            />
            <p className="mt-1 text-[11px] text-sub">
              At least a day&apos;s notice — tomorrow onwards.
            </p>
          </div>

          <div>
            <span className={FIELD_LABEL}>Venue</span>
            <div className="flex gap-2" role="radiogroup" aria-label="Venue">
              {(
                [
                  ["HOME", "Home"],
                  ["TEMPLE", "Temple"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={venue === value}
                  onClick={() => setVenue(value)}
                  className={`flex-1 rounded-[10px] border px-3 py-2.5 text-[13px] font-semibold ${
                    venue === value
                      ? "border-cta bg-cta/10 text-cta"
                      : "border-border bg-card text-body hover:border-sub"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="m-guests" className={FIELD_LABEL}>
            Expected guests
          </label>
          <select
            id="m-guests"
            value={guests}
            onChange={(e) => setGuests(e.target.value as GuestBucket | "")}
            className={INPUT_CLS}
          >
            <option value="">Select range</option>
            {GUEST_BUCKET_KEYS.map((key) => (
              <option key={key} value={key}>
                {guestBucketLabel(key)}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="mt-4 rounded-[14px] border border-border bg-card p-5">
        <p className="mb-4 text-[11px] font-bold tracking-[0.8px] text-sub uppercase">
          Where the mandali comes
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="m-name" className={FIELD_LABEL}>
              Your name
            </label>
            <input
              id="m-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label htmlFor="m-phone" className={FIELD_LABEL}>
              Mobile number
            </label>
            <input
              id="m-phone"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              placeholder="10-digit mobile"
              className={INPUT_CLS}
            />
            <p className="mt-1 text-[11px] text-sub">
              We confirm on WhatsApp on this number — it also tracks the
              request.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="m-line1" className={FIELD_LABEL}>
              House, Flat, Building
            </label>
            <input
              id="m-line1"
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              autoComplete="address-line1"
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label htmlFor="m-line2" className={FIELD_LABEL}>
              Area, Colony, Street
            </label>
            <input
              id="m-line2"
              value={line2}
              onChange={(e) => setLine2(e.target.value)}
              autoComplete="address-line2"
              className={INPUT_CLS}
            />
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="m-city" className={FIELD_LABEL}>
              City
            </label>
            <input
              id="m-city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              autoComplete="address-level2"
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label htmlFor="m-state" className={FIELD_LABEL}>
              State
            </label>
            <input
              id="m-state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              autoComplete="address-level1"
              className={INPUT_CLS}
            />
          </div>
          <div>
            <label htmlFor="m-pincode" className={FIELD_LABEL}>
              Pincode
            </label>
            <input
              id="m-pincode"
              inputMode="numeric"
              maxLength={6}
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              autoComplete="postal-code"
              className={INPUT_CLS}
            />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="m-notes" className={FIELD_LABEL}>
            Anything we should know? (optional)
          </label>
          <textarea
            id="m-notes"
            rows={3}
            maxLength={NOTES_MAX}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Start after the evening aarti; parking is inside the society"
            className={INPUT_CLS}
          />
          <p className="mt-1 text-right text-[11px] text-sub">
            {notes.length}/{NOTES_MAX}
          </p>
        </div>
      </section>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-[10px] border border-border bg-bg px-4 py-3 text-[13px] leading-relaxed text-body"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="mt-4 w-full rounded-[12px] bg-cta py-3.5 text-[14.5px] font-bold text-white hover:opacity-90 disabled:opacity-50"
      >
        {busy ? "Sending your request…" : "Check availability"}
      </button>
      <p className="mt-2 text-center text-[12px] text-sub">
        No payment now — we confirm availability and the final quote within 24
        hours on WhatsApp.
      </p>
    </form>
  );
}
