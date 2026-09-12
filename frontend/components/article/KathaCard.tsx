"use client";

import { useRef } from "react";
import { AudioPlayer } from "@/components/media/AudioPlayer";
import type { KathaBeat } from "@/lib/types";

/** Splits on blank lines, same convention as the article body's Prose renderer. */
function paragraphs(text: string, className: string) {
  return text
    .split(/\n{2,}/)
    .filter((p) => p.trim() !== "")
    .map((para, i) => (
      <p key={i} className={className}>
        {para.trim()}
      </p>
    ));
}

/**
 * Vrat katha card — a story panel, never plain prose (PRD §5.3). When the
 * content carries structured `beats`, they render as a numbered grid above
 * a "Read the full katha" button that opens the full text in a native
 * `<dialog>`. Without beats, the full text renders inline as before.
 */
export function KathaCard({
  text,
  beats,
  source,
  audioId,
}: {
  text: string;
  beats?: KathaBeat[];
  source?: string;
  audioId?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const hasBeats = !!beats?.length;

  return (
    <div className="overflow-hidden rounded-[15px] border border-border bg-card">
      <div className="border-b border-border-light bg-pratha-bg px-5 py-3">
        <p className="text-[10px] font-bold tracking-[0.8px] text-pratha-fg uppercase">
          Vrat Katha — the sacred story
        </p>
      </div>
      <div className="px-5 py-4">
        {hasBeats ? (
          <>
            <div className="grid gap-[11px] sm:grid-cols-2">
              {beats!.map((beat, i) => (
                <div key={i} className="rounded-[12px] bg-bg p-[15px]">
                  <span className="mb-[9px] flex size-6 items-center justify-center rounded-full border border-pratha-bd bg-pratha-bg text-[11px] font-bold text-pratha-fg">
                    {i + 1}
                  </span>
                  <p className="mb-[4px] text-[13.5px] leading-[1.35] font-bold text-ink">
                    {beat.title}
                  </p>
                  <p className="text-[12px] leading-[1.6] text-sub">
                    {beat.description}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-border-light pt-4">
              {source && (
                <p className="flex-1 text-[13.5px] leading-[1.75] text-sub">
                  {source}
                </p>
              )}
              {audioId && (
                <AudioPlayer enId={audioId} label="🎧 Listen" />
              )}
              <button
                type="button"
                onClick={() => dialogRef.current?.showModal()}
                className="rounded-[11px] bg-ink-deep px-[22px] py-3 text-[13px] font-bold whitespace-nowrap text-white"
              >
                Read the full katha ›
              </button>
            </div>
            <dialog
              ref={dialogRef}
              className="w-[min(640px,92vw)] rounded-2xl border-none p-0 backdrop:bg-black/50"
            >
              <div className="flex items-center justify-between gap-3 bg-ink-deep px-[22px] py-4">
                <b className="text-[16px] text-hero-text">Vrat Katha</b>
                <button
                  type="button"
                  onClick={() => dialogRef.current?.close()}
                  className="rounded-lg border border-white/35 px-[13px] py-[6px] text-[13px] text-hero-text"
                >
                  Close
                </button>
              </div>
              <div className="max-h-[64vh] overflow-auto px-[22px] py-[22px] text-[14.5px] leading-[1.8]">
                {source && (
                  <p className="mb-3 font-bold text-ink">{source}</p>
                )}
                {paragraphs(text, "mb-3 last:mb-0")}
              </div>
            </dialog>
          </>
        ) : (
          <>
            {paragraphs(text, "mb-[14px] text-[15px] leading-[1.85] last:mb-0")}
            {audioId && (
              <AudioPlayer
                enId={audioId}
                label="🎧 Listen — the katha, read aloud"
                className="mt-3"
              />
            )}
            {source && (
              <p className="mt-3 text-[11.5px] font-semibold text-sub">
                Source: {source}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
