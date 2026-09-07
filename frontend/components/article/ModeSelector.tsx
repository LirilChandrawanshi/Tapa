"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";

type Mode = "doing" | "learning";

const STORAGE_KEY = "tapa-article-mode";

/**
 * Mode selector (G18, launch-blocking) — "what brings you here today?".
 * Purely an intent signal: it never filters content, it just logs the mode
 * and remembers the choice for the session.
 */
export function ModeSelector({ slug }: { slug: string }) {
  const [mode, setMode] = useState<Mode | null>(null);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved === "doing" || saved === "learning") setMode(saved);
    } catch {
      /* storage unavailable — selection lives in memory only */
    }
  }, []);

  function choose(next: Mode) {
    setMode(next);
    track("mode_selected", { slug, mode: next });
    try {
      sessionStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* private mode — nothing to persist */
    }
  }

  const card = (active: boolean) =>
    `flex-1 rounded-[13px] border-[1.5px] px-4 py-[13px] text-left text-[13.5px] leading-[1.5] font-semibold transition-colors ${
      active
        ? "border-cta bg-bhranti-bg text-ink"
        : "border-border bg-card text-body hover:border-cta"
    }`;

  return (
    <div className="mb-6">
      <p className="mb-[9px] text-[11px] font-bold tracking-[0.7px] text-gold">
        WHAT BRINGS YOU HERE TODAY?
      </p>
      <div className="flex flex-col gap-[9px] sm:flex-row">
        <button
          type="button"
          aria-pressed={mode === "doing"}
          className={card(mode === "doing")}
          onClick={() => choose("doing")}
        >
          <span aria-hidden>🪔</span> Doing this today — take me through it
        </button>
        <button
          type="button"
          aria-pressed={mode === "learning"}
          className={card(mode === "learning")}
          onClick={() => choose("learning")}
        >
          <span aria-hidden>📖</span> I want to learn — significance first
        </button>
      </div>
    </div>
  );
}
