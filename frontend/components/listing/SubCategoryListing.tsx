import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { MethodBand } from "@/components/MethodBand";
import { EmptyShelf } from "./ArticleCardGrid";
import { SlpBrowser, type SlpMode } from "./SlpBrowser";
import {
  correctionsCount,
  fetchAllArticlesSafe,
  monthsAhead,
} from "@/lib/listingExtras";
import { getSection, type NavSectionKey } from "@/lib/taxonomy";

const HERO_CLASS: Record<NavSectionKey, string> = {
  "ritual-guides": "hero-rg",
  panchang: "hero-pa",
  "dharmic-concepts": "hero-dc",
  "ritual-pujans": "hero-rk",
};

/**
 * SLP-at-scale sub-category listing (/ritual-guides/festive-pujans, …):
 * breadcrumb, sibling rail, dark SLP hero with honest stats, then the
 * client SlpBrowser (facets · views · density · pager). The server
 * fetches up to 200 published articles and hands them over. Unknown
 * sub-categories 404; an unreachable API degrades to the empty shelf.
 */
export async function SubCategoryListing({
  sectionKey,
  subCategory,
}: {
  sectionKey: NavSectionKey;
  subCategory: string;
  /** PLP chip handoff — "coming-up" | "this-month" | "deity:Shiva". */
}) {
  const section = getSection(sectionKey);
  const current = section.children.find((c) =>
    c.href.endsWith(`/${subCategory}`),
  );
  if (!current) notFound();

  const now = new Date().toISOString();
  const articles = await fetchAllArticlesSafe(
    { category: sectionKey, subCategory },
    200,
  );

  const mode: SlpMode =
    sectionKey === "ritual-guides" && subCategory === "beginners-guides"
      ? "seq"
      : sectionKey === "dharmic-concepts"
        ? "az"
        : articles.some((a) => a.observanceDate)
          ? "dated"
          : "az";

  const noun = sectionKey === "dharmic-concepts" ? "articles" : "guides";
  const ahead = monthsAhead(articles, now);
  const corrections = correctionsCount(articles);

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
          <span className="mr-1 shrink-0 text-[9.5px] font-bold tracking-[0.6px] text-gold uppercase">
            In this category
          </span>
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
          <Link
            href={section.href}
            className="ml-auto hidden shrink-0 pl-3 text-xs font-semibold whitespace-nowrap text-cta md:block"
          >
            All {section.label} ›
          </Link>
        </div>
      </div>

      {/* SLP dark hero */}
      <section
        className={`${HERO_CLASS[sectionKey]} relative overflow-hidden py-7 md:py-9`}
      >
        <div
          aria-hidden
          className="absolute inset-0 [background:radial-gradient(ellipse_60%_80%_at_80%_40%,rgba(255,255,255,0.05)_0%,transparent_62%)]"
        />
        <div className="relative mx-auto grid max-w-[1280px] items-center gap-6 px-4 md:grid-cols-[1.25fr_0.75fr] md:gap-11 md:px-10">
          <div>
            <p className="mb-[10px] text-[10px] tracking-[1px] text-eyebrow-dark uppercase">
              {section.label}{" "}
              <b aria-hidden className="font-normal text-hero-text/55">
                ›
              </b>{" "}
              {current.label}
            </p>
            <h1 className="mb-3 text-[26px] leading-[1.12] font-bold tracking-[-0.8px] text-hero-text md:text-[34px]">
              {current.label}
            </h1>
            {current.description && (
              <p className="mb-4 max-w-[520px] text-sm leading-[1.8] text-hero-text/70 md:text-[15.5px]">
                {current.description}.
              </p>
            )}
            <div className="flex flex-wrap gap-[22px]">
              <HeroStat
                value={articles.length > 0 ? String(articles.length) : "Growing"}
                label={articles.length > 0 ? `${noun} live` : "shelf"}
              />
              {mode === "dated" && ahead > 0 && (
                <HeroStat
                  value={String(ahead)}
                  label={ahead === 1 ? "month ahead" : "months ahead"}
                />
              )}
              {corrections > 0 && (
                <HeroStat
                  value={String(corrections)}
                  label="carry a Bhranti correction"
                />
              )}
            </div>
          </div>
          <SlpHeroSideCard sectionKey={sectionKey} subCategory={subCategory} />
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-4 py-8 md:px-10">
        {articles.length > 0 ? (
          <Suspense><SlpBrowser
            articles={articles}
            mode={mode}
            now={now}
            noun={noun}
          /></Suspense>
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

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <span className="text-xs text-hero-text/55">
      <b className="text-sm font-bold text-eyebrow-dark">{value}</b> {label}
    </span>
  );
}

/** Per-pillar side card: rg → Beginner's Guides, dc → the Glossary. */
function SlpHeroSideCard({
  sectionKey,
  subCategory,
}: {
  sectionKey: NavSectionKey;
  subCategory: string;
}) {
  let card: {
    eyebrow: string;
    title: string;
    body: string;
    cta: string;
    href: string;
  } | null = null;

  if (sectionKey === "ritual-guides") {
    card =
      subCategory === "beginners-guides"
        ? {
            eyebrow: "◔ If you read one thing",
            title: "Start at step 1",
            body: "The first guides cover every word the rest assume you already know. No tags, no citations, no Sanskrit to look up.",
            cta: "Why we wrote these ›",
            href: "/editorial-method",
          }
        : {
            eyebrow: "◔ New to all of this?",
            title: "Beginner's Guides",
            body: "Guides that assume nothing — what to buy, what to say, and what genuinely matters less than you have been told.",
            cta: "Start with Beginner's Guides ›",
            href: "/ritual-guides/beginners-guides",
          };
  } else if (sectionKey === "dharmic-concepts") {
    card = {
      eyebrow: "◗ Look up any term",
      title: "The Glossary",
      body: "Every word defined once, in plain language, with the Devanagari and how to say it out loud.",
      cta: "Open the glossary ›",
      href: "/glossary",
    };
  }

  if (!card) return null;
  return (
    <div className="rounded-2xl border border-white/[0.14] bg-white/[0.07] px-[22px] py-5">
      <p className="mb-[10px] text-[9.5px] font-bold tracking-[0.7px] text-eyebrow-dark uppercase">
        {card.eyebrow}
      </p>
      <p className="mb-[6px] text-[17px] leading-[1.35] font-bold text-white">
        {card.title}
      </p>
      <p className="mb-[13px] text-[12.5px] leading-[1.65] text-hero-text/60">
        {card.body}
      </p>
      <Link
        href={card.href}
        className="inline-block rounded-[10px] bg-cta px-[18px] py-[10px] text-[12.5px] font-bold text-white"
      >
        {card.cta}
      </Link>
    </div>
  );
}
