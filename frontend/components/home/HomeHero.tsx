"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { DpbBadge } from "@/components/DpbBadge";
import { HomeHeroBackdrop } from "@/components/home/HeroBackdrop";
import { fetchArticle } from "@/lib/api";
import {
  articleHref,
  hueFromClass,
  formatObservanceDate,
} from "@/lib/articleExtras";
import {
  badgeTagOf,
  cardHref,
  sectionText,
  type HomeCard,
  type HomeSection,
} from "@/lib/homeExtras";
import {
  fetchProducts,
  formatDateLong,
  formatDateShortCaps,
  formatPaise,
  type Product,
} from "@/lib/shop";

const TRUST_LINE =
  "Sourced from named scripture · every claim tagged · nothing driven by fear";

/**
 * The eyebrow used to read "Today's Ritual · {article date}" for whatever was
 * featured, so a guide for a date six weeks gone still announced itself as
 * today's. The label now follows the date instead of contradicting it, and a
 * date that has passed is dropped rather than shown under a false heading.
 */
function heroEyebrow(
  section: HomeSection | undefined,
  observanceDate: string | null | undefined,
  today: string,
): string {
  const todayLabel = sectionText(section, "todayLabel", "Today\u2019s Ritual");
  const upcomingLabel = sectionText(section, "upcomingLabel", "Coming up");
  const featuredLabel = sectionText(section, "featuredLabel", "Featured guide");

  if (!observanceDate) {
    return `${todayLabel} \u00b7 ${formatObservanceDate(today)}`;
  }
  const date = observanceDate.slice(0, 10);
  if (date === today) {
    return `${todayLabel} \u00b7 ${formatObservanceDate(observanceDate)}`;
  }
  if (date > today) {
    return `${upcomingLabel} \u00b7 ${formatObservanceDate(observanceDate)}`;
  }
  // Past occasion — the guide is still worth featuring, the date is not.
  return featuredLabel;
}

/** How far a drag must travel horizontally before it counts as a slide change. */
const SWIPE_PX = 48;

/**
 * Swipe / drag / arrow-key navigation for the hero carousel.
 *
 * Pointer events cover touch, pen and mouse in one path. Two guards keep the
 * gesture from fighting the page: the drag must be more horizontal than
 * vertical, so a thumb scrolling the page never flips a slide (with
 * `touch-action: pan-y` leaving that scroll to the browser); and a drag that
 * did move the carousel swallows the click it would otherwise finish with, so
 * dragging across a CTA cannot navigate away mid-swipe.
 */
