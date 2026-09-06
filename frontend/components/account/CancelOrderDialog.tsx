"use client";

/**
 * Fear-free cancellation confirmation. The whole point is that nothing bad
 * happens: full refund, stated plainly, before the buyer commits.
 */

import { useState } from "react";
import {
  cancelOrder,
  formatDeadline,
  formatPaise,
  type OrderView,
} from "@/lib/orders";

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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  async function confirmCancel() {
    if (busy) return;
    setBusy(true);
    setError("");
    const res = await cancelOrder(order.orderNumber, phone);
    setBusy(false);
    if (res.ok) {
      onCancelled(res.data);
      onClose();
    } else {
      setError(res.message);
    }
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
