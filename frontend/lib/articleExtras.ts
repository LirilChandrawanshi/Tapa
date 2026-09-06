/**
 * M3 helpers layered on top of lib/api.ts — error-tolerant fetch wrappers
 * (the backend may be down while pages render) plus small pure utilities
 * shared by the article template and the listing pages.
 *
 * Deliberately additive: lib/api.ts stays untouched.
 */

import { ApiError, fetchArticle, fetchArticles, fetchFestival } from "./api";
import type { DeityHue } from "@/components/ContentCard";
import type { Article, Dpb, Observance, Paged, VidhiStep } from "./types";
import { getSection, type NavSectionKey } from "./taxonomy";

/** Article fetch that swallows network errors; 404 stays distinguishable. */
export async function fetchArticleSafe(
  slug: string,
): Promise<{ article: Article | null; notFound: boolean }> {
  try {
    const article = await fetchArticle(slug);
    return { article, notFound: false };
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      return { article: null, notFound: true };
    }
    return { article: null, notFound: false };
  }
}

/** Listing fetch that degrades to an empty page when the API is down. */
export async function fetchArticlesSafe(params: {
  category?: string;
  subCategory?: string;
  page?: number;
  size?: number;
}): Promise<Paged<Article>> {
  try {
    return await fetchArticles(params);
  } catch {
    return { items: [], page: 1, totalPages: 0, totalItems: 0 };
  }
}

/** Linked observance (for the tithi in the dateline) — best effort only. */
export async function fetchObservanceSafe(
  slug: string,
): Promise<Observance | null> {
  try {
    const res = await fetchFestival(slug);
    return res.observance;
  } catch {
    return null;
  }
}

/** Related articles — fetched in parallel, silently dropping failures. */
export async function fetchRelatedSafe(slugs: string[]): Promise<
  { slug: string; article: Article | null }[]
> {
  const results = await Promise.all(
    slugs.map(async (slug) => {
      const { article } = await fetchArticleSafe(slug);
      return { slug, article };
    }),
  );
  return results;
}

/* ── pure helpers ─────────────────────────────────────────────── */

const HUES: readonly DeityHue[] = [
  "teej",
  "krishna",
  "shiva",
  "ganesh",
  "devi",
  "vishnu",
  "earth",
  "thread",
  "data",
  "sanskar",
  "gold",
];

/** "h-shiva" → "shiva", with a per-category fallback. */
export function hueFromClass(
  hueClass: string | undefined,
  fallback: DeityHue = "gold",
): DeityHue {
  const raw = hueClass?.replace(/^h-/, "");
  return (HUES as readonly string[]).includes(raw ?? "")
    ? (raw as DeityHue)
    : fallback;
}

/** Lowercase Pill/DpbBadge tag from the API's uppercase classification. */
export function dpbTagOf(dpb: Dpb): "dharma" | "pratha" | "bhranti" {
  if (dpb.classification === "PRATHA") return "pratha";
  if (dpb.classification === "BHRANTI") return "bhranti";
  return "dharma"; // MIXED renders as dharma-styled with its own label
}

/** "sanskar-life-events" → "Sanskar Life Events" (last-resort labeling). */
export function titleizeSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/** Anchor id for a block title, stable and URL-safe. */
export function anchorId(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/[\s-]+/g, "-") || "section"
  );
}

/** Taxonomy label for a sub-category slug, e.g. "festive-pujans". */
export function subCategoryLabel(
  sectionKey: NavSectionKey,
  subCategorySlug: string | undefined,
): string {
  if (!subCategorySlug) return "";
  const section = getSection(sectionKey);
  const child = section.children.find((c) =>
    c.href.endsWith(`/${subCategorySlug}`),
  );
  return child?.label ?? titleizeSlug(subCategorySlug);
}

/** "2026-08-03" → "3 August 2026" (en-IN, UTC-stable). */
export function formatObservanceDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/** Every DPB-tagged vidhi step across the article, for the intelligence table. */
export function collectTaggedSteps(
  article: Article,
): { step: VidhiStep; dpb: Dpb }[] {
  const rows: { step: VidhiStep; dpb: Dpb }[] = [];
  for (const block of article.lang.en.blocks) {
    if (block.type !== "VIDHI") continue;
    for (const step of block.steps ?? []) {
      if (step.dpb) rows.push({ step, dpb: step.dpb });
    }
  }
  return rows;
}

/** Canonical article path — dharmic concepts live under their own root. */
export function articleHref(article: Article): string {
  const base =
    article.category === "dharmic-concepts"
      ? "/dharmic-concepts"
      : "/ritual-guides";
  const sub = article.subCategory ?? "all";
  return `${base}/${sub}/${article.slug}`;
}
