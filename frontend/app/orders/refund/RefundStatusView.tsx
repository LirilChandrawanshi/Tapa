"use client";

/**
 * Refund status (#159): a 4-stage timeline derived from the order status
 * (CANCELLED → REFUND_INITIATED → REFUNDED) plus cancelledAt. Reachable from
 * every cancelled state. Fear-free: a refund in progress is normal, not an
 * error, so no alarm colors anywhere.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  formatPaise,
  getOrder,
  type OrderStatus,
  type OrderView,
} from "@/lib/orders";

const STAGES = [
  "Cancellation confirmed",
  "Refund initiated",
  "With the payment gateway",
  "Credited to your account",
] as const;

const STAGE_SUB: Record<number, string> = {
  0: "Your order is cancelled — nothing will be dispatched.",
  1: "The full amount is queued for return, automatically.",
  2: "The gateway is moving the money back to your payment method.",
  3: "Reaches your account within 3–5 working days of initiation.",
};

/**
 * Highest completed stage index for a status. CANCELLED completes stages
 * 0–1 (cancellation auto-initiates the refund), REFUND_INITIATED completes
 * stage 2, REFUNDED completes everything.
 */
function completedThrough(status: OrderStatus): number {
  switch (status) {
    case "CANCELLED":
      return 1;
    case "REFUND_INITIATED":
      return 2;
    case "REFUNDED":
      return 3;
    default:
      return -1;
  }
}

function formatInstant(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(iso));
}

type State =
  | { kind: "loading" }
  | { kind: "missing" }
  | { kind: "error"; message: string }
  | { kind: "ready"; order: OrderView };

export function RefundStatusView() {
  const params = useSearchParams();
  const orderNumber = params.get("on") ?? "";
  const phone = params.get("phone") ?? "";
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!orderNumber || !phone) {
      setState({ kind: "missing" });
      return;
    }
    void getOrder(orderNumber, phone).then((r) =>
      setState(
        r.ok
          ? { kind: "ready", order: r.data }
          : {
              kind: "error",
              message:
                r.status === 404
                  ? "We couldn't find that order. Check the order number and the phone it was placed with."
                  : r.message,
            },
      ),
    );
  }, [orderNumber, phone]);

  if (state.kind === "loading") {
    return (
      <p className="py-14 text-center text-[13.5px] text-sub">
        Fetching your refund…
      </p>
    );
  }

  if (state.kind === "missing" || state.kind === "error") {
    return (
      <div className="mx-auto max-w-[440px] py-10 text-center">
        <p className="mb-5 text-[13.5px] leading-relaxed text-sub">
          {state.kind === "error"
            ? state.message
            : "Open this page from your order — or track the order first and follow the refund link there."}
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
  const done = completedThrough(order.status);

  if (done < 0) {
    return (
      <div className="mx-auto max-w-[520px] rounded-[14px] border border-border bg-card p-[18px] text-center">
        <p className="text-[13.5px] leading-relaxed text-body">
          Order <b>{order.orderNumber}</b> is not cancelled, so there is no
          refund in motion — everything you paid is going toward your kit.
        </p>
        <Link
          href={`/orders/track?on=${encodeURIComponent(order.orderNumber)}&phone=${encodeURIComponent(phone)}`}
          className="mt-3 inline-block text-[13px] font-bold text-cta"
        >
          Track the order instead ›
        </Link>
      </div>
    );
  }

  const amount = formatPaise(order.refundPaise ?? order.totalPaise);

  return (
    <div className="mx-auto max-w-[560px]">
      <div className="mb-4 rounded-[14px] border border-border bg-card p-[18px]">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[16px] font-bold text-ink">
            {amount} · order {order.orderNumber}
          </h2>
          <span className="text-[12.5px] text-sub">
            Back to your original payment method
          </span>
        </div>

        <ol>
          {STAGES.map((stage, i) => {
            const isDone = i <= done;
            const isNext = i === done + 1;
            return (
              <li key={stage} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={`flex size-[22px] items-center justify-center rounded-full text-[11px] font-bold ${
                      isDone
                        ? "bg-dharma-fg text-white"
                        : isNext
                          ? "border-2 border-dharma-fg bg-card text-dharma-fg"
                          : "border border-border bg-bg text-sub"
                    }`}
                  >
                    {isDone ? "✓" : i + 1}
                  </span>
                  {i < STAGES.length - 1 && (
                    <span
                      className={`w-[2px] flex-1 ${isDone ? "bg-dharma-fg" : "bg-border"}`}
                      style={{ minHeight: 18 }}
                    />
                  )}
                </div>
                <div className="pb-4">
                  <p
                    className={`text-[13.5px] ${
                      isDone
                        ? "font-bold text-ink"
                        : isNext
                          ? "font-semibold text-body"
                          : "text-sub"
                    }`}
                  >
                    {stage}
                    {i === 0 && order.cancelledAt && (
                      <span className="ml-2 text-[11.5px] font-normal text-sub">
                        {formatInstant(order.cancelledAt)}
                      </span>
                    )}
                  </p>
                  <p className="text-[12px] leading-relaxed text-sub">
                    {STAGE_SUB[i]}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        <p className="border-t border-border-light pt-3 text-[12.5px] leading-relaxed text-sub">
          {order.status === "REFUNDED"
            ? `${amount} was refunded in full. If it isn't showing yet, bank statements can lag by a day.`
            : `Nothing to do on your side — the full ${amount} comes back on its own, typically within 3–5 working days.`}
        </p>
      </div>

      {/* If it has not arrived */}
      <div className="rounded-[14px] border border-border bg-card p-[18px]">
        <p className="mb-2 text-[10px] font-bold tracking-[0.8px] text-sub uppercase">
          If it has not arrived
        </p>
        <p className="text-[13px] leading-relaxed text-body">
          Banks occasionally take a couple of extra days, especially over
          weekends and holidays. If more than 5 working days have passed since
          the refund was initiated, write to{" "}
          <a
            href="mailto:help@thetapaco.com"
            className="font-bold text-cta hover:underline"
          >
            help@thetapaco.com
          </a>{" "}
          with your order number ({order.orderNumber}) and we&apos;ll chase the
          gateway for you — you never have to chase the bank yourself.
        </p>
      </div>

      <p className="mt-5 text-center">
        <Link
          href={`/orders/track?on=${encodeURIComponent(order.orderNumber)}&phone=${encodeURIComponent(phone)}`}
          className="text-[13px] font-bold text-cta"
        >
          ‹ Back to the order
        </Link>
      </p>
    </div>
  );
}
