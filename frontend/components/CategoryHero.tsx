import type { ReactNode } from "react";

export type CategoryHeroVariant = "rg" | "pa" | "dc" | "rk";

export interface HeroMetaItem {
  value: string;
  label: string;
}

/**
 * Dark gradient hero for a parent category landing.
 * Variants: rg (Ritual Guides), pa (Panchang), dc (Dharmic Concepts),
 * rk (Ritual Kits / Pujans). Gradient classes live in globals.css.
 */
export function CategoryHero({
  variant,
  eyebrow,
  title,
  description,
  meta,
  side,
}: {
  variant: CategoryHeroVariant;
  eyebrow: string;
  title: string;
  description: string;
  meta?: readonly HeroMetaItem[];
  /** Right-side card slot — rendered inside a translucent panel. */
  side?: ReactNode;
}) {
  return (
    <section
      className={`hero-${variant} relative overflow-hidden py-7 md:py-[42px]`}
    >
      <div
        aria-hidden
        className="absolute inset-0 [background:radial-gradient(ellipse_60%_80%_at_80%_40%,rgba(255,255,255,0.05)_0%,transparent_62%)]"
      />
      <div className="relative mx-auto grid max-w-[1280px] items-center gap-6 px-4 md:grid-cols-[1.25fr_0.75fr] md:gap-11 md:px-10">
        <div>
          <p className="mb-[11px] text-[10px] tracking-[1px] text-eyebrow-dark uppercase">
            {eyebrow}
          </p>
          <h1 className="mb-[13px] text-[29px] leading-[1.12] font-bold tracking-[-0.8px] text-hero-text md:text-[40px]">
            {title}
          </h1>
          <p className="mb-[18px] max-w-[520px] text-sm leading-[1.8] text-hero-text/70 md:text-[15.5px]">
            {description}
          </p>
          {meta && meta.length > 0 && (
            <div className="flex flex-wrap gap-[22px]">
              {meta.map((m) => (
                <span key={m.label} className="text-xs text-hero-text/55">
                  <b className="text-sm font-bold text-eyebrow-dark">
                    {m.value}
                  </b>{" "}
                  {m.label}
                </span>
              ))}
            </div>
          )}
        </div>
        {side && (
          <div className="rounded-2xl border border-white/[0.14] bg-white/[0.07] px-[22px] py-5">
            {side}
          </div>
        )}
      </div>
    </section>
  );
}
