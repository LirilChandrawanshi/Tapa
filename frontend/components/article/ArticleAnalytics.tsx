"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";

/** Fires `article_viewed` once per mount. Renders nothing. */
export function ArticleAnalytics({
  slug,
  type,
}: {
  slug: string;
  type: string;
}) {
  useEffect(() => {
    track("article_viewed", { slug, type });
  }, [slug, type]);
  return null;
}
