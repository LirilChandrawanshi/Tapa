"use client";

import { useState } from "react";

/**
 * Save + Share controls in the breadcrumb row.
 * Save is a stub until the auth gate lands in M6 — it only logs.
 * Share uses the Web Share API with a clipboard fallback.
 */
export function SaveShareButtons({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const [copied, setCopied] = useState(false);

  function onSave() {
    // M6 wires this to the account + saved-items API behind the OTP gate.
    console.log(`[tapa] save requested for article: ${slug}`);
  }

  async function onShare() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* user dismissed the sheet — nothing to do */
    }
  }

  const btn =
    "flex h-[35px] items-center gap-[6px] rounded-lg border-[1.5px] border-border bg-card px-[14px] text-[13px] text-body hover:border-cta";

  return (
    <>
      <button type="button" className={btn} onClick={onSave}>
        <span aria-hidden>🔖</span> Save
      </button>
      <button type="button" className={btn} onClick={onShare}>
        <span aria-hidden>↗</span> {copied ? "Copied" : "Share"}
      </button>
    </>
  );
}
