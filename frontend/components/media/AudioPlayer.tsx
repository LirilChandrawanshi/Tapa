"use client";

/**
 * Audio-guide bar (W1-C) — native <audio> behind a compact capsule transport,
 * shaped after the browser's own player: play · time · seek · volume · ⋮.
 * No Howler: the backend serves Range requests, so the built-in element
 * seeks fine on its own.
 *
 * The secondary controls (skip, speed, volume level) live in the ⋮ menu so the
 * bar stays one row wherever it is dropped — it sits on white surfaces in both
 * the article trust strip and the katha card.
 *
 * Language follows the global EN/हिं toggle: initial value from the
 * `tapa-lang` cookie, live switches via the LANG_EVENT CustomEvent that
 * LangToggle dispatches. If the active language has no audio it falls back
 * to the other one; with no audio at all it renders a disabled bar.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { LANG_EVENT, type Lang } from "@/components/LangToggle";
import { mediaUrl } from "@/lib/media";

const SKIP_SECONDS = 15;
const SPEEDS = [1, 1.25, 1.5, 2] as const;

function cookieLang(): Lang | null {
  if (typeof document === "undefined") return null;
  const value = document.cookie
    .split("; ")
    .find((c) => c.startsWith("tapa-lang="))
    ?.split("=")[1];
  return value === "en" || value === "hi" ? value : null;
}

function fmt(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ── icons: monochrome, 16px, inherit colour ── */

function Play() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-[15px] w-[15px]">
      <path d="M8 5.5v13a.5.5 0 0 0 .77.42l10-6.5a.5.5 0 0 0 0-.84l-10-6.5A.5.5 0 0 0 8 5.5Z" />
    </svg>
  );
}

function Pause() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-[15px] w-[15px]">
      <rect x="7" y="5" width="3.4" height="14" rx="1" />
      <rect x="13.6" y="5" width="3.4" height="14" rx="1" />
    </svg>
  );
}

function VolumeOn() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-[16px] w-[16px]">
      <path d="M4 9.5h3L11.3 6a.6.6 0 0 1 1 .47v11.06a.6.6 0 0 1-1 .47L7 14.5H4a.5.5 0 0 1-.5-.5v-4a.5.5 0 0 1 .5-.5Z" />
      <path
        d="M15.8 9a4 4 0 0 1 0 6m2.4-8.6a7.2 7.2 0 0 1 0 11.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function VolumeOff() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-[16px] w-[16px]">
      <path d="M4 9.5h3L11.3 6a.6.6 0 0 1 1 .47v11.06a.6.6 0 0 1-1 .47L7 14.5H4a.5.5 0 0 1-.5-.5v-4a.5.5 0 0 1 .5-.5Z" />
      <path
        d="m16 9.5 4.5 5m0-5-4.5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Kebab() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-[16px] w-[16px]">
      <circle cx="12" cy="5.5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="18.5" r="1.6" />
    </svg>
  );
}

