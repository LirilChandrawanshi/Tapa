"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type MouseEvent } from "react";

const LINKS = [
  { key: "today", href: "/panchang", label: "Today" },
  { key: "vrat", href: "/panchang/vrat-calendar", label: "Vrat Calendar" },
  {
    key: "festival",
    href: "/panchang/festival-calendar",
    label: "Festival Calendar",
  },
  { key: "eclipses", href: "/panchang/eclipses", label: "Eclipses" },
] as const;

export type PanchangSubnavKey = (typeof LINKS)[number]["key"];

/** The sticky TopNav this bar parks beneath. */
const TOP_NAV_H = 72;

/** Survives the remount between one panchang page and the next. */
const SWITCH_KEY = "tapa:panchang-tab-switch";

/**
 * Thin sticky section nav rendered under the hero on every /panchang/* page
 * (G31). Sits below the sticky TopNav (70px mobile / 72px desktop).
 *
 * These read as tabs, so they behave like tabs: switching one keeps you where
 * you were reading instead of throwing you back up to the hero. Next's default
 * scroll-to-top is off, and the only correction is a clamp — if you were
 * scrolled past the nav, the page settles with the nav just under the header so
 * the new content starts at the top of the viewport rather than mid-section.
 */
export function PanchangSubnav({ active }: { active?: PanchangSubnavKey }) {
  const router = useRouter();
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);


  /**
   * The bar's own position in the document. Measured rather than assumed —
   * the hero above it is a different height on every panchang page, so a
   * constant would park the viewport in the wrong place. offsetTop is layout
   * based, so it still reads true while the bar is stuck.
   */
  const restingOffset = () => {
    let top = 0;
    let node = navRef.current as HTMLElement | null;
    while (node) {
      top += node.offsetTop;
      node = node.offsetParent as HTMLElement | null;
    }
    return Math.max(0, top - TOP_NAV_H);
  };

  const onNavigate = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    // let modified clicks (new tab, download…) behave natively
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    e.preventDefault();
    // Each panchang page renders its own copy of this bar, so the click and
    // the clamp happen in two different component instances — a ref would not
    // survive the remount. sessionStorage carries the intent across it.
    try {
      window.sessionStorage.setItem(SWITCH_KEY, "1");
    } catch {
      /* private mode — the navigation still works, only the clamp is skipped */
    }
    router.push(href, { scroll: false });
  };

  /**
   * Park the viewport once the new tab has actually rendered.
   *
   * Scrolling inside the click handler is too early — the router settles the
   * scroll position after the navigation commits and simply undoes it. Worse,
   * leaving it to the router alone means a tall page → short page switch lands
   * wherever the browser clamps to, several screens below the tabs.
   */
  useEffect(() => {
    let pending = false;
    try {
      pending = window.sessionStorage.getItem(SWITCH_KEY) === "1";
      if (pending) window.sessionStorage.removeItem(SWITCH_KEY);
    } catch {
      return;
    }
    if (!pending) return;

    // One frame is not enough. The new page streams in, and as the document
    // grows the browser restores the scroll it remembered from the tall page
    // we just left — undoing a single clamp a few hundred ms later. So hold
    // the clamp until the height stops changing, bounded in time, and give up
    // the moment the reader scrolls for themselves.
    let frame = 0;
    let lastHeight = -1;
    let steadyFrames = 0;
    let aborted = false;
    const startedAt = performance.now();

    const release = () => {
      aborted = true;
    };
    const INPUT = ["wheel", "touchstart", "keydown"] as const;
    INPUT.forEach((t) => window.addEventListener(t, release, { passive: true }));

    const step = () => {
      if (aborted) return;
      const height = document.documentElement.scrollHeight;
      if (height === lastHeight) steadyFrames += 1;
      else {
        steadyFrames = 0;
        lastHeight = height;
      }
      const target = restingOffset();
      if (window.scrollY > target) window.scrollTo({ top: target });
      if (steadyFrames < 4 && performance.now() - startedAt < 1200) {
        frame = requestAnimationFrame(step);
      }
    };
    frame = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(frame);
      INPUT.forEach((t) => window.removeEventListener(t, release));
    };
    // restingOffset reads the DOM; it is intentionally not a dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <nav
      ref={navRef}
      aria-label="Panchang sections"
      className="sticky top-[70px] z-40 border-b border-border bg-card/95 backdrop-blur lg:top-[72px]"
    >
      <div className="mx-auto flex max-w-[1280px] items-center gap-1 overflow-x-auto px-4 md:px-10">
        {LINKS.map((l) => {
          const on = l.key === active;
          return (
            <Link
              key={l.key}
              href={l.href}
              scroll={false}
              onClick={onNavigate(l.href)}
              aria-current={on ? "page" : undefined}
              className={`-mb-px shrink-0 border-b-2 px-3 py-[9px] text-[12px] font-bold whitespace-nowrap transition-colors ${
                on
                  ? "border-cta text-cta"
                  : "border-transparent text-mid hover:border-border hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
