"use client";

import { useEffect, useRef, useState } from "react";
import { AudioPlayer } from "@/components/media/AudioPlayer";
import type { KathaBeat } from "@/lib/types";

/** Splits on blank lines, same convention as the article body's Prose renderer. */
function splitParagraphs(text: string) {
  return text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="size-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

/**
 * Vrat katha card — a story panel, never plain prose (PRD §5.3). When the
 * content carries structured `beats`, they render as a numbered story spine
 * above a "Read the full katha" button that opens the full text in a native
 * `<dialog>`. Without beats, the full text renders inline as before.
 *
 * The dialog is a full-viewport transparent layer rather than a sized
 * `<dialog>` box: Tailwind's preflight zeroes the UA's `margin: auto`, so a
 * plain modal dialog pins itself to the top-left corner. Laying the panel out
 * with flex inside the layer centres it on desktop, lets it sit as a bottom
 * sheet on phones, and gives the scrim a real click target for dismissal.
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
  const [open, setOpen] = useState(false);
  const hasBeats = !!beats?.length;
  const paras = splitParagraphs(text);

  // Drive the native dialog from state so Esc, the close button and the scrim
  // all settle on one source of truth.
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  // showModal() blocks interaction but not scrolling behind the sheet.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="overflow-hidden rounded-[16px] border border-border bg-card">
      {/* Header — the katha announces itself before the first beat. */}
      <div className="flex items-start gap-3 border-b border-pratha-bd bg-gradient-to-r from-pratha-bg to-card px-5 py-[14px]">
        <span
          aria-hidden
          className="mt-[1px] flex size-8 shrink-0 items-center justify-center rounded-full border border-pratha-bd bg-card font-devanagari text-[13px] leading-none text-pratha-fg"
        >
          क
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.8px] text-pratha-fg uppercase">
            Vrat Katha — the sacred story
          </p>
          {source && (
            <p className="mt-[2px] truncate text-[12px] text-sub">{source}</p>
          )}
        </div>
      </div>

      <div className="px-5 py-[18px]">
        {hasBeats ? (
          <>
            {/* One beat has no column to pair with — a half-width lone card
                just reads as a layout bug, so it spans instead. */}
            <ol
              className={`grid gap-[11px] ${beats!.length > 1 ? "sm:grid-cols-2" : ""}`}
            >
              {beats!.map((beat, i) => (
                <li
                  key={i}
                  className="hover-lift rounded-[13px] border border-border-light bg-bg p-[15px]"
                >
                  <span
                    aria-hidden
                    className="mb-[9px] flex size-6 items-center justify-center rounded-full border border-pratha-bd bg-pratha-bg text-[11px] font-bold text-pratha-fg"
                  >
                    {i + 1}
                  </span>
                  <p className="mb-[4px] text-[13.5px] leading-[1.35] font-bold text-ink">
                    {beat.title}
                  </p>
                  <p className="text-[12px] leading-[1.6] text-sub">
                    {beat.description}
                  </p>
                </li>
              ))}
            </ol>

            <div className="mt-[18px] flex flex-wrap items-center justify-end gap-3 border-t border-border-light pt-4">
              <p className="mr-auto text-[12px] text-sub">
                {paras.length} passage{paras.length === 1 ? "" : "s"} · the katha
                in full
              </p>
              {audioId && <AudioPlayer enId={audioId} label="🎧 Listen" />}
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="rounded-[11px] bg-ink-deep px-[22px] py-3 text-[13px] font-bold whitespace-nowrap text-hero-text transition-colors hover:bg-ink"
              >
                Read the full katha ›
              </button>
            </div>

            <dialog
              ref={dialogRef}
              onClose={() => setOpen(false)}
              aria-labelledby="katha-dialog-title"
              className="katha-dialog fixed inset-0 m-0 size-full max-h-none max-w-none overflow-hidden bg-transparent p-0 backdrop:bg-ink-deep/60 backdrop:backdrop-blur-[3px]"
            >
              {/* The scrim itself: clicking the empty space dismisses. */}
              <div
                onClick={(e) => {
                  if (e.target === e.currentTarget) setOpen(false);
                }}
                className="flex size-full items-end justify-center sm:items-center sm:p-6"
              >
                <div className="katha-panel flex max-h-[90svh] w-full max-w-[720px] flex-col overflow-hidden rounded-t-[22px] bg-card shadow-[0_24px_60px_rgba(26,18,8,0.45)] sm:max-h-[84svh] sm:rounded-[20px]">
                  <div className="relative shrink-0 bg-ink-deep px-5 pt-4 pb-[15px] sm:px-[26px]">
                    {/* Sheet grab handle — phones only, where the panel is a sheet. */}
                    <span
                      aria-hidden
                      className="absolute top-[7px] left-1/2 h-[3px] w-9 -translate-x-1/2 rounded-full bg-white/25 sm:hidden"
                    />
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-devanagari text-[11px] tracking-[1px] text-eyebrow-dark">
                          व्रत कथा
                        </p>
                        <b
                          id="katha-dialog-title"
                          className="block text-[17px] leading-[1.3] text-hero-text"
                        >
                          Vrat Katha
                        </b>
                        {source && (
                          <p className="mt-[3px] line-clamp-2 text-[12.5px] leading-[1.45] text-white/60">
                            {source}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setOpen(false)}
                        aria-label="Close the katha"
                        className="flex size-9 shrink-0 items-center justify-center rounded-full border border-white/25 text-hero-text transition-colors hover:bg-white/10"
                      >
                        <CloseIcon />
                      </button>
                    </div>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-6 sm:px-[26px] sm:py-7">
                    <div className="mx-auto max-w-[60ch]">
                      {paras.map((para, i) => (
                        <p
                          key={i}
                          className={`text-[15.5px] leading-[1.85] text-body ${
                            i === 0
                              ? "first-letter:float-left first-letter:mt-[6px] first-letter:mr-[9px] first-letter:font-devanagari first-letter:text-[46px] first-letter:leading-[0.8] first-letter:font-bold first-letter:text-pratha-fg"
                              : "mt-[15px]"
                          }`}
                        >
                          {para}
                        </p>
                      ))}
                    </div>
                  </div>

                  {audioId && (
                    <div className="shrink-0 border-t border-border bg-bg px-5 py-3 sm:px-[26px]">
                      <AudioPlayer
                        enId={audioId}
                        label="🎧 Listen — the katha, read aloud"
                      />
                    </div>
                  )}
                </div>
              </div>
            </dialog>
          </>
        ) : (
          <>
            {paras.map((para, i) => (
              <p
                key={i}
                className={`text-[15px] leading-[1.85] ${i === 0 ? "" : "mt-[14px]"}`}
              >
                {para}
              </p>
            ))}
            {audioId && (
              <AudioPlayer
                enId={audioId}
                label="🎧 Listen — the katha, read aloud"
                className="mt-3"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
