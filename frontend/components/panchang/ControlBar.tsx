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
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 md:px-10">
        {children}
      </div>
    </div>
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
