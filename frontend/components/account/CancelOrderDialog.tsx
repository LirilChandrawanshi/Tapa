"use client";

/**
 * Fear-free cancellation confirmation. The whole point is that nothing bad
 * happens: full refund, stated plainly, before the buyer commits. An optional
 * reason picker (#161) rides along — never required, never a gate. On success
 * the buyer lands on /orders/cancelled with the refund facts and the
 * guide-stays-free pair.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  cancelOrder,
  formatDeadline,
  formatPaise,
  type OrderView,
} from "@/lib/orders";

/** Optional reasons — plain words, no interrogation. */
const CANCEL_REASONS = [
  "Ordered by mistake",
  "Buying samagri myself",
  "Plans changed",
  "Something else",
] as const;

export function CancelOrderDialog({
  order,
  phone,
  open,
  onClose,
  onCancelled,
}: {
  order: OrderView;
  /** The account phone — the API double-checks ownership with it. */
  phone: string;
  open: boolean;
  onClose: () => void;
  onCancelled: (updated: OrderView) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reason, setReason] = useState<string | null>(null);

  if (!open) return null;

  async function confirmCancel() {
    if (busy) return;
    setBusy(true);
    setError("");
    const res = await cancelOrder(order.orderNumber, phone, reason ?? undefined);
    if (res.ok) {
      onCancelled(res.data);
      onClose();
      router.push(
        `/orders/cancelled?on=${encodeURIComponent(order.orderNumber)}&phone=${encodeURIComponent(phone)}`,
      );
      return;
    }
    setBusy(false);
    setError(res.message);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cancel-order-title"
    >
      <button
        aria-label="Keep my order"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[420px] rounded-t-2xl border border-border bg-card p-6 shadow-xl sm:rounded-2xl">
        <h2 id="cancel-order-title" className="text-[17px] font-bold text-ink">
          Cancel order {order.orderNumber}?
        </h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-body">
          No charges, no questions. Full{" "}
          <b>{formatPaise(order.totalPaise)} refund</b> to your original payment
          method within 3–5 working days.
        </p>
        {order.cancellableUntil && (
          <p className="mt-1.5 text-[12.5px] text-sub">
            Free cancellation is open until{" "}
            {formatDeadline(order.cancellableUntil)}.
          </p>
        )}

        <fieldset className="mt-4">
          <legend className="mb-2 text-[11px] font-bold uppercase tracking-[0.8px] text-sub">
            Why are you cancelling? (optional)
          </legend>
          <div className="flex flex-wrap gap-2">
            {CANCEL_REASONS.map((r) => {
              const on = reason === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(on ? null : r)}
                  aria-pressed={on}
                  className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold ${
                    on
                      ? "border-cta bg-bhranti-bg text-ink"
                      : "border-border bg-bg text-body hover:border-cta/50"
                  }`}
                >
                  {r}
                </button>
              );
            })}
          </div>
        </fieldset>

        {error && (
          <p className="mt-3 rounded-lg border border-border bg-bg px-3 py-2 text-[12.5px] text-body">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void confirmCancel()}
            className="w-full rounded-lg border border-border bg-bg py-2.5 text-[13.5px] font-bold text-body hover:bg-bg/70 disabled:opacity-50"
          >
            {busy ? "Cancelling…" : "Yes, cancel and refund me"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-lg bg-cta py-2.5 text-[13.5px] font-bold text-white hover:opacity-90"
          >
            Keep my order
          </button>
        </div>
      </div>
    </div>
  );
}
