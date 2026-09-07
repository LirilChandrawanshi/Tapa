"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DpbBadge } from "@/components/DpbBadge";
import { fetchArticle } from "@/lib/api";
import {
  articleHref,
  hueFromClass,
  formatObservanceDate,
} from "@/lib/articleExtras";
import { badgeTagOf, cardHref, type HomeCard } from "@/lib/homeExtras";
import {
  fetchProducts,
  formatDateLong,
  formatDateShortCaps,
  formatPaise,
  type Product,
} from "@/lib/shop";

const TRUST_LINE =
  "Sourced from named scripture · every claim tagged · nothing driven by fear";

interface FeaturedKit {
  product: Product;
  guideHref: string;
}

/**
 * Section 3 — HERO. Full-bleed deity-hue gradient built from the featured
 * ritual (hero[0]); a simple dot carousel rotates through the rest when the
 * CMS features more than one. Client island so the dots can switch slides —
 * everything renders from serialisable props.
 *
 * P2: once `kits_launched` flips, the first PREBOOK kit with a future
 * order-by date joins as a final pre-book slide. Fetched client-side
 * (best-effort — app/page.tsx passes only articles) so a dead backend
 * just means no extra slide.
 */
export function HomeHero({ cards, today }: { cards: HomeCard[]; today: string }) {
  const [index, setIndex] = useState(0);
  const [kit, setKit] = useState<FeaturedKit | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const flagsRes = await fetch("/api/v1/flags");
        if (!flagsRes.ok) return;
        const flagsBody = (await flagsRes.json()) as {
          data?: { kits_launched?: boolean };
        };
        if (!flagsBody.data?.kits_launched) return;

        const products = await fetchProducts();
        const featured = products.find(
          (p) =>
            p.availability === "PREBOOK" &&
            !!p.orderByDate &&
            p.orderByDate.slice(0, 10) >= today,
        );
        if (!featured || cancelled) return;

        let guideHref = "/ritual-guides";
        const guideSlug = featured.linkedGuideSlugs?.[0];
        if (guideSlug) {
          try {
            guideHref = articleHref(await fetchArticle(guideSlug));
          } catch {
            // guide unreachable — the fallback listing link stands
          }
        }
        if (!cancelled) setKit({ product: featured, guideHref });
      } catch {
        // backend down — the hero simply keeps its article slides
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [today]);

  const total = cards.length + (kit ? 1 : 0);
  const safeIndex = Math.min(index, total - 1);
  const isKitSlide = kit !== null && safeIndex === cards.length;
  const card = isKitSlide ? null : cards[Math.min(safeIndex, cards.length - 1)];
  if (!card && !isKitSlide) return null;

  const dots =
    total > 1 ? (
      <div className="mt-8 flex items-center gap-[7px]">
        {cards.map((c, i) => (
          <button
            key={c.slug}
            type="button"
            aria-label={`Show featured ritual ${i + 1} of ${total}: ${c.title}`}
            aria-current={i === safeIndex}
            onClick={() => setIndex(i)}
            className={`h-[7px] rounded-full transition-all ${
              i === safeIndex
                ? "w-[22px] bg-hero-text"
                : "w-[7px] bg-hero-text/35 hover:bg-hero-text/60"
            }`}
          />
        ))}
        {kit && (
          <button
            type="button"
            aria-label={`Show featured kit: ${kit.product.title}`}
            aria-current={isKitSlide}
            onClick={() => setIndex(cards.length)}
            className={`h-[7px] rounded-full transition-all ${
              isKitSlide
                ? "w-[22px] bg-hero-text"
                : "w-[7px] bg-hero-text/35 hover:bg-hero-text/60"
            }`}
          />
        )}
      </div>
    ) : null;

  if (isKitSlide && kit) {
    const p = kit.product;
    return (
      <section className={p.hueClass}>
        <div className="mx-auto max-w-[1280px] px-4 py-12 md:px-10 md:py-16">
          <p className="mb-3 text-[10px] font-bold tracking-[1.2px] text-eyebrow-dark uppercase">
            Ritual Pujans · Pre-booking open
          </p>
          {p.orderByDate && (
            <span className="mb-4 inline-flex items-center gap-[6px] rounded-[6px] border border-white/30 bg-white/15 px-[10px] py-[4px] text-[10.5px] font-bold tracking-[0.6px] text-hero-text">
              ◷ ORDER BY {formatDateShortCaps(p.orderByDate)}
            </span>
          )}
          <h1 className="max-w-[760px] text-[30px] leading-tight font-bold tracking-[-0.6px] text-hero-text md:text-[42px]">
            {p.title}
          </h1>
          <p className="mt-3 max-w-[620px] text-[14.5px] leading-relaxed text-hero-text/75 md:text-[15.5px]">
            {p.festivalDate
              ? `For ${formatDateLong(p.festivalDate)} · `
              : ""}
            {formatPaise(p.pricePaise)} — everything the vidhi calls for,
            sourced and sealed, with the guide attached.
          </p>
          <p className="mt-4 text-[11.5px] tracking-[0.3px] text-hero-text/55">
            {TRUST_LINE}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={`/ritual-pujans/p/${p.slug}`}
              className="rounded-[10px] bg-cta px-5 py-[11px] text-[13px] font-bold text-white hover:opacity-90"
            >
              Pre-book the kit ›
            </Link>
            <Link
              href={kit.guideHref}
              className="rounded-[10px] border border-white/30 bg-white/10 px-5 py-[11px] text-[13px] font-bold text-hero-text hover:bg-white/20"
            >
              📖 Read the guide first
            </Link>
          </div>

          {dots}
        </div>
      </section>
    );
  }

  // card is non-null here — the guard above returned otherwise.
  const article = card as HomeCard;
  const href = cardHref(article);
  const tag = badgeTagOf(article.dpbTag);
  const dateLine = article.observanceDate
    ? formatObservanceDate(article.observanceDate)
    : formatObservanceDate(today);

  return (
    <section className={`h-${hueFromClass(article.hueClass ?? undefined, "devi")}`}>
      <div className="mx-auto max-w-[1280px] px-4 py-12 md:px-10 md:py-16">
        <p className="mb-3 text-[10px] font-bold tracking-[1.2px] text-eyebrow-dark uppercase">
          Today&rsquo;s Ritual · {dateLine}
        </p>
        {tag && (
          <DpbBadge
            tag={tag}
            score={tag !== "bhranti" ? (article.dpbScore ?? undefined) : undefined}
            className="mb-4"
          />
        )}
        <h1 className="max-w-[760px] text-[30px] leading-tight font-bold tracking-[-0.6px] text-hero-text md:text-[42px]">
          {article.title}
        </h1>
        {article.subtitle && (
          <p className="mt-3 max-w-[620px] text-[14.5px] leading-relaxed text-hero-text/75 md:text-[15.5px]">
            {article.subtitle}
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

        {dots}
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