export function AudioPlayer({
  enId,
  hiId,
  lang: initialLang,
  label = "Audio guide",
  className = "",
}: {
  enId?: string | null;
  hiId?: string | null;
  lang?: Lang;
  label?: string;
  className?: string;
}) {
  const [lang, setLang] = useState<Lang>(initialLang ?? "en");
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState<number>(1);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [menuOpen, setMenuOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // hydrate from the cookie, then follow the global toggle live
  useEffect(() => {
    if (!initialLang) {
      const stored = cookieLang();
      if (stored) setLang(stored);
    }
    const onLang = (e: Event) => {
      const detail = (e as CustomEvent<{ lang: Lang }>).detail;
      if (detail?.lang) setLang(detail.lang);
    };
    window.addEventListener(LANG_EVENT, onLang);
    return () => window.removeEventListener(LANG_EVENT, onLang);
  }, [initialLang]);

  // ⋮ menu closes on outside click or Esc
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const activeId = lang === "hi" ? (hiId ?? enId) : (enId ?? hiId);
  const fallbackLang: Lang | null =
    lang === "hi" && !hiId && enId ? "en" : lang === "en" && !enId && hiId ? "hi" : null;

  /** Pull duration off the element — metadata may already be loaded. */
  const syncDuration = useCallback(() => {
    const el = audioRef.current;
    setDuration(el && Number.isFinite(el.duration) ? el.duration : 0);
  }, []);

  // Pause + rewind when the source switches languages.
  // This also runs on mount, so it must NOT blindly zero the duration:
  // on a fast/cached response `loadedmetadata` has often already fired,
  // and clobbering it here is what left the bar reading "0:14 / 0:00".
  useEffect(() => {
    setPlaying(false);
    setCurrent(0);
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
    syncDuration();
  }, [activeId, syncDuration]);

  // keep element-level settings in step with the UI
  useEffect(() => {
    const el = audioRef.current;
    if (el) el.playbackRate = speed;
  }, [speed, activeId]);

  useEffect(() => {
    const el = audioRef.current;
    if (el) {
      el.muted = muted;
      el.volume = volume;
    }
  }, [muted, volume, activeId]);

  const disabled = !activeId;
  const seekMax = duration > 0 ? duration : 0;
  const pct = duration > 0 ? (current / duration) * 100 : 0;

  function toggle() {
    const el = audioRef.current;
    if (!el || disabled) return;
    if (el.paused) void el.play();
    else el.pause();
  }

  function seek(value: number) {
    const el = audioRef.current;
    if (!el || !Number.isFinite(el.duration)) return;
    el.currentTime = value;
    setCurrent(value);
  }

  function nudge(delta: number) {
    const el = audioRef.current;
    if (!el || !Number.isFinite(el.duration)) return;
    seek(Math.min(Math.max(el.currentTime + delta, 0), el.duration));
  }

  const capsuleBtn =
    "flex size-[30px] shrink-0 items-center justify-center rounded-full text-mid transition-colors hover:bg-ink/[0.07] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cta/35 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

  const menuRow =
    "flex w-full items-center justify-between gap-3 rounded-[7px] px-2 py-[7px] text-[12.5px] text-body transition-colors hover:bg-bg disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className={className}>
      {activeId && (
        <audio
          ref={audioRef}
          src={mediaUrl(activeId)}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
          onLoadedMetadata={syncDuration}
          onDurationChange={syncDuration}
          onCanPlay={syncDuration}
        />
      )}

      {/* caption — keeps the label and the bilingual signal outside the capsule */}
      <p className="mb-[5px] truncate text-[11px] font-bold text-sub">
        {label}
        {disabled
          ? " — coming soon"
          : fallbackLang
            ? ` · ${fallbackLang === "en" ? "EN" : "हिं"} only`
            : ` · ${lang === "en" ? "EN" : "हिं"}`}
      </p>

      <div
        className={`flex items-center gap-2 rounded-full border border-border bg-bg py-[7px] pr-[9px] pl-[10px] ${
          disabled ? "opacity-55" : ""
        }`}
      >
        <button
          type="button"
          onClick={toggle}
          disabled={disabled}
          aria-label={playing ? "Pause audio guide" : "Play audio guide"}
          className={`${capsuleBtn} text-ink`}
        >
          {playing ? <Pause /> : <Play />}
        </button>

        <span className="shrink-0 font-mono text-[11.5px] tabular-nums text-mid">
          {fmt(current)} / {fmt(duration)}
        </span>

        {/* seek — thumb stays hidden until hover/focus, like the native bar */}
        <input
          type="range"
          min={0}
          max={seekMax || 1}
          step={0.1}
          value={Math.min(current, seekMax)}
          onChange={(e) => seek(Number(e.target.value))}
          disabled={disabled || seekMax === 0}
          aria-label="Seek audio guide"
          aria-valuetext={`${fmt(current)} of ${fmt(duration)}`}
          // appearance-none kills accent-color, so the thumb is styled by hand —
          // otherwise it falls back to the browser's default blue.
          className="group h-[4px] min-w-0 flex-1 cursor-pointer appearance-none rounded-full disabled:cursor-not-allowed [&::-moz-range-thumb]:size-[11px] [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-cta [&::-webkit-slider-thumb]:size-[11px] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cta [&::-webkit-slider-thumb]:opacity-0 [&::-webkit-slider-thumb]:transition-opacity hover:[&::-webkit-slider-thumb]:opacity-100 focus-visible:[&::-webkit-slider-thumb]:opacity-100"
          style={{
            background: `linear-gradient(to right, var(--color-cta) ${pct}%, var(--color-border) ${pct}%)`,
          }}
        />

        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          disabled={disabled}
          aria-label={muted || volume === 0 ? "Unmute" : "Mute"}
          title={muted || volume === 0 ? "Unmute" : "Mute"}
          className={capsuleBtn}
        >
          {muted || volume === 0 ? <VolumeOff /> : <VolumeOn />}
        </button>

        {/* ⋮ — skip, speed and volume level live here so the bar stays one row */}
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            disabled={disabled}
            aria-label="More audio options"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className={capsuleBtn}
          >
            <Kebab />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 bottom-full z-30 mb-2 w-[204px] rounded-[12px] border border-border bg-card p-1.5 shadow-[0_12px_30px_-12px_rgba(28,23,18,0.35)]"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => nudge(-SKIP_SECONDS)}
                className={menuRow}
              >
                Back {SKIP_SECONDS}s<span aria-hidden className="text-sub">↺</span>
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => nudge(SKIP_SECONDS)}
                className={menuRow}
              >
                Forward {SKIP_SECONDS}s<span aria-hidden className="text-sub">↻</span>
              </button>

              <div className="my-1 border-t border-border-light" />

              <p className="px-2 pt-1 pb-[5px] text-[10px] font-bold tracking-[0.6px] text-sub uppercase">
                Speed
              </p>
              <div className="flex gap-1 px-1 pb-1">
                {SPEEDS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="menuitemradio"
                    aria-checked={speed === s}
                    onClick={() => setSpeed(s)}
                    className={`flex-1 rounded-[7px] border py-[5px] font-mono text-[11px] font-bold transition-colors ${
                      speed === s
                        ? "border-cta bg-cta text-white"
                        : "border-border bg-card text-mid hover:border-gold"
                    }`}
                  >
                    {s}×
                  </button>
                ))}
              </div>

              <div className="my-1 border-t border-border-light" />

              <p className="px-2 pt-1 pb-[5px] text-[10px] font-bold tracking-[0.6px] text-sub uppercase">
                Volume
              </p>
              <div className="px-2 pb-2">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setVolume(v);
                    setMuted(v === 0);
                  }}
                  aria-label="Volume"
                  className="h-[4px] w-full cursor-pointer accent-[#fd066d]"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AudioPlayer;
