import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { MethodBand } from "@/components/MethodBand";
import { SectionHeader } from "@/components/SectionHeader";
import { ArticleCardGrid, EmptyShelf } from "./ArticleCardGrid";
import { fetchArticlesSafe } from "@/lib/articleExtras";
import { getSection, type NavSectionKey } from "@/lib/taxonomy";

/**
 * SLP-lite sub-category listing (/ritual-guides/festive-pujans, …):
 * breadcrumb, sibling rail from the taxonomy, card grid, MethodBand.
 * Unknown sub-categories 404; an unreachable API degrades to the
 * empty-shelf state rather than an error page.
 */
export async function SubCategoryListing({
  sectionKey,
  subCategory,
}: {
  sectionKey: NavSectionKey;
  subCategory: string;
}) {
  const section = getSection(sectionKey);
  const current = section.children.find((c) =>
    c.href.endsWith(`/${subCategory}`),
  );
  if (!current) notFound();

  const now = new Date().toISOString();
  const page = await fetchArticlesSafe({
    category: sectionKey,
    subCategory,
    size: 24,
  });

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: section.label, href: section.href },
          { label: current.label },
        ]}
      />

      {/* sibling rail */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1280px] items-center gap-2 overflow-x-auto px-4 py-[10px] [scrollbar-width:none] md:px-10 [&::-webkit-scrollbar]:hidden">
          {section.children.map((child) => {
            const active = child.href === current.href;
            return (
              <Link
                key={child.href}
                href={child.href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-[10px] border-[1.5px] px-[15px] py-[7px] text-[13px] font-medium whitespace-nowrap ${
                  active
                    ? "border-cta bg-cta text-white"
                    : "border-border bg-bg text-body hover:border-cta"
                }`}
              >
                {child.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-4 py-9 md:px-10">
        <SectionHeader
          eyebrow={section.label}
          title={current.label}
          description={current.description}
          count={
            page.totalItems > 0
              ? `${page.totalItems} guide${page.totalItems === 1 ? "" : "s"}`
              : undefined
          }
        />
        {page.items.length > 0 ? (
          <ArticleCardGrid articles={page.items} now={now} />
        ) : (
          <EmptyShelf label={current.label} />
        )}

        <div className="mt-12">
          <MethodBand />
        </div>
      </div>
    </div>
  );
}
