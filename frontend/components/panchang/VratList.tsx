"use client";

import { useMemo, useState } from "react";
import type { UpcomingObservance } from "@/lib/types";
import {
  VRAT_FILTERS,
  type VratFilterKey,
  matchesVratFilter,
  monthLabel,
  monthShort,
} from "@/lib/panchangExtras";
import { FilterChips } from "./FilterChips";
import { ObservanceRow, ObservanceTable } from "./ObservanceRow";

interface MonthGroup {
  key: string; // "2026-09"
  items: UpcomingObservance[];
}

function groupByMonth(items: UpcomingObservance[]): MonthGroup[] {
  const groups: MonthGroup[] = [];
  for (const u of items) {
    const key = u.observance.date.slice(0, 7);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.items.push(u);
    else groups.push({ key, items: [u] });
  }
  return groups;
}

/**
 * Client half of the vrat calendar: filter chips, month-strip navigator
 * (#85 — chips with counts jumping to per-month sections) and filtered rows.
 * Receives already-fetched, serialisable data from the server page.
 */
export function VratList({
  items,
  now,
}: {
  items: UpcomingObservance[];
  now: string;
}) {
  const [filter, setFilter] = useState<VratFilterKey>("all");

  const counts = useMemo(() => {
    const c: Partial<Record<VratFilterKey, number>> = {};
    for (const f of VRAT_FILTERS) {
      c[f.key] = items.filter((u) => matchesVratFilter(u.observance, f.key)).length;
    }
    return c;
  }, [items]);

  const visible = useMemo(
    () => items.filter((u) => matchesVratFilter(u.observance, filter)),
    [items, filter],
  );

  const months = useMemo(() => groupByMonth(visible), [visible]);

  return (
    <div>
      <FilterChips
        options={VRAT_FILTERS}
        active={filter}
        onChange={setFilter}
        counts={counts}
      />

      {/* Month strip navigator — one chip per month with its date count */}
      {months.length > 1 && (
        <nav
          aria-label="Jump to month"
          className="mt-4 flex flex-wrap gap-2 border-t border-border-light pt-4"
        >
          {months.map((m) => (
            <a
              key={m.key}
              href={`#m-${m.key}`}
              className="rounded-[9px] border border-border bg-card px-[11px] py-[5px] text-[11.5px] font-bold text-mid transition-colors hover:border-data-bd hover:bg-data-bg hover:text-data-fg"
            >
              {monthShort(m.key)}
              <span className="ml-[5px] font-medium text-sub">
                {m.items.length}
              </span>
            </a>
          ))}
        </nav>
      )}

      <div className="mt-4">
        {visible.length === 0 ? (
          <div className="rounded-[15px] border border-border bg-card px-5 py-8 text-center text-[13px] text-sub">
            No {VRAT_FILTERS.find((f) => f.key === filter)?.label} dates in the
            loaded window — they may fall later in the year.
          </div>
        ) : (
          months.map((m, gi) => (
            <section
              key={m.key}
              id={`m-${m.key}`}
              className={`scroll-mt-[150px] ${gi > 0 ? "mt-7" : ""}`}
            >
              <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-border pb-[6px]">
                <h2 className="text-[15px] font-bold tracking-[-0.2px] text-ink">
                  {monthLabel(m.key)}
                </h2>
                <span className="text-[11px] text-sub">
                  {m.items.length} date{m.items.length === 1 ? "" : "s"}
                </span>
              </div>
              <ObservanceTable>
                {m.items.map((u, i) => (
                  <ObservanceRow
                    key={`${u.observance.slug}-${u.observance.date}`}
                    item={u}
                    now={now}
                    highlight={gi === 0 && i === 0 && filter === "all"}
                  />
                ))}
              </ObservanceTable>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
