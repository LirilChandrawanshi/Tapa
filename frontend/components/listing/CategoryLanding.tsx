import Link from "next/link";
import { CategoryHero, type CategoryHeroVariant } from "@/components/CategoryHero";
import { MethodBand } from "@/components/MethodBand";
import { SectionHeader } from "@/components/SectionHeader";
import { ArticleCardGrid, EmptyShelf } from "./ArticleCardGrid";
import { articleHref, fetchArticlesSafe } from "@/lib/articleExtras";
import { getSection, type NavSectionKey } from "@/lib/taxonomy";
import type { Article } from "@/lib/types";

/**
 * Parent-category landing (/ritual-guides, /dharmic-concepts):
 * CategoryHero (honest live counts + per-pillar side card), a filter
 * chip row that links into the flagship SLP with `?filter=…`, then one
 * card-grid section per taxonomy sub-category — the Beginner's shelf
 * renders as a "Read in this order" split feature card. Sections
 * degrade to an editorial empty state when the API is down/unseeded.
 */
export async function CategoryLanding({
  sectionKey,
  variant,
  eyebrow,
  description,
  heroImage,
}: {
  sectionKey: NavSectionKey;
  variant: CategoryHeroVariant;
  eyebrow: string;
  description: string;
  /** Optional hero photograph; falls back to the variant's CSS layers. */
  heroImage?: string;
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
  const liveShelves = shelves.filter((s) => s.page.totalItems > 0).length;

  return (
    <div>
      <CategoryHero
        variant={variant}
        image={heroImage}
        eyebrow={eyebrow}
        title={section.label}
        description={description}
        meta={[
          {
            value: totalItems > 0 ? String(totalItems) : "Growing",
            label: totalItems > 0 ? "guides live" : "library",
          },
          {
            value: `${liveShelves > 0 ? liveShelves : section.children.length}`,
            label:
              liveShelves > 0
                ? `of ${section.children.length} sub-categories live`
                : "sub-categories",
          },
          { value: "0", label: "fear-based claims" },
        ]}
        side={<LandingSideCard sectionKey={sectionKey} section={section} />}
      />

      <FilterChipRow sectionKey={sectionKey} />

      <div className="mx-auto max-w-[1280px] px-4 py-9 md:px-10">
        {shelves.map(({ child, subCategory, page }) => (
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
            {page.items.length === 0 ? (
              <EmptyShelf label={child.label} />
            ) : subCategory === "beginners-guides" ? (
              <BeginnersFeatureCard articles={page.items} href={child.href} />
            ) : (
              <ArticleCardGrid articles={page.items} now={now} />
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

/* ── hero side card, per pillar ──────────────────────────────────── */

function LandingSideCard({
  sectionKey,
  section,
}: {
  sectionKey: NavSectionKey;
  section: ReturnType<typeof getSection>;
}) {
  if (sectionKey === "ritual-guides") {
    return (
      <div>
        <p className="mb-[10px] text-[9.5px] font-bold tracking-[0.7px] text-eyebrow-dark uppercase">
          ◔ New to all of this?
        </p>
        <p className="mb-[6px] text-[17px] leading-[1.35] font-bold text-white">
          Nobody is born knowing the vidhi
        </p>
        <p className="mb-[13px] text-[12.5px] leading-[1.65] text-hero-text/60">
          Guides that assume nothing — what to buy, what to say, how long it
          takes, and what matters less than you have been told.
        </p>
        <Link
          href="/ritual-guides/beginners-guides"
          className="inline-block rounded-[10px] bg-cta px-[18px] py-[10px] text-[12.5px] font-bold text-white"
        >
          Start with Beginner&rsquo;s Guides ›
        </Link>
      </div>
    );
  }

  if (sectionKey === "dharmic-concepts") {
    return (
      <div>
        <p className="mb-[10px] text-[9.5px] font-bold tracking-[0.7px] text-eyebrow-dark uppercase">
          ◗ Look up any term
        </p>
        <p className="mb-[6px] text-[17px] leading-[1.35] font-bold text-white">
          The Glossary
        </p>
        <p className="mb-[13px] text-[12.5px] leading-[1.65] text-hero-text/60">
          Every word defined once, in plain language, with the Devanagari and
          how to say it out loud.
        </p>
        <Link
          href="/glossary"
          className="inline-block rounded-[10px] bg-cta px-[18px] py-[10px] text-[12.5px] font-bold text-white"
        >
          Open the glossary ›
        </Link>
      </div>
    );
  }

  // other pillars keep the collection list
  return (
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
  );
}

/* ── filter chip row → flagship SLP with ?filter= ────────────────── */

/** The sub-category each pillar's chips land in. */
const CHIP_TARGET: Partial<Record<NavSectionKey, string>> = {
  "ritual-guides": "/ritual-guides/festive-pujans",
  "dharmic-concepts": "/dharmic-concepts/meanings-practices",
};

const DEITY_CHIPS = ["Shiva", "Vishnu", "Devi", "Ganesha"] as const;

function FilterChipRow({ sectionKey }: { sectionKey: NavSectionKey }) {
  const target = CHIP_TARGET[sectionKey];
  if (!target) return null;

  const chips: { label: string; filter: string }[] = [
    ...(sectionKey === "ritual-guides"
      ? [
          { label: "Coming up", filter: "coming-up" },
          { label: "This month", filter: "this-month" },
        ]
      : []),
    ...DEITY_CHIPS.map((d) => ({ label: d, filter: `deity:${d}` })),
  ];

  return (
    <div className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-[1280px] items-center gap-[9px] overflow-x-auto px-4 py-[13px] [scrollbar-width:none] md:px-10 [&::-webkit-scrollbar]:hidden">
        <span className="mr-[3px] shrink-0 text-[9.5px] font-bold tracking-[0.6px] text-gold uppercase">
          Filter
        </span>
        {chips.map((chip) => (
          <Link
            key={chip.filter}
            href={`${target}?filter=${encodeURIComponent(chip.filter)}`}
            className="shrink-0 rounded-[9px] border-[1.5px] border-border bg-bg px-[14px] py-[7px] text-[12.5px] font-medium whitespace-nowrap text-body hover:border-cta hover:text-cta"
          >
            {chip.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ── Beginner's split feature card (#39) ─────────────────────────── */

function BeginnersFeatureCard({
  articles,
  href,
}: {
  articles: Article[];
  href: string;
}) {
  const list = articles.slice(0, 5);
  return (
    <div className="grid overflow-hidden rounded-[18px] border border-border md:grid-cols-2">
      <div className="flex flex-col justify-center px-5 py-6 [background:linear-gradient(150deg,#6B3410,#2A1408)] md:px-[34px] md:py-8">
        <span className="mb-[13px] inline-flex self-start rounded-[7px] border border-white/30 bg-white/[0.18] px-3 py-[5px] text-[10px] font-bold tracking-[0.4px] text-white uppercase">
          Read in this order
        </span>
        <p className="mb-[9px] text-[22px] leading-[1.2] font-bold tracking-[-0.5px] text-white md:text-[27px]">
          Nobody is born knowing the vidhi
        </p>
        <p className="mb-4 text-[13.5px] leading-[1.7] text-white/70">
          Guides that assume nothing. What to buy, what to say, how long it
          takes, and what genuinely does not matter as much as you have been
          told.
        </p>
        <Link
          href={href}
          className="inline-block self-start rounded-[10px] bg-white px-5 py-[11px] text-[12.5px] font-bold text-ink"
        >
          Start at step 1 ›
        </Link>
      </div>
      <div className="flex flex-col justify-center bg-card px-5 py-5 md:px-8 md:py-7">
        {list.map((a, i) => (
          <Link
            key={a.slug}
            href={articleHref(a)}
            className="flex items-center justify-between gap-3 border-b-[0.5px] border-border-light py-[10px] last:border-b-0"
          >
            <span className="min-w-0">
              <span className="block text-[14.5px] font-semibold text-ink">
                {i + 1} · {a.lang.en.title}
              </span>
              {a.readMinutes !== undefined && (
                <span className="mt-[2px] block text-[11.5px] text-sub">
                  {a.readMinutes} min read
                </span>
              )}
            </span>
            <span aria-hidden className="shrink-0 text-base text-cta">
              ›
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
