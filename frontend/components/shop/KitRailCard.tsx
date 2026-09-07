"use client";

import Link from "next/link";
import { useState } from "react";
import { NotifyMe } from "@/components/home/NotifyMe";
import { productHref } from "@/components/shop/ProductCard";
import {
  addToCart,
  availabilityChip,
  formatDateMedium,
  formatPaise,
  prebookClosed,
  shopTrack,
  type Product,
} from "@/lib/shop";

/**
 * Homepage kits-rail card — one of four states per the prototype:
 * PREBOOK ("PRE-BOOK · ORDER BY 1 OCT" + "Pre-book ›"), LIVE ("ALL YEAR" +
 * an in-place "Add to cart — ₹751"), COMING_SOON ("OPENS SOON" + notify-me
 * capture) and SOLD_OUT. The card body links to the PDP either way.
 */
export function KitRailCard({ product: p }: { product: Product }) {
  const [added, setAdded] = useState(false);
  const closed = prebookClosed(p);
  const href = productHref(p);

  const chip =
    p.availability === "LIVE" && p.season
      ? p.season.toUpperCase()
      : availabilityChip(p);

  const onAdd = () => {
    addToCart(p.slug, 1);
    shopTrack("kit_added_to_cart", {
      slug: p.slug,
      qty: 1,
      price_paise: p.pricePaise,
      surface: "home_rail",
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  };

  return (
    <article className="flex w-[272px] shrink-0 snap-start flex-col overflow-hidden rounded-[15px] border border-border bg-card transition-colors hover:border-cta">
      <Link
        href={href}
        className={`${p.hueClass} flex h-[110px] items-start justify-between p-[13px]`}
      >
        <span className="font-devanagari text-[30px] leading-none text-white/90">
          {p.titleDevanagari}
        </span>
        <span className="rounded-[5px] border border-white/30 bg-white/20 px-[8px] py-[3px] text-[9px] font-bold tracking-[0.4px] whitespace-nowrap text-white">
          {chip}
        </span>
      </Link>

      <div className="flex flex-1 flex-col px-[15px] pt-[13px] pb-[15px]">
        <p className="mb-[5px] text-[9.5px] font-bold tracking-[0.8px] text-gold uppercase">
          {p.eyebrow}
        </p>
        <Link href={href} className="mb-[4px] text-[15.5px] leading-snug font-bold text-ink hover:text-cta">
          {p.title}
        </Link>
        {p.festivalDate && (
          <p className="mb-[6px] text-[11.5px] font-semibold text-gold">
            {formatDateMedium(p.festivalDate)}
          </p>
        )}

        <div className="mt-auto pt-[10px]">
          {p.availability === "PREBOOK" && !closed && (
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[16px] font-bold text-ink">
                {formatPaise(p.pricePaise)}
              </span>
              <Link href={href} className="text-[12.5px] font-bold text-cta">
                Pre-book ›
              </Link>
            </div>
          )}

          {p.availability === "PREBOOK" && closed && (
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[16px] font-bold text-sub">
                {formatPaise(p.pricePaise)}
              </span>
              <Link href={href} className="text-[12px] font-bold text-sub">
                Pre-booking closed
              </Link>
            </div>
          )}

          {p.availability === "LIVE" && (
            <button
              type="button"
              onClick={onAdd}
              className={`w-full rounded-[10px] px-4 py-[9px] text-[12.5px] font-bold text-white ${
                added ? "bg-dharma-fg" : "bg-cta hover:opacity-90"
              }`}
            >
              {added
                ? "Added to cart ✓"
                : `Add to cart — ${formatPaise(p.pricePaise)}`}
            </button>
          )}

          {p.availability === "COMING_SOON" && (
            <div className="rounded-[11px] bg-ink p-[10px]">
              <NotifyMe context="kits" />
            </div>
          )}

          {p.availability === "SOLD_OUT" && (
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[16px] font-bold text-sub">
                {formatPaise(p.pricePaise)}
              </span>
              <Link href={href} className="text-[12px] font-bold text-sub">
                Sold out
              </Link>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
