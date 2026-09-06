import { SOURCE_LINE } from "@/lib/panchangExtras";

/**
 * Panchang data carries no DPB tag and no score — by design. Every surface
 * that shows timing data renders this marker instead of a DpbBadge.
 */
export function TimingDataTag({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[5px] border border-data-bd bg-data-bg px-[9px] py-[3px] text-[9.5px] font-bold tracking-[0.6px] text-data-fg uppercase ${className}`}
    >
      ☾ Timing data · No tag, no score
    </span>
  );
}

/** Provenance strip shown under any block of computed timing values. */
export function SourceStrip({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[11px] tracking-[0.2px] text-sub ${className}`}>
      {SOURCE_LINE}
    </p>
  );
}

/** Friendly state for a dead backend — never a blank section. */
export function VerifyingPanel({
  title = "Panchang is being verified",
  note = "Timing values are entered and checked by hand, never auto-fetched. This section will fill in shortly — nothing else on the page depends on it.",
  className = "",
}: {
  title?: string;
  note?: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[15px] border border-data-bd bg-data-bg px-6 py-8 text-center ${className}`}
    >
      <p className="text-[15px] font-bold text-data-fg">☾ {title}</p>
      <p className="mx-auto mt-2 max-w-[460px] text-[12.5px] leading-relaxed text-data-fg/75">
        {note}
      </p>
    </div>
  );
}

/**
 * Subtle notes for imperfect data: `stale` → last verified values,
 * `verified === false` → provisional. Renders nothing when all is well.
 */
export function DataStateNote({
  stale,
  verified,
  className = "",
}: {
  stale?: boolean;
  verified?: boolean;
  className?: string;
}) {
  if (!stale && verified !== false) return null;
  return (
    <p className={`text-[11px] text-sub italic ${className}`}>
      {stale && <span>showing last verified values</span>}
      {stale && verified === false && <span> · </span>}
      {verified === false && <span>provisional</span>}
    </p>
  );
}
