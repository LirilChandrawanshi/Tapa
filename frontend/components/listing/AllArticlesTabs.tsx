"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CompactRow } from "@/components/CompactRow";
import { articleHref, titleizeSlug } from "@/lib/articleExtras";
import { TAXONOMY } from "@/lib/taxonomy";
import type { Article } from "@/lib/types";

const READER_PAGE = 50;

type Tab = "reader" | "crawl";

function categoryLabel(slug: string): string {
  return TAXONOMY.find((s) => s.key === slug)?.label ?? titleizeSlug(slug);
}

/**
 * Client half of /all-articles. Two tabs:
 *  - Reader index — category filter chips + 50-per-page list.
 *  - Crawl index — a plain grouped link list, no images; both panels
 *    stay in the DOM (toggled with `hidden`) so the crawl surface is
 *    present in the server-rendered HTML for search engines.
 */
export function AllArticlesTabs({ articles }: { articles: Article[] }) {
  const [tab, setTab] = useState<Tab>("reader");
  const [category, setCategory] = useState<string>("all");
  const [page, setPage] = useState(1);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of articles) {
      counts.set(a.category, (counts.get(a.category) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([slug, count]) => ({ slug, label: categoryLabel(slug), count }));
  }, [articles]);

  const filtered = useMemo(
    () =>
      category === "all"
        ? articles
        : articles.filter((a) => a.category === category),
    [articles, category],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / READER_PAGE));
  const safePage = Math.min(page, totalPages);
  const slice = filtered.slice(
    (safePage - 1) * READER_PAGE,
    safePage * READER_PAGE,
  );

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

      {/* ── reader index ── */}
      <div hidden={tab !== "reader"}>
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-[15px] border border-border bg-card px-4 py-3">
          <span className="mr-1 text-[10px] font-bold tracking-[0.8px] text-sub uppercase">
            Category
          </span>
          <Chip
            on={category === "all"}
            onClick={() => {
              setCategory("all");
              setPage(1);
            }}
          >
            All · {articles.length}
          </Chip>
          {categories.map((c) => (
            <Chip
              key={c.slug}
              on={category === c.slug}
              onClick={() => {
                setCategory(c.slug);
                setPage(1);
              }}
            >
              {c.label} · {c.count}
            </Chip>
          ))}
        </div>

        <p className="mb-3 text-[12.5px] text-sub">
          Showing {(safePage - 1) * READER_PAGE + 1}–
          {Math.min(safePage * READER_PAGE, filtered.length)} of{" "}
          {filtered.length}
        </p>

        {slice.length > 0 ? (
          <div className="overflow-hidden rounded-[15px] border border-border bg-card">
            {slice.map((a) => (
              <CompactRow
                key={a.slug}
                href={articleHref(a)}
                title={a.lang.en.title}
                subtitle={[
                  categoryLabel(a.category),
                  a.lang.en.deck ?? a.lang.en.heroSubtitle,
                  a.readMinutes ? `${a.readMinutes} min` : undefined,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[15px] border border-dashed border-border bg-card/60 px-6 py-10 text-center text-[12.5px] text-sub">
            No published articles in this category yet.
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-[7px]">
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

      {/* ── crawl index — plain grouped links, always in the DOM ── */}
      <div hidden={tab !== "crawl"}>
        <p className="mb-5 max-w-[640px] text-[12.5px] leading-relaxed text-sub">
          Every published article, grouped by category — a plain list with no
          images, for readers and crawlers alike.
        </p>
        {categories.map((c) => (
          <section key={c.slug} className="mb-8">
            <h2 className="mb-3 border-b border-border pb-2 text-lg font-bold tracking-[-0.3px] text-ink">
              {c.label}{" "}
              <span className="text-[13px] font-medium text-sub">
                · {c.count}
              </span>
            </h2>
            <ul className="columns-1 gap-8 md:columns-2 lg:columns-3">
              {articles
                .filter((a) => a.category === c.slug)
                .map((a) => (
                  <li key={a.slug} className="mb-[6px] break-inside-avoid">
                    <Link
                      href={articleHref(a)}
                      className="text-[13.5px] leading-snug text-body hover:text-cta hover:underline"
                    >
                      {a.lang.en.title}
                    </Link>
                  </li>
                ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

function Chip({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`rounded-full border px-3 py-[5px] text-xs font-semibold transition-colors ${
        on
          ? "border-cta bg-cta text-white"
          : "border-border bg-card text-body hover:border-cta hover:text-cta"
      }`}
    >
      {children}
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
