import type { Metadata } from "next";
import { Breadcrumb } from "@/components/Breadcrumb";
import { SectionHeader } from "@/components/SectionHeader";
import { AllArticlesTabs } from "@/components/listing/AllArticlesTabs";
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

export default async function AllArticlesPage() {
  const articles = await fetchAllArticlesSafe({}, 500);

  return (
    <div>
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: "All Articles" }]}
      />
      <div className="mx-auto max-w-[1280px] px-4 py-9 md:px-10">
        <SectionHeader
          eyebrow="The Tapa Co. · Knowledge"
          title="All articles"
          description="Every guide and concept article we have published, in one place. Each names its source — scripture, custom and rumour clearly separated."
        />
        <AllArticlesTabs articles={articles} />
      </div>
    </div>
  );
}
