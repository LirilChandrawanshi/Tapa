"use client";

import { useState } from "react";
import type { KitItem } from "@/lib/shop";

const COLLAPSED_COUNT = 9;

/**
 * The numbered kit manifest under the locked "What's in this kit" heading.
 * Items render as "name · note" when a note exists; collapsed to the first
 * nine with a "Show all N items ▾" control.
 */
export function KitManifest({ items }: { items: KitItem[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, COLLAPSED_COUNT);
  const hidden = items.length - COLLAPSED_COUNT;

  return (
    <section aria-labelledby="kit-manifest-heading">
      <h2
        id="kit-manifest-heading"
        className="mb-1 text-xl font-bold tracking-[-0.4px] text-ink md:text-2xl"
      >
        What&apos;s in this kit
      </h2>
      <p className="mb-4 text-[13px] text-sub">
        {items.length} {items.length === 1 ? "item" : "items"}, weighed and
        sealed separately.
      </p>
      <ol className="overflow-hidden rounded-[14px] border border-border bg-card">
        {visible.map((item) => (
          <li
            key={item.n}
            className="flex items-baseline gap-[13px] border-b border-border-light px-[17px] py-[10px] text-[13.5px] last:border-b-0"
          >
            <span className="w-6 shrink-0 text-right text-[12px] font-bold text-gold tabular-nums">
              {item.n}
            </span>
            <span className="text-body">
              {item.name}
              {item.qty > 1 && (
                <span className="text-sub"> × {item.qty}</span>
              )}
              {item.note ? <span className="text-sub"> · {item.note}</span> : null}
            </span>
          </li>
        ))}
      </ol>
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-3 text-[13px] font-bold text-cta"
        >
          {expanded ? "Show fewer items ▴" : `Show all ${items.length} items ▾`}
        </button>
      )}
    </section>
  );
}
