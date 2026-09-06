"use client";

/**
 * Booking confirmation body — reads ?bn= & ?phone= and fetches the booking.
 * Kept fear-free: even the failure path says the booking is safe.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { WhatsAppNudge } from "@/components/WhatsAppNudge";
import {
  fetchBooking,
  formatDay,
  formatPaise,
  type BookingView,
} from "@/lib/booking";

type State =
  | { kind: "loading" }
  | { kind: "missing" }
  | { kind: "error" }
  | { kind: "ready"; booking: BookingView };

export function BookingConfirmed() {
  const params = useSearchParams();
  const bookingNumber = params.get("bn") ?? "";
  const phone = params.get("phone") ?? "";
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!bookingNumber || !phone) {
      setState({ kind: "missing" });
      return;
    }
    void fetchBooking(bookingNumber, phone).then((r) =>
      setState(r.ok ? { kind: "ready", booking: r.data } : { kind: "error" }),
    );
  }, [bookingNumber, phone]);

  if (state.kind === "loading") {
    return (
      <p className="py-14 text-center text-[13.5px] text-sub">
        Fetching your booking…
      </p>
    );
  }

  if (state.kind === "missing" || state.kind === "error") {
    return (
      <div className="mx-auto max-w-[440px] px-4 py-14 text-center">
        <h2 className="mb-2 text-xl font-bold text-ink">
          We couldn&apos;t open this confirmation
        </h2>
        <p className="mb-5 text-[13.5px] leading-relaxed text-sub">
          If you just paid, your booking is safe — it&apos;s listed in your
          account under the phone number you booked with.
        </p>
        <Link
          href="/account/bookings"
          className="inline-block rounded-[10px] bg-ink px-6 py-[11px] text-[13.5px] font-bold text-white"
        >
          View my bookings ›
        </Link>
      </div>
    );
  }

  const { booking } = state;

  const nextSteps = [
    `${booking.purohitName} calls you the day before to walk through the sankalp details.`,
    booking.kitIncluded
      ? "The samagri kit arrives the day before — lay it out, everything is labelled."
      : "You're bringing your own samagri — the purohit will confirm the list on his call.",
    "A reminder lands the morning of the puja, with the free guide attached.",
  ];

  return (
    <div className="mx-auto max-w-[620px] px-4 py-9 md:px-6">
      <div className="mb-5 text-center">
        <p
          aria-hidden
          className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-dharma-bg text-xl text-dharma-fg"
        >
          ✓
        </p>
        <h1 className="mb-1 text-2xl font-bold tracking-[-0.4px] text-ink">
          Booking confirmed
        </h1>
        <p className="text-[15px] text-body">
          <b>
            {booking.pujaName} — {booking.variantName}
          </b>{" "}
          · {formatDay(booking.date)}, {booking.slotWindow}
        </p>
        <p className="mt-1 text-[13.5px] font-semibold text-ink">
          with {booking.purohitName}
        </p>
        <p className="mt-2 text-[13px] text-sub">
          Booking {booking.bookingNumber} · {formatPaise(booking.pricePaise)}{" "}
          paid
        </p>
      </div>

      <div className="mb-4 rounded-[14px] border border-border bg-card p-[18px]">
        <p className="mb-3 text-[10px] font-bold tracking-[0.8px] text-sub uppercase">
          What happens next
        </p>
        <ol className="space-y-[10px]">
          {nextSteps.map((step, i) => (
            <li
              key={step}
              className="flex gap-3 text-[13px] leading-relaxed text-body"
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-bg text-[10.5px] font-bold text-gold">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      <p className="mb-4 text-center text-[12.5px] text-sub">
        Free cancellation until 24 hours before the puja — full{" "}
        {formatPaise(booking.pricePaise)} refund.{" "}
        <Link
          href="/policies/cancellation"
          className="font-semibold text-cta hover:underline"
        >
          Cancellation policy
        </Link>
      </p>

      <WhatsAppNudge copy="Stay close to your practice." />

      <div className="text-center">
        <Link
          href="/account/bookings"
          className="inline-block rounded-[10px] bg-cta px-6 py-[11px] text-[13.5px] font-bold text-white hover:opacity-90"
        >
          View my bookings ›
        </Link>
      </div>
    </div>
  );
}
