"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CountdownPill } from "@/components/CountdownPill";
import { track } from "@/lib/analytics";
import { deityHue } from "@/lib/articleExtras";
import {
  countByMonth,
  fmtRange,
  fmtShort,
  guideHref,
  monthLabel,
  weekday,
} from "@/lib/panchangExtras";
import type { UpcomingObservance } from "@/lib/types";
import { ConventionToggle } from "./ConventionToggle";
import { ControlBar, ControlSep } from "./ControlBar";
import { SourceStrip, TimingDataTag } from "./DataMeta";
import { FilterChips } from "./FilterChips";
import { MonthTabs, monthKeyOf } from "./MonthTabs";
import { CitySelect, PdfDownloadLink } from "./PanchangControls";

/**
 * Festival calendar body — the spec's month-first view: month tabs pick a
 * month, a deity filter narrows it, and each festival is a card whose date
 * block carries its deity's hue.
 *
 * "With a guide" stands in for the spec's "Major only" chip: significance is
 * not a field we hold, but whether a ritual guide is live is, and it is the
 * honest version of the same question.
 */

const FILTERS = [
  { key: "all", label: "All festivals" },
  { key: "guide", label: "With a guide" },
  { key: "shiva", label: "Shiva" },
  { key: "vishnu", label: "Vishnu" },
  { key: "devi", label: "Devi" },
  { key: "ganesh", label: "Ganesha" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

function matches(u: UpcomingObservance, f: FilterKey): boolean {
  if (f === "all") return true;
  if (f === "guide") return Boolean(u.observance.articleSlug);
  return deityHue(u.observance.deity, "gold") === f;
}

export function FestivalGrid({
  items,
  now,
  year,
}: {
  items: UpcomingObservance[];
  now: string;
  year: string;
}) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [month, setMonth] = useState<string>(() => {
    const counts = countByMonth(items);
    const current = now.slice(0, 7);
    if ((counts[current] ?? 0) > 0) return current;
    return Object.keys(counts).sort()[0] ?? monthKeyOf(year, 0);
  });

  const counts = useMemo(() => {
    const c: Partial<Record<FilterKey, number>> = {};
    for (const f of FILTERS) c[f.key] = items.filter((u) => matches(u, f.key)).length;
    return c;
  }, [items]);

  const filtered = useMemo(
    () => items.filter((u) => matches(u, filter)),
    [items, filter],
  );
  const monthCounts = useMemo(() => countByMonth(filtered), [filtered]);
  const activeMonth =
    (monthCounts[month] ?? 0) > 0
      ? month
      : (Object.keys(monthCounts).sort()[0] ?? month);

  const rows = useMemo(
    () => filtered.filter((u) => u.observance.date.startsWith(activeMonth)),
    [filtered, activeMonth],
  );

  // The spec's "NEXT MONTH" teaser — the next month that actually has dates.
  const nextMonth = useMemo(() => {
    const later = Object.keys(monthCounts)
      .filter((k) => k > activeMonth)
      .sort();
    return later[0] ?? null;
  }, [monthCounts, activeMonth]);
  const nextRows = useMemo(
    () =>
      nextMonth
        ? filtered
            .filter((u) => u.observance.date.startsWith(nextMonth))
            .slice(0, 3)
        : [],
    [filtered, nextMonth],
  );

  return (
    <>
      <ControlBar>
        <TimingDataTag />
        <CitySelect />
        <ControlSep />
        <ConventionToggle />
        <PdfDownloadLink
          surface="festival-calendar-strip"
          className="ml-auto rounded-[9px] border border-data-fg bg-data-fg px-[14px] py-[7px] text-[12px] font-bold text-white hover:opacity-90"
        >
          ↓ Download PDF
        </PdfDownloadLink>
      </ControlBar>

      <div className="mx-auto max-w-[1280px] px-4 pt-6 md:px-10">
        <FilterChips
          options={FILTERS}
          active={filter}
          onChange={(k) => {
            setFilter(k);
            track("panchang_filter_changed", {
              surface: "festival-calendar",
              filter: k,
            });
          }}
          counts={counts}
        />

        <div className="mt-4">
          <MonthTabs
            year={year}
            counts={monthCounts}
            active={activeMonth}
            onChange={setMonth}
            noun="festival"
            surface="festival-calendar"
          />
        </div>

        {rows.length === 0 ? (
          <div className="mt-5 rounded-[15px] border border-border bg-card px-5 py-8 text-center text-[13px] text-sub">
            No {FILTERS.find((f) => f.key === filter)?.label} dates in {year}.{" "}
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
            <div className="mt-6 mb-4 flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-2">
              <div>
                <p className="text-[10px] font-bold tracking-[0.8px] text-gold uppercase">
                  {monthLabel(activeMonth)}
                </p>
                <h2 className="text-[17px] font-bold tracking-[-0.2px] text-ink">
                  {lunarSpan(rows) ?? "The month's festivals"}
                </h2>
              </div>
              <span className="text-[11.5px] text-sub">
                {rows.length} festival{rows.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {rows.map((u) => (
                <FestivalCard
                  key={`${u.observance.slug}-${u.observance.date}`}
                  item={u}
                  now={now}
                />
              ))}
            </div>
            <SourceStrip className="mt-3" />
          </>
        )}

        {nextRows.length > 0 && nextMonth && (
          <section className="mt-10">
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-2">
              <div>
                <p className="text-[10px] font-bold tracking-[0.8px] text-gold uppercase">
                  Next month
                </p>
                <h2 className="text-[17px] font-bold tracking-[-0.2px] text-ink">
                  {monthLabel(nextMonth)}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setMonth(nextMonth)}
                className="text-[12px] font-bold text-cta hover:underline"
              >
                See {monthLabel(nextMonth).split(" ")[0]} ›
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {nextRows.map((u) => (
                <FestivalCard
                  key={`${u.observance.slug}-${u.observance.date}`}
                  item={u}
                  now={now}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}

function FestivalCard({
  item,
  now,
}: {
  item: UpcomingObservance;
  now: string;
}) {
  const o = item.observance;
  const hue = deityHue(o.deity, "gold");
  const multiDay = Boolean(o.endDate && o.endDate !== o.date);
  const [dd, mm] = fmtShort(o.date).split(" ");
  return (
    <div className="hover-lift reveal flex overflow-hidden rounded-[15px] border border-border bg-card hover:border-data-bd">
      <div
        className={`h-${hue} flex w-[76px] shrink-0 flex-col items-center justify-center px-2 py-4 text-center`}
      >
        <span className="text-[21px] leading-none font-bold text-hero-text">
          {dd}
        </span>
        <span className="mt-[3px] text-[9.5px] font-bold tracking-[1px] text-eyebrow-dark uppercase">
          {mm}
        </span>
        <span className="mt-1 text-[9.5px] text-hero-text/55">
          {weekday(o.date).slice(0, 3)}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <Link
          href={`/panchang/o/${o.slug}`}
          className="text-[14.5px] leading-snug font-bold text-ink hover:text-cta"
        >
          {o.name}
        </Link>
        <p className="mt-[3px] text-[11.5px] text-data-fg">
          {multiDay ? fmtRange(o.date, o.endDate) : fmtRange(o.date)}
          {o.tithiLabel ? ` · ${o.tithiLabel}` : ""}
          {!o.verified ? " · provisional" : ""}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3">
          {o.articleSlug ? (
            <Link
              href={guideHref(o.articleSlug)}
              className="rounded-[5px] border border-dharma-bd bg-dharma-bg px-[7px] py-[2px] text-[9px] font-bold tracking-[0.5px] text-dharma-fg uppercase"
            >
              Guide live
            </Link>
          ) : (
            <span className="rounded-[5px] border border-border bg-bg px-[7px] py-[2px] text-[9px] font-bold tracking-[0.5px] text-sub uppercase">
              Guide coming
            </span>
          )}
          {o.seriesPosition && (
            <span className="rounded-[5px] border border-border bg-bg px-[7px] py-[2px] text-[9px] font-bold tracking-[0.5px] text-sub uppercase">
              {o.seriesPosition}
            </span>
          )}
          <CountdownPill date={o.date} now={now} />
        </div>
      </div>
    </div>
  );
}

/** "Bhadrapada, into Ashwin" from the tithi labels present in the month. */
function lunarSpan(rows: readonly UpcomingObservance[]): string | null {
  const names: string[] = [];
  for (const u of rows) {
    const first = u.observance.tithiLabel?.trim().split(/\s+/)[0];
    if (first && !names.includes(first)) names.push(first);
  }
  if (names.length === 0) return null;
  if (names.length === 1) return names[0];
  return `${names[0]}, into ${names[names.length - 1]}`;
}
