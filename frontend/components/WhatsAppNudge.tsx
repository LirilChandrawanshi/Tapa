"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const IMPRESSIONS_KEY = "tapa-nudge-impressions";
const JOINED_KEY = "tapa-circle-joined";
const MAX_IMPRESSIONS = 3;

/**
 * Tapa Circle nudge — WA-green accent card with contextual copy.
 * Counts its impressions in localStorage across placements; after 3
 * impressions, or once the user has joined the Circle, it stays hidden.
 */
export function WhatsAppNudge({ copy }: { copy: string }) {
  // null = deciding (renders nothing, avoids a flash before the check)
  const [visible, setVisible] = useState<boolean | null>(null);

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

  return (
    <div className="my-5 flex items-center gap-[13px] rounded-[14px] border border-wa/30 border-l-[3px] border-l-wa bg-card px-[18px] py-[15px]">
      <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-wa/10 text-lg">
        💬
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-bold text-ink">{copy}</p>
        <p className="mt-[2px] text-xs text-sub">
          Vrat and festival reminders on WhatsApp, with the guide attached.
        </p>
      </div>
      <Link
        href="/tapa-circle"
        className="shrink-0 rounded-[10px] bg-wa px-4 py-[10px] text-[12.5px] font-bold whitespace-nowrap text-white"
      >
        Join the Tapa Circle ›
      </Link>
    </div>
  );
}
