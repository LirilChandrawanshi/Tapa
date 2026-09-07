import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CategoryHero } from "@/components/CategoryHero";
import { GlossaryBrowser } from "@/components/staticpages/GlossaryBrowser";
import { SuggestWord } from "@/components/staticpages/SuggestWord";
import { fetchGlossary } from "@/lib/api";
import type { GlossaryTerm } from "@/lib/types";

export const revalidate = 3600; // ISR — purged via the `glossary` tag

export const metadata: Metadata = {
  title: "Glossary",
  description:
    "Every word we use, explained once — forty words or fewer per term, in plain language. No tags, no scores, plain meanings.",
};

async function fetchGlossarySafe(): Promise<{
  items: GlossaryTerm[];
  mostLookedUp: GlossaryTerm[];
}> {
  try {
    return await fetchGlossary();
  } catch {
    return { items: [], mostLookedUp: [] };
  }
}

export default async function GlossaryPage() {
  const { items, mostLookedUp } = await fetchGlossarySafe();

  return (
    <div>
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: "Glossary" }]}
      />

      <CategoryHero
        variant="dc"
        eyebrow="The Tapa Co. · Glossary"
        title="Every word we use, explained once"
        description="Forty words or fewer per term, in plain language — no tags, no scores, plain meanings. If a word in any guide sends you here, this is where it is defined, and where to read more about it."
        meta={[
          {
            value: items.length > 0 ? String(items.length) : "growing",
            label: "terms",
          },
          { value: "EN + हिं", label: "both" },
          { value: "Free", label: "like everything else" },
        ]}
        side={
          mostLookedUp.length > 0 ? (
            <div>
              <p className="mb-[10px] text-[10px] font-bold tracking-[0.8px] text-eyebrow-dark uppercase">
                Most looked up
              </p>
              <div className="flex flex-wrap gap-[7px]">
                {mostLookedUp.map((t) => (
                  <a
                    key={t.slug}
                    href={`#${t.slug}`}
                    className="rounded-full border border-white/20 bg-white/10 px-3 py-[5px] text-xs font-semibold text-hero-text hover:border-eyebrow-dark hover:text-eyebrow-dark"
                  >
                    {t.term}
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-[10px] text-[10px] font-bold tracking-[0.8px] text-eyebrow-dark uppercase">
                How this differs from Concepts
              </p>
              <p className="text-[12.5px] leading-relaxed text-hero-text/70">
                The glossary <b className="text-hero-text">defines and points</b>{" "}
                — one paragraph, then a link. Dharmic Concepts explain — the
                story, the source and the practice behind a word.
              </p>
            </div>
          )
        }
      />

      <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-10">
        <GlossaryBrowser terms={items} />

        {/* one-sheet PDF of the whole glossary (#118) */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[15px] border border-gold/40 bg-pratha-bg px-5 py-4">
          <div>
            <p className="text-[13.5px] font-bold text-ink">
              Take the whole glossary with you
            </p>
            <p className="text-[12.5px] leading-relaxed text-sub">
              Every term, Devanagari and definition on one printable sheet —
              for the puja shelf, or for whoever asks what the words mean.
            </p>
          </div>
          <a
            href="/api/v1/glossary.pdf"
            target="_blank"
            rel="noopener"
            className="shrink-0 rounded-[11px] bg-cta px-[20px] py-[10px] text-[12.5px] font-bold text-white"
          >
            Download the PDF ›
          </a>
        </div>

        <div className="mt-9 grid gap-4 md:grid-cols-2">
          <div className="rounded-[18px] bg-ink-deep px-5 py-6 md:px-[28px]">
            <p className="mb-[10px] text-[10px] font-bold tracking-[0.8px] text-eyebrow-dark uppercase">
              How the glossary works
            </p>
            <h2 className="mb-2 text-[17px] font-bold text-hero-text">
              One entry per word, referenced everywhere it appears.
            </h2>
            <p className="mb-3 text-[12.5px] leading-[1.8] text-[#C4A882]">
              A term is defined here once. Every guide that uses it links to
              this entry rather than repeating a definition — so when a
              definition improves, it improves everywhere at once.
            </p>
            <p className="text-[12.5px] leading-[1.8] text-[#C4A882]">
              Entries carry <b className="text-hero-text">no classification tag
              and no confidence score</b>. A definition is not a
              ritual-authority claim. Where a word carries real weight, the
              entry points at the Dharmic Concept that does the sourcing.
            </p>
          </div>
          <div className="rounded-[18px] border border-border bg-card px-5 py-6 md:px-[28px]">
            <p className="mb-[10px] text-[10px] font-bold tracking-[0.8px] text-gold uppercase">
              How this differs from Concepts
            </p>
            <p className="mb-3 text-[13px] leading-[1.8] text-body">
              The glossary <b>defines and points</b> — one paragraph, then a
              link. <b>Dharmic Concepts explain</b> — the story, the source and
              the practice behind a word.
            </p>
            <p className="mb-4 text-[13px] leading-[1.8] text-body">
              Where a concept article exists, the entry links to it.
            </p>
            <Link
              href="/dharmic-concepts"
              className="inline-block rounded-[11px] bg-cta px-[20px] py-[10px] text-[12.5px] font-bold text-white"
            >
              Browse Dharmic Concepts ›
            </Link>
          </div>
        </div>

        <div className="mt-4">
          <SuggestWord />
        </div>
      </div>
    </div>
  );
}
