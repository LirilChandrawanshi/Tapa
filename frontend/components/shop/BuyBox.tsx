"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  addToCart,
  formatDateLong,
  MAX_QTY,
  MIN_QTY,
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

/**
 * PDP buy box — qty stepper plus the availability-specific action.
 * PREBOOK / LIVE add to the cart and move to /cart; COMING_SOON captures
 * a phone for notify-me; SOLD_OUT renders a disabled CTA.
 */
export function BuyBox({ product: p }: { product: Product }) {
  const router = useRouter();
  const [qty, setQty] = useState(MIN_QTY);
  const [phone, setPhone] = useState("");
  const [notifyState, setNotifyState] = useState<
    "idle" | "sending" | "done" | "error"
  >("idle");

  useEffect(() => {
    shopTrack("kit_viewed", {
      slug: p.slug,
      availability: p.availability,
      price_paise: p.pricePaise,
    });
  }, [p.slug, p.availability, p.pricePaise]);

  const line = availabilityLine(p);
  const buyable = p.availability === "PREBOOK" || p.availability === "LIVE";

  const onAdd = () => {
    addToCart(p.slug, qty);
    shopTrack("kit_added_to_cart", {
      slug: p.slug,
      qty,
      price_paise: p.pricePaise,
    });
    router.push("/cart");
  };

  const onNotify = async () => {
    if (!/^\d{10}$/.test(phone.trim())) {
      setNotifyState("error");
      return;
    }
    setNotifyState("sending");
    const r = await submitNotifyMe(phone);
    setNotifyState(r.ok ? "done" : "error");
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
        </div>
      )}

      {p.availability === "COMING_SOON" &&
        (notifyState === "done" ? (
          <p className="rounded-[10px] border border-dharma-bd bg-dharma-bg px-4 py-[11px] text-[13px] font-semibold text-dharma-fg">
            ✓ Noted. We&apos;ll message you the moment this opens.
          </p>
        ) : (
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
                  if (notifyState === "error") setNotifyState("idle");
                }}
                className="min-w-0 flex-1 rounded-[10px] border border-border bg-card px-4 py-[11px] text-[14px] text-ink outline-none focus:border-cta"
              />
              <button
                type="button"
                onClick={onNotify}
                disabled={notifyState === "sending"}
                className="rounded-[10px] bg-ink px-6 py-[11px] text-[14px] font-bold whitespace-nowrap text-white disabled:opacity-60"
              >
                {notifyState === "sending" ? "Saving…" : "Notify me"}
              </button>
            </div>
            {notifyState === "error" && (
              <p className="mt-2 text-[12px] text-cta">
                Enter the 10-digit mobile number you want the message on.
              </p>
            )}
          </div>
        ))}

      {p.availability === "SOLD_OUT" && (
        <button
          type="button"
          disabled
          className="w-full rounded-[10px] bg-border px-6 py-[11px] text-[14px] font-bold text-sub"
        >
          Sold out
        </button>
      )}

      {buyable && (
        <p className="mt-[11px] text-[12px] leading-relaxed text-sub">
          {termsLine(p)}
        </p>
      )}
    </div>
  );
}
