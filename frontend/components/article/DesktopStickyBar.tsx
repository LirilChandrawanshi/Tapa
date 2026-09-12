"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Desktop sticky reveal bar — hidden until the reader scrolls past the
 * dates/parana strip (watched via IntersectionObserver on a sentinel div
 * rendered just after it), then slides up. Mirrors the mobile-only bottom
 * bar that's always visible; this one only ever shows on lg+ viewports.
 */
export function DesktopStickyBar({
  title,
  subtitle,
  pdfHref,
  circleHref,
}: {
  title: string;
  subtitle?: string;
  pdfHref: string;
  circleHref: string;
}) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      ([entry]) => setRevealed(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} aria-hidden />
      <div
        className={`fixed inset-x-0 bottom-0 z-[80] hidden border-t border-border bg-white/95 shadow-[0_-2px_18px_rgba(28,23,18,0.10)] backdrop-blur-[10px] transition-transform duration-200 lg:flex ${
          revealed ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto flex w-full max-w-[1280px] items-center gap-[14px] px-10 py-[11px]">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] leading-[1.3] font-bold text-ink">
              {title}
            </p>
            {subtitle && (
              <p className="mt-[1px] truncate text-[12px] text-sub">{subtitle}</p>
            )}
          </div>
          {/* This bar is now the only ritual-card download on desktop — the
              sidebar card was dropped to give that column its height back —
              so it carries the full dark/gold artifact treatment. */}
          <div className="ml-auto flex shrink-0 items-center gap-[9px]">
            <a
              href={pdfHref}
              className="group flex items-center gap-[11px] rounded-[12px] border border-[rgba(227,181,103,0.28)] bg-ink-deep py-[9px] pr-[18px] pl-[13px] transition-colors hover:border-[rgba(227,181,103,0.5)]"
            >
              <span
                aria-hidden
                className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] border border-[rgba(227,181,103,0.3)] bg-[rgba(227,181,103,0.08)] text-[15px] leading-none text-eyebrow-dark transition-transform group-hover:translate-y-[2px]"
              >
                ↓
              </span>
              <span className="text-left">
                <span className="block text-[9.5px] font-bold tracking-[0.7px] text-eyebrow-dark uppercase">
                  Ritual card · PDF
                </span>
                <span className="block text-[14px] leading-[1.3] font-bold whitespace-nowrap text-hero-text">
                  Download the ritual card
                </span>
              </span>
            </a>
            <a
              href={circleHref}
              className="rounded-[12px] bg-wa px-5 py-3 text-[14px] font-bold whitespace-nowrap text-white transition-colors hover:brightness-110"
            >
              Join the Tapa Circle
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
