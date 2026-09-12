import Link from "next/link";
import { DpbBadge, type DpbTag } from "@/components/DpbBadge";
import { Pill } from "@/components/Pill";
import { sectionText, type HomeSection } from "@/lib/homeExtras";

const TAGS: DpbTag[] = ["dharma", "pratha", "bhranti"];

/** Only the three locked classifications are accepted; anything else falls back. */
function asTag(value: string): DpbTag {
  return (TAGS as string[]).includes(value) ? (value as DpbTag) : "dharma";
}

/**
 * Dharmic Concepts feature split. Copy, the linked concept and the badge are
 * CMS-editable (`category-spotlight`); the DPB badge itself still renders
 * through DpbBadge so the locked tag styling cannot be edited around.
 */
export function CategorySpotlight({ section }: { section?: HomeSection }) {
  const score = Number(sectionText(section, "dpbScore", "4"));
  return (
    <section className="mx-auto max-w-[1280px] px-4 pt-10 md:px-10">
      <div className="grid overflow-hidden rounded-[18px] border border-border md:grid-cols-2">
        <div className="hero-dc flex flex-col justify-center px-6 py-9 md:px-9">
          <p className="mb-3 text-[11px] font-bold tracking-[0.8px] text-eyebrow-dark uppercase">
            {sectionText(section, "eyebrow", "Dharmic Concepts · Materials")}
          </p>
          <h2 className="mb-3 text-[24px] leading-[1.2] font-bold tracking-[-0.4px] text-hero-text md:text-[27px]">
            {sectionText(section, "title", "Why is bilva dear to Mahadev?")}
          </h2>
          <p className="mb-5 text-[14px] leading-[1.8] text-hero-text/70">
            {sectionText(
              section,
              "body",
              "A hunter got lost in a forest, climbed a tree, and dropped leaves through the night to stay awake. He did not know there was a Shivalinga at the roots. He did not know it was a bilva tree.",
            )}
          </p>
          <Link
            href={sectionText(section, "ctaHref", "/dharmic-concepts")}
            className="inline-block self-start rounded-[22px] bg-cta px-[22px] py-[11px] text-[13px] font-bold text-white hover:opacity-90"
          >
            {sectionText(section, "ctaLabel", "Read the story ›")}
          </Link>
        </div>
        <div className="flex flex-col justify-center bg-card px-6 py-9 md:px-9">
          <p className="mb-4 text-[15px] leading-[1.85] text-body italic">
            {sectionText(
              section,
              "quoteLead",
              "Three leaves, one stem. The tree did not study scripture to grow this way.",
            )}{" "}
            <b className="font-bold text-ink not-italic">
              {sectionText(
                section,
                "quoteBold",
                "The tradition looked at what grew and recognised something it already knew.",
              )}
            </b>
          </p>
          <div className="flex flex-wrap gap-[7px]">
            <DpbBadge
              tag={asTag(sectionText(section, "dpbTag", "dharma"))}
              score={Number.isFinite(score) ? score : 4}
              source={sectionText(section, "dpbSource", "Puranic")}
            />
            <Pill>{sectionText(section, "pill", "Shiva Purana · Bilvashtakam")}</Pill>
          </div>
        </div>
      </div>
    </section>
  );
}
