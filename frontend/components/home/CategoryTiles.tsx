import Image from "next/image";
import Link from "next/link";
import { SectionHeader } from "@/components/SectionHeader";
import type { HomeCounts } from "@/lib/homeExtras";

/**
 * The banner each tile wears: the pillar's own photograph over its hue, the
 * same image the category's landing hero uses, so the tile and the page it
 * opens read as one place. The gradient stays underneath as the fallback, and
 * a bottom scrim keeps the card's top edge from clashing with whatever the
 * photograph does there.
 *
 * No glyph: each image already says lamp, moon, leaf or basket better than an
 * emoji can, and a flat OS emoji on a painted illustration reads as a sticker.
 */
function TileBanner({
  hue,
  image,
  dimmed = false,
}: {
  hue: string;
  image: string;
  dimmed?: boolean;
}) {
  return (
    <div
      className={`${hue} relative h-[96px] overflow-hidden ${dimmed ? "opacity-60" : ""}`}
    >
      <Image
        src={image}
        alt=""
        aria-hidden
        fill
        sizes="(max-width: 1024px) 50vw, 25vw"
        className="pointer-events-none object-cover object-center opacity-70 transition-transform duration-500 group-hover:scale-[1.06]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent"
      />

    </div>
  );
}

/**
 * Section 11 — EXPLORE BY CATEGORY. The four pillars as tiles (2×2 mobile,
 * 4-col desktop) with live counts where the API provides them. The Ritual
 * Pujans tile stays a non-link "Launching soon" card while `kits_launched`
 * is off — no dead links.
 */
export function CategoryTiles({
  counts,
  kitsLaunched,
}: {
  counts: HomeCounts;
  kitsLaunched: boolean;
}) {
  const tiles = [
    {
      hue: "hero-rg",
      image: "/brand/ritual-guides.jpg",
      title: "Ritual Guides",
      note: "The complete vidhi for every festival and vrat, sourced and tagged.",
      stat:
        typeof counts.ritualGuides === "number"
          ? `${counts.ritualGuides} guides live`
          : "New guides weekly",
      href: "/ritual-guides",
      cta: "Browse guides ›",
    },
    {
      hue: "hero-pa",
      image: "/brand/calender.png",
      title: "Panchang",
      note: "Today's tithi and sunrise, and every vrat date of the year.",
      stat: "2026 calendar",
      href: "/panchang",
      cta: "Open Panchang ›",
    },
    {
      hue: "hero-dc",
      image: "/brand/dharmic.png",
      title: "Dharmic Concepts",
      note: "Why bilva and not tulsi — the story behind the object in your hand.",
      stat: [
        typeof counts.dharmicConcepts === "number"
          ? `${counts.dharmicConcepts} concepts`
          : "Concepts",
        typeof counts.glossaryTerms === "number"
          ? `${counts.glossaryTerms} glossary terms`
          : "growing glossary",
      ].join(" · "),
      href: "/dharmic-concepts",
      cta: "Explore concepts ›",
    },
  ] as const;

  return (
    <section className="mx-auto max-w-[1280px] px-4 pt-10 md:px-10">
      <SectionHeader eyebrow="Three ways in" title="Start wherever you are" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link
            key={t.title}
            href={t.href}
            className="group flex flex-col overflow-hidden rounded-[15px] border border-border bg-card transition-colors hover:border-cta"
          >
            <TileBanner hue={t.hue} image={t.image} />
            <div className="flex flex-1 flex-col p-5">
              <span className="text-[15px] font-bold text-ink group-hover:text-cta">
                {t.title}
              </span>
              <span className="mt-[3px] text-[11px] font-bold tracking-[0.3px] text-gold">
                {t.stat}
              </span>
              <span className="mt-2 mb-3 flex-1 text-[12px] leading-relaxed text-sub">
                {t.note}
              </span>
              <span className="mt-auto text-[12px] font-bold text-cta">
                {t.cta}
              </span>
            </div>
          </Link>
        ))}

        {kitsLaunched ? (
          <Link
            href="/ritual-pujans"
            className="group flex flex-col overflow-hidden rounded-[15px] border border-border bg-card transition-colors hover:border-cta"
          >
            <TileBanner hue="hero-rk" image="/brand/ritual_pujans.png" />
            <div className="flex flex-1 flex-col p-5">
              <span className="text-[15px] font-bold text-ink group-hover:text-cta">
                Ritual Pujans
              </span>
              <span className="mt-[3px] text-[11px] font-bold tracking-[0.3px] text-gold">
                Kits are live
              </span>
              <span className="mt-2 mb-3 flex-1 text-[12px] leading-relaxed text-sub">
                Samagri kits matched to every guide, delivered before the date.
              </span>
              <span className="mt-auto text-[12px] font-bold text-cta">
                Order a kit ›
              </span>
            </div>
          </Link>
        ) : (
          <div className="flex flex-col overflow-hidden rounded-[15px] border border-dashed border-border bg-card/60">
            <TileBanner hue="hero-rk" image="/brand/ritual_pujans.png" dimmed />
            <div className="flex flex-1 flex-col p-5">
              <span className="text-[15px] font-bold text-ink/80">
                Ritual Pujans
              </span>
              <span className="mt-[3px] text-[11px] font-bold tracking-[0.3px] text-amber">
                Launching soon
              </span>
              <span className="mt-2 mb-3 flex-1 text-[12px] leading-relaxed text-sub">
                Samagri kits matched to every guide, delivered before the date.
              </span>
              <span className="mt-auto text-[12px] font-bold text-sub">
                Pre-booking opens soon
              </span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
