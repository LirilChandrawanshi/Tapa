"use client";

import { useMemo, useState } from "react";
import type { UpcomingObservance } from "@/lib/types";
import {
  VRAT_FILTERS,
  type VratFilterKey,
  matchesVratFilter,
} from "@/lib/panchangExtras";
import { FilterChips } from "./FilterChips";
import { ObservanceRow, ObservanceTable } from "./ObservanceRow";

/**
 * Client half of the vrat calendar: filter chips + filtered rows.
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

  return (
    <div>
      <FilterChips
        options={VRAT_FILTERS}
        active={filter}
        onChange={setFilter}
        counts={counts}
      />
      <div className="mt-4">
        {visible.length === 0 ? (
          <div className="rounded-[15px] border border-border bg-card px-5 py-8 text-center text-[13px] text-sub">
            No {VRAT_FILTERS.find((f) => f.key === filter)?.label} dates in the
            loaded window — they may fall later in the year.
          </div>
        ) : (
          <ObservanceTable>
            {visible.map((u, i) => (
              <ObservanceRow
                key={`${u.observance.slug}-${u.observance.date}`}
                item={u}
                now={now}
                highlight={i === 0 && filter === "all"}
              />
            ))}
          </ObservanceTable>
        )}
      </div>
    </div>
  );
}
