"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DpbBadge } from "@/components/DpbBadge";
import {
  articleHref,
  DEITIES,
  normalizeDeity,
  titleizeSlug,
} from "@/lib/articleExtras";
import { badgeTagOf } from "@/lib/homeExtras";
import { TAXONOMY } from "@/lib/taxonomy";
import type { Article } from "@/lib/types";

const READER_PAGE = 50;

type Tab = "reader" | "crawl";

function categoryLabel(slug: string): string {
  return TAXONOMY.find((s) => s.key === slug)?.label ?? titleizeSlug(slug);
}

/** Sub-categories of a pillar, in locked taxonomy order (not article order). */
function subCategoriesOf(
  categorySlug: string,
): readonly { slug: string; label: string }[] {
  const section = TAXONOMY.find((s) => s.key === categorySlug);
  if (!section) return [];
  return section.children.map((c) => ({
    slug: c.href.split("/").filter(Boolean).pop() ?? "",
    label: c.label,
  }));
}

function subCategoryLabel(categorySlug: string, subSlug: string): string {
  return (
    subCategoriesOf(categorySlug).find((s) => s.slug === subSlug)?.label ??
    titleizeSlug(subSlug)
  );
}

/** Confidence facet buckets — DPB rules: DHARMA 3–5, PRATHA ≤ 2, BHRANTI unscored. */
const CONFIDENCE_BUCKETS: readonly {
  key: string;
  label: string;
  match: (a: Article) => boolean;
}[] = [
  {
    key: "dharma-5",
    label: "Dharma 5/5",
    match: (a) =>
      badgeTagOf(a.dpb?.classification) === "dharma" &&
      a.dpb?.confidenceScore === 5,
  },
  {
    key: "dharma-4",
    label: "Dharma 4/5",
    match: (a) =>
      badgeTagOf(a.dpb?.classification) === "dharma" &&
      a.dpb?.confidenceScore === 4,
  },
  {
    key: "dharma-3",
    label: "Dharma 3/5",
    match: (a) =>
      badgeTagOf(a.dpb?.classification) === "dharma" &&
      a.dpb?.confidenceScore === 3,
  },
  {
    key: "pratha",
    label: "Pratha 1–2/5",
    match: (a) => badgeTagOf(a.dpb?.classification) === "pratha",
  },
  {
    key: "bhranti",
    label: "Bhranti",
    match: (a) => badgeTagOf(a.dpb?.classification) === "bhranti",
  },
];

