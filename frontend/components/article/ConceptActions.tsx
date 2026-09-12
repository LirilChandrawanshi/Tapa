"use client";

import Link from "next/link";
import { useSaveShare } from "./SaveShareButtons";

/**
 * Save/share controls for the Dharmic Concept template. The prototype puts
 * them in three places — over the hero, in the sticky sidebar, and in the
 * mobile bottom bar — so each surface gets its own small client island rather
 * than one component trying to be all three.
 */

/** Ghost share pill, top-right of the hero image. */
export function ConceptHeroShare({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const { copied, onShare, extras } = useSaveShare(slug, title);
  return (
    <>
      <button
        type="button"
        onClick={() => void onShare()}
        className="absolute top-5 right-4 z-10 rounded-[20px] border border-white/30 bg-white/15 px-4 py-[7px] text-[12.5px] font-medium text-white backdrop-blur-[2px] hover:bg-white/25 md:right-10"
      >
        <span aria-hidden>↗</span> {copied ? "Copied" : "Share"}
      </button>
      {extras}
    </>
  );
}

/** The hero button pair: read-on primary, save ghost. */
export function ConceptHeroButtons({
  slug,
  title,
  readHref,
  readLabel,
}: {
  slug: string;
  title: string;
  readHref: string;
  readLabel: string;
}) {
  const { saved, onSave, extras } = useSaveShare(slug, title);
  return (
    <div className="flex flex-wrap items-stretch gap-[10px]">
      <a
        href={readHref}
        className="rounded-[10px] bg-white/95 px-[22px] py-3 text-[13.5px] font-bold whitespace-nowrap text-ink hover:bg-white"
      >
        {readLabel}
      </a>
      <button
        type="button"
        aria-pressed={saved}
        onClick={() => void onSave()}
        className="rounded-[10px] border-[1.5px] border-white/40 px-[22px] py-3 text-[13.5px] font-semibold whitespace-nowrap text-hero-text hover:border-white/70"
      >
        {saved ? "Saved" : "Save this"}
      </button>
      {extras}
    </div>
  );
}

/** Dark "save this concept" CTA in the sidebar stack. */
export function ConceptSaveCta({
  slug,
  title,
  subtitle,
}: {
  slug: string;
  title: string;
  subtitle: string;
}) {
  const { saved, onSave, extras } = useSaveShare(slug, title);
  return (
    <>
      <button
        type="button"
        aria-pressed={saved}
        onClick={() => void onSave()}
        className="flex w-full flex-col items-center gap-[3px] rounded-xl bg-ink-deep p-[14px] hover:opacity-90"
      >
        <span aria-hidden className="text-lg text-white">
          {saved ? "🔖" : "↓"}
        </span>
        <span className="text-[13px] font-bold text-white">
          {saved ? "Saved to your rituals" : "Save this concept"}
        </span>
        <span className="text-center text-[11px] leading-[1.5] text-white/60">
          {subtitle}
        </span>
      </button>
      {extras}
    </>
  );
}

/**
 * Mobile bottom bar — a concept has no ritual card to download, so the
 * prototype pairs the Circle subscription with Save instead.
 */
export function ConceptMobileBar({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const { saved, onSave, extras } = useSaveShare(slug, title);
  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] flex gap-[9px] border-t border-border bg-white/95 px-[14px] pt-[10px] pb-[calc(10px+env(safe-area-inset-bottom))] shadow-[0_-2px_16px_rgba(28,23,18,0.08)] backdrop-blur-[10px] md:hidden">
      <Link
        href="/tapa-circle"
        className="flex flex-1 items-center justify-center gap-[6px] rounded-[11px] bg-wa px-3 py-3 text-[12.5px] font-bold text-white"
      >
        Subscribe
        <span className="text-[11px] font-semibold opacity-80">₹499/yr</span>
      </Link>
      <button
        type="button"
        aria-pressed={saved}
        onClick={() => void onSave()}
        className={`flex-1 rounded-[11px] border-[1.5px] px-3 py-3 text-[12.5px] font-bold ${
          saved
            ? "border-cta bg-bhranti-bg text-cta"
            : "border-border bg-card text-body"
        }`}
      >
        <span aria-hidden>↓</span> {saved ? "Saved" : "Save this"}
      </button>
      {extras}
    </div>
  );
}