function useSlideSwipe(total: number, setIndex: (next: (i: number) => number) => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);

  if (total <= 1) {
    return {};
  }

  const go = (delta: number) => setIndex((i) => (i + delta + total) % total);

  return {
    role: "region",
    "aria-roledescription": "carousel",
    "aria-label": "Featured rituals",
    tabIndex: 0,
    // vertical scrolling stays with the browser; we only claim horizontal
    style: { touchAction: "pan-y" as const },
    onPointerDown: (e: React.PointerEvent) => {
      start.current = { x: e.clientX, y: e.clientY };
      swiped.current = false;
    },
    onPointerUp: (e: React.PointerEvent) => {
      const from = start.current;
      start.current = null;
      if (!from) return;
      const dx = e.clientX - from.x;
      const dy = e.clientY - from.y;
      if (Math.abs(dx) < SWIPE_PX || Math.abs(dx) <= Math.abs(dy)) return;
      swiped.current = true;
      go(dx < 0 ? 1 : -1);
    },
    onPointerCancel: () => {
      start.current = null;
    },
    // Starting a drag on a link or an image hands the gesture to the browser's
    // native drag-and-drop, which cancels our pointer stream mid-swipe. The
    // hero is a carousel, not a drag source, so refuse it.
    onDragStart: (e: React.DragEvent) => e.preventDefault(),
    onClickCapture: (e: React.MouseEvent) => {
      if (!swiped.current) return;
      swiped.current = false;
      e.preventDefault();
      e.stopPropagation();
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      }
    },
  };
}

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
export function HomeHero({
  cards,
  today,
  panchangSlot,
  section,
}: {
  cards: HomeCard[];
  today: string;
  /** Server-rendered <PanchangCard> — kept out of this client component's own fetch. */
  panchangSlot?: ReactNode;
  /** CMS copy for the hero's labels and buttons (`hero-chrome`). */
  section?: HomeSection;
}) {
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
  const swipe = useSlideSwipe(total, setIndex);
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
      <section
        {...swipe}
        className={`${p.hueClass} hero-scene relative overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-eyebrow-dark/60`}
      >
        <HomeHeroBackdrop />
        <div className="relative mx-auto grid max-w-[1280px] gap-8 px-4 py-12 md:grid-cols-[1.15fr_.85fr] md:items-center md:px-10 md:py-16">
          <div>
            <p className="anim-rise mb-3 text-[10px] font-bold tracking-[1.2px] text-eyebrow-dark uppercase">
              Ritual Pujans · Pre-booking open
            </p>
            {p.orderByDate && (
              <span className="mb-4 inline-flex items-center gap-[6px] rounded-[6px] border border-white/30 bg-white/15 px-[10px] py-[4px] text-[10.5px] font-bold tracking-[0.6px] text-hero-text">
                ◷ ORDER BY {formatDateShortCaps(p.orderByDate)}
              </span>
            )}
            <h1 className="anim-rise-lcp max-w-[760px] text-[30px] leading-tight font-bold tracking-[-0.6px] text-hero-text md:text-[42px]">
              {p.title}
            </h1>
            <p className="anim-rise anim-d2 mt-3 max-w-[620px] text-[14.5px] leading-relaxed text-hero-text/75 md:text-[15.5px]">
              {p.festivalDate
                ? `For ${formatDateLong(p.festivalDate)} · `
                : ""}
              {formatPaise(p.pricePaise)} — everything the vidhi calls for,
              sourced and sealed, with the guide attached.
            </p>
            <p className="anim-rise anim-d3 mt-4 text-[11.5px] tracking-[0.3px] text-hero-text/55">
              {sectionText(section, "trustLine", TRUST_LINE)}
            </p>

            <div className="anim-rise anim-d4 mt-6 flex flex-wrap items-center gap-3">
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
          {panchangSlot}
        </div>
      </section>
    );
  }

  // card is non-null here — the guard above returned otherwise.
  const article = card as HomeCard;
  const href = cardHref(article);
  const tag = badgeTagOf(article.dpbTag);
  const eyebrow = heroEyebrow(section, article.observanceDate, today);

  return (
    <section
      {...swipe}
      className={`h-${hueFromClass(article.hueClass ?? undefined, "devi")} hero-scene relative overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-eyebrow-dark/60`}
    >
      <HomeHeroBackdrop />
      <div className="relative mx-auto grid max-w-[1280px] gap-8 px-4 py-12 md:grid-cols-[1.15fr_.85fr] md:items-center md:px-10 md:py-16">
        <div>
          <p className="anim-rise mb-3 text-[10px] font-bold tracking-[1.2px] text-eyebrow-dark uppercase">
            {eyebrow}
          </p>
          {tag && (
            <DpbBadge
              tag={tag}
              score={tag !== "bhranti" ? (article.dpbScore ?? undefined) : undefined}
              className="mb-4"
            />
          )}
          <h1 className="anim-rise-lcp max-w-[760px] text-[30px] leading-tight font-bold tracking-[-0.6px] text-hero-text md:text-[42px]">
            {article.title}
          </h1>
          {article.subtitle && (
            <p className="anim-rise anim-d2 mt-3 max-w-[620px] text-[14.5px] leading-relaxed text-hero-text/75 md:text-[15.5px]">
              {article.subtitle}
            </p>
          )}
          <p className="anim-rise anim-d3 mt-4 text-[11.5px] tracking-[0.3px] text-hero-text/55">
            {sectionText(section, "trustLine", TRUST_LINE)}
          </p>

          <div className="anim-rise anim-d4 mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={href}
              className="rounded-[10px] bg-cta px-5 py-[11px] text-[13px] font-bold text-white hover:opacity-90"
            >
              {sectionText(section, "primaryCta", "\u25B6 Start today\u2019s vrat")}
            </Link>
            <Link
              href={href}
              className="rounded-[10px] border border-white/30 bg-white/10 px-5 py-[11px] text-[13px] font-bold text-hero-text hover:bg-white/20"
            >
              {sectionText(section, "secondaryCta", "\u{1F4D6} Read complete vidhi")}
            </Link>
            {article.hasAudio && (
              <Link
                href={`${href}#audio`}
                className="rounded-[10px] border border-white/30 px-5 py-[11px] text-[13px] font-bold text-hero-text/90 hover:bg-white/10"
              >
                {sectionText(section, "audioCta", "\u{1F3A7} Listen instead")}
              </Link>
            )}
          </div>

          {dots}
        </div>
        {panchangSlot}
      </div>
    </section>
  );
}

/**
 * Server-rendered fallback hero for a dead backend or an empty featured
 * rotation — the section never disappears, it just loses the article CTA.
 */
export function HomeHeroFallback({
  today,
  panchangSlot,
  section,
}: {
  today: string;
  panchangSlot?: ReactNode;
  section?: HomeSection;
}) {
  return (
    <section className="hero-rg hero-scene relative overflow-hidden">
      <HomeHeroBackdrop />
      <div className="relative mx-auto grid max-w-[1280px] gap-8 px-4 py-12 md:grid-cols-[1.15fr_.85fr] md:items-center md:px-10 md:py-16">
        <div>
          <p className="anim-rise mb-3 text-[10px] font-bold tracking-[1.2px] text-eyebrow-dark uppercase">
            {heroEyebrow(section, null, today)}
          </p>
          <h1 className="anim-rise-lcp max-w-[760px] text-[30px] leading-tight font-bold tracking-[-0.6px] text-hero-text md:text-[42px]">
            Dharma does not demand fear. It demands devotion.
          </h1>
          <p className="anim-rise anim-d2 mt-3 max-w-[620px] text-[14.5px] leading-relaxed text-hero-text/75 md:text-[15.5px]">
            Today&rsquo;s featured ritual is being verified — every guide is
            checked against a named text before it is featured here.
          </p>
          <p className="anim-rise anim-d3 mt-4 text-[11.5px] tracking-[0.3px] text-hero-text/55">
            {sectionText(section, "trustLine", TRUST_LINE)}
          </p>
          <div className="anim-rise anim-d4 mt-6 flex flex-wrap items-center gap-3">
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
        {panchangSlot}
      </div>
    </section>
  );
}
