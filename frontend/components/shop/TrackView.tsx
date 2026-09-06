"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  cancelOrder,
  fetchOrder,
  formatDateMedium,
  formatPaise,
  type OrderView,
} from "@/lib/shop";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "notfound" }
  | { kind: "error"; message: string }
  | { kind: "ready"; order: OrderView };

const STEPS = ["Pre-booked", "Packing", "Dispatched", "Delivered"] as const;

function stepIndex(status: string): number {
  switch (status.toUpperCase()) {
    case "PACKING":
      return 1;
    case "DISPATCHED":
    case "SHIPPED":
    case "OUT_FOR_DELIVERY":
      return 2;
    case "DELIVERED":
      return 3;
    default:
      // PLACED / CONFIRMED / PREBOOKED — money taken, packing not begun.
      return 0;
  }
}

function isDated(order: OrderView): boolean {
  return Boolean(
    order.festivalDate || order.items.some((i) => i.orderByDate || i.festivalDate),
  );
}

/** Guest order tracking — order number + phone, no account needed. */
export function TrackView() {
  const params = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(params.get("on") ?? "");
  const [phone, setPhone] = useState(params.get("phone") ?? "");
  const [state, setState] = useState<State>({ kind: "idle" });
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [justCancelled, setJustCancelled] = useState(false);

  const lookUp = async (on: string, ph: string) => {
    if (!on.trim() || !ph.trim()) return;
    setState({ kind: "loading" });
    setConfirmingCancel(false);
    setJustCancelled(false);
    const r = await fetchOrder(on, ph);
    if (r.ok) setState({ kind: "ready", order: r.data });
    else if (r.status === 404) setState({ kind: "notfound" });
    else setState({ kind: "error", message: r.message });
  };

  // Arriving from the confirmation link — look the order up straight away.
  useEffect(() => {
    const on = params.get("on");
    const ph = params.get("phone");
    if (on && ph) void lookUp(on, ph);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onCancel = async (order: OrderView) => {
    setCancelling(true);
    const r = await cancelOrder(order.orderNumber, phone);
    setCancelling(false);
    setConfirmingCancel(false);
    if (r.ok) {
      setState({ kind: "ready", order: r.data });
      setJustCancelled(true);
    } else {
      setState({ kind: "error", message: r.message });
    }
  };

  return (
    <div className="mx-auto max-w-[620px]">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void lookUp(orderNumber, phone);
        }}
        className="mb-5 rounded-[14px] border border-border bg-card p-[18px]"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[10.5px] font-bold tracking-[0.6px] text-sub uppercase">
              Order number
            </span>
            <input
              type="text"
              placeholder="TK-2026-0001"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="w-full rounded-[9px] border border-border bg-bg px-[13px] py-[10px] text-[13.5px] text-ink outline-none focus:border-cta"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10.5px] font-bold tracking-[0.6px] text-sub uppercase">
              Mobile number
            </span>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="The number the order was placed with"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              className="w-full rounded-[9px] border border-border bg-bg px-[13px] py-[10px] text-[13.5px] text-ink outline-none focus:border-cta"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={state.kind === "loading"}
          className="mt-3 w-full rounded-[10px] bg-ink px-6 py-[11px] text-[13.5px] font-bold text-white disabled:opacity-60 sm:w-auto"
        >
          {state.kind === "loading" ? "Looking it up…" : "Track this order"}
        </button>
        <p className="mt-2 text-[11.5px] text-sub">
          No password and no OTP — the order number and phone are enough.
        </p>
      </form>

      {state.kind === "notfound" && (
        <div className="rounded-[12px] border border-pratha-bd bg-pratha-bg px-4 py-3 text-[13px] text-pratha-fg">
          We couldn&apos;t find that order. Check the order number and the
          phone it was placed with.
        </div>
      )}
      {state.kind === "error" && (
        <div className="rounded-[12px] border border-pratha-bd bg-pratha-bg px-4 py-3 text-[13px] text-pratha-fg">
          {state.message}
        </div>
      )}

      {state.kind === "ready" && (
        <OrderCard
          order={state.order}
          justCancelled={justCancelled}
          confirmingCancel={confirmingCancel}
          cancelling={cancelling}
          onAskCancel={() => setConfirmingCancel(true)}
          onKeep={() => setConfirmingCancel(false)}
          onConfirmCancel={() => void onCancel(state.order)}
        />
      )}
    </div>
  );
}

