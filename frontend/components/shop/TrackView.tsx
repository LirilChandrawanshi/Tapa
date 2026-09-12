"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  cancelOrder,
  fetchOrder,
  formatDateMedium,
  formatPaise,
  refuseDelivery,
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
    case "DELAYED":
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
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState(params.get("on") ?? "");
  const [phone, setPhone] = useState(params.get("phone") ?? "");
  const [state, setState] = useState<State>({ kind: "idle" });
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const lookUp = async (on: string, ph: string) => {
    if (!on.trim() || !ph.trim()) return;
    setState({ kind: "loading" });
    setConfirmingCancel(false);
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
      // the cancelled page carries the refund facts + the guide-stays-free pair
      router.push(
        `/orders/cancelled?on=${encodeURIComponent(order.orderNumber)}&phone=${encodeURIComponent(phone)}`,
      );
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
          phone={phone}
          confirmingCancel={confirmingCancel}
          cancelling={cancelling}
          onAskCancel={() => setConfirmingCancel(true)}
          onKeep={() => setConfirmingCancel(false)}
          onConfirmCancel={() => void onCancel(state.order)}
          onOrderUpdated={(order) => setState({ kind: "ready", order })}
        />
      )}
    </div>
  );
}

function OrderCard({
  order,
  phone,
  confirmingCancel,
  cancelling,
  onAskCancel,
  onKeep,
  onConfirmCancel,
  onOrderUpdated,
}: {
  order: OrderView;
  phone: string;
  confirmingCancel: boolean;
  cancelling: boolean;
  onAskCancel: () => void;
  onKeep: () => void;
  onConfirmCancel: () => void;
  onOrderUpdated: (order: OrderView) => void;
}) {
  const [keepAcknowledged, setKeepAcknowledged] = useState(false);
  const [refusing, setRefusing] = useState(false);

  async function handleRefuse() {
    if (refusing) return;
    setRefusing(true);
    const res = await refuseDelivery(order.orderNumber, phone);
    setRefusing(false);
    if (res.ok) onOrderUpdated(res.data);
  }

  const cancelled = ["CANCELLED", "REFUND_INITIATED", "REFUNDED"].includes(
    order.status.toUpperCase(),
  );
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
            This order was cancelled
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-sub">
            {formatPaise(order.totalPaise)} returns to the account the payment
            came from, within 3–5 working days. The guide and the samagri list
            stay free — cancelling the pujan does not cancel the ritual.
          </p>
          <Link
            href={`/orders/refund?on=${encodeURIComponent(order.orderNumber)}&phone=${encodeURIComponent(phone)}`}
            className="mt-2 inline-block text-[12.5px] font-bold text-cta"
          >
            Track this refund ›
          </Link>
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

      {/* delivery delayed — proactive, states the choice plainly */}
      {order.status.toUpperCase() === "DELAYED" && (
        <div className="mb-4 rounded-[12px] border border-pratha-bd bg-pratha-bg px-4 py-3">
          <p className="text-[13.5px] font-bold text-ink">
            Your order is running late
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-sub">
            {order.revisedDeliveryDate
              ? `The courier now expects delivery by ${formatDateMedium(order.revisedDeliveryDate)}.`
              : "We're waiting on a revised delivery date from the courier."}{" "}
            Keep the order, or refuse it at the door — it comes back to us
            and the full amount is returned within 3–7 working days of it
            reaching the warehouse.
          </p>
          {order.refusalRequested ? (
            <p className="mt-2 text-[12.5px] font-semibold text-body">
              Noted — we&apos;ll start the refund once it&apos;s back with us.
            </p>
          ) : keepAcknowledged ? (
            <p className="mt-2 text-[12.5px] font-semibold text-body">
              Good — no action needed, we&apos;ll keep you posted.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setKeepAcknowledged(true)}
                className="rounded-[9px] bg-ink px-4 py-[9px] text-[12.5px] font-bold text-white"
              >
                Keep the order
              </button>
              <button
                type="button"
                disabled={refusing}
                onClick={() => void handleRefuse()}
                className="rounded-[9px] border border-border bg-card px-4 py-[9px] text-[12.5px] font-bold text-body disabled:opacity-60"
              >
                {refusing ? "…" : "I will refuse the delivery"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* courier + tracking id, whenever the courier has it (#174) */}
      {!cancelled && order.trackingId && (
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2 rounded-[11px] bg-bg px-4 py-3">
          <p className="text-[10px] font-bold tracking-[0.8px] text-sub uppercase">
            {order.courier ? order.courier : "Courier"}
          </p>
          <p className="font-mono text-[13px] font-bold text-ink">
            {order.trackingId}
          </p>
        </div>
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

      {/* something wrong with what arrived? */}
      <div className="mt-4 border-t border-border pt-4">
        <Link
          href={`/help/report-a-problem?on=${encodeURIComponent(order.orderNumber)}&phone=${encodeURIComponent(phone)}`}
          className="text-[13px] font-bold text-cta"
        >
          Report a problem ›
        </Link>
        <p className="mt-1 text-[11.5px] text-sub">
          Damaged box, broken or missing item — item-level replacement
          first, within one working day.
        </p>
      </div>
    </div>
  );
}
