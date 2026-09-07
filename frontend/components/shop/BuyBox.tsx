"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addToCart,
  formatDateLong,
  MAX_QTY,
  MIN_QTY,
  prebookClosed,
  priceCtaLabel,
  shopTrack,
  submitNotifyMe,
  termsLine,
  type Product,
} from "@/lib/shop";

/** "◔ Pre-booking · dispatch from 4 October 2026" etc. */
function availabilityLine(p: Product): { mark: string; text: string } {
  switch (p.availability) {
    case "PREBOOK":
      if (prebookClosed(p)) {
        return { mark: "○", text: "Pre-booking closed for this occasion" };
      }
      return {
        mark: "◔",
        text: p.dispatchFrom
          ? `Pre-booking · dispatch from ${formatDateLong(p.dispatchFrom)}`
          : "Pre-booking open",
      };
    case "LIVE":
      return { mark: "●", text: "In stock · delivered in 2–3 days" };
    case "COMING_SOON":
      return { mark: "◌", text: "Opens soon" };
    case "SOLD_OUT":
      return { mark: "○", text: "Sold out" };
  }
}

/** Inline phone capture shared by the notify states (opens-soon / restock / next year). */
function NotifyInline({
  buttonLabel,
  doneCopy,
  context,
  articleSlug,
}: {
  buttonLabel: string;
  doneCopy: string;
  context: "kits" | "restock";
  articleSlug?: string;
}) {
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );

  const onNotify = async () => {
    if (!/^\d{10}$/.test(phone.trim())) {
      setState("error");
      return;
    }
    setState("sending");
    const r = await submitNotifyMe(phone, { context, articleSlug });
    setState(r.ok ? "done" : "error");
  };

  if (state === "done") {
    return (
      <p className="rounded-[10px] border border-dharma-bd bg-dharma-bg px-4 py-[11px] text-[13px] font-semibold text-dharma-fg">
        ✓ {doneCopy}
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-stretch gap-3">
        <input
          type="tel"
          inputMode="numeric"
          maxLength={10}
          placeholder="10-digit mobile number"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value.replace(/\D/g, ""));
            if (state === "error") setState("idle");
          }}
          className="min-w-0 flex-1 rounded-[10px] border border-border bg-card px-4 py-[11px] text-[14px] text-ink outline-none focus:border-cta"
        />
        <button
          type="button"
          onClick={onNotify}
          disabled={state === "sending"}
          className="rounded-[10px] bg-ink px-6 py-[11px] text-[14px] font-bold whitespace-nowrap text-white disabled:opacity-60"
        >
          {state === "sending" ? "Saving…" : buttonLabel}
        </button>
      </div>
      {state === "error" && (
        <p className="mt-2 text-[12px] text-cta">
          Enter the 10-digit mobile number you want the message on.
        </p>
      )}
    </div>
  );
}

/**
 * PDP buy box — qty stepper plus the availability-specific action.
 * PREBOOK / LIVE add to the cart (primary → /cart, plus a secondary
 * "Add to bag" / "Buy now"); a PREBOOK past its order-by date renders the
 * honest closed state (the backend already rejects such orders);
 * COMING_SOON captures a phone for notify-me; SOLD_OUT captures a
 * restock alert instead of a dead button.
 */
