import Link from "next/link";
import type { ReactNode } from "react";
import { CountdownPill } from "@/components/CountdownPill";
import type { UpcomingObservance } from "@/lib/types";
import { fmtShort, guideHref, weekday } from "@/lib/panchangExtras";
import { TypeBadge } from "./TypeBadge";

/** Table shell: column header + rows. Columns collapse on mobile. */
export function ObservanceTable({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[15px] border border-border bg-card">
      <div className="hidden grid-cols-[110px_1.4fr_1fr_180px] gap-3 border-b border-border bg-bg px-5 py-[9px] text-[9.5px] font-bold tracking-[0.9px] text-sub uppercase md:grid">
        <span>Date</span>
        <span>Observance</span>
        <span>Tithi</span>
        <span />
      </div>
      {children}
    </div>
  );
}

/**
 * One observance in a date table — landing "next 30 days", vrat calendar,
 * series rails. Name links to the observance page; Guide › to the ritual
 * guide when one exists.
 */
export function ObservanceRow({
  item,
  now,
  showBadge = false,
  highlight = false,
}: {
  item: UpcomingObservance;
  /** IST "YYYY-MM-DD" — passed down so server and client agree. */
  now: string;
  showBadge?: boolean;
  highlight?: boolean;
}) {
  const o = item.observance;
  return (
    <div
      className={`grid grid-cols-[86px_1fr] items-center gap-x-3 gap-y-1 border-b border-border-light px-5 py-[13px] last:border-b-0 md:grid-cols-[110px_1.4fr_1fr_180px] ${
        highlight ? "bg-data-bg/40" : ""
      }`}
    >
      <div>
        <p className="text-[13.5px] font-bold text-ink">{fmtShort(o.date)}</p>
        <p className="text-[11px] text-sub">{weekday(o.date)}</p>
      </div>
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-[7px]">
          <Link
            href={`/panchang/o/${o.slug}`}
            className="text-[14px] font-bold text-ink hover:text-cta"
          >
            {o.name}
          </Link>
          {showBadge && <TypeBadge type={o.type} />}
          {o.seriesPosition && (
            <span className="text-[10.5px] text-sub">{o.seriesPosition}</span>
          )}
          {!o.verified && (
            <span className="text-[10px] text-sub italic">provisional</span>
          )}
        </p>
        {o.blurb && (
          <p className="mt-[2px] line-clamp-1 text-[11.5px] text-sub">
            {o.blurb}
          </p>
        )}
      </div>
      <p className="col-start-2 text-[12px] text-data-fg md:col-start-auto">
        {o.tithiLabel ?? "—"}
      </p>
      <div className="col-span-2 flex items-center gap-3 md:col-span-1 md:justify-end">
        <CountdownPill date={o.date} now={now} />
        {o.articleSlug ? (
          <Link
            href={guideHref(o.articleSlug)}
            className="text-[12px] font-bold whitespace-nowrap text-cta"
          >
            Guide ›
          </Link>
        ) : (
          <span className="text-[11px] whitespace-nowrap text-sub">
            Guide soon
          </span>
        )}
      </div>
    </div>
  );
}
