"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getMe } from "@/lib/auth";
import { claimGuestOrders } from "@/lib/orders";
import { OtpFlow } from "@/components/auth/OtpFlow";
import { WhatsAppNudge } from "@/components/WhatsAppNudge";
import {
  fetchOrder,
  formatDateLong,
  formatDateMedium,
  formatPaise,
  type OrderView,
} from "@/lib/shop";

/** A pre-booked (dated) order vs a standard all-year one — different confirmations. */
function isDated(order: OrderView): boolean {
  return Boolean(
    order.festivalDate || order.items.some((i) => i.orderByDate || i.festivalDate),
  );
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(d);
}

function StepDot({ state }: { state: "done" | "now" | "upcoming" }) {
  return (
    <span
      aria-hidden
      className={`mt-[3px] size-[10px] shrink-0 rounded-full ${
        state === "done"
          ? "bg-dharma-fg"
          : state === "now"
            ? "bg-cta ring-[3px] ring-bhranti-bg"
            : "border border-border bg-bg"
      }`}
    />
  );
}

type State =
  | { kind: "loading" }
  | { kind: "missing" }
  | { kind: "error" }
  | { kind: "ready"; order: OrderView };

/** Order confirmation — reads ?on= & ?phone= and fetches the order. */
export function ConfirmedView() {
  const params = useSearchParams();
  const orderNumber = params.get("on") ?? "";
  const phone = params.get("phone") ?? "";
  const [state, setState] = useState<State>({ kind: "loading" });
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [claimed, setClaimed] = useState(false);
  const [showOtp, setShowOtp] = useState(false);

  useEffect(() => {
    if (!orderNumber || !phone) {
      setState({ kind: "missing" });
      return;
    }
    void fetchOrder(orderNumber, phone).then((r) =>
      setState(r.ok ? { kind: "ready", order: r.data } : { kind: "error" }),
    );
    void getMe().then((r) => setSignedIn(r.ok));
  }, [orderNumber, phone]);

  if (state.kind === "loading") {
    return <p className="py-14 text-center text-[13.5px] text-sub">Fetching your order…</p>;
  }

  if (state.kind === "missing" || state.kind === "error") {
    return (
      <div className="mx-auto max-w-[440px] py-14 text-center">
        <h2 className="mb-2 text-xl font-bold text-ink">
          We couldn&apos;t open this confirmation
        </h2>
        <p className="mb-5 text-[13.5px] leading-relaxed text-sub">
          If you just paid, your order is safe — track it with the order
          number and the phone it was placed with.
        </p>
        <Link
          href="/orders/track"
          className="inline-block rounded-[10px] bg-ink px-6 py-[11px] text-[13.5px] font-bold text-white"
        >
          Track an order ›
        </Link>
      </div>
    );
  }

  const { order } = state;
  const first = order.items[0];
  const festival = order.festivalDate ?? order.items.find((i) => i.festivalDate)?.festivalDate;
  const dated = isDated(order);
  const earliestOrderBy = order.items
    .map((i) => i.orderByDate)
    .filter((d): d is string => Boolean(d))
    .sort()[0];

  const trackHref = `/orders/track?on=${encodeURIComponent(order.orderNumber)}&phone=${encodeURIComponent(phone)}`;
  // The order only carries the product slug, not the linked guide's article slug — browse is the safe link.
  const guideHref = "/ritual-guides";

  const cancelLine = order.cancellableUntil ? (
    <p className="mt-3 border-t border-border-light pt-3 text-[12px] text-sub">
      Cancel free until{" "}
      {new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "long",
        hour: "numeric",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      }).format(new Date(order.cancellableUntil))}
      . Stated here so it never has to be hunted for.
    </p>
  ) : null;

  return (
    <div className="mx-auto max-w-[620px]">
      <div className="mb-5 text-center">
        <p
          aria-hidden
          className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-dharma-bg text-xl text-dharma-fg"
        >
          ✓
        </p>
        <h1 className="mb-1 text-2xl font-bold tracking-[-0.4px] text-ink">
          {dated ? "Pre-booking confirmed" : "Order confirmed"}
        </h1>
        {first && (
          <p className="text-[15px] text-body">
            Your <b>{first.title}</b> is on its way
          </p>
        )}
        <p className="mt-2 text-[13px] text-sub">
          Order {order.orderNumber} · {formatPaise(order.totalPaise)} paid
        </p>
        {order.expectedDelivery && (
          <p className="mt-1 text-[13.5px] font-semibold text-ink">
            Expected by {formatDateMedium(order.expectedDelivery)} ·{" "}
            {order.address.city}
          </p>
        )}
      </div>

      {/* Dated orders get the full wait-carrying timeline; standard orders get a short summary (#Flow-9/10) */}
      {dated ? (
        <div className="mb-4 rounded-[14px] border border-border bg-card p-[18px]">
          <p className="mb-3 text-[10px] font-bold tracking-[0.8px] text-sub uppercase">
            What happens next
          </p>
          <ol className="space-y-3">
            <li className="flex gap-3 text-[13px] leading-relaxed">
              <StepDot state="done" />
              <span>
                <b className="block text-ink">Payment received</b>
                <span className="text-sub">{formatDateTime(order.createdAt)}</span>
              </span>
            </li>
            <li className="flex gap-3 text-[13px] leading-relaxed">
              <StepDot state="now" />
              <span>
                <b className="block text-ink">Packing begins</b>
                <span className="text-sub">
                  {earliestOrderBy
                    ? `${formatDateLong(earliestOrderBy)} — after the cut-off closes`
                    : "Once the cut-off closes"}
                </span>
              </span>
            </li>
            <li className="flex gap-3 text-[13px] leading-relaxed">
              <StepDot state="upcoming" />
              <span>
                <b className="block text-ink">Dispatched</b>
                <span className="text-sub">Tracking sent on WhatsApp</span>
              </span>
            </li>
            <li className="flex gap-3 text-[13px] leading-relaxed">
              <StepDot state="upcoming" />
              <span>
                <b className="block text-ink">Delivered</b>
                <span className="text-sub">
                  {order.expectedDelivery
                    ? `By ${formatDateMedium(order.expectedDelivery)}${festival ? " — before the puja" : ""}`
                    : "Date to follow"}
                </span>
              </span>
            </li>
          </ol>
          {cancelLine}
        </div>
      ) : (
        <div className="mb-4 rounded-[14px] border border-border bg-card p-[18px]">
          <dl className="space-y-[7px] text-[13px]">
            {order.items.map((item) => (
              <div key={item.productSlug} className="flex justify-between gap-3">
                <dt className="text-body">
                  {item.title}
                  {item.qty > 1 && <span className="text-sub"> × {item.qty}</span>}
                </dt>
                <dd className="font-semibold whitespace-nowrap text-ink">
                  {formatPaise(item.unitPricePaise * item.qty)}
                </dd>
              </div>
            ))}
            <div className="flex justify-between border-t border-border-light pt-2">
              <dt className="text-sub">Payment</dt>
              <dd className="font-semibold text-ink">Paid</dd>
            </div>
            {order.expectedDelivery && (
              <div className="flex justify-between">
                <dt className="text-sub">Arriving</dt>
                <dd className="font-semibold text-ink">
                  {formatDateMedium(order.expectedDelivery)}
                </dd>
              </div>
            )}
          </dl>
          {cancelLine}
        </div>
      )}

      {dated ? (
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          <Link
            href={guideHref}
            className="rounded-[10px] bg-ink px-5 py-[11px] text-center text-[13.5px] font-bold text-white"
          >
            Read the guide ›
          </Link>
          <Link
            href={trackHref}
            className="rounded-[10px] border border-border bg-card px-5 py-[11px] text-center text-[13.5px] font-bold text-body"
          >
            Track this order ›
          </Link>
        </div>
      ) : (
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          <Link
            href={trackHref}
            className="rounded-[10px] bg-ink px-5 py-[11px] text-center text-[13.5px] font-bold text-white"
          >
            Track this order ›
          </Link>
          <Link
            href={guideHref}
            className="rounded-[10px] border border-border bg-card px-5 py-[11px] text-center text-[13.5px] font-bold text-body"
          >
            Read the guide ›
          </Link>
        </div>
      )}

      {/* Keep-this-order card — one inline OTP, never a wall (#164/#185). */}
      {signedIn === false && (
        <div className="mb-4 rounded-[14px] border border-border bg-card p-[18px]">
          {!showOtp ? (
            <>
              <p className="mb-1 text-[13.5px] font-bold text-ink">
                Keep this order on your account
              </p>
              <p className="mb-3 text-[12.5px] leading-relaxed text-sub">
                One OTP attaches this order to your account — tracking,
                invoice and cancellation in one place. No password, no form.
                Use the number this order was placed with:{" "}
                <b className="text-body">+91 {phone}</b>.
              </p>
              <button
                type="button"
                onClick={() => setShowOtp(true)}
                className="inline-block rounded-[9px] bg-ink px-5 py-[9px] text-[12.5px] font-bold text-white"
              >
                Sign in with OTP ›
              </button>
            </>
          ) : (
            <OtpFlow
              context="signin"
              heading="Keep this order on your account"
              onSuccess={() => {
                setSignedIn(true);
                setClaimed(true);
                // attaches every guest order on this phone — safe to call often
                void claimGuestOrders();
              }}
              onDismiss={() => setShowOtp(false)}
              dismissLabel="Not now — the order is safe either way"
            />
          )}
        </div>
      )}
      {signedIn === true && (
        <div className="mb-4 rounded-[14px] border border-border bg-card p-[18px]">
          <p className="text-[13px] text-body">
            {claimed ? "Done — no password, ever." : "This order is saved to your account."}{" "}
            <Link
              href={`/account/orders/${encodeURIComponent(order.orderNumber)}`}
              className="font-bold text-cta"
            >
              {claimed ? "Order attached to your account ›" : "View your orders ›"}
            </Link>
          </p>
        </div>
      )}

      <WhatsAppNudge copy="Get dispatch and delivery updates for this order on WhatsApp." />
    </div>
  );
}
