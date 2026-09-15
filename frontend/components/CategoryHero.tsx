import Image from "next/image";
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
 *
 * Depth comes from four stacked CSS layers rather than a photograph —
 * mesh, motif, key light, scrim, grain. That keeps the locked colour
 * tokens exact at every width, costs nothing to download, and survives
 * the crop a full-bleed band takes on a narrow screen.
 *
 * `image` opts a variant out of that and puts a photograph underneath
 * instead. The gradient stays as the base layer, so the colour is right
 * before the file lands and if it never does; the scrim still runs on top,
 * so the headline keeps its contrast guarantee either way. The SVG motif
 * steps aside — it and a photograph both claim the lit right third.
 */
export function CategoryHero({
  variant,
  eyebrow,
  title,
  description,
  meta,
  side,
  image,
  actions,
}: {
  variant: CategoryHeroVariant;
  eyebrow: string;
  title: string;
  description: string;
  meta?: readonly HeroMetaItem[];
  /** Right-side card slot — rendered inside a translucent panel. */
  side?: ReactNode;
  /** Optional background photograph; replaces the SVG motif when set. */
  image?: string;
  /** Share / Save controls, overlaid in the band's top-right corner. */
  actions?: ReactNode;
}) {
  return (
    <section className={`hero-${variant} hero-band relative overflow-hidden`}>
      {image && (
        <Image
          src={image}
          alt=""
          aria-hidden
          fill
          sizes="100vw"
          priority
          className="pointer-events-none object-cover object-center"
        />
      )}
      <div aria-hidden className="hero-mesh absolute inset-0" />
      {!image && <HeroMotif variant={variant} />}
      <div aria-hidden className="hero-key absolute inset-0" />
      <div aria-hidden className="hero-scrim absolute inset-0" />
      <div aria-hidden className="hero-grain absolute inset-0" />

      {actions && (
        <div className="absolute top-3 right-4 z-10 flex items-center gap-2 md:top-4 md:right-10">
          {actions}
        </div>
      )}

      <div className="relative mx-auto grid w-full max-w-[1280px] items-center gap-6 px-4 md:grid-cols-[1.25fr_0.75fr] md:gap-11 md:px-10">
        <div>
          <p className="anim-rise mb-[11px] text-[10px] tracking-[1px] text-eyebrow-dark uppercase">
            {eyebrow}
          </p>
          <h1 className="anim-rise-lcp mb-[13px] text-[29px] leading-[1.12] font-bold tracking-[-0.8px] text-hero-text md:text-[40px]">
            {title}
          </h1>
          <p className="anim-rise anim-d2 mb-[18px] max-w-[520px] text-sm leading-[1.8] text-hero-text/70 md:text-[15.5px]">
            {description}
          </p>
          {meta && meta.length > 0 && (
            <div className="anim-rise anim-d3 flex flex-wrap gap-[22px]">
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
          <div className="anim-rise anim-d4 rounded-2xl border border-white/[0.14] bg-white/[0.07] px-[22px] py-5">
            {side}
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Motifs ───────────────────────────────────────────────────────────
 * A near-invisible line mark in the lit third of each hero, behind the
 * side card. It gives a category its own identity without an image:
 * no weight, no crop, no licensing, no AI artefacts.
 *
 * Hidden below `md` — once the grid stacks, the motif would sit under the
 * headline and eat contrast.
 */

const MOTIF_STROKE: Record<CategoryHeroVariant, string> = {
  rg: "text-amber",
  pa: "text-data-bd",
  dc: "text-gold",
  rk: "text-eyebrow-dark",
};

function HeroMotif({ variant }: { variant: CategoryHeroVariant }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 400 200"
      preserveAspectRatio="xMidYMid meet"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      className={`pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[56%] opacity-[0.07] md:block ${MOTIF_STROKE[variant]}`}
    >
      {variant === "pa" && <MoonPhases />}
      {variant === "dc" && <LeafVenation />}
      {variant === "rk" && <JuteWeave />}
      {variant === "rg" && <LampRipples />}
    </svg>
  );
}

/**
 * Panchang — one lunation across an arc. Astronomy, not astrology: the
 * PRD's whole position is that the panchang computes, it does not predict,
 * so the mark is phases rather than a zodiac wheel.
 */
function MoonPhases() {
  const r = 15;
  const moons = Array.from({ length: 8 }, (_, i) => {
    const p = i / 8; // 0 = new, 0.5 = full
    const cx = 34 + i * 47;
    const cy = 134 - Math.sin((i / 7) * Math.PI) * 54;
    const k = -Math.cos(2 * Math.PI * p); // terminator curvature, -1..1
    const waxing = p < 0.5;
    const outer = waxing ? 1 : 0;
    const inner = k >= 0 ? (waxing ? 0 : 1) : waxing ? 1 : 0;
    const rx = Math.abs(k) * r;
    return {
      cx,
      cy,
      d: `M ${cx} ${cy - r} A ${r} ${r} 0 0 ${outer} ${cx} ${cy + r} A ${rx.toFixed(2)} ${r} 0 0 ${inner} ${cx} ${cy - r} Z`,
    };
  });
  return (
    <>
      <path
        d="M 34 134 Q 200 44 366 134"
        strokeOpacity={0.4}
        strokeDasharray="3 7"
      />
      {moons.map((m) => (
        <g key={m.cx}>
          <circle cx={m.cx} cy={m.cy} r={r} strokeOpacity={0.55} />
          <path d={m.d} fill="currentColor" stroke="none" />
        </g>
      ))}
    </>
  );
}

/** Dharmic Concepts — venation: a midrib and the veins branching off it. */
function LeafVenation() {
  const mid = (t: number) => ({
    x: 30 + t * 340,
    y: 172 - t * 132 - Math.sin(t * Math.PI) * 14,
  });
  const veins = Array.from({ length: 9 }, (_, i) => {
    const t = 0.1 + i * 0.095;
    const { x, y } = mid(t);
    const reach = 40 + Math.sin(t * Math.PI) * 34;
    return {
      t,
      up: `M ${x.toFixed(1)} ${y.toFixed(1)} Q ${(x + reach * 0.45).toFixed(1)} ${(y - reach * 0.85).toFixed(1)} ${(x + reach).toFixed(1)} ${(y - reach * 0.95).toFixed(1)}`,
      down: `M ${x.toFixed(1)} ${y.toFixed(1)} Q ${(x - reach * 0.3).toFixed(1)} ${(y + reach * 0.7).toFixed(1)} ${(x - reach * 0.72).toFixed(1)} ${(y + reach * 0.9).toFixed(1)}`,
    };
  });
  return (
    <>
      <path d="M 30 172 Q 200 118 370 40" strokeWidth={2} />
      {veins.map((v) => (
        <g key={v.t} strokeOpacity={0.6}>
          <path d={v.up} />
          <path d={v.down} />
        </g>
      ))}
    </>
  );
}

/** Ritual Pujans — jute sacking: the weave the samagri is sourced in. */
function JuteWeave() {
  const lines = [];
  for (let i = -6; i < 26; i++) {
    const x = i * 20;
    lines.push(
      <path
        key={`a${i}`}
        d={`M ${x} -10 L ${x + 78} 210`}
        strokeOpacity={0.5}
      />,
    );
    lines.push(
      <path
        key={`b${i}`}
        d={`M ${x} 210 L ${x + 78} -10`}
        strokeOpacity={0.28}
      />,
    );
  }
  return <>{lines}</>;
}

/** Ritual Guides — the heat rings off a lit wick. */
function LampRipples() {
  const rings = Array.from({ length: 7 }, (_, i) => ({
    rx: 22 + i * 27,
    ry: 14 + i * 17,
    o: 0.75 - i * 0.09,
  }));
  return (
    <>
      {rings.map((ring) => (
        <ellipse
          key={ring.rx}
          cx={214}
          cy={104}
          rx={ring.rx}
          ry={ring.ry}
          strokeOpacity={ring.o}
        />
      ))}
      <path
        d="M 214 86 C 204 96 205 108 214 118 C 223 108 224 96 214 86 Z"
        fill="currentColor"
        stroke="none"
        fillOpacity={0.8}
      />
    </>
  );
}
