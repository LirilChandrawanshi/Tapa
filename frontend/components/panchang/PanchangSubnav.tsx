"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type MouseEvent } from "react";

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

/** Marks the zero-height flow element that reports the bar's resting position. */
const MARK_ATTR = "data-panchang-subnav-mark";

/**
 * Where the viewport should settle: the bar's resting position, less the header
 * it parks beneath.
 *
 * Read from a zero-height marker rather than the bar itself. The bar is
 * `position: sticky`, and once stuck its own offsets report where it is painted
 * rather than where it belongs, so it cannot measure itself. Queried from the
 * document, not a ref, because the element is replaced on every tab switch.
 */
function restingOffset(): number {
  const mark = document.querySelector(`[${MARK_ATTR}]`);
  if (!mark) return 0;
  return Math.max(0, mark.getBoundingClientRect().top + window.scrollY - TOP_NAV_H);
}

let clampFrame: number | null = null;

/**
 * Hold the viewport at the tab strip until the incoming page stops growing.
 *
 * One scroll is not enough: the new page streams in, and as the document grows
 * the browser restores the scroll it remembered from the page we just left,
 * undoing a single correction a few hundred milliseconds later. This lives
 * outside the component on purpose — each panchang page renders its own copy of
 * the bar, so the component remounts mid-navigation and an effect-scoped loop
 * gets cancelled by its own cleanup before a single frame runs.
 */
function holdAtTabs() {
  if (clampFrame !== null) cancelAnimationFrame(clampFrame);

  let lastTarget = -1;
  let steadyFrames = 0;
  let aborted = false;
  const startedAt = performance.now();

  const release = () => {
    aborted = true;
  };
  const INPUT = ["wheel", "touchstart", "keydown"] as const;
  INPUT.forEach((t) => window.addEventListener(t, release, { passive: true }));

  const finish = () => {
    INPUT.forEach((t) => window.removeEventListener(t, release));
    clampFrame = null;
  };

  const step = () => {
    if (aborted) return finish();

    // Settle exactly at the strip rather than only clamping downward: the
    // first frames run before the incoming page has laid out, so an early
    // measurement is the outgoing page's, and every hero is a different
    // height. Re-reading and re-applying each frame converges on the right one.
    const target = restingOffset();
    window.scrollTo({ top: target });

    // Stability is judged on the target itself, not the document height — the
    // height can sit still for a few frames mid-stream while the strip has not
    // moved into place yet. A floor on elapsed time outlasts that pause.
    if (target === lastTarget) steadyFrames += 1;
    else {
      steadyFrames = 0;
      lastTarget = target;
    }
    const elapsed = performance.now() - startedAt;
    const settled = steadyFrames >= 5 && elapsed > 400;
    if (!settled && elapsed < 1500) {
      clampFrame = requestAnimationFrame(step);
    } else {
      finish();
    }
  };
  clampFrame = requestAnimationFrame(step);
}

/**
 * Thin sticky section nav rendered under the hero on every /panchang/* page
 * (G31). Sits below the sticky TopNav (70px mobile / 72px desktop).
 *
 * These read as tabs, so they behave like tabs: switching one lands you at the
 * strip with the new section starting below it, rather than throwing you back
 * up to the hero. Someone still reading above the strip is left where they are.
 */
export function PanchangSubnav({ active }: { active?: PanchangSubnavKey }) {
  const router = useRouter();
  const pathname = usePathname();

  const onNavigate = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    // let modified clicks (new tab, download…) behave natively
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    e.preventDefault();
    // Decide here, on the page being left, whether the reader was below the
    // strip — that is the only moment the question can be answered. Someone
    // still looking at the hero is left exactly where they are.
    if (window.scrollY > restingOffset()) {
      // The click and the correction happen in two different instances of this
      // component, so the intent has to outlive the remount between them.
      try {
        window.sessionStorage.setItem(SWITCH_KEY, "1");
      } catch {
        /* private mode — navigation works, only the correction is skipped */
      }
    }
    router.push(href, { scroll: false });
  };

  useEffect(() => {
    let pending = false;
    try {
      pending = window.sessionStorage.getItem(SWITCH_KEY) === "1";
      if (pending) window.sessionStorage.removeItem(SWITCH_KEY);
    } catch {
      return;
    }
    if (pending) holdAtTabs();
  }, [pathname]);

  return (
    <>
      <div {...{ [MARK_ATTR]: "" }} aria-hidden className="h-0" />
      <nav
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
    </>
  );
}
