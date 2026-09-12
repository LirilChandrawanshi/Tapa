"use client";

/**
 * /account/orders — order history (P2-M4).
 *
 * On load we silently claim guest orders (phone is the identity key, so
 * anything ordered without signing in attaches here), then list newest first.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CountdownPill } from "@/components/CountdownPill";
import { OtpBottomSheet } from "@/components/auth/OtpBottomSheet";
import { CancelOrderDialog } from "@/components/account/CancelOrderDialog";
import { getMe, type Me } from "@/lib/auth";
import { addToCart } from "@/lib/shop";
import {
  canCancel,
  claimGuestOrders,
  formatDay,
  formatDeadline,
  formatPaise,
  getMyOrders,
  statusMeta,
  type OrderView,
  type StatusTone,
} from "@/lib/orders";

const TONE_CLS: Record<StatusTone, string> = {
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

export default function AccountOrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);
  const [orders, setOrders] = useState<OrderView[]>([]);
  const [loadError, setLoadError] = useState("");
  const [gateOpen, setGateOpen] = useState(false);
  const [cancelling, setCancelling] = useState<OrderView | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  const load = useCallback(async () => {
    const meRes = await getMe();
    if (!meRes.ok) {
      setMe(null);
      setOrders([]);
      setLoading(false);
      return;
    }
    setMe(meRes.data);
    // Attach any guest orders placed with this phone — best-effort, silent.
    await claimGuestOrders().catch(() => undefined);
    const res = await getMyOrders();
    if (res.ok) {
      setOrders(res.data ?? []);
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

  function reorder(order: OrderView) {
    order.items.forEach((line) => addToCart(line.productSlug, line.qty));
    router.push("/cart");
  }

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
            📦
          </div>
          <h1 className="mt-4 text-[20px] font-bold text-ink">Your orders</h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-sub">
            Sign in with your WhatsApp number to see every kit you have
            ordered — including orders placed without an account.
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
        <span aria-hidden>›</span> Orders
      </nav>
      <h1 className="text-[20px] font-bold text-ink">Your Orders</h1>

      {loadError && (
        <p className="mt-4 rounded-xl border border-border bg-card px-4 py-3 text-[13px] text-body">
          {loadError}
        </p>
      )}

      {!loadError && orders.length === 0 && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-[15px] font-bold text-ink">No orders yet</p>
          <p className="mt-1.5 text-[13px] text-sub">
            When you order a Ritual Pujan kit, it will show up here with live
            tracking.
          </p>
          <Link
            href="/ritual-pujans"
            className="mt-4 inline-block rounded-lg bg-cta px-5 py-2.5 text-[13.5px] font-bold text-white hover:opacity-90"
          >
            Browse Ritual Pujans →
          </Link>
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3">
        {orders.map((order) => {
          const meta = statusMeta(order.status);
          const firstTitle = order.items[0]?.title ?? "Ritual kit";
          const more = order.items.length - 1;
          const cancellable = now !== null && canCancel(order, now);
          return (
            <article
              key={order.orderNumber}
              className="rounded-2xl border border-border bg-card p-4"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-[12.5px] font-bold text-body">
                  {order.orderNumber}
                </span>
                {order.createdAt && (
                  <span className="text-[12px] text-sub">
                    Placed {createdCopy(order.createdAt)}
                  </span>
                )}
                <span
                  className={`ml-auto inline-block rounded-[5px] border px-2 py-[3px] text-[10px] font-bold tracking-[0.4px] ${TONE_CLS[meta.tone]}`}
                >
                  {meta.label.toUpperCase()}
                </span>
              </div>

              <p className="mt-2 text-[14.5px] font-bold text-ink">
                {firstTitle}
                {more > 0 && (
                  <span className="font-semibold text-sub"> +{more} more</span>
                )}
              </p>

              {order.festivalDate && (
                <p className="mt-1 flex items-center gap-2 text-[12.5px] font-semibold text-body">
                  Pre-booked · for {formatDay(order.festivalDate)}
                  {now && (
                    <CountdownPill date={order.festivalDate} now={now} />
                  )}
                </p>
              )}

              {order.statusNote && (
                <p className="mt-1 text-[12.5px] text-sub">
                  {order.statusNote}
                </p>
              )}
              {order.expectedDelivery &&
                order.status !== "DELIVERED" &&
                order.status !== "CANCELLED" &&
                order.status !== "REFUND_INITIATED" &&
                order.status !== "REFUNDED" && (
                  <p className="mt-0.5 text-[12.5px] text-sub">
                    Expected delivery by{" "}
                    <b className="text-body">
                      {formatDay(order.expectedDelivery)}
                    </b>
                  </p>
                )}

              <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border-light pt-3">
                <span className="text-[14px] font-bold text-ink">
                  {formatPaise(order.totalPaise)}
                </span>
                <span className="ml-auto flex flex-wrap items-center gap-2">
                  {cancellable && (
                    <button
                      type="button"
                      onClick={() => setCancelling(order)}
                      className="rounded-lg border border-border bg-bg px-3 py-1.5 text-[12px] font-bold text-body hover:bg-bg/70"
                    >
                      Cancel — free until{" "}
                      {formatDeadline(order.cancellableUntil)}
                    </button>
                  )}
                  {order.status === "DELIVERED" && (
                    <button
                      type="button"
                      onClick={() => reorder(order)}
                      className="rounded-lg border border-border bg-bg px-3 py-1.5 text-[12px] font-bold text-body hover:bg-bg/70"
                    >
                      Reorder
                    </button>
                  )}
                  <a
                    href={`/api/v1/orders/${encodeURIComponent(order.orderNumber)}/invoice?phone=${encodeURIComponent(me.phone)}`}
                    className="rounded-lg border border-border bg-bg px-3 py-1.5 text-[12px] font-bold text-body hover:bg-bg/70"
                  >
                    Invoice
                  </a>
                  <Link
                    href={`/account/orders/${order.orderNumber}`}
                    className="rounded-lg bg-cta px-4 py-1.5 text-[12px] font-bold text-white hover:opacity-90"
                  >
                    Track →
                  </Link>
                </span>
              </div>
            </article>
          );
        })}
      </div>

      {cancelling && (
        <CancelOrderDialog
          order={cancelling}
          phone={me.phone}
          open
          onClose={() => setCancelling(null)}
          onCancelled={(updated) =>
            setOrders((list) =>
              list.map((o) =>
                o.orderNumber === updated.orderNumber ? updated : o,
              ),
            )
          }
        />
      )}
    </main>
  );
}
