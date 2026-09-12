import Link from "next/link";
import { formatPaise } from "@/lib/shop";
import type { HomePromo, HomePromos, PromoPlacement } from "@/lib/homeExtras";

/**
 * An editor-placed homepage band — a banner, an offer, or a push for one kit.
 *
 * Two looks only, both from the locked tokens: BOLD for a brand-pink band that
 * takes the eye, SUBTLE for a bordered card that sits with the page. Copy and
 * placement come from the CMS; the styling does not, so a promo can never
 * introduce an off-palette colour.
 */
function Band({ promo }: { promo: HomePromo }) {
  const bold = promo.style === "BOLD";
  const hasPrice =
    typeof promo.productPricePaise === "number" && promo.productPricePaise > 0;
  const struck =
    typeof promo.productMrpPaise === "number" &&
    hasPrice &&
    promo.productMrpPaise > (promo.productPricePaise as number);

  return (
    <div
      className={`flex flex-wrap items-center gap-x-6 gap-y-3 rounded-[18px] px-6 py-6 md:px-8 ${
        bold ? "bg-cta text-white" : "border border-border bg-card"
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-[6px] flex flex-wrap items-center gap-2">
          {promo.eyebrow && (
            <p
              className={`text-[10px] font-bold tracking-[0.8px] uppercase ${
                bold ? "text-white/75" : "text-gold"
              }`}
            >
              {promo.eyebrow}
            </p>
          )}
          {promo.badge && (
            <span
              className={`rounded-[6px] px-2 py-[3px] text-[10px] font-bold tracking-[0.5px] uppercase ${
                bold
                  ? "bg-white/20 text-white"
                  : "border border-pratha-bd bg-pratha-bg text-pratha-fg"
              }`}
            >
              {promo.badge}
            </span>
          )}
        </div>

        {promo.title && (
          <h2
            className={`text-[19px] leading-[1.3] font-bold md:text-[21px] ${
              bold ? "text-white" : "text-ink"
            }`}
          >
            {promo.title}
          </h2>
        )}
        {promo.body && (
          <p
            className={`mt-[5px] max-w-[640px] text-[13.5px] leading-[1.72] ${
              bold ? "text-white/80" : "text-sub"
            }`}
          >
            {promo.body}
          </p>
        )}
        {hasPrice && (
          <p
            className={`mt-2 text-[14px] font-bold ${
              bold ? "text-white" : "text-ink"
            }`}
          >
            {formatPaise(promo.productPricePaise as number)}
            {struck && (
              <span
                className={`ml-2 text-[12.5px] font-semibold line-through ${
                  bold ? "text-white/55" : "text-sub"
                }`}
              >
                {formatPaise(promo.productMrpPaise as number)}
              </span>
            )}
          </p>
        )}
      </div>

      {promo.ctaHref && promo.ctaLabel && (
        <Link
          href={promo.ctaHref}
          className={`shrink-0 rounded-[12px] px-6 py-[13px] text-[13.5px] font-bold whitespace-nowrap ${
            bold
              ? "bg-white text-cta hover:opacity-90"
              : "bg-cta text-white hover:opacity-90"
          }`}
        >
          {promo.ctaLabel}
        </Link>
      )}
    </div>
  );
}

/**
 * Renders whatever the editor placed in one slot. Nothing placed → nothing
 * rendered, not even the wrapper, so an empty slot costs no vertical space.
 */
export function PromoSlot({
  promos,
  at,
}: {
  promos: HomePromos;
  at: PromoPlacement;
}) {
  const rows = promos[at];
  if (!rows || rows.length === 0) return null;
  return (
    <section className="mx-auto max-w-[1280px] px-4 pt-10 md:px-10">
      <div className="flex flex-col gap-3">
        {rows.map((p) => (
          <Band key={p.id} promo={p} />
        ))}
      </div>
    </section>
  );
}
