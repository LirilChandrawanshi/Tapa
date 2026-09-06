"use client";

import { useEffect, useState } from "react";
import { LANG_EVENT, type Lang } from "@/components/LangToggle";

function readLangCookie(): Lang {
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith("tapa-lang="));
  return match?.split("=")[1] === "hi" ? "hi" : "en";
}

/**
 * Swaps a piece of article copy between EN and HI on the LangToggle's
 * `tapa:lang-change` event. Renders EN on the server (and whenever the
 * Hindi variant is missing/empty) so hydration stays deterministic.
 */
export function LangSwap({
  en,
  hi,
  html = false,
  className,
}: {
  en: string;
  hi?: string;
  /** Treat the strings as trusted CMS HTML (intro blocks). */
  html?: boolean;
  className?: string;
}) {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    setLang(readLangCookie());
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<{ lang: Lang }>).detail;
      if (detail?.lang) setLang(detail.lang);
    };
    window.addEventListener(LANG_EVENT, onChange);
    return () => window.removeEventListener(LANG_EVENT, onChange);
  }, []);

  const text = lang === "hi" && hi && hi.trim() !== "" ? hi : en;
  const isHindi = text !== en;
  const cls =
    `${className ?? ""} ${isHindi ? "font-devanagari" : ""}`.trim() ||
    undefined;

  if (html) {
    return (
      <span className={cls} dangerouslySetInnerHTML={{ __html: text }} />
    );
  }
  return <span className={cls}>{text}</span>;
}
