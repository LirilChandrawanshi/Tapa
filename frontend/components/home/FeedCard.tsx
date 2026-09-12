import Link from "next/link";
import Image from "next/image";
import type { FeedCard as FeedCardType, FeedRefType } from "@/lib/feed";

const REF_ICON: Record<FeedRefType, string> = {
  PRODUCT: "🛍",
  ARTICLE: "📖",
  OBSERVANCE: "🪔",
  GLOSSARY_TERM: "📚",
  LINK: "🔗",
  PROMO: "✨",
};

const REF_CTA_FALLBACK: Record<FeedRefType, string> = {
  PRODUCT: "Shop this kit ›",
  ARTICLE: "Read the guide ›",
  OBSERVANCE: "See the observance ›",
  GLOSSARY_TERM: "Look it up ›",
  LINK: "Open ›",
  PROMO: "Learn more ›",
};

/** External hosts (stock photo / Wikimedia placeholders) skip Next's image
 *  optimizer — several throttle or block its server-side fetch when it
 *  arrives without a browser-like User-Agent. The browser fetches these
 *  directly instead, exactly as it would any other hotlinked image. */
function isExternal(url: string | null): boolean {
  return !!url && /^https?:\/\//.test(url);
}

/** Full-bleed banner — HERO layout, one at the top of the feed. */
export function FeedHeroCard({ card }: { card: FeedCardType }) {
  const hue = card.hueClass ?? "h-gold";
  return (
    <Link
      href={card.href}
      target={card.refType === "LINK" ? "_blank" : undefined}
      className={`group relative block overflow-hidden rounded-[22px] ${card.imageUrl ? "" : hue}`}
    >
      {card.imageUrl && (
        <Image
          src={card.imageUrl}
          alt={card.title}
          fill
          priority
          unoptimized={isExternal(card.imageUrl)}
          sizes="100vw"
          className="object-cover"
        />
      )}
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(0deg,rgba(8,5,3,0.88)_0%,rgba(8,5,3,0.45)_46%,rgba(8,5,3,0.15)_100%)]"
      />
      <div className="relative flex min-h-[340px] flex-col justify-end px-6 py-8 md:min-h-[420px] md:px-12 md:py-11">
        {(card.badge ?? card.subtitle) && (
          <span className="mb-4 inline-flex w-fit items-center gap-[6px] rounded-[6px] border border-white/30 bg-white/15 px-[11px] py-[5px] text-[10.5px] font-bold tracking-[0.6px] text-hero-text uppercase backdrop-blur-sm">
            {REF_ICON[card.refType]} {card.badge ?? card.subtitle}
          </span>
        )}
        <h2 className="max-w-[680px] text-[30px] leading-[1.1] font-bold tracking-[-0.6px] text-hero-text drop-shadow-sm md:text-[44px]">
          {card.title}
        </h2>
        {card.caption && (
          <p className="mt-3 max-w-[560px] text-[14.5px] leading-relaxed text-hero-text/85 md:text-[16px]">
            {card.caption}
          </p>
        )}
        <span className="mt-6 inline-flex w-fit items-center gap-2 rounded-[10px] bg-cta px-5 py-[11px] text-[13px] font-bold text-white transition-transform group-hover:translate-x-[3px]">
          {card.ctaLabel ?? REF_CTA_FALLBACK[card.refType]}
        </span>
      </div>
    </Link>
  );
}

/** Horizontal promo banner — WIDE/STANDARD PROMO layout, rendered full-width
 *  as its own breaker between content rows, not mixed into a rail. */
