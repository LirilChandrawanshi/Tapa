"use client";

import { useMemo, useState } from "react";
import type { UpcomingObservance } from "@/lib/types";
import { track } from "@/lib/analytics";
import {
  VRAT_FILTERS,
  type VratFilterKey,
  countByMonth,
  matchesVratFilter,
  monthLabel,
} from "@/lib/panchangExtras";
import { ConventionToggle } from "./ConventionToggle";
import { CONTROL_H,
  ControlBar, ControlSep } from "./ControlBar";
import { FilterChips } from "./FilterChips";
import { MonthTabs, monthKeyOf } from "./MonthTabs";
import { ObservanceRow, ObservanceTable } from "./ObservanceRow";
import { CitySelect, PdfDownloadLink } from "./PanchangControls";
import { SourceStrip, TimingDataTag } from "./DataMeta";

/**
 * The vrat calendar, whole. Owns the two controls the spec puts in the
 * sticky rail — the type filter and the Jan–Dec month tabs — so it renders
 * the control bar itself rather than trying to share state across the page.
 *
 * One month is shown at a time, as in the spec: the month tabs are the
 * primary navigator, not a jump list over an endless scroll.
 */
export function VratList({
  items,
  now,
  year,
}: {
  /** Every observance of `year`, date-sorted. Past dates included. */
  items: UpcomingObservance[];
  now: string;
  year: string;
}) {
  const [filter, setFilter] = useState<VratFilterKey>("all");
  const [month, setMonth] = useState<string>(() => firstMonth(items, now, year));

  const counts = useMemo(() => {
    const c: Partial<Record<VratFilterKey, number>> = {};
    for (const f of VRAT_FILTERS) {
      c[f.key] = items.filter((u) => matchesVratFilter(u.observance, f.key)).length;
    }
    return c;
  }, [items]);

  const filtered = useMemo(
    () => items.filter((u) => matchesVratFilter(u.observance, filter)),
    [items, filter],
  );

  const monthCounts = useMemo(() => countByMonth(filtered), [filtered]);
  // A filter can empty the open month — fall to the first month that has rows.
  const activeMonth =
    (monthCounts[month] ?? 0) > 0
      ? month
      : (Object.keys(monthCounts).sort()[0] ?? month);

  const rows = useMemo(
    () => filtered.filter((u) => u.observance.date.startsWith(activeMonth)),
    [filtered, activeMonth],
  );

  const lunarSpan = lunarMonthSpan(rows);

  return (
    <>
      <ControlBar>
        {/* Hidden in the sticky bar on a phone: it is a statement, not a
            control, and it pushed the city selector — the most important
            control on the page — off the visible row. SourceStrip still
            carries the provenance below. */}
        <span className="hidden md:contents">
          <TimingDataTag />
        </span>
        <CitySelect />
        <ControlSep />
        <ConventionToggle />
        <PdfDownloadLink
          surface="vrat-calendar-strip"
          className={`${CONTROL_H} ml-auto inline-flex items-center rounded-[9px] border border-data-fg bg-data-fg px-[14px] text-[12px] font-bold text-white hover:opacity-90`}
        >
          ↓ Download PDF
        </PdfDownloadLink>
      </ControlBar>

      <div className="mx-auto max-w-[1280px] px-4 pt-6 md:px-10">
        <FilterChips
          options={VRAT_FILTERS}
          active={filter}
          onChange={(k) => {
            setFilter(k);
            track("panchang_filter_changed", { surface: "vrat-calendar", filter: k });
          }}
          counts={counts}
        />

        <div className="mt-4">
          <MonthTabs
            year={year}
            counts={monthCounts}
            active={activeMonth}
            onChange={setMonth}
            surface="vrat-calendar"
          />
        </div>

        <div className="mt-5">
          {rows.length === 0 ? (
            <div className="rounded-[15px] border border-border bg-card px-5 py-8 text-center text-[13px] text-sub">
              No {VRAT_FILTERS.find((f) => f.key === filter)?.label} dates in{" "}
              {year}.{" "}
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="font-bold text-cta hover:underline"
              >
                Show all
              </button>
            </div>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-[6px]">
                <h2 className="text-[15px] font-bold tracking-[-0.2px] text-ink uppercase">
                  {monthLabel(activeMonth)}
                </h2>
                <span className="text-[11.5px] text-sub">
                  {rows.length} observance{rows.length === 1 ? "" : "s"}
                  {lunarSpan ? ` · ${lunarSpan}` : ""}
                </span>
              </div>
              <ObservanceTable>
                {rows.map((u) => (
                  <ObservanceRow
                    key={`${u.observance.slug}-${u.observance.date}`}
                    item={u}
                    now={now}
                    highlight={u.observance.date >= now}
                  />
                ))}
              </ObservanceTable>
              <SourceStrip className="mt-2" />
            </>
          )}
        </div>
      </div>
    </>
  );
}

/** Open on the current month when it has dates, else the first that does. */
function firstMonth(
  items: readonly UpcomingObservance[],
  now: string,
  year: string,
): string {
  const counts = countByMonth(items);
  const current = now.slice(0, 7);
  if ((counts[current] ?? 0) > 0) return current;
  const withDates = Object.keys(counts).sort();
  return withDates[0] ?? monthKeyOf(year, 0);
}

/**
 * "Bhadrapada into Ashwin" — the lunar months a civil month straddles, read
 * off the tithi labels we already have. Null when the labels are absent.
 */
function lunarMonthSpan(rows: readonly UpcomingObservance[]): string | null {
  const names: string[] = [];
  for (const u of rows) {
    const first = u.observance.tithiLabel?.trim().split(/\s+/)[0];
    if (first && !names.includes(first)) names.push(first);
  }
  if (names.length === 0) return null;
  if (names.length === 1) return names[0];
  return `${names[0]} into ${names[names.length - 1]}`;
}
