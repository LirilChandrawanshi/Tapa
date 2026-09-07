"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CompactRow } from "@/components/CompactRow";
import { ArticleCardGrid } from "./ArticleCardGrid";
import {
  articleHref,
  formatObservanceDate,
} from "@/lib/articleExtras";
import {
  applySelection,
  buildFacets,
  confidenceLabelOf,
  EMPTY_SELECTION,
  firstLetterOf,
  monthLabelOf,
  readBandLabelOf,
  selectionCount,
  selectionFromFilterParam,
  type ConfidenceBand,
  type DeityLabel,
  type FacetOption,
  type FacetSelection,
  type ListingFacets,
  type ReadBand,
} from "@/lib/listingExtras";
import type { Article } from "@/lib/types";

export type SlpMode = "dated" | "az" | "seq";

type SortKey = "date" | "title";
type Density = "cards" | "compact";

const PAGE = 24;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/**
 * Client half of the SLP-at-scale mechanism: facet sidebar (desktop) /
 * filter sheet (mobile), applied chips, dated / A–Z / sequenced views,
 * Cards-Compact density toggle and a "Show next 24" pager. The server
 * hands it up to 200 published articles for the sub-category.
 */
export function SlpBrowser({
  articles,
  mode,
  now,
  noun = "guides",
}: {
  articles: Article[];
  mode: SlpMode;
  /** ISO timestamp fixed by the server so SSR and hydration agree. */
  now: string;
  /** "guides" (ritual) or "articles" (concepts) — result-bar noun. */
  noun?: string;
  /** PLP chip handoff — "coming-up" | "this-month" | "deity:Shiva". */
}) {
  const searchParams = useSearchParams();
  const facets = useMemo(() => buildFacets(articles), [articles]);
  const [sel, setSel] = useState<FacetSelection>(() =>
    mode === "seq"
      ? EMPTY_SELECTION
      : selectionFromFilterParam(searchParams?.get("filter") ?? undefined, facets, now),
  );
  const [sort, setSort] = useState<SortKey>(mode === "az" ? "title" : "date");
  const [density, setDensity] = useState<Density>("cards");
  const [shown, setShown] = useState(PAGE);
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = useMemo(
    () => (mode === "seq" ? articles : applySelection(articles, sel)),
    [articles, sel, mode],
  );

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (mode === "seq") return list; // curated API order
    if (sort === "title") {
      list.sort((a, b) => a.lang.en.title.localeCompare(b.lang.en.title));
    } else {
      list.sort((a, b) => {
        const da = a.observanceDate ?? "9999-99-99"; // undated sink last
        const db = b.observanceDate ?? "9999-99-99";
        return da === db
          ? a.lang.en.title.localeCompare(b.lang.en.title)
          : da.localeCompare(db);
      });
    }
    return list;
  }, [filtered, sort, mode]);

  // Cards paginate 24 at a time; Compact lists everything on one page
  // (the reference behaviour — it keeps the A–Z jump bar honest).
  const paged = density === "cards";
  const visible = paged ? sorted.slice(0, shown) : sorted;
  const nFilters = selectionCount(sel);

  const toggle = <K extends keyof FacetSelection>(
    group: K,
    key: FacetSelection[K][number],
  ) => {
    setSel((prev) => {
      const list = prev[group] as string[];
      const next = list.includes(key as string)
        ? list.filter((k) => k !== key)
        : [...list, key as string];
      return { ...prev, [group]: next };
    });
    setShown(PAGE);
  };

  const clearAll = () => {
    setSel(EMPTY_SELECTION);
    setShown(PAGE);
  };

  /* ── sequenced view (Beginner's Guides) — no facets, no density ── */
  if (mode === "seq") {
    if (articles.length === 0) return null;
    return (
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <p className="text-[19px] font-bold tracking-[-0.3px] text-ink">
            {articles.length}
            <span className="ml-2 text-[13.5px] font-medium text-sub">
              {noun} · reading order
            </span>
          </p>
          <p className="text-[12.5px] text-sub">
            Sort — <b className="font-semibold text-body">Reading order</b>
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {articles.map((a, i) => (
            <SequenceRow key={a.slug} article={a} n={i + 1} />
          ))}
        </div>
      </div>
    );
  }

  const facetRail = (
    <FacetRail
      facets={facets}
      sel={sel}
      nFilters={nFilters}
      toggle={toggle}
      clearAll={clearAll}
      shownCount={filtered.length}
      noun={noun}
    />
  );

  return (
    <div className="mt-1 items-start gap-[30px] lg:grid lg:grid-cols-[236px_1fr]">
      {/* desktop facet rail */}
      <aside className="sticky top-[88px] hidden max-h-[calc(100vh-110px)] overflow-y-auto rounded-2xl border border-border bg-card py-1 lg:block">
        {facetRail}
      </aside>

      <div className="min-w-0">
        {/* applied chips */}
        {nFilters > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {sel.months.map((m) => (
              <AppliedChip
                key={m}
                label={monthLabelOf(m)}
                onRemove={() => toggle("months", m)}
              />
            ))}
            {sel.deities.map((d) => (
              <AppliedChip
                key={d}
                label={d}
                onRemove={() => toggle("deities", d)}
              />
            ))}
            {sel.confidence.map((c) => (
              <AppliedChip
                key={c}
                label={confidenceLabelOf(c)}
                onRemove={() => toggle("confidence", c)}
              />
            ))}
            {sel.readBands.map((r) => (
              <AppliedChip
                key={r}
                label={readBandLabelOf(r)}
                onRemove={() => toggle("readBands", r)}
              />
            ))}
            <button
              onClick={clearAll}
              className="text-xs font-medium text-sub hover:text-cta"
            >
              Clear all
            </button>
          </div>
        )}

        {/* results head */}
        <div className="mb-1 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <p className="text-[19px] font-bold tracking-[-0.3px] text-ink">
            {filtered.length}
            <span className="ml-2 text-[13.5px] font-medium text-sub">
              {noun}
              {filtered.length > 0 &&
                (paged
                  ? ` · showing 1–${Math.min(shown, filtered.length)}`
                  : " · all on one page")}
            </span>
          </p>
          <div className="flex items-center gap-3">
            {/* mobile filter trigger */}
            <button
              onClick={() => setSheetOpen(true)}
              className="rounded-[10px] border-[1.5px] border-border bg-card px-[15px] py-[8px] text-[12.5px] font-bold text-body lg:hidden"
            >
              Filter{nFilters > 0 && <b className="text-cta"> · {nFilters}</b>}
            </button>
            <div className="flex overflow-hidden rounded-[9px] border-[1.5px] border-border">
              {(["cards", "compact"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDensity(d)}
                  aria-pressed={density === d}
                  className={`px-[13px] py-[7px] text-[11.5px] font-semibold ${
                    density === d
                      ? "bg-[#FFF0F5] text-cta"
                      : "bg-card text-sub"
                  }`}
                >
                  {d === "cards" ? "Cards" : "Compact"}
                </button>
              ))}
            </div>
            {mode === "dated" ? (
              <label className="hidden items-center gap-2 text-[12.5px] text-sub sm:flex">
                Sort —
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="rounded-[8px] border border-border bg-card px-2 py-[5px] text-[12.5px] font-semibold text-body"
                >
                  <option value="date">Date — soonest first</option>
                  <option value="title">Title A–Z</option>
                </select>
              </label>
            ) : (
              <span className="hidden text-[12.5px] text-sub sm:inline">
                Sort — <b className="font-semibold text-body">A to Z</b>
              </span>
            )}
          </div>
        </div>

        {/* A–Z jump bar */}
        {mode === "az" && sort === "title" && filtered.length > 0 && (
          <JumpBar articles={visible} />
        )}

        {filtered.length === 0 ? (
          <div className="mt-4 rounded-[15px] border border-dashed border-border bg-card/60 px-6 py-10 text-center">
            <p className="mb-1 text-[14.5px] font-bold text-ink">
              Nothing matches these filters
            </p>
            <p className="mx-auto mb-4 max-w-[380px] text-[12.5px] leading-relaxed text-sub">
              Every filter you remove brings guides back — nothing has been
              unpublished.
            </p>
            <button
              onClick={clearAll}
              className="rounded-[10px] border-[1.5px] border-cta bg-card px-5 py-[9px] text-[12.5px] font-bold text-cta"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <GroupedResults
            articles={visible}
            mode={mode}
            sort={sort}
            density={density}
            now={now}
            noun={noun}
          />
        )}

        {/* pager */}
        {paged && filtered.length > shown && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setShown((s) => s + PAGE)}
              className="rounded-[11px] border-[1.5px] border-cta bg-card px-7 py-3 text-[13px] font-bold text-cta"
            >
              Show next {Math.min(PAGE, filtered.length - shown)}
            </button>
            <p className="mt-2 text-[11.5px] text-sub">
              {Math.min(shown, filtered.length)} of {filtered.length} shown
            </p>
          </div>
        )}
      </div>

      {/* mobile filter sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button
            aria-label="Close filters"
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 bg-ink/50"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-card pb-4 shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-5 py-3">
              <p className="text-[13px] font-bold text-ink">
                Filter{nFilters > 0 && ` · ${nFilters}`}
              </p>
              <button
                onClick={() => setSheetOpen(false)}
                className="text-[12.5px] font-bold text-cta"
              >
                Done
              </button>
            </div>
            {facetRail}
            <div className="px-5 pt-2">
              <button
                onClick={() => setSheetOpen(false)}
                className="w-full rounded-[11px] bg-cta py-3 text-[13px] font-bold text-white"
              >
                Show {filtered.length} {noun}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── grouped results ─────────────────────────────────────────────── */

function GroupedResults({
  articles,
  mode,
  sort,
  density,
  now,
  noun,
}: {
  articles: Article[];
  mode: "dated" | "az";
  sort: SortKey;
  density: Density;
  now: string;
  noun: string;
}) {
  // dated + date sort → month groups; az + title sort → letter groups;
  // any other combination renders one flat run.
  const groups: { id: string; label: string; items: Article[] }[] = [];
  const push = (id: string, label: string, a: Article) => {
    const last = groups[groups.length - 1];
    if (last && last.id === id) last.items.push(a);
    else groups.push({ id, label, items: [a] });
  };

  if (mode === "dated" && sort === "date") {
    for (const a of articles) {
      const mk = a.observanceDate?.slice(0, 7);
      if (mk) push(`m-${mk}`, monthLabelOf(mk), a);
      else push("m-none", "Date not fixed", a);
    }
  } else if (mode === "az" && sort === "title") {
    for (const a of articles) {
      const letter = firstLetterOf(a.lang.en.title);
      push(`l-${letter}`, letter, a);
    }
  } else {
    groups.push({ id: "all", label: "", items: articles });
  }

  return (
    <div>
      {groups.map((g) => (
        <section key={g.id} id={g.id} className="mt-6 first:mt-4">
          {g.label && (
            <div className="mb-3 flex items-baseline gap-3 border-b border-border-light pb-2">
              <h3 className="text-[15px] font-bold tracking-[-0.2px] text-ink">
                {g.label}
              </h3>
              <span className="text-xs text-sub">
                {g.items.length}{" "}
                {g.items.length === 1 ? noun.replace(/s$/, "") : noun}
              </span>
            </div>
          )}
          {density === "cards" ? (
            <ArticleCardGrid articles={g.items} now={now} />
          ) : (
            <div className="overflow-hidden rounded-[15px] border border-border bg-card">
              {g.items.map((a) => (
                <CompactRow
                  key={a.slug}
                  href={articleHref(a)}
                  title={a.lang.en.title}
                  subtitle={compactSubtitle(a)}
                />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function compactSubtitle(a: Article): string | undefined {
  const parts: string[] = [];
  const date = formatObservanceDate(a.observanceDate);
  if (date) parts.push(date);
  const deck = a.lang.en.deck ?? a.lang.en.heroSubtitle;
  if (deck) parts.push(deck);
  if (a.readMinutes) parts.push(`${a.readMinutes} min`);
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

/* ── sequenced row (Beginner's Guides) ───────────────────────────── */

function SequenceRow({ article, n }: { article: Article; n: number }) {
  const en = article.lang.en;
  return (
    <Link
      href={articleHref(article)}
      className="grid grid-cols-[42px_1fr] items-center gap-4 rounded-[15px] border border-border bg-card px-5 py-4 hover:border-cta md:grid-cols-[52px_1fr_auto] md:gap-5 md:px-6 md:py-5"
    >
      <span className="flex h-[42px] w-[42px] items-center justify-center rounded-full border-[1.5px] border-border bg-bg text-base font-bold text-gold md:h-[52px] md:w-[52px] md:text-[19px]">
        {n}
      </span>
      <span className="min-w-0">
        <span className="block text-[16px] leading-tight font-bold text-ink md:text-[17.5px]">
          {en.title}
        </span>
        {(en.deck ?? en.heroSubtitle) && (
          <span className="mt-1 block text-[13px] leading-relaxed text-sub">
            {en.deck ?? en.heroSubtitle}
          </span>
        )}
        {article.readMinutes !== undefined && (
          <span className="mt-2 block text-[11.5px] text-sub">
            {article.readMinutes} min read
          </span>
        )}
      </span>
      <span className="hidden text-[12.5px] font-bold whitespace-nowrap text-cta md:block">
        Read ›
      </span>
    </Link>
  );
}

/* ── facet rail ──────────────────────────────────────────────────── */

function FacetRail({
  facets,
  sel,
  nFilters,
  toggle,
  clearAll,
  shownCount,
  noun,
}: {
  facets: ListingFacets;
  sel: FacetSelection;
  nFilters: number;
  toggle: <K extends keyof FacetSelection>(
    group: K,
    key: FacetSelection[K][number],
  ) => void;
  clearAll: () => void;
  shownCount: number;
  noun: string;
}) {
  const hasAny =
    facets.months.length +
      facets.deities.length +
      facets.confidence.length +
      facets.readBands.length >
    0;
  if (!hasAny) {
    return (
      <p className="px-[18px] py-4 text-xs leading-relaxed text-sub">
        Filters appear as this shelf grows.
      </p>
    );
  }
  return (
    <div>
      {facets.months.length > 0 && (
        <FacetGroup
          heading="Month"
          options={facets.months}
          selected={sel.months}
          onToggle={(k) => toggle("months", k)}
        />
      )}
      {facets.deities.length > 0 && (
        <FacetGroup
          heading="Deity"
          options={facets.deities}
          selected={sel.deities}
          onToggle={(k) => toggle("deities", k as DeityLabel)}
        />
      )}
      {facets.confidence.length > 0 && (
        <FacetGroup
          heading="Confidence"
          options={facets.confidence}
          selected={sel.confidence}
          onToggle={(k) => toggle("confidence", k as ConfidenceBand)}
        />
      )}
      {facets.readBands.length > 0 && (
        <FacetGroup
          heading="Reading time"
          options={facets.readBands}
          selected={sel.readBands}
          onToggle={(k) => toggle("readBands", k as ReadBand)}
        />
      )}
      <div className="px-[18px] py-3 text-xs text-sub">
        {nFilters > 0 ? (
          <>
            {nFilters} filter{nFilters === 1 ? "" : "s"} ·{" "}
            <button onClick={clearAll} className="font-bold text-cta">
              Clear all
            </button>
          </>
        ) : (
          <>
            No filters applied · <b className="text-body">{shownCount}</b>{" "}
            {noun} shown
          </>
        )}
      </div>
    </div>
  );
}

function FacetGroup({
  heading,
  options,
  selected,
  onToggle,
}: {
  heading: string;
  options: FacetOption[];
  selected: string[];
  onToggle: (key: string) => void;
}) {
  return (
    <div className="border-b border-border-light px-[18px] py-[14px] last:border-b-0">
      <p className="mb-[10px] flex items-center justify-between text-[9.5px] font-bold tracking-[0.6px] text-gold uppercase">
        {heading}
        <span className="text-[10px] opacity-55">{options.length}</span>
      </p>
      {options.map((o) => {
        const on = selected.includes(o.key);
        return (
          <button
            key={o.key}
            onClick={() => onToggle(o.key)}
            aria-pressed={on}
            className={`flex w-full items-center gap-[9px] py-[5px] text-left text-[13px] ${
              on ? "font-semibold text-cta" : "text-body"
            }`}
          >
            <span
              aria-hidden
              className={`flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-[4px] border-[1.5px] text-[9px] font-bold text-white ${
                on ? "border-cta bg-cta" : "border-border bg-bg"
              }`}
            >
              {on ? "✓" : ""}
            </span>
            {o.label}
            <span className="ml-auto text-[11.5px] text-sub">{o.count}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── A–Z jump bar ────────────────────────────────────────────────── */

function JumpBar({ articles }: { articles: Article[] }) {
  const live = new Set(articles.map((a) => firstLetterOf(a.lang.en.title)));
  return (
    <div className="mt-4 flex flex-nowrap items-center gap-[5px] overflow-x-auto rounded-xl border border-border bg-card px-[14px] py-[10px] lg:flex-wrap">
      <span className="mr-1 shrink-0 text-[9.5px] font-bold tracking-[0.6px] text-gold uppercase">
        Jump to
      </span>
      {ALPHABET.map((c) =>
        live.has(c) ? (
          <a
            key={c}
            href={`#l-${c}`}
            className="rounded-[6px] px-2 py-[3px] text-xs font-semibold text-body hover:bg-[#FFF0F5] hover:text-cta"
          >
            {c}
          </a>
        ) : (
          <span
            key={c}
            aria-hidden
            className="px-2 py-[3px] text-xs font-semibold text-sub opacity-35"
          >
            {c}
          </span>
        ),
      )}
    </div>
  );
}

/* ── applied chip ────────────────────────────────────────────────── */

function AppliedChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <button
      onClick={onRemove}
      className="inline-flex items-center gap-[7px] rounded-[8px] border border-[#F7C0D6] bg-[#FFF0F5] px-[11px] py-[5px] text-xs font-semibold text-cta"
    >
      {label}
      <span aria-hidden className="opacity-70">
        ✕
      </span>
    </button>
  );
}
