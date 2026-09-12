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

/**
 * The spec's bordered Source Strip block — heading, the provenance line and
 * the standing note that panchang carries no DPB tag and no score. Used at
 * the top of every detail template, where the muted one-liner is too quiet.
 */
export function SourceStripBlock({
  note = "No classification tag and no Confidence Score. This is timing data, not a ritual-authority claim. Regenerates annually.",
  line = SOURCE_LINE,
  className = "",
}: {
  note?: string;
  line?: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[13px] border border-data-bd bg-data-bg px-5 py-4 ${className}`}
    >
      <p className="mb-[6px] text-[9.5px] font-bold tracking-[0.9px] text-data-fg/60 uppercase">
        Source strip
      </p>
      <p className="text-[12.5px] leading-relaxed font-medium text-data-fg">
        {line}
      </p>
      <p className="mt-[3px] text-[11.5px] leading-relaxed text-data-fg/70">
        {note}
      </p>
    </div>
  );
}

/**
 * Sidebar explainer for why a panchang page carries no DPB badge. The rule
 * is a PRD non-negotiable, so it is stated on the page rather than assumed.
 */
export function NoTagNote({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[13px] border border-border bg-bg px-[17px] py-4 ${className}`}
    >
      <p className="mb-[6px] text-[9.5px] font-bold tracking-[0.9px] text-sub uppercase">
        Why this page has no tag
      </p>
      <p className="text-[11.5px] leading-relaxed text-mid">
        {children ?? (
          <>
            Panchang carries <b>no Dharma or Pratha tag and no Confidence
            Score</b> — a date is not a ritual-authority claim. The almanac
            source is named in the Source Strip instead.
          </>
        )}
      </p>
    </div>
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
