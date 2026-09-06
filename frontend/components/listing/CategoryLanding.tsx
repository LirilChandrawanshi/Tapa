import Link from "next/link";
import { CategoryHero, type CategoryHeroVariant } from "@/components/CategoryHero";
import { MethodBand } from "@/components/MethodBand";
import { SectionHeader } from "@/components/SectionHeader";
import { ArticleCardGrid, EmptyShelf } from "./ArticleCardGrid";
import { fetchArticlesSafe } from "@/lib/articleExtras";
import { getSection, type NavSectionKey } from "@/lib/taxonomy";

/**
 * Parent-category landing (/ritual-guides, /dharmic-concepts):
 * CategoryHero + one card-grid section per taxonomy sub-category,
 * each fed by fetchArticles({category, subCategory}). Sections degrade
 * to an editorial empty state when the API is down or unseeded.
 */
export async function CategoryLanding({
  sectionKey,
  variant,
  eyebrow,
  description,
}: {
  sectionKey: NavSectionKey;
  variant: CategoryHeroVariant;
  eyebrow: string;
  description: string;
}) {
  const section = getSection(sectionKey);
  const now = new Date().toISOString();

  const shelves = await Promise.all(
    section.children.map(async (child) => {
      const subCategory = child.href.split("/").pop() ?? "";
      const page = await fetchArticlesSafe({
        category: sectionKey,
        subCategory,
        size: 6,
      });
      return { child, subCategory, page };
    }),
  );

  const totalItems = shelves.reduce((n, s) => n + s.page.totalItems, 0);

  return (
    <div>
      <CategoryHero
        variant={variant}
        eyebrow={eyebrow}
        title={section.label}
        description={description}
        meta={[
          { value: String(section.children.length), label: "collections" },
          {
            value: totalItems > 0 ? String(totalItems) : "growing",
            label: totalItems > 0 ? "guides live" : "library",
          },
          { value: "0", label: "fear-based claims" },
        ]}
        side={
          <div>
            <p className="mb-[10px] text-[10px] font-bold tracking-[0.8px] text-eyebrow-dark uppercase">
              Browse by collection
            </p>
            <div className="flex flex-col">
              {section.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className="flex items-center justify-between gap-3 border-b border-white/10 py-[9px] text-[13px] font-semibold text-hero-text last:border-b-0 hover:text-eyebrow-dark"
                >
                  {child.label}
                  <span aria-hidden className="text-cta">
                    ›
                  </span>
                </Link>
              ))}
            </div>
          </div>
        }
      />

      <div className="mx-auto max-w-[1280px] px-4 py-9 md:px-10">
        {shelves.map(({ child, page }) => (
          <section key={child.href} className="mb-11 last:mb-0">
            <SectionHeader
              title={child.label}
              description={child.description}
              count={
                page.totalItems > 0
                  ? `${page.totalItems} guide${page.totalItems === 1 ? "" : "s"}`
                  : undefined
              }
              viewAllHref={child.href}
            />
            {page.items.length > 0 ? (
              <ArticleCardGrid articles={page.items} now={now} />
            ) : (
              <EmptyShelf label={child.label} />
            )}
          </section>
        ))}

        <div className="mt-12">
          <MethodBand />
        </div>
      </div>
    </div>
  );
}
