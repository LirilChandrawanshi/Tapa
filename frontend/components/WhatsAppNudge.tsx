"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const IMPRESSIONS_KEY = "tapa-nudge-impressions";
const JOINED_KEY = "tapa-circle-joined";
const MAX_IMPRESSIONS = 3;

export type NudgeContext =
  | "article-vrat"
  | "article-concept"
  | "panchang"
  | "order"
  | "generic";

/**
 * Per-context nudge copy (#15) — one line per placement, fear-free by rule:
 * an invitation to be reminded, never a warning about forgetting.
 *
 * RI-EDITOR-OWNABLE STRINGS: these five lines belong to the RI editor's copy
 * deck; edit them here (they are intentionally plain string literals, not CMS
 * fields, until the Circle gets editor-managed copy).
 */
const CONTEXT_COPY: Record<NudgeContext, string> = {
  "article-vrat":
    "Want a reminder the evening before this vrat, with this guide attached?",
  "article-concept":
    "Enjoying the knowledge? The Circle brings the calendar's occasions to you.",
  panchang:
    "The panchang, brought to you — a reminder the evening before each occasion.",
  order:
    "While your order is on its way — the Circle keeps you close to the calendar.",
  generic: "Never miss a vrat again.",
};

/**
 * Tapa Circle nudge — WA-green accent card with contextual copy.
 * Counts its impressions in localStorage across placements; after 3
 * impressions, or once the user has joined the Circle, it stays hidden.
 *
 * Entry-point capture (#22): the join link carries ?from=<current path> so
 * /tapa-circle can record which page began the join.
 */
export function WhatsAppNudge({
  copy,
  context = "generic",
}: {
  /** Explicit override; existing call sites keep working. Prefer `context`. */
  copy?: string;
  context?: NudgeContext;
}) {
  // null = deciding (renders nothing, avoids a flash before the check)
  const [visible, setVisible] = useState<boolean | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    try {
      if (localStorage.getItem(JOINED_KEY) === "true") {
        setVisible(false);
        return;
      }
      const seen = Number(localStorage.getItem(IMPRESSIONS_KEY) ?? "0");
      if (!Number.isFinite(seen) || seen >= MAX_IMPRESSIONS) {
        setVisible(false);
        return;
      }
      localStorage.setItem(IMPRESSIONS_KEY, String(seen + 1));
      setVisible(true);
    } catch {
      // storage unavailable — show it, nothing to count against
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const headline = copy ?? CONTEXT_COPY[context];
  const joinHref = pathname
    ? `/tapa-circle?from=${encodeURIComponent(pathname)}`
    : "/tapa-circle";

  return (
    <div className="my-5 flex items-center gap-[13px] rounded-[14px] border border-wa/30 border-l-[3px] border-l-wa bg-card px-[18px] py-[15px]">
      <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-wa/10 text-lg">
        💬
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-bold text-ink">{headline}</p>
        <p className="mt-[2px] text-xs text-sub">
          Vrat and festival reminders on WhatsApp, with the guide attached.
        </p>
      </div>
      <Link
        href={joinHref}
        className="shrink-0 rounded-[10px] bg-wa px-4 py-[10px] text-[12.5px] font-bold whitespace-nowrap text-white"
      >
        Join the Tapa Circle ›
      </Link>
    </div>
  );
}
