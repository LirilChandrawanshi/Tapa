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

  const nextSteps = [
    "We'll message you the moment it's dispatched, with tracking.",
    "The kit arrives with the printed ritual card inside — lay it out before you begin.",
    festival
      ? `A reminder lands before ${formatDateLong(festival)}, with the free guide attached.`
      : "The free guide stays on the knowledge layer whenever you need it.",
  ];

  const trackHref = `/orders/track?on=${encodeURIComponent(order.orderNumber)}&phone=${encodeURIComponent(phone)}`;

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
          Order placed ✓
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

      <div className="mb-4 rounded-[14px] border border-border bg-card p-[18px]">
        <p className="mb-3 text-[10px] font-bold tracking-[0.8px] text-sub uppercase">
          What happens next
        </p>
        <ol className="space-y-[10px]">
          {nextSteps.map((step, i) => (
            <li key={step} className="flex gap-3 text-[13px] leading-relaxed text-body">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-bg text-[10.5px] font-bold text-gold">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        {order.cancellableUntil && (
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
        )}
      </div>

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

      <p className="text-center">
        <Link href={trackHref} className="text-[13.5px] font-bold text-cta">
          Track this order ›
        </Link>
      </p>
    </div>
  );
}
