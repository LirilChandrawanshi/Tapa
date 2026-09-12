"use client";

import { useMemo, useState } from "react";
import { ObservanceRow, ObservanceTable } from "./ObservanceRow";
import type { UpcomingObservance } from "@/lib/types";

/**
 * Filter chips over an observance list — All / Ekadashi / Pradosh /
 * Purnima / Amavasya, matched on the `series` field the backend already
 * carries (never on the display name, which is localised).
 *
 * A chip with nothing behind it in the current window renders dimmed and
 * unclickable rather than disappearing — an empty count is information.
 */
const SERIES_CHIPS = [
  { key: "ekadashi", label: "Ekadashi" },
  { key: "pradosh", label: "Pradosh" },
  { key: "purnima", label: "Purnima" },
  { key: "amavasya", label: "Amavasya" },
] as const;

export function ObservanceFilter({
  items,
  now,
}: {
  items: UpcomingObservance[];
  now: string;
}) {
  const [series, setSeries] = useState<string>("all");

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const chip of SERIES_CHIPS) {
      map.set(
        chip.key,
        items.filter((u) => u.observance.series === chip.key).length,
      );
    }
    return map;
  }, [items]);

  const filtered = useMemo(
    () =>
      series === "all"
        ? items
        : items.filter((u) => u.observance.series === series),
    [items, series],
  );

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-[10px] font-bold tracking-[0.8px] text-gold uppercase">
          Filter
        </span>
        <Chip on={series === "all"} onClick={() => setSeries("all")}>
          All · {items.length}
        </Chip>
        {SERIES_CHIPS.map((chip) => {
          const n = counts.get(chip.key) ?? 0;
          return (
            <Chip
              key={chip.key}
              on={series === chip.key}
              disabled={n === 0}
              onClick={() => setSeries(chip.key)}
            >
              {chip.label} · {n}
            </Chip>
          );
        })}
      </div>

      {filtered.length > 0 ? (
        <ObservanceTable>
          {filtered.map((u, i) => (
            <ObservanceRow
              key={`${u.observance.slug}-${u.observance.date}`}
              item={u}
              now={now}
              highlight={i === 0 && series === "all"}
            />
          ))}
        </ObservanceTable>
      ) : (
        <div className="rounded-[15px] border border-dashed border-border bg-card/60 px-6 py-9 text-center text-[12.5px] text-sub">
          No {series} dates in the next 30 days.{" "}
          <button
            type="button"
            onClick={() => setSeries("all")}
            className="font-bold text-cta hover:underline"
          >
            Show all
          </button>
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
