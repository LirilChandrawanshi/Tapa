"use client";

/**
 * Audio-guide bar (W1-C) — native <audio> behind a dark play/pause +
 * progress + duration bar. No Howler: the backend serves Range requests,
 * so the built-in element seeks fine on its own.
 *
 * Language follows the global EN/हिं toggle: initial value from the
 * `tapa-lang` cookie, live switches via the LANG_EVENT CustomEvent that
 * LangToggle dispatches. If the active language has no audio it falls back
 * to the other one; with no audio at all it renders a disabled bar.
 *
 * Exported for Wave-2's ArticleView adoption.
 */

import { useEffect, useRef, useState } from "react";
import { LANG_EVENT, type Lang } from "@/components/LangToggle";
import { mediaUrl } from "@/lib/media";

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
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const activeId = lang === "hi" ? (hiId ?? enId) : (enId ?? hiId);
  const fallbackLang: Lang | null =
    lang === "hi" && !hiId && enId ? "en" : lang === "en" && !enId && hiId ? "hi" : null;

  // pause + rewind when the source switches languages
  useEffect(() => {
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
  }, [activeId]);

  const disabled = !activeId;

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

  return (
    <div
      className={`flex items-center gap-3 rounded-xl bg-ink px-4 py-3 text-hero-text ${
        disabled ? "opacity-60" : ""
      } ${className}`}
    >
      {activeId && (
        <audio
          ref={audioRef}
          src={mediaUrl(activeId)}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onDurationChange={(e) => setDuration(e.currentTarget.duration)}
        />
      )}
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        aria-label={playing ? "Pause audio guide" : "Play audio guide"}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm ${
          disabled ? "cursor-not-allowed bg-white/20" : "bg-cta text-white"
        }`}
      >
        {playing ? (
          <span aria-hidden className="text-[11px] font-bold tracking-tighter">
            ❚❚
          </span>
        ) : (
          <span aria-hidden className="ml-0.5 text-[13px]">
            ▶
          </span>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-baseline justify-between gap-2 text-[11px]">
          <span className="truncate font-bold">
            {label}
            {disabled
              ? " — coming soon"
              : fallbackLang
                ? ` (${fallbackLang === "en" ? "EN" : "हिं"} only)`
                : ` (${lang === "en" ? "EN" : "हिं"})`}
          </span>
          <span className="shrink-0 font-mono text-white/70">
            {fmt(current)} / {fmt(duration)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={Number.isFinite(duration) && duration > 0 ? duration : 0}
          step={0.1}
          value={Math.min(current, duration || 0)}
          onChange={(e) => seek(Number(e.target.value))}
          disabled={disabled}
          aria-label="Seek audio guide"
          className="h-1 w-full cursor-pointer accent-[#fd066d] disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}

export default AudioPlayer;
