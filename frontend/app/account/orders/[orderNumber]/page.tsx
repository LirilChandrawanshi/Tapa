"use client";

/**
 * /account/orders/[orderNumber] — full order detail with the 4-step timeline,
 * items, address, delivery expectation and fear-free cancellation.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { OtpBottomSheet } from "@/components/auth/OtpBottomSheet";
import { CancelOrderDialog } from "@/components/account/CancelOrderDialog";
import { OrderTimeline } from "@/components/account/OrderTimeline";
import { getMe, type Me } from "@/lib/auth";
import { CIRCLE_WHATSAPP_NUMBER } from "@/lib/staticExtras";
import {
  canCancel,
  claimGuestOrders,
  formatDay,
  formatDeadline,
  formatPaise,
  getMyOrders,
  refuseDelivery,
  statusMeta,
  type OrderView,
} from "@/lib/orders";

export default function OrderDetailPage() {
  const params = useParams<{ orderNumber: string }>();
  const orderNumber = decodeURIComponent(params.orderNumber ?? "");

  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);
  const [order, setOrder] = useState<OrderView | null>(null);
  const [loadError, setLoadError] = useState("");
  const [gateOpen, setGateOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [keepAcknowledged, setKeepAcknowledged] = useState(false);
  const [refusing, setRefusing] = useState(false);

  const load = useCallback(async () => {
    const meRes = await getMe();
    if (!meRes.ok) {
      setMe(null);
      setLoading(false);
      return;
    }
    setMe(meRes.data);
    await claimGuestOrders().catch(() => undefined);
    const res = await getMyOrders();
    if (res.ok) {
      const found =
        (res.data ?? []).find((o) => o.orderNumber === orderNumber) ?? null;
      setOrder(found);
      setLoadError(
        found ? "" : "We couldn't find this order in your account.",
      );
    } else {
      setLoadError(res.message);
    }
    setLoading(false);
  }, [orderNumber]);

  useEffect(() => {
    setNow(new Date());
    void load();
  }, [load]);

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-[680px] px-4 py-10">
        <div className="h-[220px] animate-pulse rounded-2xl border border-border bg-card" />
      </main>
    );
  }

  /* ---------- signed out ---------- */
  if (!me) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-[440px] items-center px-4 py-10">
        <div className="w-full rounded-2xl border border-border bg-card p-7 text-center shadow-sm">
          <h1 className="text-[20px] font-bold text-ink">
            Track order {orderNumber}
          </h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-sub">
            Sign in with the WhatsApp number you ordered with and this order
            will attach to your account automatically.
          </p>
          <button
            type="button"
            onClick={() => setGateOpen(true)}
            className="mt-5 w-full rounded-lg bg-cta py-3 text-[14px] font-bold text-white hover:opacity-90"
          >
            Sign in
          </button>
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

  /* ---------- not found / error ---------- */
  if (!order) {
    return (
      <main className="mx-auto w-full max-w-[680px] px-4 py-10">
        <p className="rounded-2xl border border-border bg-card px-5 py-6 text-center text-[13.5px] text-body">
          {loadError || "We couldn't find this order."}
        </p>
        <p className="mt-4 text-center">
          <Link
            href="/account/orders"
            className="text-[13px] font-bold text-cta hover:underline"
          >
            ← All orders
          </Link>
        </p>
      </main>
    );
  }

  const meta = statusMeta(order.status);
  const cancellable = now !== null && canCancel(order, now);
  const closed =
    order.status === "CANCELLED" ||
    order.status === "REFUND_INITIATED" ||
    order.status === "REFUNDED";
  const alreadyShipped = order.status === "DISPATCHED" || order.status === "DELIVERED";
  // Free cancellation is no longer available, but the order hasn't been cancelled/refunded.
  const windowClosed = now !== null && !cancellable && !closed;
  const talkToUsUrl = `https://wa.me/${CIRCLE_WHATSAPP_NUMBER}?text=${encodeURIComponent(
    `Hi, I have a question about order ${order.orderNumber}.`,
  )}`;

  async function handleRefuse() {
    if (refusing) return;
    setRefusing(true);
    const res = await refuseDelivery(order!.orderNumber, me!.phone);
    setRefusing(false);
    if (res.ok) setOrder(res.data);
  }

  return (
    <main className="mx-auto w-full max-w-[680px] px-4 py-8">
      <nav className="mb-1 text-[12px] text-sub">
        <Link href="/account" className="hover:text-cta">
          Account
        </Link>{" "}
        <span aria-hidden>›</span>{" "}
        <Link href="/account/orders" className="hover:text-cta">
          Orders
        </Link>{" "}
        <span aria-hidden>›</span> {order.orderNumber}
      </nav>

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h1 className="text-[20px] font-bold text-ink">{order.orderNumber}</h1>
        {order.createdAt && (
          <span className="text-[12.5px] text-sub">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        )}
      </div>
      {order.festivalDate && (
        <p className="mt-1 text-[13px] font-semibold text-body">
          Pre-booked · for {formatDay(order.festivalDate)}
        </p>
      )}

      {/* timeline */}
      <section
        id="timeline"
        className="mt-5 rounded-2xl border border-border bg-card px-4 py-5"
      >
        <OrderTimeline order={order} />
        {!closed && order.statusNote && (
          <p className="mt-4 text-center text-[12.5px] text-sub">
            {order.statusNote}
          </p>
        )}
        {!closed && order.expectedDelivery && order.status !== "DELIVERED" && (
          <p className="mt-1 text-center text-[13px] text-body">
            Expected delivery by{" "}
            <b>{formatDay(order.expectedDelivery)}</b>
          </p>
        )}
        {order.status === "DISPATCHED" && order.trackingId && (
          <p className="mt-2 text-center text-[12.5px] text-sub">
            {order.courier ? `${order.courier} · ` : ""}
            Tracking ID{" "}
            <span className="font-mono font-bold text-body">
              {order.trackingId}
            </span>
          </p>
        )}
        {order.status === "CANCELLED" && (
          <p className="mt-3 text-center text-[12.5px] text-sub">
            Your full {formatPaise(order.totalPaise)} refund is being
            processed — it reaches your original payment method in 3–5 working
            days.
          </p>
        )}
        {order.status === "REFUND_INITIATED" && (
          <p className="mt-3 text-center text-[12.5px] text-sub">
            {formatPaise(order.totalPaise)} is on its way back to your original
            payment method (3–5 working days).
          </p>
        )}
        {order.status === "REFUNDED" && (
          <p className="mt-3 text-center text-[12.5px] text-sub">
            {formatPaise(order.totalPaise)} was refunded in full to your
            original payment method.
          </p>
        )}
        {closed && (
          <p className="mt-2 text-center">
            <Link
              href={`/orders/refund?on=${encodeURIComponent(order.orderNumber)}&phone=${encodeURIComponent(me.phone)}`}
              className="text-[13px] font-bold text-cta hover:underline"
            >
              Track this refund ›
            </Link>
          </p>
        )}
      </section>

      {/* delivery delayed — proactive, states the choice plainly */}
      {order.status === "DELAYED" && (
        <section className="mt-4 rounded-2xl border border-pratha-bd bg-pratha-bg px-4 py-4">
          <p className="text-[13.5px] font-bold text-ink">
            Your order is running late
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-sub">
            {order.revisedDeliveryDate
              ? `The courier now expects delivery by ${formatDay(order.revisedDeliveryDate)}.`
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
                className="rounded-lg bg-ink px-4 py-2 text-[12.5px] font-bold text-white"
              >
                Keep the order
              </button>
              <button
                type="button"
                disabled={refusing}
                onClick={() => void handleRefuse()}
                className="rounded-lg border border-border bg-card px-4 py-2 text-[12.5px] font-bold text-body hover:bg-bg/70 disabled:opacity-60"
              >
                {refusing ? "…" : "I will refuse the delivery"}
              </button>
            </div>
          )}
        </section>
      )}

      {/* the four actions (#165) */}
      <section className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <a
          href="#timeline"
          className="rounded-xl border border-border bg-card px-3 py-3 text-center text-[12.5px] font-bold text-body hover:border-cta/60"
        >
          Track
        </a>
        <a
          href={`/api/v1/orders/${encodeURIComponent(order.orderNumber)}/invoice?phone=${encodeURIComponent(me.phone)}`}
          className="rounded-xl border border-border bg-card px-3 py-3 text-center text-[12.5px] font-bold text-body hover:border-cta/60"
        >
          Download invoice
        </a>
        <button
          type="button"
          disabled={!cancellable}
          onClick={() => setCancelOpen(true)}
          title={
            cancellable ? undefined : "The free-cancellation window has closed."
          }
          className="rounded-xl border border-border bg-card px-3 py-3 text-center text-[12.5px] font-bold text-body hover:border-cta/60 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Cancel
        </button>
        <Link
          href={`/help/report-a-problem?on=${encodeURIComponent(order.orderNumber)}&phone=${encodeURIComponent(me.phone)}`}
          className="rounded-xl border border-border bg-card px-3 py-3 text-center text-[12.5px] font-bold text-body hover:border-cta/60"
        >
          Report a problem
        </Link>
      </section>

      {/* items */}
      <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        <h2 className="border-b border-border-light px-4 py-2.5 text-[11px] font-bold uppercase tracking-[1px] text-sub">
          In this order
        </h2>
        <ul className="divide-y divide-border-light">
          {order.items.map((line) => (
            <li
              key={line.productSlug}
              className="flex items-center gap-3 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold text-body">
                  {line.title}
                </p>
                {line.festivalDate && (
                  <p className="mt-[2px] text-[11.5px] text-sub">
                    For {formatDay(line.festivalDate)}
                  </p>
                )}
              </div>
              <span className="text-[12px] text-sub">× {line.qty}</span>
              <span className="w-[76px] text-right text-[13px] font-bold text-body">
                {formatPaise(line.unitPricePaise * line.qty)}
              </span>
            </li>
          ))}
        </ul>
        <dl className="border-t border-border-light px-4 py-3 text-[12.5px]">
          <div className="flex justify-between py-0.5 text-sub">
            <dt>Subtotal</dt>
            <dd>{formatPaise(order.subtotalPaise)}</dd>
          </div>
          <div className="flex justify-between py-0.5 text-sub">
            <dt>Delivery</dt>
            <dd>
              {order.deliveryPaise === 0
                ? "Free"
                : formatPaise(order.deliveryPaise)}
            </dd>
          </div>
          <div className="mt-1 flex justify-between border-t border-border-light pt-2 text-[14px] font-bold text-ink">
            <dt>Total paid</dt>
            <dd>{formatPaise(order.totalPaise)}</dd>
          </div>
        </dl>
      </section>

      {/* address + payment */}
      <section className="mt-4 rounded-2xl border border-border bg-card px-4 py-4">
        <h2 className="text-[11px] font-bold uppercase tracking-[1px] text-sub">
          Delivering to
        </h2>
        <p className="mt-2 text-[13.5px] font-semibold text-body">
          {order.address.name} · {order.address.phone}
        </p>
        <p className="mt-0.5 text-[13px] leading-relaxed text-sub">
          {order.address.line1}
          {order.address.line2 ? `, ${order.address.line2}` : ""},{" "}
          {order.address.city}, {order.address.state} — {order.address.pincode}
        </p>
        <p className="mt-3 border-t border-border-light pt-3 text-[12.5px] text-sub">
          Paid in full online — nothing to pay on delivery.
        </p>
      </section>

      {/* cancel */}
      {cancellable && (
        <section className="mt-4 rounded-2xl border border-border bg-card px-4 py-4">
          <p className="text-[13px] text-body">
            Change of plans? Cancellation is free until{" "}
            <b>{formatDeadline(order.cancellableUntil)}</b> — full{" "}
            {formatPaise(order.totalPaise)} refund, no questions asked.
          </p>
          <button
            type="button"
            onClick={() => setCancelOpen(true)}
            className="mt-3 rounded-lg border border-border bg-bg px-4 py-2 text-[12.5px] font-bold text-body hover:bg-bg/70"
          >
            Cancel this order
          </button>
        </section>
      )}

      {/* cancellation window passed — states the rule, then leaves a route open */}
      {windowClosed && (
        <section className="mt-4 rounded-2xl border border-pratha-bd bg-pratha-bg px-4 py-4">
          <p className="text-[13.5px] font-bold text-ink">
            {alreadyShipped
              ? "This order has already been dispatched, so it can no longer be cancelled."
              : order.cancellableUntil
                ? `The free-cancellation window closed on ${formatDeadline(order.cancellableUntil)}. This order is confirmed and in packing.`
                : "This order can no longer be cancelled."}
          </p>
          <p className="mt-2 text-[12.5px] leading-relaxed text-sub">
            You can still refuse the delivery at the door — it comes back to
            us and the full amount is returned within 3–7 working days of it
            reaching the warehouse. Or accept it and tell us about any damage
            or missing item afterwards.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href="#timeline"
              className="rounded-lg border border-border bg-card px-4 py-2 text-[12.5px] font-bold text-body hover:bg-bg/70"
            >
              Track this order
            </a>
            <a
              href={talkToUsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-border bg-card px-4 py-2 text-[12.5px] font-bold text-body hover:bg-bg/70"
            >
              Talk to us on WhatsApp
            </a>
          </div>
        </section>
      )}

      <CancelOrderDialog
        order={order}
        phone={me.phone}
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onCancelled={setOrder}
      />

      <p className="mt-6 text-center text-[12px] text-sub">
        Need help with this order?{" "}
        <a
          href="mailto:help@thetapaco.com"
          className="font-bold text-cta hover:underline"
        >
          help@thetapaco.com
        </a>
      </p>
      {/* keep the raw status handy for support conversations */}
      <p className="sr-only">Status: {meta.label}</p>
    </main>
  );
}
