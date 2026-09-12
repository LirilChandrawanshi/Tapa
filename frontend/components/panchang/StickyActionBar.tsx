import type { ReactNode } from "react";

/**
 * Sticky bottom action bar — the spec pins two actions to the foot of every
 * panchang template (Guide + Remind on a vrat, Subscribe + Day card on a
 * festival, Download + Circle on the calendars).
 *
 * Rendered as a real page-flow element with `sticky bottom-0` rather than
 * `fixed`, so it never covers the footer.
 */
export function StickyActionBar({
  secondary,
  primary,
}: {
  /** Left slot — the lighter of the two actions. */
  secondary?: ReactNode;
  /** Right slot — the action the page is actually pushing. */
  primary: ReactNode;
}) {
  return (
    <div className="sticky bottom-0 z-40 mt-10 border-t border-border bg-card/95 py-[10px] backdrop-blur">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-4 md:px-10">
        <div className="flex min-w-0 items-center gap-3">{secondary}</div>
        <div className="flex shrink-0 items-center gap-3">{primary}</div>
      </div>
    </div>
  );
}

/** Text-plus-subtitle label used inside a sticky bar button. */
export function StickyLabel({
  title,
  note,
}: {
  title: string;
  note?: string;
}) {
  return (
    <span className="flex flex-col items-start leading-tight">
      <span>{title}</span>
      {note && (
        <span className="text-[10px] font-medium opacity-75">{note}</span>
      )}
    </span>
  );
}
