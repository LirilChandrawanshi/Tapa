import Link from "next/link";
import { DpbBadge } from "@/components/DpbBadge";
import { Pill } from "@/components/Pill";

/**
 * Dharmic Concepts feature split — a single static spotlight (à la
 * MethodBand's hardcoded rows). Intentionally not data-driven for Phase 1;
 * HomePayload has no "featured concept" field, so wiring this to a real
 * article is a natural follow-up rather than something to build now.
 */
export function CategorySpotlight() {
  return (
    <section className="mx-auto max-w-[1280px] px-4 pt-10 md:px-10">
      <div className="grid overflow-hidden rounded-[18px] border border-border md:grid-cols-2">
        <div className="hero-dc flex flex-col justify-center px-6 py-9 md:px-9">
          <p className="mb-3 text-[11px] font-bold tracking-[0.8px] text-eyebrow-dark uppercase">
            Dharmic Concepts · Materials
          </p>
          <h2 className="mb-3 text-[24px] leading-[1.2] font-bold tracking-[-0.4px] text-hero-text md:text-[27px]">
            Why is bilva dear to Mahadev?
          </h2>
          <p className="mb-5 text-[14px] leading-[1.8] text-hero-text/70">
            A hunter got lost in a forest, climbed a tree, and dropped leaves
            through the night to stay awake. He did not know there was a
            Shivalinga at the roots. He did not know it was a bilva tree.
          </p>
          <Link
            href="/dharmic-concepts"
            className="inline-block self-start rounded-[22px] bg-cta px-[22px] py-[11px] text-[13px] font-bold text-white hover:opacity-90"
          >
            Read the story ›
          </Link>
        </div>
        <div className="flex flex-col justify-center bg-card px-6 py-9 md:px-9">
          <p className="mb-4 text-[15px] leading-[1.85] text-body italic">
            Three leaves, one stem. The tree did not study scripture to grow
            this way.{" "}
            <b className="font-bold text-ink not-italic">
              The tradition looked at what grew and recognised something it
              already knew.
            </b>
          </p>
          <div className="flex flex-wrap gap-[7px]">
            <DpbBadge tag="dharma" score={4} source="Puranic" />
            <Pill>Shiva Purana · Bilvashtakam</Pill>
          </div>
        </div>
      </div>
    </section>
  );
}
