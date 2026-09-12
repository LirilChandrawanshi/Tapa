"use client";

import { useMemo, useState } from "react";
import { SectionHeader } from "@/components/SectionHeader";
import { ProductCard } from "@/components/shop/ProductCard";
import { prebookClosed, type Product } from "@/lib/shop";

interface Shelf {
  label: string;
  href: string;
  description?: string;
  category: string;
}

/**
 * Ritual Pujans shelves with the spec's filter chip row on top —
 * All kits / Pre-book / In stock / Under ₹1,000 / ₹1,000–2,000.
 *
 * Availability is read through `prebookClosed` so a dated kit past its
 * cut-off never counts as pre-bookable. Price bands are inclusive of the
 * lower bound, exclusive of the upper, and work on integer paise.
 */
const FILTERS = [
  {
    key: "prebook",
    label: "Pre-book",
    match: (p: Product) => p.availability === "PREBOOK" && !prebookClosed(p),
  },
  {
    key: "live",
    label: "In stock",
    match: (p: Product) => p.availability === "LIVE",
  },
  {
    key: "under-1000",
    label: "Under ₹1,000",
    match: (p: Product) => p.pricePaise < 100_000,
  },
  {
    key: "1000-2000",
    label: "₹1,000–2,000",
    match: (p: Product) =>
      p.pricePaise >= 100_000 && p.pricePaise <= 200_000,
  },
] as const;

export function PujanShelves({
  shelves,
  products,
}: {
  shelves: Shelf[];
  products: Product[];
}) {
  const [filter, setFilter] = useState<string>("all");

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of FILTERS) map.set(f.key, products.filter(f.match).length);
    return map;
  }, [products]);

  const visible = useMemo(() => {
    const active = FILTERS.find((f) => f.key === filter);
    const kept = active ? products.filter(active.match) : products;
    const keptSlugs = new Set(kept.map((p) => p.slug));
    return shelves
      .map((s) => ({
        shelf: s,
        items: products.filter(
          (p) => p.category === s.category && keptSlugs.has(p.slug),
        ),
      }))
      .filter((s) => s.items.length > 0);
  }, [shelves, products, filter]);

  const total = visible.reduce((n, s) => n + s.items.length, 0);

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[10px] font-bold tracking-[0.8px] text-gold uppercase">
          Filter
        </span>
        <Chip on={filter === "all"} onClick={() => setFilter("all")}>
          All kits · {products.length}
        </Chip>
        {FILTERS.map((f) => {
          const n = counts.get(f.key) ?? 0;
          return (
            <Chip
              key={f.key}
              on={filter === f.key}
              disabled={n === 0}
              onClick={() => setFilter(f.key)}
            >
              {f.label} · {n}
            </Chip>
          );
        })}
        {filter !== "all" && (
          <span className="ml-auto text-[12.5px] text-sub">
            {total} pujan{total === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {visible.length > 0 ? (
        visible.map(({ shelf, items }) => (
          <section key={shelf.href} className="mb-11 last:mb-0">
            <SectionHeader
              title={shelf.label}
              description={shelf.description}
              count={`${items.length} pujan${items.length === 1 ? "" : "s"}`}
              viewAllHref={shelf.href}
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </section>
        ))
      ) : (
        <div className="rounded-[15px] border border-dashed border-border bg-card/60 px-6 py-10 text-center text-[12.5px] text-sub">
          Nothing in that band right now.{" "}
          <button
            type="button"
            onClick={() => setFilter("all")}
            className="font-bold text-cta hover:underline"
          >
            Show all kits
          </button>{" "}
          — or read the free guides, which never depend on a kit.
        </div>
      )}
    </>
  );
}

function Chip({
  on,
  disabled,
  onClick,
  children,
}: {
  on: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      className={`rounded-[9px] border-[1.5px] px-[14px] py-[7px] text-[12.5px] font-medium whitespace-nowrap ${
        on
          ? "border-cta bg-[#FFF0F5] font-bold text-cta"
          : "border-border bg-bg text-body"
      } ${disabled ? "cursor-default opacity-40" : "hover:border-cta"}`}
    >
      {children}
    </button>
  );
}
