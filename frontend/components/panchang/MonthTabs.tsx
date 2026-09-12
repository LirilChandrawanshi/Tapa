"use client";

import { track } from "@/lib/analytics";

/**
 * The spec's `.mtabs` strip — all twelve months, always. A month with
 * nothing in it renders an em-dash and is not clickable: an empty month is
 * information, so it stays visible rather than disappearing from the row.
 */

export const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

/** "2026-09" for month index 8 of the given year. */
export function monthKeyOf(year: string, index: number): string {
  return `${year}-${String(index + 1).padStart(2, "0")}`;
}

export function MonthTabs({
  year,
  counts,
  active,
  onChange,
  /** Singular noun for the count label, e.g. "date" → "12 dates". */
  noun = "date",
  surface,
}: {
  year: string;
  /** month key ("2026-09") → number of items in it. */
  counts: Record<string, number>;
  /** Active month key, or null while nothing is selected. */
  active: string | null;
  onChange: (monthKey: string) => void;
  noun?: string;
  surface: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={`Months of ${year}`}
      className="flex gap-2 overflow-x-auto pb-1"
    >
      {MONTH_SHORT.map((label, i) => {
        const key = monthKeyOf(year, i);
        const n = counts[key] ?? 0;
        const on = key === active;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={on}
            disabled={n === 0}
            onClick={() => {
              onChange(key);
              track("panchang_month_selected", { surface, month: key });
            }}
            className={`flex shrink-0 flex-col items-center rounded-[10px] border px-[13px] py-[7px] transition-colors ${
              on
                ? "border-data-fg bg-data-fg text-white"
                : n === 0
                  ? "cursor-default border-border bg-bg text-sub/50"
                  : "border-border bg-card text-mid hover:border-data-bd hover:bg-data-bg hover:text-data-fg"
            }`}
          >
            <span className="text-[12.5px] font-bold">{label}</span>
            <span
              className={`text-[10px] ${on ? "text-white/70" : "text-sub"}`}
            >
              {n === 0 ? "—" : `${n} ${noun}${n === 1 ? "" : "s"}`}
            </span>
          </button>
        );
      })}
    </div>
  );
}
