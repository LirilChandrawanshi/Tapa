"use client";

import type { ReactNode } from "react";
import { track } from "@/lib/analytics";
import { CALENDAR_PDF_HREF, CITY_LABEL } from "@/lib/panchangExtras";

/**
 * City selector — a single live option today (Delhi-NCR) with the coming
 * cities visible but disabled. Changing it is a no-op for the data, but the
 * analytics event tells us which city to compute next.
 */
export function CitySelect({ className = "" }: { className?: string }) {
  return (
    <label
      className={`flex items-center gap-2 rounded-[9px] border border-border bg-bg px-3 py-[6px] text-[12px] font-bold text-mid ${className}`}
    >
      <span className="text-[9.5px] font-bold tracking-[0.7px] text-sub uppercase">
        Calculated for
      </span>
      <select
        aria-label="City the panchang is calculated for"
        defaultValue="delhi-ncr"
        onChange={() => track("panchang_city_changed", { city: "delhi-ncr" })}
        // min-h-11 so the most important control on a panchang page is
        // actually tappable on a phone; the label above keeps it compact.
        className="min-h-11 cursor-pointer bg-transparent py-1 text-[12px] font-bold text-mid outline-none md:min-h-0 md:py-0"
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
    <div className="sticky bottom-0 z-40 mt-10 border-t border-border bg-card/95 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-3 px-4 md:px-10">
        <p className="text-[12.5px] text-mid">
          <span aria-hidden>↓</span>{" "}
          <b className="text-ink">The full 2026 calendar, one PDF</b>
          <span className="hidden text-sub sm:inline">
            {" "}
            — every tithi, vrat and festival date
          </span>
        </p>
        <PdfDownloadLink
          surface="vrat-calendar-sticky"
          className="shrink-0 rounded-[9px] bg-cta px-4 py-[7px] text-[12px] font-bold text-white hover:opacity-90"
        >
          Download 2026 calendar (PDF)
        </PdfDownloadLink>
      </div>
    </div>
  );
}
