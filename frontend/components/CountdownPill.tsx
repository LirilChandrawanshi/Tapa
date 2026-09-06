const MS_PER_DAY = 86_400_000;

function startOfDayUtc(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * "TODAY" / "IN N DAYS" countdown pill.
 * Pink when the date is today or within 7 days; amber beyond that.
 * Computed against a passed `now` so server and client render identically.
 */
export function CountdownPill({
  date,
  now,
  className = "",
}: {
  date: Date | string;
  now: Date | string;
  className?: string;
}) {
  const target = typeof date === "string" ? new Date(date) : date;
  const current = typeof now === "string" ? new Date(now) : now;
  const days = Math.round(
    (startOfDayUtc(target) - startOfDayUtc(current)) / MS_PER_DAY,
  );

  if (days < 0) return null;

  const isNear = days <= 7;
  const label = days === 0 ? "TODAY" : `IN ${days} DAY${days === 1 ? "" : "S"}`;

  return (
    <span
      className={`inline-flex items-center rounded-[5px] border px-[9px] py-[3px] text-[9.5px] font-bold tracking-[0.4px] ${
        isNear
          ? "border-cta bg-cta text-white"
          : "border-amber bg-amber text-white"
      } ${className}`}
    >
      {label}
    </span>
  );
}
