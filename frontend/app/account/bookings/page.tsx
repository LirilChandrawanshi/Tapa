"use client";

/**
 * /account/bookings — puja booking history (P4-M2).
 *
 * Mirrors /account/orders: auth-gated with the OTP sheet, newest first,
 * cancel inline while the free window (24h before the puja) is open.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { OtpBottomSheet } from "@/components/auth/OtpBottomSheet";
import { CancelBookingDialog } from "@/components/booking/CancelBookingDialog";
import { getMe, type Me } from "@/lib/auth";
import {
  bookingStatusMeta,
  canCancelBooking,
  formatDay,
  formatDeadline,
  formatPaise,
  getMyBookings,
  type BookingTone,
  type BookingView,
} from "@/lib/booking";

const TONE_CLS: Record<BookingTone, string> = {
  good: "border-dharma-bd bg-dharma-bg text-dharma-fg",
  progress: "border-pratha-bd bg-pratha-bg text-pratha-fg",
  attention: "border-cta bg-card text-cta",
  neutral: "border-border bg-bg text-sub",
};

function createdCopy(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AccountBookingsPage() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);
  const [bookings, setBookings] = useState<BookingView[]>([]);
  const [loadError, setLoadError] = useState("");
  const [gateOpen, setGateOpen] = useState(false);
  const [cancelling, setCancelling] = useState<BookingView | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  const load = useCallback(async () => {
    const meRes = await getMe();
    if (!meRes.ok) {
      setMe(null);
      setBookings([]);
      setLoading(false);
      return;
    }
    setMe(meRes.data);
    const res = await getMyBookings();
    if (res.ok) {
      setBookings(res.data ?? []);
      setLoadError("");
    } else {
      setLoadError(res.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    setNow(new Date());
    void load();
  }, [load]);

  /* ---------- loading ---------- */
  if (loading) {
    return (
      <main className="mx-auto w-full max-w-[680px] px-4 py-10">
        <div className="h-[120px] animate-pulse rounded-2xl border border-border bg-card" />
      </main>
    );
  }

  /* ---------- signed out ---------- */
  if (!me) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-[440px] items-center px-4 py-10">
        <div className="w-full rounded-2xl border border-border bg-card p-7 text-center shadow-sm">
          <div
            aria-hidden
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-bg text-[26px]"
          >
            🪔
          </div>
          <h1 className="mt-4 text-[20px] font-bold text-ink">
            Your puja bookings
          </h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-sub">
            Sign in with your WhatsApp number to see every purohit booking made
            with it — including bookings placed without an account.
          </p>
          <button
            type="button"
            onClick={() => setGateOpen(true)}
            className="mt-5 w-full rounded-lg bg-cta py-3 text-[14px] font-bold text-white hover:opacity-90"
          >
            Sign in
          </button>
          <Link
            href="/account"
            className="mt-3 block w-full py-2 text-[13px] font-semibold text-sub hover:text-body"
          >
            Back to account
          </Link>
        </div>

        <OtpBottomSheet
          open={gateOpen}
          context="signin"
          onClose={() => setGateOpen(false)}
          onSuccess={() => {
            setGateOpen(false);
            setLoading(true);
            void load();
          }}
        />
      </main>
    );
  }

  /* ---------- signed in ---------- */
  return (
    <main className="mx-auto w-full max-w-[680px] px-4 py-8">
      <nav className="mb-1 text-[12px] text-sub">
        <Link href="/account" className="hover:text-cta">
          Account
        </Link>{" "}
        <span aria-hidden>›</span> Puja Bookings
      </nav>
      <h1 className="text-[20px] font-bold text-ink">Your Puja Bookings</h1>

      {loadError && (
        <p className="mt-4 rounded-xl border border-border bg-card px-4 py-3 text-[13px] text-body">
          {loadError}
        </p>
      )}

      {!loadError && bookings.length === 0 && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-[15px] font-bold text-ink">No bookings yet</p>
          <p className="mt-1.5 text-[13px] text-sub">
            When you book a purohit, the booking will show up here with its
            date, slot and cancellation window.
          </p>
          <Link
            href="/pujan-with-purohit"
            className="mt-4 inline-block rounded-lg bg-cta px-5 py-2.5 text-[13.5px] font-bold text-white hover:opacity-90"
          >
            Browse pujas →
          </Link>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3">
        {bookings.map((booking) => {
          const meta = bookingStatusMeta(booking.status);
          const cancellable = now !== null && canCancelBooking(booking, now);
          return (
            <article
              key={booking.bookingNumber}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-[12.5px] font-bold text-body">
                  {booking.bookingNumber}
                </span>
                {booking.createdAt && (
                  <span className="text-[12px] text-sub">
                    Booked {createdCopy(booking.createdAt)}
                  </span>
                )}
                <span
                  className={`ml-auto inline-block rounded-[5px] border px-2 py-[3px] text-[10px] font-bold tracking-[0.4px] ${TONE_CLS[meta.tone]}`}
                >
                  {meta.label.toUpperCase()}
                </span>
              </div>

              <p className="mt-2 text-[14.5px] font-bold text-ink">
                {booking.pujaName} — {booking.variantName}
              </p>
              <p className="mt-0.5 text-[12.5px] text-body">
                with <b>{booking.purohitName}</b> · {formatDay(booking.date)},{" "}
                {booking.slotWindow}
                {booking.kitIncluded ? " · samagri kit included" : ""}
              </p>

              {booking.statusNote && (
                <p className="mt-1 text-[12.5px] text-sub">
                  {booking.statusNote}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border-light pt-3">
                <span className="text-[14px] font-bold text-ink">
                  {formatPaise(booking.pricePaise)}
                </span>
                {cancellable && (
                  <button
                    type="button"
                    onClick={() => setCancelling(booking)}
                    className="ml-auto rounded-lg border border-border bg-bg px-3 py-1.5 text-[12px] font-bold text-body hover:bg-bg/70"
                  >
                    Cancel — free until{" "}
                    {formatDeadline(booking.cancellableUntil)}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <p className="mt-6 text-[12px] leading-relaxed text-sub">
        Booked without signing in? Bookings made with this phone number appear
        here automatically. Your confirmation link also opens any booking with
        its TP- number and the phone it was booked with.
      </p>

      {cancelling && (
        <CancelBookingDialog
          booking={cancelling}
          phone={me.phone}
          open
          onClose={() => setCancelling(null)}
          onCancelled={(updated) =>
            setBookings((list) =>
              list.map((b) =>
                b.bookingNumber === updated.bookingNumber ? updated : b,
              ),
            )
          }
        />
      )}
    </main>
  );
}
