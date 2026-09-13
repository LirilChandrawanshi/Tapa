"use client";

import type { ReactNode } from "react";
import { track } from "@/lib/analytics";
import { CALENDAR_PDF_HREF, CITY_LABEL } from "@/lib/panchangExtras";
import { CONTROL_H, ControlLabel } from "@/components/panchang/ControlBar";

/**
 * City selector — a single live option today (Delhi-NCR) with the coming
 * cities visible but disabled. Changing it is a no-op for the data, but the
 * analytics event tells us which city to compute next.
 */
export function CitySelect({ className = "" }: { className?: string }) {
  return (
    <label className={`flex items-center gap-2 ${className}`}>
      <ControlLabel>Calculated for</ControlLabel>
      <select
        aria-label="City the panchang is calculated for"
        defaultValue="delhi-ncr"
        onChange={() => track("panchang_city_changed", { city: "delhi-ncr" })}
        // min-h-11 so the most important control on a panchang page is
        // actually tappable on a phone; the label beside it keeps it compact.
        className={`${CONTROL_H} cursor-pointer rounded-[8px] border border-border bg-card px-2.5 text-[12px] font-bold text-mid outline-none focus-visible:border-gold`}
      >
        <option value="delhi-ncr">{CITY_LABEL}</option>
        <option disabled>Mumbai — soon</option>
        <option disabled>Bengaluru — soon</option>
        <option disabled>Kolkata — soon</option>
        <option disabled>More cities soon</option>
      </select>
    </label>
  );
}

/** PDF calendar link that fires panchang_calendar_downloaded on click. */
export function PdfDownloadLink({
  surface,
  className = "",
  children,
}: {
  /** Where the link lives, e.g. "landing-strip" — goes into the event. */
  surface: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={CALENDAR_PDF_HREF}
      className={className}
      onClick={() => track("panchang_calendar_downloaded", { surface })}
    >
      {children}
    </a>
  );
}

/**
 * Sticky mini download bar pinned to the bottom of the vrat calendar (#84) —
 * the whole year as one PDF, reachable without scrolling back up.
 */
export function StickyDownloadBar() {
  return (
    <div className="sticky bottom-0 z-40 mt-10 border-t border-border bg-card/95 py-2 backdrop-blur md:py-3">
      {/* One row on a phone. Wrapping made this 90px of permanent chrome at
          the foot of an already crowded screen. */}
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-4 md:flex-wrap md:px-10">
        <p className="min-w-0 truncate text-[12.5px] text-mid">
          <span aria-hidden>↓</span>{" "}
          <b className="text-ink">The full 2026 calendar, one PDF</b>
          <span className="hidden text-sub sm:inline">
            {" "}
            — every tithi, vrat and festival date
          </span>
        </p>
        <PdfDownloadLink
          surface="vrat-calendar-sticky"
          className="shrink-0 rounded-[9px] bg-cta px-4 py-[9px] text-[12px] font-bold text-white hover:opacity-90 md:py-[7px]"
        >
          {/* The label already sits beside "the full 2026 calendar" — spelling
              the year out again is what forced this bar onto two rows. */}
          <span className="sm:hidden">Download</span>
          <span className="hidden sm:inline">Download 2026 calendar (PDF)</span>
        </PdfDownloadLink>
      </div>
    </div>
  );
}
