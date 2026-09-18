import Link from "next/link";
import {
  availabilityChip,
  formatPaise,
  prebookClosed,
  type Product,
} from "@/lib/shop";

export function productHref(p: Product): string {
  return `/ritual-pujans/p/${p.slug}`;
}

const KNOWN_HUE_CLASSES = new Set([
  "h-shiva",
  "h-ganesh",
  "h-devi",
  "h-vishnu",
  "h-earth",
  "h-thread",
  "h-sanskar",
  "h-gold",
]);

/** Falls back to a default gradient so an unrecognized/mistyped hueClass never renders as blank white. */
function resolveHueClass(hueClass: string): string {
  return KNOWN_HUE_CLASSES.has(hueClass) ? hueClass : "h-default";
}

/** Per-card CTA text — the card links to the PDP, where the action happens. */
function cardCta(p: Product): string {
  switch (p.availability) {
    case "PREBOOK":
      return prebookClosed(p) ? "Pre-booking closed" : "Pre-book ›";
    case "LIVE":
      return "Add to cart ›";
    case "COMING_SOON":
      return "Notify me ›";
    case "SOLD_OUT":
      return "Sold out";
  }
}

/**
 * PLP product card — hue header carrying the Devanagari title, then
 * eyebrow, title, price (with struck MRP) and an availability chip.
 */
export function ProductCard({ product: p }: { product: Product }) {
  const soldOut = p.availability === "SOLD_OUT" || prebookClosed(p);
  return (
    <Link
      href={productHref(p)}
      className="group flex flex-col overflow-hidden rounded-[15px] border border-border bg-card transition-colors hover:border-cta"
    >
      <div
        className={`${resolveHueClass(p.hueClass)} flex h-[132px] items-start justify-between p-[13px]`}
      >
        <span className="font-devanagari text-[34px] leading-none text-white/90">
          {p.titleDevanagari}
        </span>
        <span className="rounded-[5px] border border-white/30 bg-white/20 px-[9px] py-[3px] text-[9.5px] font-bold tracking-[0.4px] whitespace-nowrap text-white">
          {availabilityChip(p)}
        </span>
      </div>
      <div className="flex flex-1 flex-col px-[17px] pt-[15px] pb-[17px]">
        <p className="mb-[6px] text-[10px] font-bold tracking-[0.8px] text-gold uppercase">
          {p.eyebrow}
        </p>
        <h3 className="mb-[5px] text-[16.5px] leading-snug font-bold text-ink">
          {p.title}
        </h3>
        <p className="mb-[13px] flex-1 text-[12.5px] leading-relaxed text-sub">
          {p.description}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-[17px] font-bold text-ink">
            {formatPaise(p.pricePaise)}
          </span>
          {p.mrpPaise != null && p.mrpPaise > p.pricePaise && (
            <span className="text-[12.5px] text-sub line-through">
              {formatPaise(p.mrpPaise)}
            </span>
          )}
          <span
            className={`ml-auto text-[12.5px] font-bold ${
              soldOut ? "text-sub" : "text-cta"
            }`}
          >
            {cardCta(p)}
          </span>
        </div>
      </div>
    </Link>
  );
}
