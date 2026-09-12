"use client";

import { useEffect, useState } from "react";
import { fmtShort, weekday } from "@/lib/panchangExtras";

/**
 * Purnimanta / Amanta month-reckoning toggle (#80).
 *
 * The choice lives in localStorage and is broadcast via a window event so the
 * date cells (AmantaDate) can swap to `dateAmanta` where the API provides one.
 * Most observances carry no separate Amanta date — those render identically.
 */

export type Convention = "purnimanta" | "amanta";

const STORAGE_KEY = "tapa:panchang-convention";
const EVENT = "tapa:panchang-convention";

function readStored(): Convention {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "amanta"
      ? "amanta"
      : "purnimanta";
  } catch {
    return "purnimanta";
  }
}

/** Subscribe to the current convention; always "purnimanta" pre-hydration. */
export function useConvention(): Convention {
  const [conv, setConv] = useState<Convention>("purnimanta");
  useEffect(() => {
    setConv(readStored());
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<Convention>).detail;
      setConv(detail === "amanta" ? "amanta" : "purnimanta");
    };
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);
  return conv;
}

export function ConventionToggle({ className = "" }: { className?: string }) {
  const conv = useConvention();

  function choose(next: Convention) {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode — the event still updates this page */
    }
    window.dispatchEvent(new CustomEvent<Convention>(EVENT, { detail: next }));
  }

  const seg = (key: Convention, label: string) => (
    <button
      type="button"
      aria-pressed={conv === key}
      onClick={() => choose(key)}
      className={`min-h-10 rounded-[7px] px-[12px] py-[4px] text-[11.5px] font-bold transition-colors md:min-h-0 ${
        conv === key
          ? "bg-data-fg text-white"
          : "text-mid hover:bg-data-bg hover:text-data-fg"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-[9.5px] font-bold tracking-[0.7px] text-sub uppercase">
        Convention
      </span>
      <div
        role="group"
        aria-label="Month reckoning convention"
        className="flex gap-[3px] rounded-[9px] border border-border bg-bg p-[3px]"
      >
        {seg("purnimanta", "Purnimanta")}
        {seg("amanta", "Amanta")}
      </div>
      {conv === "amanta" && (
        <span className="text-[10.5px] text-sub italic">
          Amanta view — dates shift for month-boundary observances
        </span>
      )}
    </div>
  );
}

/**
 * Date cell that follows the convention toggle: shows `dateAmanta` (when the
 * API provides one) in Amanta view, the Purnimanta date otherwise.
 */
export function AmantaDate({
  date,
  dateAmanta,
}: {
  date: string;
  dateAmanta?: string;
}) {
  const conv = useConvention();
  const shown = conv === "amanta" && dateAmanta ? dateAmanta : date;
  return (
    <>
      <p className="text-[13.5px] font-bold text-ink">{fmtShort(shown)}</p>
      <p className="text-[11px] text-sub">{weekday(shown)}</p>
    </>
  );
}
