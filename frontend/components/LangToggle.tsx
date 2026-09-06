"use client";

import { useEffect, useState } from "react";

export type Lang = "en" | "hi";

const COOKIE_NAME = "tapa-lang";
export const LANG_EVENT = "tapa:lang-change";

function readCookie(): Lang | null {
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${COOKIE_NAME}=`));
  const value = match?.split("=")[1];
  return value === "en" || value === "hi" ? value : null;
}

/**
 * EN / हिं segmented control. Persists the choice in a `tapa-lang` cookie
 * and emits a `tapa:lang-change` CustomEvent. No i18n plumbing yet —
 * this is the single source of truth for the choice.
 */
export function LangToggle({ className = "" }: { className?: string }) {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const stored = readCookie();
    if (stored) setLang(stored);
  }, []);

  function choose(next: Lang) {
    setLang(next);
    document.cookie = `${COOKIE_NAME}=${next}; path=/; max-age=31536000; samesite=lax`;
    window.dispatchEvent(
      new CustomEvent<{ lang: Lang }>(LANG_EVENT, { detail: { lang: next } }),
    );
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className={`flex gap-[2px] rounded-lg bg-bg p-[3px] ${className}`}
    >
      {(
        [
          { value: "en", label: "EN" },
          { value: "hi", label: "हिं" },
        ] as const
      ).map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={lang === option.value}
          onClick={() => choose(option.value)}
          className={`rounded-md px-[11px] py-[6px] text-xs font-bold ${
            lang === option.value
              ? "bg-cta text-white"
              : "bg-transparent text-cta"
          } ${option.value === "hi" ? "font-devanagari" : ""}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
