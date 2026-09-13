import type { ReactNode } from "react";

/**
 * The spec's `.ctrl` strip — a sticky rail under the hero carrying the city
 * selector, the month-reckoning convention, page filters and the download.
 * Every panchang page has one; only its contents differ.
 *
 * Sits below the sticky TopNav (70/72px) and the PanchangSubnav (~37px).
 */
export function ControlBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky top-[107px] z-30 border-b border-border bg-card/95 backdrop-blur lg:top-[109px]">
      {/*
       * One scrolling row on a phone, wrapping rows from `md`.
       *
       * Wrapping here cost 195px of an 844px screen, and because the bar is
       * sticky that was 195px gone for the whole session — with the nav and
       * subnav above it, 47% of the viewport was permanently chrome. A
       * horizontal scroll keeps every control reachable in about a third of
       * the height.
       *
       * `[&>*]:shrink-0` so the controls keep their natural width and scroll
       * instead of compressing into slivers.
       */}
      <div className="mx-auto flex max-w-[1280px] items-center gap-x-3 overflow-x-auto px-4 py-[9px] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:shrink-0 md:flex-wrap md:gap-y-2 md:overflow-x-visible md:px-10 md:py-[11px]">
        {children}
      </div>
    </div>
  );
}

/**
 * Shared height for every control in the strip. The three groups used to be
 * 28, 36 and 40px tall against three different backgrounds, which is what made
 * the row read as clutter rather than a toolbar. Mobile keeps a 44px tap
 * target; the desktop row settles on one line.
 */
export const CONTROL_H = "min-h-11 md:min-h-0 md:h-8";

/** Uppercase micro-label that sits outside its control, never inside it. */
export function ControlLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[9.5px] font-bold tracking-[0.7px] text-sub uppercase">
      {children}
    </span>
  );
}

/** Thin vertical rule between control-bar groups (the spec's `.sep`). */
export function ControlSep() {
  return <span aria-hidden className="hidden h-5 w-px bg-border md:block" />;
}

/**
 * Amber caution pill for a stated convention split — e.g. Ekadashi dates
 * differing between Smarta and Vaishnava reckoning. Never a warning about
 * doing something wrong: it states that two answers coexist.
 */
export function ConventionWarnPill({ children }: { children: ReactNode }) {
  return (
    <p className="flex items-center gap-[6px] rounded-[9px] border border-pratha-bd bg-pratha-bg px-[11px] py-[6px] text-[11.5px] leading-snug font-medium text-pratha-fg">
      <span aria-hidden>⚠</span>
      {children}
    </p>
  );
}
