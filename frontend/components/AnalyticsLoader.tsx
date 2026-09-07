"use client";

import { useEffect } from "react";
import { initAnalytics } from "@/lib/analytics";

/**
 * Invisible client shim rendered once in the root layout — boots the
 * env-configured analytics providers (GA4 / Mixpanel) on the client.
 * Renders nothing; safe on every page.
 */
export function AnalyticsLoader() {
  useEffect(() => {
    initAnalytics();
  }, []);
  return null;
}
