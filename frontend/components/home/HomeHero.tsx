"use client";

import Link from "next/link";
import { useState } from "react";
import { DpbBadge } from "@/components/DpbBadge";
import { hueFromClass, formatObservanceDate } from "@/lib/articleExtras";
import { badgeTagOf, cardHref, type HomeCard } from "@/lib/homeExtras";

const TRUST_LINE =
  "Sourced from named scripture · every claim tagged · nothing driven by fear";

/**
 * Section 3 — HERO. Full-bleed deity-hue gradient built from the featured
 * ritual (hero[0]); a simple dot carousel rotates through the rest when the
 * CMS features more than one. Client island so the dots can switch slides —
 * everything renders from serialisable props.
 */
export function HomeHero({ cards, today }: { cards: HomeCard[]; today: string }) {
  const [index, setIndex] = useState(0);
  const card = cards[Math.min(index, cards.length - 1)];
  if (!card) return null;

  const href = cardHref(card);
  const tag = badgeTagOf(card.dpbTag);
  const dateLine = card.observanceDate
    ? formatObservanceDate(card.observanceDate)
    : formatObservanceDate(today);

  return (
    <section className={`h-${hueFromClass(card.hueClass ?? undefined, "devi")}`}>
      <div className="mx-auto max-w-[1280px] px-4 py-12 md:px-10 md:py-16">
        <p className="mb-3 text-[10px] font-bold tracking-[1.2px] text-eyebrow-dark uppercase">
          Today&rsquo;s Ritual · {dateLine}
        </p>
        {tag && (
          <DpbBadge
            tag={tag}
            score={tag !== "bhranti" ? (card.dpbScore ?? undefined) : undefined}
            className="mb-4"
          />
        )}
        <h1 className="max-w-[760px] text-[30px] leading-tight font-bold tracking-[-0.6px] text-hero-text md:text-[42px]">
          {card.title}
        </h1>
        {card.subtitle && (
          <p className="mt-3 max-w-[620px] text-[14.5px] leading-relaxed text-hero-text/75 md:text-[15.5px]">
            {card.subtitle}
          </p>
        )}
        <p className="mt-4 text-[11.5px] tracking-[0.3px] text-hero-text/55">
          {TRUST_LINE}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href={href}
            className="rounded-[10px] bg-cta px-5 py-[11px] text-[13px] font-bold text-white hover:opacity-90"
          >
            ▶ Start today&rsquo;s vrat
          </Link>
          <Link
            href={href}
            className="rounded-[10px] border border-white/30 bg-white/10 px-5 py-[11px] text-[13px] font-bold text-hero-text hover:bg-white/20"
          >
            📖 Read complete vidhi
          </Link>
          <Link
            href={`${href}#audio`}
            className="rounded-[10px] border border-white/30 px-5 py-[11px] text-[13px] font-bold text-hero-text/90 hover:bg-white/10"
          >
            🎧 Listen instead
          </Link>
        </div>

        {cards.length > 1 && (
          <div className="mt-8 flex items-center gap-[7px]">
            {cards.map((c, i) => (
              <button
                key={c.slug}
                type="button"
                aria-label={`Show featured ritual ${i + 1} of ${cards.length}: ${c.title}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={`h-[7px] rounded-full transition-all ${
                  i === index
                    ? "w-[22px] bg-hero-text"
                    : "w-[7px] bg-hero-text/35 hover:bg-hero-text/60"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/**
 * Server-rendered fallback hero for a dead backend or an empty featured
 * rotation — the section never disappears, it just loses the article CTA.
 */
export function HomeHeroFallback({ today }: { today: string }) {
  return (
    <section className="hero-rg">
      <div className="mx-auto max-w-[1280px] px-4 py-12 md:px-10 md:py-16">
        <p className="mb-3 text-[10px] font-bold tracking-[1.2px] text-eyebrow-dark uppercase">
          Today&rsquo;s Ritual · {formatObservanceDate(today)}
        </p>
        <h1 className="max-w-[760px] text-[30px] leading-tight font-bold tracking-[-0.6px] text-hero-text md:text-[42px]">
          Dharma does not demand fear. It demands devotion.
        </h1>
        <p className="mt-3 max-w-[620px] text-[14.5px] leading-relaxed text-hero-text/75 md:text-[15.5px]">
          Today&rsquo;s featured ritual is being verified — every guide is
          checked against a named text before it is featured here.
        </p>
        <p className="mt-4 text-[11.5px] tracking-[0.3px] text-hero-text/55">
          {TRUST_LINE}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/ritual-guides"
            className="rounded-[10px] bg-cta px-5 py-[11px] text-[13px] font-bold text-white hover:opacity-90"
          >
            ▶ Browse ritual guides
          </Link>
          <Link
            href="/panchang"
            className="rounded-[10px] border border-white/30 bg-white/10 px-5 py-[11px] text-[13px] font-bold text-hero-text hover:bg-white/20"
          >
            ☀ Today&rsquo;s Panchang
          </Link>
        </div>
      </div>
    </section>
  );
}
