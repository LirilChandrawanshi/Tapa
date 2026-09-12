"use client";

/**
 * Thin analytics fan-out — the PRD requires Mixpanel + GA4 from Phase 1 launch.
 * Everything calls track(); providers are bound lazily when their globals exist
 * (scripts are added in production via env-configured IDs; absent locally).
 */

type EventName =
  | "article_viewed"
  | "article_saved"
  | "article_shared"
  | "mode_selected"
  | "mantra_chant_started"
  | "mantra_count_updated"
  | "samagri_item_checked"
  | "samagri_downloaded"
  | "samagri_whatsapp_shared"
  | "intelligence_layer_opened"
  | "panchang_city_changed"
  | "panchang_jump_chip"
  | "panchang_shared"
  | "panchang_filter_changed"
  | "panchang_month_selected"
  | "panchang_calendar_downloaded"
  | "search_query"
  | "search_result_clicked"
  | "search_zero_result"
  | "wa_nudge_impressed"
  | "wa_nudge_clicked"
  | "wa_nudge_suppressed"
  | "login_started"
  | "login_completed"
  | "login_skipped"
  | "notify_me_submitted"
  | "pdf_downloaded"
  | "circle_join_clicked"
  // Phase 2 — commerce
  | "kit_viewed"
  | "kit_added_to_cart"
  | "cart_viewed"
  | "checkout_started"
  | "payment_method_selected"
  | "payment_completed"
  | "payment_failed"
  | "order_cancelled";

interface MixpanelLike {
  track: (name: string, props?: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    mixpanel?: MixpanelLike;
    gtag?: (...args: unknown[]) => void;
  }
}

let analyticsInitialized = false;

function injectScript(src: string, onload?: () => void) {
  const el = document.createElement("script");
  el.src = src;
  el.async = true;
  if (onload) el.onload = onload;
  document.head.appendChild(el);
}

/**
 * One-time provider bootstrap (G50). Called once from <AnalyticsLoader/> in
 * the root layout. Each provider loads only when its env-configured ID is
 * present at build time — absent locally, so dev stays script-free and
 * track() falls through to the console.debug line below.
 */
export function initAnalytics() {
  if (typeof window === "undefined" || analyticsInitialized) return;
  analyticsInitialized = true;
  try {
    const ga4Id = process.env.NEXT_PUBLIC_GA4_ID;
    if (ga4Id) {
      const w = window as unknown as { dataLayer?: unknown[] };
      const dataLayer = (w.dataLayer = w.dataLayer ?? []);
      // gtag.js requires the *arguments object* on the dataLayer, not an array.
      window.gtag = function gtag() {
        // eslint-disable-next-line prefer-rest-params
        dataLayer.push(arguments);
      };
      window.gtag("js", new Date());
      window.gtag("config", ga4Id);
      injectScript(
        `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4Id)}`,
      );
    }

    const mixpanelToken = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
    if (mixpanelToken) {
      injectScript("https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js", () => {
        try {
          (
            window.mixpanel as unknown as
              | { init?: (token: string) => void }
              | undefined
          )?.init?.(mixpanelToken);
        } catch {
          // analytics must never break the product
        }
      });
    }
  } catch {
    // analytics must never break the product
  }
}

export function track(event: EventName, props: Record<string, unknown> = {}) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.mixpanel?.track(event, props);
    window.gtag?.("event", event, props);
    if (process.env.NODE_ENV === "development") {
      console.debug("[analytics]", event, props);
    }
  } catch {
    // analytics must never break the product
  }
}
