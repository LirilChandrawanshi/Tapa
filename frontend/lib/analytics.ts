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
