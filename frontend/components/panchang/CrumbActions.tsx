"use client";

import { useState } from "react";
import { LangToggle } from "@/components/LangToggle";
import { SaveShareButtons } from "@/components/article/SaveShareButtons";
import { track } from "@/lib/analytics";

/**
 * Breadcrumb-row controls for a panchang detail page: EN/हिं, Save, Share.
 *
 * Save writes against a ritual guide, so it only appears when the observance
 * links to one — a bare date has nothing to save. Everything else gets a
 * share button that uses the Web Share API with a clipboard fallback.
 */
export function CrumbActions({
  title,
  articleSlug,
  showLang = true,
}: {
  title: string;
  /** Ritual-guide slug, when this observance has one. */
  articleSlug?: string;
  showLang?: boolean;
}) {
  return (
    <>
      {showLang && <LangToggle />}
      {articleSlug ? (
        <SaveShareButtons slug={articleSlug} title={title} />
      ) : (
        <ShareButton title={title} />
      )}
    </>
  );
}

export function ShareButton({ title }: { title: string }) {
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
      className="flex h-[35px] items-center gap-[6px] rounded-lg border-[1.5px] border-border bg-card px-[14px] text-[13px] text-body hover:border-cta"
    >
      <span aria-hidden>↗</span> {copied ? "Copied" : "Share"}
    </button>
  );
}
