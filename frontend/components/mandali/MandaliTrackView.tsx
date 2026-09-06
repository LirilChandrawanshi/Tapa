"use client";

/**
 * Guest tracking for mandali requests: TM- number + the phone it was made
 * with. Status card in plain words per state, and a fear-free cancel while
 * REQUESTED/CONFIRMED — nothing was paid, so nothing is refunded.
 */

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  canCancelMandaliRequest,
  cancelMandaliRequest,
  fetchMandaliRequest,
  formatDay,
  formatPaise,
  guestBucketLabel,
  mandaliStatusMeta,
  venueLabel,
  type MandaliRequestView,
  type MandaliTone,
} from "@/lib/mandali";

const INPUT_CLS =
  "w-full rounded-[10px] border border-border bg-card px-3.5 py-2.5 text-[13.5px] text-ink outline-none focus:border-cta";

const TONE_CLS: Record<MandaliTone, string> = {
  good: "bg-dharma-bg text-dharma-fg border-dharma-bd",
  progress: "bg-pratha-bg text-pratha-fg border-pratha-bd",
  attention: "bg-card text-cta border-cta",
  neutral: "bg-bg text-sub border-border",
};

/** The plain-words explanation per state — never just the enum. */
function statusCopy(request: MandaliRequestView): string {
  switch (request.status) {
    case "REQUESTED":
      return "We're confirming availability and the final quote — expect our WhatsApp message within 24 hours of your request.";
    case "CONFIRMED":
      return request.quotedPricePaise
        ? `Your mandali is confirmed at ${formatPaise(request.quotedPricePaise)}. Our team will collect payment on the confirmation call — nothing to do online.`
        : "Your mandali is confirmed. Our team will share the final quote and collect payment on the confirmation call.";
    case "DECLINED":
      return "We couldn't arrange a mandali for that date — it happens in festival season. Try another date and we'll do our best, or chat with us on WhatsApp.";
    case "COMPLETED":
      return "The mandali visit is complete. Thank you for having them — we hope the evening was full of bhakti.";
    case "CANCELLED":
      return "This request was cancelled. Nothing was charged.";
  }
}

export function MandaliTrackView() {
  const params = useSearchParams();
  const [tm, setTm] = useState(params.get("tm") ?? "");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [request, setRequest] = useState<MandaliRequestView | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelError, setCancelError] = useState("");

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError("");
    setRequest(null);
    if (!tm.trim() || !phone.trim()) {
      setError("Enter the TM- request number and the mobile number it was made with.");
      return;
    }
    setBusy(true);
    const res = await fetchMandaliRequest(tm, phone);
    setBusy(false);
    if (res.ok) {
      setRequest(res.data);
    } else {
      setError(
        res.status === 404
          ? "We couldn't find that request. Check the TM- number and that the phone matches the one used to request."
          : res.message,
      );
    }
  }

  async function doCancel() {
    if (!request || cancelBusy) return;
    setCancelBusy(true);
    setCancelError("");
    const res = await cancelMandaliRequest(request.requestNumber, phone);
    setCancelBusy(false);
    if (res.ok) {
      setRequest(res.data);
      setConfirmingCancel(false);
    } else {
      setCancelError(res.message);
    }
  }

  const meta = request ? mandaliStatusMeta(request.status) : null;

  return (
    <div>
      <form
        onSubmit={lookup}
        className="rounded-[14px] border border-border bg-card p-5"
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="t-tm"
              className="mb-1 block text-[11px] font-bold tracking-[0.6px] text-sub uppercase"
            >
              Request number
            </label>
            <input
              id="t-tm"
              value={tm}
              onChange={(e) => setTm(e.target.value)}
              placeholder="TM-2026-0001"
              className={`${INPUT_CLS} font-mono`}
            />
          </div>
          <div>
            <label
              htmlFor="t-phone"
              className="mb-1 block text-[11px] font-bold tracking-[0.6px] text-sub uppercase"
            >
              Mobile number
            </label>
            <input
              id="t-phone"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone used for the request"
              className={INPUT_CLS}
            />
          </div>
        </div>
        {error && (
          <p
            role="alert"
            className="mt-3 rounded-[10px] border border-border bg-bg px-4 py-2.5 text-[13px] text-body"
          >
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="mt-4 w-full rounded-[12px] bg-cta py-3 text-[14px] font-bold text-white hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Looking up…" : "Track request"}
        </button>
      </form>

      {request && meta && (
        <section className="mt-5 rounded-[14px] border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-[13.5px] font-bold text-ink">
              {request.requestNumber}
            </p>
            <span
              className={`inline-block rounded-[6px] border px-2.5 py-1 text-[11px] font-bold ${TONE_CLS[meta.tone]}`}
            >
              {meta.label}
            </span>
          </div>

          <p className="mt-3 text-[13.5px] leading-relaxed text-body">
            {statusCopy(request)}
          </p>

          {request.status === "CONFIRMED" && request.quotedPricePaise != null && (
            <p className="mt-3 rounded-[10px] bg-bg px-4 py-3 text-[14px] font-bold text-ink">
              Confirmed quote: {formatPaise(request.quotedPricePaise)}
            </p>
          )}

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-4 text-[12.5px]">
            {(
              [
                ["Mandali", request.mandaliName],
                ["Date", formatDay(request.date)],
                ["Venue", venueLabel(request.venueType)],
                ["Guests", guestBucketLabel(request.expectedGuests)],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <dt className="text-[10.5px] font-bold tracking-[0.6px] text-sub uppercase">
                  {label}
                </dt>
                <dd className="text-body">{value}</dd>
              </div>
            ))}
          </dl>

          {canCancelMandaliRequest(request) && (
            <div className="mt-4 border-t border-border pt-4">
              {confirmingCancel ? (
                <div className="rounded-[10px] border border-border bg-bg p-4">
                  <p className="text-[13.5px] font-bold text-ink">
                    Cancel request {request.requestNumber}?
                  </p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-body">
                    No charges, no questions — nothing was paid, so there is
                    nothing to refund.
                  </p>
                  {cancelError && (
                    <p className="mt-2 text-[12.5px] text-body">{cancelError}</p>
                  )}
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      disabled={cancelBusy}
                      onClick={() => void doCancel()}
                      className="flex-1 rounded-[10px] border border-border bg-card py-2.5 text-[13px] font-bold text-body hover:bg-bg disabled:opacity-50"
                    >
                      {cancelBusy ? "Cancelling…" : "Yes, cancel my request"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingCancel(false)}
                      className="flex-1 rounded-[10px] bg-cta py-2.5 text-[13px] font-bold text-white hover:opacity-90"
                    >
                      Keep my request
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingCancel(true)}
                  className="text-[13px] font-semibold text-sub hover:text-body hover:underline"
                >
                  Cancel this request
                </button>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