export function BuyBox({
  product: p,
  guideHref = "/ritual-guides",
}: {
  product: Product;
  guideHref?: string;
}) {
  const router = useRouter();
  const [qty, setQty] = useState(MIN_QTY);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    shopTrack("kit_viewed", {
      slug: p.slug,
      availability: p.availability,
      price_paise: p.pricePaise,
    });
  }, [p.slug, p.availability, p.pricePaise]);

  const closed = prebookClosed(p);
  const line = availabilityLine(p);
  const buyable =
    (p.availability === "PREBOOK" && !closed) || p.availability === "LIVE";

  const trackAdd = () => {
    addToCart(p.slug, qty);
    shopTrack("kit_added_to_cart", {
      slug: p.slug,
      qty,
      price_paise: p.pricePaise,
    });
  };

  /** Primary CTA — add and move to the cart. */
  const onAdd = () => {
    trackAdd();
    router.push("/cart");
  };

  /** PREBOOK secondary — add and stay on the page. */
  const onAddToBag = () => {
    trackAdd();
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  };

  /** LIVE secondary — add and go straight to checkout. */
  const onBuyNow = () => {
    trackAdd();
    router.push("/checkout");
  };

  return (
    <div>
      <p className="mb-[14px] flex items-center gap-2 text-[13.5px] font-semibold text-body">
        <span aria-hidden className="text-amber">
          {line.mark}
        </span>
        {line.text}
      </p>

      {buyable && (
        <>
          <div className="flex flex-wrap items-stretch gap-3">
            <div className="flex items-center rounded-[10px] border border-border bg-card">
              <button
                type="button"
                aria-label="Decrease quantity"
                disabled={qty <= MIN_QTY}
                onClick={() => setQty((q) => Math.max(MIN_QTY, q - 1))}
                className="px-4 py-[11px] text-[15px] font-bold text-body disabled:text-border"
              >
                −
              </button>
              <span className="min-w-[26px] text-center text-[14px] font-bold text-ink">
                {qty}
              </span>
              <button
                type="button"
                aria-label="Increase quantity"
                disabled={qty >= MAX_QTY}
                onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))}
                className="px-4 py-[11px] text-[15px] font-bold text-body disabled:text-border"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={onAdd}
              className="flex-1 rounded-[10px] bg-cta px-6 py-[11px] text-[14px] font-bold whitespace-nowrap text-white hover:opacity-90"
            >
              {priceCtaLabel(p)}
            </button>
            {p.availability === "PREBOOK" ? (
              <button
                type="button"
                onClick={onAddToBag}
                className={`rounded-[10px] border-[1.5px] px-5 py-[11px] text-[14px] font-bold whitespace-nowrap ${
                  added
                    ? "border-dharma-bd bg-dharma-bg text-dharma-fg"
                    : "border-cta bg-card text-cta hover:bg-cta/5"
                }`}
              >
                {added ? "Added ✓" : "Add to bag"}
              </button>
            ) : (
              <button
                type="button"
                onClick={onBuyNow}
                className="rounded-[10px] border-[1.5px] border-cta bg-card px-5 py-[11px] text-[14px] font-bold whitespace-nowrap text-cta hover:bg-cta/5"
              >
                Buy now
              </button>
            )}
          </div>
          <p className="mt-[11px] text-[12px] leading-relaxed text-sub">
            {termsLine(p)}
          </p>
        </>
      )}

      {closed && (
        <div className="rounded-[12px] border border-border bg-bg p-4">
          <p className="mb-3 text-[13.5px] leading-relaxed text-body">
            <strong className="font-bold text-ink">Pre-booking closed</strong>
            {" — "}
            we can no longer deliver before
            {p.festivalDate
              ? ` ${formatDateLong(p.festivalDate)}`
              : " the occasion"}
            . The full samagri list is free in the guide.
          </p>
          <Link
            href={guideHref}
            className="mb-4 inline-block rounded-[10px] bg-cta px-5 py-[10px] text-[13.5px] font-bold text-white hover:opacity-90"
          >
            Read the guide ›
          </Link>
          <p className="mb-2 text-[12px] font-semibold text-sub">
            Want a message when next year&apos;s kit opens?
          </p>
          <NotifyInline
            buttonLabel="Notify me"
            doneCopy="Noted. We'll message you when next year's pre-booking opens."
            context="kits"
            articleSlug={p.slug}
          />
        </div>
      )}

      {p.availability === "COMING_SOON" && (
        <NotifyInline
          buttonLabel="Notify me"
          doneCopy="Noted. We'll message you the moment this opens."
          context="kits"
        />
      )}

      {p.availability === "SOLD_OUT" && (
        <div className="rounded-[12px] border border-border bg-bg p-4">
          <p className="mb-3 text-[13.5px] leading-relaxed text-body">
            <strong className="font-bold text-ink">
              We pack in small numbers.
            </strong>{" "}
            This batch is gone.
          </p>
          <NotifyInline
            buttonLabel="Notify me"
            doneCopy="Noted. We'll message you the moment this is back."
            context="restock"
            articleSlug={p.slug}
          />
          <Link
            href={guideHref}
            className="mt-3 inline-block text-[13px] font-bold text-cta"
          >
            Read the guide meanwhile ›
          </Link>
        </div>
      )}
    </div>
  );
}
