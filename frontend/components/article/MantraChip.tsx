"use client";

import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { mediaUrl } from "@/lib/media";
import type { Mantra } from "@/lib/types";

interface JapaState {
  count: number;
  target: number;
}

/**
 * Dark mantra card — Devanagari in amber, transliteration, meaning, and a
 * japa counter with preset rounds (11/21/51/108). Progress persists in
 * sessionStorage keyed by slug + mantra so a reload keeps the count.
 */
export function MantraChip({ slug, mantra }: { slug: string; mantra: Mantra }) {
  const storageKey = `tapa-japa-${slug}-${mantra.devanagari}`;
  const presets = mantra.presets.length > 0 ? mantra.presets : [11, 21, 51, 108];
  const [state, setState] = useState<JapaState>({
    count: 0,
    target: mantra.defaultCount || presets[presets.length - 1],
  });
  const [listening, setListening] = useState(false);
  const chantStarted = useRef(false);
  const mantraAudioId = mantra.audioEnMediaId ?? mantra.audioHiMediaId;

  function markChantStarted(via: string) {
    if (chantStarted.current) return;
    chantStarted.current = true;
    track("mantra_chant_started", { slug, via });
  }

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      const saved: unknown = JSON.parse(raw);
      if (
        typeof saved === "object" &&
        saved !== null &&
        typeof (saved as JapaState).count === "number" &&
        typeof (saved as JapaState).target === "number"
      ) {
        setState(saved as JapaState);
      }
    } catch {
      /* corrupt storage — start at zero */
    }
  }, [storageKey]);

  function update(next: JapaState) {
    setState(next);
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* private mode — count lives in memory only */
    }
  }

  const dec = () => {
    const next = { ...state, count: Math.max(0, state.count - 1) };
    update(next);
    track("mantra_count_updated", { slug, count: next.count, target: next.target });
  };
  const inc = () => {
    markChantStarted("counter");
    const next = { ...state, count: Math.min(state.target, state.count + 1) };
    update(next);
    track("mantra_count_updated", { slug, count: next.count, target: next.target });
  };
  const pick = (target: number) =>
    update({ target, count: Math.min(state.count, target) });

  const ctlBtn =
    "flex size-[38px] items-center justify-center rounded-[11px] border-[1.5px] border-white/20 bg-white/5 text-[17px] text-white hover:border-amber";

  return (
    <div className="my-2 rounded-[13px] bg-ink-deep px-[18px] py-4">
      <p className="mb-[7px] text-[11px] font-bold tracking-[0.5px] text-eyebrow-dark uppercase">
        The mantra
      </p>
      <p className="font-devanagari mb-1 text-xl leading-relaxed text-amber">
        {mantra.devanagari}
      </p>
      <p className="text-xs text-[#C4A882]">
        {mantra.transliteration}
        {mantra.meaning ? ` — "${mantra.meaning}"` : ""}
      </p>

      {mantraAudioId && (
        <div className="mt-3">
          {listening ? (
            // eslint-disable-next-line jsx-a11y/media-has-caption
            <audio
              src={mediaUrl(mantraAudioId)}
              controls
              autoPlay
              preload="metadata"
              className="h-9 w-full"
              onPlay={() => markChantStarted("audio")}
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                markChantStarted("audio");
                setListening(true);
              }}
              className="rounded-[9px] border-[1.5px] border-white/20 bg-white/5 px-[13px] py-[7px] text-[12.5px] font-semibold text-amber hover:border-amber"
            >
              ▶ Listen &amp; chant
            </button>
          )}
        </div>
      )}

      <div className="mt-[14px] flex flex-wrap items-center gap-3 border-t border-white/10 pt-[14px]">
        <div>
          <p className="text-[9.5px] font-bold tracking-[0.5px] text-eyebrow-dark">
            JAPA COUNT
          </p>
          <p className="mt-1 text-[11px] text-[#A99070]">
            Tap as you complete each round
          </p>
        </div>
        <div className="ml-auto flex items-center gap-[11px]">
          <button type="button" aria-label="Decrease count" className={ctlBtn} onClick={dec}>
            −
          </button>
          <div className="min-w-[58px] text-center">
            <p className="text-2xl leading-none font-bold text-white">
              {state.count}
            </p>
            <p className="mt-[3px] text-[11px] text-[#A99070]">
              of {state.target}
            </p>
          </div>
          <button type="button" aria-label="Increase count" className={ctlBtn} onClick={inc}>
            +
          </button>
        </div>
        <div className="mt-[7px] flex w-full gap-[7px]">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => pick(preset)}
              className={`flex-1 rounded-[9px] border-[1.5px] p-2 text-[12.5px] font-semibold ${
                state.target === preset
                  ? "border-amber bg-amber text-ink"
                  : "border-white/20 bg-white/5 text-[#C4A882] hover:border-amber"
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
