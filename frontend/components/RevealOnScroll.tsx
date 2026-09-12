"use client";

import { useEffect } from "react";

/**
 * Sitewide scroll reveal.
 *
 * Mounted once in the root layout. It finds text blocks inside .page-flow,
 * marks the ones below the fold, and fades each in as it scrolls into view.
 *
 * Why an observer rather than `animation-timeline: view()`, which would
 * have cost no JavaScript at all:
 *
 *   - Scroll-driven CSS animations exist only in Chromium. Safari and
 *     Firefox would have seen nothing move.
 *   - They are scrubbed against scroll position, so scrolling back up
 *     faded content out again. A reveal should happen once and stay.
 *
 * Failure direction is fixed by design: the CSS only hides an element that
 * this script has marked, so if the bundle never loads, hydration fails, or
 * a crawler reads the page, everything is visible.
 */

/** Text blocks. Containers are handled via the explicit .reveal class. */
const TEXT_SELECTOR =
  "h1,h2,h3,h4,h5,h6,p,li,dt,dd,blockquote,figcaption,summary,.reveal";

/**
 * Ancestors whose text must never move: sticky and fixed chrome that stays
 * parked on screen, interactive controls, and live regions.
 */
const EXCLUDED_ANCESTORS = [
  "nav",
  "header",
  "footer",
  "button",
  "label",
  '[role="dialog"]',
  '[role="tablist"]',
  '[role="status"]',
  ".sticky",
  ".fixed",
  ".no-anim",
].join(",");

export function RevealOnScroll() {
  useEffect(() => {
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const scope = document.querySelector<HTMLElement>(".page-flow");
    if (!scope) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let batch = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const el = entry.target as HTMLElement;
          // Cap the cascade so a long run never feels like a queue.
          el.style.setProperty("--reveal-delay", `${Math.min(batch, 5) * 45}ms`);
          el.dataset.reveal = "shown";
          observer.unobserve(el);
          batch++;
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.01 },
    );

    function collect() {
      if (!scope) return;
      // Anything already on screen stays put. Fading in the first viewport
      // would delay Largest Contentful Paint and flash on every navigation.
      const fold = window.innerHeight * 0.92;

      for (const el of scope.querySelectorAll<HTMLElement>(TEXT_SELECTOR)) {
        if (el.dataset.reveal) continue;
        if (el.closest(EXCLUDED_ANCESTORS)) continue;
        // Already animated on load by the hero stagger.
        if (el.matches('[class*="anim-rise"]')) continue;
        // Inside a block that reveals as a unit — let the block move, not
        // its individual lines.
        const block = el.closest(".reveal");
        if (block && block !== el) continue;

        if (el.getBoundingClientRect().top < fold) {
          el.dataset.reveal = "shown";
          continue;
        }
        el.dataset.reveal = "pending";
        observer.observe(el);
      }
    }

    collect();

    // Client-rendered content — tabs, filters, streamed Suspense boundaries —
    // arrives after the first pass, so pick it up on the next frame.
    let queued = 0;
    const mutations = new MutationObserver(() => {
      if (queued) return;
      queued = window.requestAnimationFrame(() => {
        queued = 0;
        collect();
      });
    });
    mutations.observe(scope, { childList: true, subtree: true });

    return () => {
      if (queued) window.cancelAnimationFrame(queued);
      mutations.disconnect();
      observer.disconnect();
    };
  }, []);

  return null;
}
