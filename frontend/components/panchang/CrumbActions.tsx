"use client";

import { useState } from "react";
import {
  ACTION_BTN,
  type ActionTone,
  actionSkin,
} from "@/components/article/actionTone";
import { SaveShareButtons } from "@/components/article/SaveShareButtons";
import { track } from "@/lib/analytics";

/**
 * Save + Share controls for a panchang detail page.
 *
 * No language toggle here — the top nav already carries one, and a second
 * EN/हिं pair a row below it read as a duplicate control.
 *
 * Save writes against a ritual guide, so it only appears when the observance
 * links to one — a bare date has nothing to save. Everything else gets a
 * share button that uses the Web Share API with a clipboard fallback.
 */
export function CrumbActions({
  title,
  articleSlug,
  tone = "bar",
}: {
  title: string;
  /** Ritual-guide slug, when this observance has one. */
  articleSlug?: string;
  /** `hero` restyles the buttons for the dark hero they overlay. */
  tone?: ActionTone;
}) {
  return articleSlug ? (
    <SaveShareButtons slug={articleSlug} title={title} tone={tone} />
  ) : (
    <ShareButton title={title} tone={tone} />
  );
}

export function ShareButton({
  title,
  tone = "bar",
}: {
  title: string;
  tone?: ActionTone;
}) {
  const [copied, setCopied] = useState(false);

  async function onShare() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        track("panchang_shared", { channel: "native" });
        return;
      }
      await navigator.clipboard.writeText(url);
      track("panchang_shared", { channel: "clipboard" });
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* the user dismissed the sheet — nothing to do */
    }
  }

  return (
    <button
      type="button"
      onClick={() => void onShare()}
      className={`${ACTION_BTN} ${actionSkin(tone)}`}
    >
      <span aria-hidden>↗</span> {copied ? "Copied" : "Share"}
    </button>
  );
}
