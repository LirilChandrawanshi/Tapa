import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CategoryHero } from "@/components/CategoryHero";
import { MethodBand } from "@/components/MethodBand";
import { AllArticlesTabs } from "@/components/listing/AllArticlesTabs";
import { fetchGlossary } from "@/lib/api";
import { fetchAllArticlesSafe } from "@/lib/listingExtras";

/**
 * /all-articles — the full index of everything published (#56).
 * Rendered on demand so a down backend degrades to the empty state
 * instead of failing the build; the plain crawl index is emitted in
 * the server HTML (both tab panels stay in the DOM).
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All Articles",
  description:
    "Every published Tapa guide and concept article in one index — browse by category, or scan the plain list.",
};

/** Glossary count for the hero side card — a dead backend just hides the number. */
async function glossaryCountSafe(): Promise<number> {
  try {
    return (await fetchGlossary()).items.length;
  } catch {
    return 0;
  }
}

export default async function AllArticlesPage() {
  const [articles, glossaryCount] = await Promise.all([
    fetchAllArticlesSafe({}, 500),
    glossaryCountSafe(),
  ]);

  const categoryCount = new Set(articles.map((a) => a.category)).size;

  return (
    <div>
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: "All Articles" }]}
      />

      <CategoryHero
        variant="rg"
        eyebrow="The Tapa Co. › All Articles"
        title="Everything we have written"
        description="Every article across Ritual Guides, Dharmic Concepts and Panchang, in one list. Filter by category and sub-category on the left, or search if you already know the word you want."
        meta={[
          { value: String(articles.length), label: "articles" },
          { value: String(categoryCount), label: "categories" },
          { value: "Every", label: "claim sourced" },
        ]}
        side={
          <>
            <p className="mb-[11px] text-[9.5px] font-bold tracking-[0.7px] text-eyebrow-dark uppercase">
              ◗ Look up any term
            </p>
            <p className="mb-[6px] text-[17px] leading-[1.35] font-bold text-hero-text">
              The Glossary
            </p>
            <p className="mb-[13px] text-[12.5px] leading-[1.65] text-hero-text/60">
              {glossaryCount > 0 ? `${glossaryCount} words` : "Every word"}{" "}
              defined once, in plain language, with the Devanagari and how to
              say it out loud.
            </p>
            <Link
              href="/glossary"
              className="inline-block rounded-[10px] bg-cta px-[18px] py-[10px] text-[12.5px] font-bold text-white hover:opacity-90"
            >
              Open the glossary ›
            </Link>
          </>
        }
      />

      <div className="mx-auto max-w-[1280px] px-4 py-9 md:px-10">
        <AllArticlesTabs articles={articles} />
        <div className="mt-11">
          <MethodBand />
        </div>
      </div>
    </div>
  );
}
