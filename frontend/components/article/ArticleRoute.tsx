import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleView } from "./ArticleView";
import { ConceptView } from "./ConceptView";
import { fetchArticleSafe } from "@/lib/articleExtras";
import { getSection, type NavSectionKey } from "@/lib/taxonomy";

/**
 * Shared route body for /ritual-guides/... and /dharmic-concepts/...
 * article pages: fetches the article, 404s on a true miss, and renders a
 * graceful "temporarily unavailable" state when the API is unreachable
 * (the build and SSR must survive the backend being down).
 */
export async function ArticleRoute({
  slug,
  sectionKey,
}: {
  slug: string;
  sectionKey: NavSectionKey;
}) {
  const section = getSection(sectionKey);
  const { article, notFound: missing } = await fetchArticleSafe(slug);

  if (missing) notFound();

  if (!article) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 py-20 text-center md:px-10">
        <p className="mb-2 text-[11px] font-bold tracking-[0.8px] text-gold uppercase">
          {section.label}
        </p>
        <h1 className="mb-3 text-2xl font-bold text-ink">
          This guide is resting for a moment
        </h1>
        <p className="mx-auto mb-6 max-w-[440px] text-sm leading-relaxed text-sub">
          We could not reach the knowledge library just now. Nothing is lost —
          refresh in a little while, or browse the rest of the collection.
        </p>
        <Link
          href={section.href}
          className="inline-block rounded-[11px] bg-cta px-[22px] py-[11px] text-[12.5px] font-bold text-white"
        >
          Browse {section.label} ›
        </Link>
      </div>
    );
  }

  // Dharmic Concepts get their own template — a concept is an argument, not
  // a procedure, so the ritual-guide furniture (samagri, muhurat, ritual card)
  // does not apply. See ConceptView.
  const Template =
    article.type === "DHARMIC_CONCEPT" ? ConceptView : ArticleView;

  return (
    <Template
      article={article}
      sectionKey={sectionKey}
      sectionLabel={section.label}
      sectionHref={section.href}
    />
  );
}