function searchableText(a: Article): string {
  return [
    a.lang.en.title,
    a.lang.en.deck,
    a.lang.en.heroSubtitle,
    a.dpb?.sourceName,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/**
 * Client half of /all-articles (#56). Two tabs:
 *  - Reader index — sticky facet rail (sub-category + confidence), search,
 *    and a category-grouped 50-per-page list with DPB badges.
 *  - Plain index — a flat grouped link list, no filters; both panels stay
 *    in the DOM (toggled with `hidden`) so the crawl surface is present in
 *    the server-rendered HTML for search engines.
 */
export function AllArticlesTabs({ articles }: { articles: Article[] }) {
  const [tab, setTab] = useState<Tab>("reader");
  const [subFilters, setSubFilters] = useState<ReadonlySet<string>>(new Set());
  const [deityFilters, setDeityFilters] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const [confFilters, setConfFilters] = useState<ReadonlySet<string>>(
    new Set(),
  );
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [facetsOpen, setFacetsOpen] = useState(false);

  /** Categories present in the data, in locked taxonomy order. */
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of articles) {
      counts.set(a.category, (counts.get(a.category) ?? 0) + 1);
    }
    const order = TAXONOMY.map((s) => s.key as string);
    return [...counts.entries()]
      .sort(([a], [b]) => {
        const ia = order.indexOf(a);
        const ib = order.indexOf(b);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      })
      .map(([slug, count]) => ({ slug, label: categoryLabel(slug), count }));
  }, [articles]);

  const subCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of articles) {
      if (!a.subCategory) continue;
      const key = `${a.category}/${a.subCategory}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [articles]);

  const deityCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of articles) {
      const d = normalizeDeity(a.deity);
      if (d) counts.set(d, (counts.get(d) ?? 0) + 1);
    }
    return counts;
  }, [articles]);

  const confCount = useMemo(() => {
    const counts = new Map<string, number>();
    for (const bucket of CONFIDENCE_BUCKETS) {
      counts.set(bucket.key, articles.filter(bucket.match).length);
    }
    return counts;
  }, [articles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      if (subFilters.size > 0) {
        const key = a.subCategory ? `${a.category}/${a.subCategory}` : "";
        if (!subFilters.has(key)) return false;
      }
      if (deityFilters.size > 0) {
        const d = normalizeDeity(a.deity);
        if (!d || !deityFilters.has(d)) return false;
      }
      if (confFilters.size > 0) {
        const hit = CONFIDENCE_BUCKETS.some(
          (b) => confFilters.has(b.key) && b.match(a),
        );
        if (!hit) return false;
      }
      if (q && !searchableText(a).includes(q)) return false;
      return true;
    });
  }, [articles, subFilters, deityFilters, confFilters, query]);

  /** Sorted by category (taxonomy order) so the page slice groups cleanly. */
  const ordered = useMemo(() => {
    const order = categories.map((c) => c.slug);
    return [...filtered].sort(
      (a, b) => order.indexOf(a.category) - order.indexOf(b.category),
    );
  }, [filtered, categories]);

  const totalPages = Math.max(1, Math.ceil(ordered.length / READER_PAGE));
  const safePage = Math.min(page, totalPages);
  const slice = ordered.slice(
    (safePage - 1) * READER_PAGE,
    safePage * READER_PAGE,
  );

  /** The page slice, grouped under its category heading. */
  const groups = useMemo(() => {
    const byCategory = new Map<string, Article[]>();
    for (const a of slice) {
      const list = byCategory.get(a.category);
      if (list) list.push(a);
      else byCategory.set(a.category, [a]);
    }
    return [...byCategory.entries()];
  }, [slice]);

  const activeCount = subFilters.size + deityFilters.size + confFilters.size;

  function toggleSub(key: string) {
    setSubFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setPage(1);
  }

  function toggleDeity(key: string) {
    setDeityFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setPage(1);
  }

  function toggleConf(key: string) {
    setConfFilters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setPage(1);
  }

  function clearAll() {
    setSubFilters(new Set());
    setDeityFilters(new Set());
    setConfFilters(new Set());
    setQuery("");
    setPage(1);
  }

  if (articles.length === 0) {
    return (
      <div className="rounded-[15px] border border-dashed border-border bg-card/60 px-6 py-12 text-center">
        <p className="mb-1 text-[14.5px] font-bold text-ink">
          The index could not be reached just now
        </p>
        <p className="mx-auto max-w-[420px] text-[12.5px] leading-relaxed text-sub">
          Nothing is lost — refresh in a little while and every published
          article will be listed here.
        </p>
      </div>
    );
  }

  const tabCls = (on: boolean) =>
    `rounded-[10px] border-[1.5px] px-4 py-[8px] text-[13px] font-bold ${
      on
        ? "border-cta bg-cta text-white"
        : "border-border bg-card text-body hover:border-cta"
    }`;

  const facetRail = (
    <>
      {categories.map((c) => {
        const subs = subCategoriesOf(c.slug);
        if (subs.length === 0) return null;
        return (
          <div
            key={c.slug}
            className="border-b border-border-light px-[18px] py-[14px] last:border-b-0"
          >
            <div className="mb-[10px] flex items-center justify-between text-[9.5px] font-bold tracking-[0.6px] text-gold uppercase">
              {c.label}
              <span className="text-[10px] opacity-55">{c.count}</span>
            </div>
            {subs.map((s) => {
              const key = `${c.slug}/${s.slug}`;
              const n = subCount.get(key) ?? 0;
              return (
                <FacetOption
                  key={key}
                  label={s.label}
                  count={n}
                  on={subFilters.has(key)}
                  disabled={n === 0}
                  onToggle={() => toggleSub(key)}
                />
              );
            })}
          </div>
        );
      })}

      <div className="border-b border-border-light px-[18px] py-[14px] last:border-b-0">
        <div className="mb-[10px] flex items-center justify-between text-[9.5px] font-bold tracking-[0.6px] text-gold uppercase">
          Deity
          <span className="text-[10px] opacity-55">{deityCount.size}</span>
        </div>
        {DEITIES.map((d) => {
          const n = deityCount.get(d.slug) ?? 0;
          return (
            <FacetOption
              key={d.slug}
              label={d.label}
              count={n}
              on={deityFilters.has(d.slug)}
              disabled={n === 0}
              onToggle={() => toggleDeity(d.slug)}
            />
          );
        })}
      </div>

      <div className="border-b border-border-light px-[18px] py-[14px] last:border-b-0">
        <div className="mb-[10px] flex items-center justify-between text-[9.5px] font-bold tracking-[0.6px] text-gold uppercase">
          Confidence
          <span className="text-[10px] opacity-55">
            {CONFIDENCE_BUCKETS.length}
          </span>
        </div>
        {CONFIDENCE_BUCKETS.map((b) => {
          const n = confCount.get(b.key) ?? 0;
          return (
            <FacetOption
              key={b.key}
              label={b.label}
              count={n}
              on={confFilters.has(b.key)}
              disabled={n === 0}
              onToggle={() => toggleConf(b.key)}
            />
          );
        })}
      </div>

      <div className="px-[18px] py-[13px] text-xs text-sub">
        {activeCount === 0 ? (
          <>
            No filters applied ·{" "}
            <b className="font-bold text-cta">{articles.length} shown</b>
          </>
        ) : (
          <button
            type="button"
            onClick={clearAll}
            className="font-bold text-cta hover:underline"
          >
            Clear {activeCount} filter{activeCount === 1 ? "" : "s"}
          </button>
        )}
      </div>
    </>
  );

  return (
    <div>
      {/* tab switch */}
      <div className="mb-5 flex items-center gap-2">
        <button
          onClick={() => setTab("reader")}
          aria-pressed={tab === "reader"}
          className={tabCls(tab === "reader")}
        >
          Reader index
        </button>
        <button
          onClick={() => setTab("crawl")}
          aria-pressed={tab === "crawl"}
          className={tabCls(tab === "crawl")}
        >
          Plain index
        </button>
        <span className="ml-auto text-[12.5px] text-sub">
          {articles.length} article{articles.length === 1 ? "" : "s"} published
        </span>
      </div>

      {/* ── reader index — facet rail + grouped list ── */}
      <div hidden={tab !== "reader"}>
        <div className="grid items-start gap-0 md:grid-cols-[236px_1fr] md:gap-[30px]">
          {/* facet rail — sticky on desktop, collapsible sheet on mobile */}
          <aside className="sticky top-[132px] hidden max-h-[calc(100vh-156px)] overflow-y-auto rounded-2xl border border-border bg-card py-[6px] md:block">
            {facetRail}
          </aside>

          <div>
            {/* search */}
            <label className="mb-4 flex items-center gap-[10px] rounded-xl border-[1.5px] border-border bg-card px-4 py-3 focus-within:border-cta">
              <span aria-hidden className="text-sub">
                ⌕
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder={`Search all ${articles.length} articles`}
                className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-sub"
              />
              <span className="shrink-0 rounded-[5px] border border-border px-[7px] py-[2px] text-[11px] text-sub">
                /
              </span>
            </label>

            {/* result head */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-3">
              <p className="text-[19px] font-bold tracking-[-0.3px] text-ink">
                {ordered.length}
                <span className="ml-2 text-[13.5px] font-medium text-sub">
                  {ordered.length === 1 ? "article" : "articles"}
                  {ordered.length > 0 && (
                    <>
                      {" "}
                      · showing {(safePage - 1) * READER_PAGE + 1}–
                      {Math.min(safePage * READER_PAGE, ordered.length)}
                    </>
                  )}
                </span>
              </p>
              <div className="flex items-center gap-[14px]">
                <button
                  type="button"
                  onClick={() => setFacetsOpen((v) => !v)}
                  aria-expanded={facetsOpen}
                  className="rounded-[10px] border-[1.5px] border-border bg-card px-[15px] py-[9px] text-[12.5px] font-bold text-body md:hidden"
                >
                  Filter
                  {activeCount > 0 && (
                    <b className="ml-1 text-cta">· {activeCount}</b>
                  )}
                </button>
                <span className="text-[12.5px] text-sub">
                  Sort — <b className="font-semibold text-body">Category</b>
                </span>
              </div>
            </div>

            {/* mobile facet sheet */}
            {facetsOpen && (
              <div className="mt-3 rounded-2xl border border-border bg-card py-[6px] md:hidden">
                {facetRail}
              </div>
            )}

            {/* applied filter chips */}
            {activeCount > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {[...subFilters].map((key) => {
                  const [cat, sub] = key.split("/");
                  return (
                    <AppliedChip
                      key={key}
                      label={subCategoryLabel(cat, sub)}
                      onRemove={() => toggleSub(key)}
                    />
                  );
                })}
                {[...deityFilters].map((key) => (
                  <AppliedChip
                    key={key}
                    label={
                      DEITIES.find((d) => d.slug === key)?.label ?? key
                    }
                    onRemove={() => toggleDeity(key)}
                  />
                ))}
                {[...confFilters].map((key) => (
                  <AppliedChip
                    key={key}
                    label={
                      CONFIDENCE_BUCKETS.find((b) => b.key === key)?.label ??
                      key
                    }
                    onRemove={() => toggleConf(key)}
                  />
                ))}
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-xs font-medium text-sub hover:text-cta"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* grouped rows */}
            {groups.length > 0 ? (
              groups.map(([categorySlug, rows]) => (
                <section key={categorySlug} className="mt-[26px] first:mt-4">
                  <div className="mb-[13px] flex items-baseline gap-3 border-b border-border-light pb-2">
                    <h2 className="text-[15px] font-bold tracking-[-0.2px] text-ink">
                      {categoryLabel(categorySlug)}
                    </h2>
                    <span className="text-xs text-sub">
                      {rows.length} shown
                    </span>
                    <Link
                      href={`/${categorySlug}`}
                      className="ml-auto text-[11.5px] font-bold text-cta hover:underline"
                    >
                      View all ›
                    </Link>
                  </div>
                  <div className="overflow-hidden rounded-[15px] border border-border bg-card">
                    {rows.map((a) => (
                      <IndexRow key={a.slug} article={a} />
                    ))}
                  </div>
                </section>
              ))
            ) : (
              <div className="mt-4 rounded-[15px] border border-dashed border-border bg-card/60 px-6 py-10 text-center text-[12.5px] text-sub">
                Nothing matches those filters yet.{" "}
                <button
                  type="button"
                  onClick={clearAll}
                  className="font-bold text-cta hover:underline"
                >
                  Clear them
                </button>{" "}
                to see everything.
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-7 flex items-center justify-center gap-[7px]">
                <PagerBtn
                  disabled={safePage === 1}
                  onClick={() => setPage(safePage - 1)}
                >
                  ‹
                </PagerBtn>
                {Array.from({ length: totalPages }, (_, i) => (
                  <PagerBtn
                    key={i}
                    on={i + 1 === safePage}
                    onClick={() => setPage(i + 1)}
                  >
                    {i + 1}
                  </PagerBtn>
                ))}
                <PagerBtn
                  disabled={safePage === totalPages}
                  onClick={() => setPage(safePage + 1)}
                >
                  ›
                </PagerBtn>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── crawl index — plain grouped links, always in the DOM ── */}
      <div hidden={tab !== "crawl"}>
        <p className="mb-5 max-w-[640px] text-[12.5px] leading-relaxed text-sub">
          Every published URL on the knowledge layer, grouped by category — a
          plain list with no filters and no images, for readers and crawlers
          alike.
        </p>
        {categories.map((c) => (
          <section key={c.slug} className="mb-7">
            <div className="mb-[13px] flex items-baseline gap-3 border-b border-border-light pb-2">
              <h2 className="text-[15px] font-bold tracking-[-0.2px] text-ink">
                {c.label}
              </h2>
              <span className="text-xs text-sub">{c.count}</span>
            </div>
            <div className="overflow-hidden rounded-[15px] border border-border bg-card">
              {articles
                .filter((a) => a.category === c.slug)
                .map((a) => (
                  <Link
                    key={a.slug}
                    href={articleHref(a)}
                    className="flex items-center gap-4 border-b-[0.5px] border-border-light px-5 py-[15px] transition-colors duration-150 last:border-b-0 hover:bg-[#FCFAF6]"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-[15.5px] leading-tight font-semibold text-ink">
                        {a.lang.en.title}
                      </span>
                      <span className="mt-[3px] block text-[12.5px] leading-relaxed text-sub">
                        {c.label}
                        {a.subCategory
                          ? ` › ${subCategoryLabel(a.category, a.subCategory)}`
                          : ""}
                      </span>
                    </span>
                    <span aria-hidden className="shrink-0 text-base text-cta">
                      ›
                    </span>
                  </Link>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

/** One index row — path line, title, deck, then DPB badge + read time. */
function IndexRow({ article }: { article: Article }) {
  const deck = article.lang.en.deck ?? article.lang.en.heroSubtitle;
  const tag = badgeTagOf(article.dpb?.classification);
  return (
    <Link
      href={articleHref(article)}
      className="grid grid-cols-[1fr_auto] items-center gap-4 border-b-[0.5px] border-border-light px-4 py-3 last:border-b-0 hover:bg-[#FCFAF6]"
    >
      <span className="min-w-0">
        <span className="mb-[3px] block text-[11px] font-semibold text-sub">
          {categoryLabel(article.category)}
          {article.subCategory && (
            <>
              {" "}
              <b className="font-bold text-gold">›</b>{" "}
              {subCategoryLabel(article.category, article.subCategory)}
            </>
          )}
        </span>
        <span className="block text-[14.5px] leading-[1.35] font-semibold text-ink">
          {article.lang.en.title}
        </span>
        {deck && (
          <span className="mt-[2px] block truncate text-xs leading-relaxed text-sub">
            {deck}
          </span>
        )}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        {tag && (
          <DpbBadge
            tag={tag}
            score={tag === "bhranti" ? undefined : article.dpb?.confidenceScore}
          />
        )}
        {article.readMinutes ? (
          <span className="hidden text-[11px] text-sub sm:inline">
            {article.readMinutes} min
          </span>
        ) : null}
      </span>
    </Link>
  );
}

function FacetOption({
  label,
  count,
  on,
  disabled,
  onToggle,
}: {
  label: string;
  count: number;
  on: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      disabled={disabled}
      onClick={onToggle}
      className={`flex w-full items-center gap-[9px] py-[5px] text-left text-[13px] ${
        on ? "font-semibold text-cta" : "text-body"
      } ${disabled ? "opacity-40" : "hover:text-cta"}`}
    >
      <span
        aria-hidden
        className={`flex size-[15px] shrink-0 items-center justify-center rounded-[4px] border-[1.5px] text-[9px] font-bold text-white ${
          on ? "border-cta bg-cta" : "border-border bg-bg"
        }`}
      >
        {on ? "✓" : ""}
      </span>
      {label}
      <span className="ml-auto text-[11.5px] text-sub">{count}</span>
    </button>
  );
}

function AppliedChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-[7px] rounded-lg border border-[#F7C0D6] bg-[#FFF0F5] px-[11px] py-[5px] text-xs font-semibold text-cta hover:opacity-80"
    >
      {label}
      <span aria-hidden className="not-italic opacity-70">
        ✕
      </span>
    </button>
  );
}

function PagerBtn({
  on,
  disabled,
  onClick,
  children,
}: {
  on?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-current={on ? "page" : undefined}
      className={`flex h-9 min-w-9 items-center justify-center rounded-[9px] border-[1.5px] px-3 text-[13px] font-semibold ${
        on
          ? "border-cta bg-[#FFF0F5] text-cta"
          : "border-border bg-card text-body"
      } ${disabled ? "cursor-default opacity-40" : "hover:border-cta"}`}
    >
      {children}
    </button>
  );
}
