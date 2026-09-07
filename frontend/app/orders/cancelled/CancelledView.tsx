"use client";

/**
 * Cancelled confirmation (#161/#162): the full-refund facts up front,
 * "Track this refund ›", and the "guide stays free" pair — cancelling the
 * kit never cancels the ritual. Guide links resolve best-effort from each
 * line's product (items carry productSlug only).
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatPaise, getOrder, type OrderView } from "@/lib/orders";
import { fetchProduct } from "@/lib/shop";
import { fetchArticle } from "@/lib/api";
import { articleHref } from "@/lib/articleExtras";

type State =
  | { kind: "loading" }
  | { kind: "missing" }
  | { kind: "error"; message: string }
  | { kind: "ready"; order: OrderView };

interface GuideLink {
  href: string;
  title: string;
}

const METHOD_LABEL: Record<string, string> = {
  upi: "your UPI account",
  card: "your card",
  netbanking: "your bank account",
};

function formatDay(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    timeZone: "Asia/Kolkata",
  }).format(new Date(iso));
}

export function CancelledView() {
  const params = useSearchParams();
  const orderNumber = params.get("on") ?? "";
  const phone = params.get("phone") ?? "";
  const [state, setState] = useState<State>({ kind: "loading" });
  const [guides, setGuides] = useState<GuideLink[]>([]);

  useEffect(() => {
    if (!orderNumber || !phone) {
      setState({ kind: "missing" });
      return;
    }
    void getOrder(orderNumber, phone).then((r) =>
      setState(
        r.ok
          ? { kind: "ready", order: r.data }
          : { kind: "error", message: r.message },
      ),
    );
  }, [orderNumber, phone]);

  // Best-effort guide resolution — silence on any failure, never a spinner.
  useEffect(() => {
    if (state.kind !== "ready") return;
    let cancelled = false;
    void (async () => {
      const found: GuideLink[] = [];
      const seen = new Set<string>();
      for (const line of state.order.items) {
        const product = await fetchProduct(line.productSlug);
        for (const slug of product?.linkedGuideSlugs ?? []) {
          if (seen.has(slug)) continue;
          seen.add(slug);
          try {
            const article = await fetchArticle(slug);
            if (article) {
              found.push({
                href: articleHref(article),
                title: article.lang?.en?.title ?? line.title,
              });
            }
          } catch {
            // guide lookup is decoration — skip quietly
          }
        }
      }
      if (!cancelled && found.length > 0) setGuides(found.slice(0, 3));
    })();
    return () => {
      cancelled = true;
    };
  }, [state]);

  if (state.kind === "loading") {
    return (
      <p className="py-14 text-center text-[13.5px] text-sub">
        Fetching your order…
      </p>
    );
  }

  if (state.kind === "missing" || state.kind === "error") {
    return (
      <div className="mx-auto max-w-[440px] py-14 text-center">
        <h2 className="mb-2 text-xl font-bold text-ink">
          We couldn&apos;t open this page
        </h2>
        <p className="mb-5 text-[13.5px] leading-relaxed text-sub">
          {state.kind === "error"
            ? state.message
            : "Track the order with its number and the phone it was placed with — the refund details are there too."}
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
  const cancelled =
    order.status === "CANCELLED" ||
    order.status === "REFUND_INITIATED" ||
    order.status === "REFUNDED";
  const amount = formatPaise(order.refundPaise ?? order.totalPaise);
  const method = METHOD_LABEL[order.paymentMethod ?? ""] ?? "your original payment method";
  const refundHref = `/orders/refund?on=${encodeURIComponent(order.orderNumber)}&phone=${encodeURIComponent(phone)}`;

  if (!cancelled) {
    return (
      <div className="mx-auto max-w-[520px] rounded-[14px] border border-border bg-card p-[18px] text-center">
        <p className="text-[13.5px] leading-relaxed text-body">
          Order <b>{order.orderNumber}</b> is still active — nothing has been
          cancelled.
        </p>
        <Link
          href={`/orders/track?on=${encodeURIComponent(order.orderNumber)}&phone=${encodeURIComponent(phone)}`}
          className="mt-3 inline-block text-[13px] font-bold text-cta"
        >
          Track the order ›
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[560px]">
      <div className="mb-5 text-center">
        <p
          aria-hidden
          className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-dharma-bg text-xl text-dharma-fg"
        >
          ✓
        </p>
        <h1 className="mb-1 text-2xl font-bold tracking-[-0.4px] text-ink">
          Cancelled — refund on its way
        </h1>
        <p className="text-[13px] text-sub">
          Order {order.orderNumber} · nothing more to do on your side
        </p>
      </div>

      {/* refund facts */}
      <div className="mb-4 rounded-[14px] border border-border bg-card p-[18px]">
        <p className="mb-3 text-[10px] font-bold tracking-[0.8px] text-sub uppercase">
          Your refund
        </p>
        <dl className="space-y-[7px] text-[13.5px]">
          <div className="flex justify-between">
            <dt className="text-sub">Amount</dt>
            <dd className="font-bold text-ink">{amount} — in full</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sub">Returns to</dt>
            <dd className="font-semibold text-ink">{method}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sub">Expected</dt>
            <dd className="font-semibold text-ink">
              3–5 working days
              {order.cancelledAt
                ? ` · from ${formatDay(order.cancelledAt)}`
                : ""}
            </dd>
          </div>
        </dl>
        <Link
          href={refundHref}
          className="mt-4 block rounded-[10px] bg-ink px-6 py-[11px] text-center text-[13.5px] font-bold text-white"
        >
          Track this refund ›
        </Link>
      </div>

      {/* the guide stays free */}
      <div className="mb-4 rounded-[14px] border border-border bg-card p-[18px]">
        <p className="mb-1 text-[13.5px] font-bold text-ink">
          The guide stays free
        </p>
        <p className="text-[12.5px] leading-relaxed text-sub">
          Cancelling the kit does not cancel the ritual. Every guide and
          samagri list stays free, whether you buy from us or source
          everything yourself.
        </p>
        {guides.length > 0 ? (
          <ul className="mt-3 space-y-1.5">
            {guides.map((g) => (
              <li key={g.href}>
                <Link href={g.href} className="text-[13px] font-bold text-cta">
                  {g.title} — free guide ›
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Link
            href="/ritual-guides"
            className="mt-3 inline-block text-[13px] font-bold text-cta"
          >
            Browse the free ritual guides ›
          </Link>
        )}
      </div>

      <p className="text-center text-[12px] text-sub">
        Anything unclear?{" "}
        <a
          href="mailto:help@thetapaco.com"
          className="font-bold text-cta hover:underline"
        >
          help@thetapaco.com
        </a>
      </p>
    </div>
  );
}
