"use client";

import { useEffect, useState, type ReactNode } from "react";
import { LANG_EVENT, type Lang } from "@/components/LangToggle";

function cookieLang(): Lang {
  if (typeof document === "undefined") return "en";
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith("tapa-lang="));
  return match?.split("=")[1] === "hi" ? "hi" : "en";
}

/**
 * Shows its children only while the site language matches `lang`.
 * Both language variants of the article body are server-rendered (ISR-safe);
 * this wrapper flips visibility on the client. SSR default: English visible,
 * Hindi hidden — the cookie takes over on hydration.
 */
export function LangSection({
  lang,
  children,
}: {
  lang: Lang;
  children: ReactNode;
}) {
  const [active, setActive] = useState<Lang>("en");

  useEffect(() => {
    setActive(cookieLang());
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<{ lang: Lang }>).detail;
      if (detail?.lang) setActive(detail.lang);
    };
    window.addEventListener(LANG_EVENT, onChange);
    return () => window.removeEventListener(LANG_EVENT, onChange);
  }, []);

  return <div hidden={active !== lang}>{children}</div>;
}