function OrderCard({
  order,
  justCancelled,
  confirmingCancel,
  cancelling,
  onAskCancel,
  onKeep,
  onConfirmCancel,
}: {
  order: OrderView;
  justCancelled: boolean;
  confirmingCancel: boolean;
  cancelling: boolean;
  onAskCancel: () => void;
  onKeep: () => void;
  onConfirmCancel: () => void;
}) {
  const cancelled = order.status.toUpperCase() === "CANCELLED";
  const current = stepIndex(order.status);
  const withinWindow =
    Boolean(order.cancellableUntil) &&
    Date.now() < new Date(order.cancellableUntil as string).getTime();
  const canCancel = !cancelled && current < 2 && withinWindow;
  const firstStep = isDated(order) ? STEPS[0] : "Order placed";

  return (
    <div className="rounded-[14px] border border-border bg-card p-[18px]">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[16px] font-bold text-ink">{order.orderNumber}</h2>
        <span className="text-[13px] font-semibold text-body">
          {order.statusNote ?? order.status}
        </span>
      </div>

      {cancelled ? (
        <div className="mb-4 rounded-[12px] border border-bhranti-bd bg-bhranti-bg px-4 py-3">
          <p className="text-[13.5px] font-bold text-ink">
            {justCancelled ? "Cancelled — refund initiated" : "This order was cancelled"}
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-sub">
            {formatPaise(order.totalPaise)} returns to the account the payment
            came from, within 5–7 working days. The guide and the samagri list
            stay free — cancelling the pujan does not cancel the ritual.
          </p>
        </div>
      ) : (
        <ol className="mb-4">
          {STEPS.map((step, i) => {
            const label = i === 0 ? firstStep : step;
            const done = i < current;
            const now = i === current;
            return (
              <li key={step} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={`flex size-[22px] items-center justify-center rounded-full text-[11px] font-bold ${
                      done || now
                        ? "bg-dharma-fg text-white"
                        : "border border-border bg-bg text-sub"
                    }`}
                  >
                    {done ? "✓" : i + 1}
                  </span>
                  {i < STEPS.length - 1 && (
                    <span
                      className={`w-[2px] flex-1 ${done ? "bg-dharma-fg" : "bg-border"}`}
                      style={{ minHeight: 18 }}
                    />
                  )}
                </div>
                <div className="pb-4">
                  <p
                    className={`text-[13.5px] ${
                      now ? "font-bold text-ink" : done ? "font-semibold text-body" : "text-sub"
                    }`}
                  >
                    {label}
                  </p>
                  {now && order.statusNote && (
                    <p className="text-[12px] text-sub">{order.statusNote}</p>
                  )}
                  {step === "Delivered" && order.expectedDelivery && (
                    <p className="text-[12px] text-sub">
                      Expected by {formatDateMedium(order.expectedDelivery)}
                    </p>
                  )}
                  {step === "Dispatched" && order.trackingId && (
                    <p className="text-[12px] text-sub">
                      {order.courier ? `${order.courier} · ` : ""}
                      {order.trackingId}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="mb-4 rounded-[11px] bg-bg px-4 py-3">
        <p className="mb-1 text-[10px] font-bold tracking-[0.8px] text-sub uppercase">
          Delivery address
        </p>
        <p className="text-[13px] leading-relaxed text-body">
          {order.address.name} · {order.address.phone}
          <br />
          {order.address.line1}, {order.address.line2}
          <br />
          {order.address.city}, {order.address.state} — {order.address.pincode}
        </p>
      </div>

      <ul className="mb-3 space-y-2 text-[13px]">
        {order.items.map((item) => (
          <li key={item.productSlug} className="flex justify-between gap-3">
            <span className="text-body">
              {item.title}
              {item.qty > 1 && <span className="text-sub"> × {item.qty}</span>}
            </span>
            <span className="font-semibold whitespace-nowrap text-ink">
              {formatPaise(item.unitPricePaise * item.qty)}
            </span>
          </li>
        ))}
      </ul>
      <dl className="space-y-[6px] border-t border-border pt-3 text-[13px]">
        <div className="flex justify-between">
          <dt className="text-sub">Subtotal</dt>
          <dd className="font-semibold text-ink">{formatPaise(order.subtotalPaise)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-sub">Delivery</dt>
          <dd className={order.deliveryPaise === 0 ? "font-bold text-dharma-fg" : "font-semibold text-ink"}>
            {order.deliveryPaise === 0 ? "Free" : formatPaise(order.deliveryPaise)}
          </dd>
        </div>
        <div className="flex justify-between border-t border-border pt-2 text-[14.5px] font-bold text-ink">
          <dt>Total paid</dt>
          <dd>{formatPaise(order.totalPaise)}</dd>
        </div>
      </dl>

      {canCancel && (
        <div className="mt-4 border-t border-border pt-4">
          {confirmingCancel ? (
            <div className="rounded-[11px] border border-bhranti-bd bg-bhranti-bg px-4 py-3">
              <p className="mb-2 text-[13px] font-bold text-ink">
                Cancel this order? The full {formatPaise(order.totalPaise)}
                {" "}returns to the account the payment came from.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onConfirmCancel}
                  disabled={cancelling}
                  className="rounded-[9px] bg-cta px-4 py-[9px] text-[12.5px] font-bold text-white disabled:opacity-60"
                >
                  {cancelling ? "Cancelling…" : "Yes, cancel and refund"}
                </button>
                <button
                  type="button"
                  onClick={onKeep}
                  disabled={cancelling}
                  className="rounded-[9px] border border-border bg-card px-4 py-[9px] text-[12.5px] font-bold text-body"
                >
                  Keep the order
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onAskCancel}
              className="text-[13px] font-bold text-cta"
            >
              Cancel this order ›
            </button>
          )}
          {order.cancellableUntil && !confirmingCancel && (
            <p className="mt-1 text-[11.5px] text-sub">
              Free to cancel until{" "}
              {new Intl.DateTimeFormat("en-IN", {
                day: "numeric",
                month: "long",
                hour: "numeric",
                minute: "2-digit",
                timeZone: "Asia/Kolkata",
              }).format(new Date(order.cancellableUntil))}
              .
            </p>
          )}
        </div>
      )}
    </div>
  );
}
