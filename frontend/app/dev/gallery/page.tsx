import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CategoryHero } from "@/components/CategoryHero";
import { CompactRow } from "@/components/CompactRow";
import { ContentCard } from "@/components/ContentCard";
import { CountdownPill } from "@/components/CountdownPill";
import { DpbBadge } from "@/components/DpbBadge";
import { LangToggle } from "@/components/LangToggle";
import { MethodBand } from "@/components/MethodBand";
import { MythStrip } from "@/components/MythStrip";
import { Pill } from "@/components/Pill";
import { SectionHeader } from "@/components/SectionHeader";

export const metadata: Metadata = {
  title: "Component gallery",
  robots: { index: false },
};

/** Fixed reference date so CountdownPill output is deterministic. */
const NOW = "2026-09-07";

function GallerySection({
  label,
  note,
  children,
}: {
  label: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-9 first:mt-0">
      <p className="mb-1 text-[10px] font-bold tracking-[0.8px] text-gold uppercase">
        {label}
      </p>
      {note && <p className="mb-3 max-w-[760px] text-[13px] text-sub">{note}</p>}
      <div className={note ? "" : "mt-3"}>{children}</div>
    </section>
  );
}

export default function GalleryPage() {
  return (
    <main className="pb-20">
      <div className="mx-auto max-w-[1280px] px-4 pt-8 md:px-10">
        <h1 className="text-2xl font-bold tracking-[-0.4px] text-ink">
          M1 component gallery
        </h1>
        <p className="mt-1 text-[13.5px] text-sub">
          Design system &amp; site shell — every M1 component with sample data.
          AnnounceBar, TopNav (with MegaDropdown) and Footer are live in the
          page chrome above and below.
        </p>

        <GallerySection
          label="BREADCRUMB"
          note="Last item is the current page — bold, no link."
        >
          <div className="overflow-hidden rounded-[15px] border border-border">
            <Breadcrumb
              items={[
                { label: "Home", href: "/" },
                { label: "Ritual Guides", href: "/ritual-guides" },
                { label: "Festive Pujans" },
              ]}
            />
          </div>
        </GallerySection>

        <GallerySection
          label="PILL — VARIANTS"
          note="dharma · pratha · bhranti · data · default"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Pill variant="dharma">DHARMA · 4/5</Pill>
            <Pill variant="pratha">PRATHA</Pill>
            <Pill variant="bhranti">BHRANTI</Pill>
            <Pill variant="data">MONTH VIEW</Pill>
            <Pill>COMING SOON</Pill>
          </div>
        </GallerySection>

        <GallerySection
          label="DPB BADGE"
          note="Diamond + tag + score + source class. BHRANTI never carries a score (PRD rule)."
        >
          <div className="flex flex-wrap items-center gap-2">
            <DpbBadge tag="dharma" score={4} source="Puranic" />
            <DpbBadge tag="dharma" score={5} source="Vedic" />
            <DpbBadge tag="pratha" score={2} />
            <DpbBadge tag="bhranti" />
          </div>
        </GallerySection>

        <GallerySection
          label="COUNTDOWN PILL"
          note={`Computed against a fixed now (${NOW}). Pink when ≤ 7 days, amber beyond.`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <CountdownPill date="2026-09-07" now={NOW} />
            <CountdownPill date="2026-09-08" now={NOW} />
            <CountdownPill date="2026-09-13" now={NOW} />
            <CountdownPill date="2026-10-11" now={NOW} />
          </div>
        </GallerySection>

        <GallerySection label="LANG TOGGLE" note="Persists to the tapa-lang cookie and emits tapa:lang-change.">
          <LangToggle />
        </GallerySection>

        <GallerySection
          label="SECTION HEADER"
          note="Eyebrow, title, description, count and View all."
        >
          <SectionHeader
            eyebrow="Fixed to a tithi"
            title="Festive Pujans"
            description="The date moves each year because it follows the lunar calendar, not the Gregorian one. Every guide states both."
            count="18 guides"
            viewAllHref="/ritual-guides/festive-pujans"
          />
        </GallerySection>

        <GallerySection
          label="CONTENT CARD"
          note="Hue-gradient header, eyebrow/when slots, meta row, pills, optional MythStrip foot."
        >
          <div className="grid gap-4 md:grid-cols-3">
            <ContentCard
              hue="teej"
              href="/ritual-guides/festive-pujans/hartalika-teej"
              topLeft={<CountdownPill date="2026-09-13" now={NOW} />}
              title="Hartalika Teej"
              meta="13 September"
              summary="The sand Shivalinga, the night vigil, and why this is a different vrat from Hariyali Teej."
              pills={<DpbBadge tag="dharma" score={4} source="Puranic" />}
              readTime="9 min"
              myth={"“Nirjala or the vrat doesn’t count.”"}
            />
            <ContentCard
              hue="ganesh"
              href="/ritual-guides/festive-pujans/ganesh-chaturthi"
              topLeft={<CountdownPill date="2026-09-14" now={NOW} />}
              title="Ganesh Chaturthi"
              meta="14 September"
              summary="Prana pratishtha at the Madhyahna muhurat, and what a pandit is genuinely for."
              pills={<DpbBadge tag="dharma" score={4} source="Puranic" />}
              readTime="11 min"
              myth={"“Only a pandit can perform this.”"}
            />
            <ContentCard
              hue="data"
              href="/panchang/festival-calendar"
              topRight="SEPTEMBER"
              title="6 festivals"
              meta="Bhadrapada into Ashwin"
              summary="Janmashtami, Hartalika Teej, Ganesh Chaturthi, Radha Ashtami, Anant Chaturdashi, Pitru Paksha."
              pills={<Pill variant="data">MONTH VIEW</Pill>}
            />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <ContentCard
              hue="shiva"
              topRight="LIVE"
              title="Why is bilva dear to Mahadev?"
              meta="Materials · Shiva"
              summary="Three leaves on one stem. The tradition recognised what it saw."
              pills={<DpbBadge tag="dharma" score={4} source="Puranic" />}
              readTime="12 min"
            />
            <ContentCard
              hue="sanskar"
              title="Naamkaran"
              meta="Birth & childhood"
              summary="Naming the child. When it is done, who does it, and what the ceremony actually requires."
              pills={<DpbBadge tag="dharma" score={5} />}
              readTime="10 min"
            />
            <ContentCard
              hue="vishnu"
              topRight="SOON"
              title="Why is tulsi sacred to Vishnu?"
              meta="Materials · Vishnu"
              summary="Lakshmi's form as a plant, present in every Vishnu and Krishna puja."
              pills={<Pill>COMING SOON</Pill>}
              readTime="—"
            />
            <ContentCard
              hue="thread"
              topRight="LIVE"
              title="Three Stories, One Thread"
              meta="The raksha sutra"
              summary="Wife, friend, devotee — three relationships, one act of protection."
              pills={<DpbBadge tag="dharma" score={4} source="Puranic" />}
              readTime="7 min"
              myth={"“All three stories are about siblings.”"}
            />
          </div>
        </GallerySection>

        <GallerySection label="MYTH STRIP" note="Standalone — also renders inside ContentCard.">
          <div className="overflow-hidden rounded-[15px] border border-border bg-card">
            <div className="px-[17px] py-3 text-[13px] text-sub">
              …card or article body…
            </div>
            <MythStrip myth={"“Missing one Monday invalidates all of them.”"} />
          </div>
        </GallerySection>

        <GallerySection
          label="COMPACT ROW"
          note="Wrap rows in a rounded bordered container."
        >
          <div className="overflow-hidden rounded-[15px] border border-border bg-card">
            <CompactRow
              title="What is a vrat?"
              subtitle="6 min read · plain language, no citations"
              href="/ritual-guides/beginners-guides/what-is-a-vrat"
            />
            <CompactRow
              title="Your first puja at home"
              subtitle="8 min · under ₹300 to start"
              href="/ritual-guides/beginners-guides/first-puja-at-home"
            />
            <CompactRow
              title="The seven kandas"
              subtitle="6 min · no Sanskrit required"
              href="/ritual-guides/beginners-guides/the-seven-kandas"
            />
          </div>
        </GallerySection>
      </div>

      <GallerySectionFullBleed label="CATEGORY HERO — FOUR VARIANTS" />
      <div className="mt-3 flex flex-col gap-5">
        <CategoryHero
          variant="rg"
          eyebrow="Ritual Guides"
          title="Every ritual, the right way"
          description="The complete vidhi for festivals, vrats and life events — the steps, the story behind them, and a clear line between what scripture says and what your family does. Free, always."
          meta={[
            { value: "34", label: "guides live" },
            { value: "21", label: "more by December" },
            { value: "4", label: "sub-categories" },
          ]}
          side={
            <>
              <p className="mb-[11px] text-[9.5px] font-bold tracking-[0.7px] text-eyebrow-dark">
                ◔ NEW TO ALL OF THIS?
              </p>
              <p className="mb-[6px] text-[17px] leading-[1.35] font-bold text-white">
                Start with Beginner&rsquo;s Guides
              </p>
              <p className="mb-[13px] text-[12.5px] leading-[1.65] text-hero-text/60">
                No tags, no citations, no Sanskrit you have to look up. Just
                what to do.
              </p>
              <span className="inline-block rounded-[10px] bg-cta px-[18px] py-[10px] text-[12.5px] font-bold text-white">
                Start here ›
              </span>
            </>
          }
        />
        <CategoryHero
          variant="pa"
          eyebrow="Panchang"
          title="The day, computed for your city"
          description="Tithi, nakshatra, sunrise and Rahu Kaal — served from our own API, verified manually, never blank."
          meta={[
            { value: "142", label: "vrat dates this year" },
            { value: "5", label: "limbs, explained once" },
          ]}
        />
        <CategoryHero
          variant="dc"
          eyebrow="Dharmic Concepts"
          title="Why we do what we do"
          description="Materials, meanings and practices — every concept sourced to a named text, in plain language."
          meta={[{ value: "142", label: "glossary terms" }]}
        />
        <CategoryHero
          variant="rk"
          eyebrow="Ritual Pujans"
          title="Everything for the pujan, delivered"
          description="Samagri kits matched to every ritual guide. You do not need a kit — every samagri list is free and complete."
        />
      </div>

      <div className="mx-auto max-w-[1280px] px-4 md:px-10">
        <GallerySection
          label="METHOD BAND"
          note="The Dharma / Pratha / Bhranti explainer."
        >
          <MethodBand />
        </GallerySection>
      </div>
    </main>
  );
}

function GallerySectionFullBleed({ label }: { label: string }) {
  return (
    <p className="mx-auto mt-9 mb-1 max-w-[1280px] px-4 text-[10px] font-bold tracking-[0.8px] text-gold uppercase md:px-10">
      {label}
    </p>
  );
}