export function FeedPromoBanner({ card }: { card: FeedCardType }) {
  const hue = card.hueClass ?? "h-gold";
  return (
    <Link
      href={card.href}
      target={card.refType === "LINK" ? "_blank" : undefined}
      className="group grid overflow-hidden rounded-[18px] border border-border md:grid-cols-[1fr_1.4fr]"
    >
      <div className={`relative h-[140px] md:h-auto ${card.imageUrl ? "" : hue}`}>
        {card.imageUrl ? (
          <Image
            src={card.imageUrl}
            alt={card.title}
            fill
            unoptimized={isExternal(card.imageUrl)}
            sizes="(max-width: 768px) 100vw, 40vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span
            aria-hidden
            className="absolute inset-0 flex items-center justify-center text-[44px] opacity-90"
          >
            {REF_ICON[card.refType]}
          </span>
        )}
      </div>
      <div className="flex flex-col justify-center bg-card px-6 py-6 md:px-9">
        {card.badge && (
          <span className="mb-2 inline-flex w-fit rounded-[5px] bg-cta/10 px-[9px] py-[3px] text-[10px] font-bold tracking-[0.5px] text-cta uppercase">
            {card.badge}
          </span>
        )}
        <h3 className="mb-[6px] text-[19px] leading-snug font-bold text-ink md:text-[22px]">
          {card.title}
        </h3>
        {card.caption && (
          <p className="mb-4 max-w-[440px] text-[13px] leading-relaxed text-sub">
            {card.caption}
          </p>
        )}
        <span className="inline-flex w-fit items-center gap-1 text-[13px] font-bold text-cta">
          {card.ctaLabel ?? REF_CTA_FALLBACK[card.refType]}
        </span>
      </div>
    </Link>
  );
}

/** Rail card — WIDE (~360px) or STANDARD (~264px), horizontally scrollable. */
export function FeedCard({
  card,
  size = "standard",
}: {
  card: FeedCardType;
  size?: "wide" | "standard";
}) {
  const hue = card.hueClass ?? "h-gold";
  const wide = size === "wide";

  return (
    <Link
      href={card.href}
      target={card.refType === "LINK" ? "_blank" : undefined}
      className={`group flex shrink-0 snap-start flex-col overflow-hidden rounded-[16px] border border-border bg-card transition-colors hover:border-cta ${
        wide ? "w-[320px] md:w-[360px]" : "w-[220px] md:w-[248px]"
      }`}
    >
      <div
        className={`relative flex items-center justify-center overflow-hidden ${hue} ${
          wide ? "h-[200px]" : "h-[152px]"
        }`}
      >
        {card.imageUrl ? (
          <Image
            src={card.imageUrl}
            alt={card.title}
            fill
            unoptimized={isExternal(card.imageUrl)}
            sizes={wide ? "360px" : "248px"}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span
            aria-hidden
            className={`opacity-90 ${wide ? "text-[48px]" : "text-[34px]"}`}
          >
            {REF_ICON[card.refType]}
          </span>
        )}
        {card.badge && (
          <span className="absolute top-[10px] left-[10px] rounded-[5px] border border-white/30 bg-white/20 px-[8px] py-[3px] text-[9px] font-bold tracking-[0.4px] whitespace-nowrap text-white uppercase backdrop-blur-sm">
            {card.badge}
          </span>
        )}
      </div>

      <div className={`flex flex-1 flex-col ${wide ? "px-5 py-4" : "px-[14px] py-[12px]"}`}>
        <h3
          className={`mb-1 leading-snug font-bold text-ink line-clamp-2 ${
            wide ? "text-[16px]" : "text-[13.5px]"
          }`}
        >
          {card.title}
        </h3>
        {card.subtitle && !card.badge && (
          <p className="mb-1 text-[11px] font-semibold text-gold">
            {card.subtitle}
          </p>
        )}
        {wide && card.caption && (
          <p className="mb-2 flex-1 text-[12px] leading-relaxed text-sub line-clamp-2">
            {card.caption}
          </p>
        )}
        <span
          className={`mt-auto text-[11.5px] font-bold text-cta ${wide ? "" : "text-[10.5px]"}`}
        >
          {card.ctaLabel ?? REF_CTA_FALLBACK[card.refType]}
        </span>
      </div>
    </Link>
  );
}
