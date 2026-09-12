import Link from "next/link";
import { fmtShort, weekday } from "@/lib/panchangExtras";
import type { UpcomingObservance } from "@/lib/types";

/**
 * "This vrat recurs" — the spec's four-card strip around the date you are
 * on. The current date stays in the strip and is marked, rather than being
 * filtered out: the point is to show where in the series you are.
 */
export function OccurrenceStrip({
  items,
  current,
  max = 4,
}: {
  /** Every date in the series this year, in date order, including `current`. */
  items: readonly UpcomingObservance[];
  current: { slug: string; date: string };
  max?: number;
}) {
  if (items.length === 0) return null;

  const index = items.findIndex(
    (u) => u.observance.slug === current.slug && u.observance.date === current.date,
  );
  // Centre the window on the current date where we can find it.
  const start =
    index < 0
      ? 0
      : Math.max(0, Math.min(index - 1, Math.max(0, items.length - max)));
  const window = items.slice(start, start + max);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {window.map((u) => {
        const o = u.observance;
        const isCurrent = o.slug === current.slug && o.date === current.date;
        return (
          <Link
            key={`${o.slug}-${o.date}`}
            href={`/panchang/o/${o.slug}`}
            aria-current={isCurrent ? "page" : undefined}
            className={`hover-lift rounded-[13px] border px-4 py-[14px] ${
              isCurrent
                ? "border-cta bg-bhranti-bg"
                : "border-border bg-card hover:border-data-bd"
            }`}
          >
            <p
              className={`text-[15px] font-bold ${
                isCurrent ? "text-cta" : "text-ink"
              }`}
            >
              {fmtShort(o.date)}
            </p>
            <p className="text-[11px] text-sub">{weekday(o.date)}</p>
            <p className="mt-[6px] text-[12.5px] leading-snug font-medium text-mid">
              {o.name}
              {isCurrent && (
                <span className="font-bold text-cta"> — this one</span>
              )}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
