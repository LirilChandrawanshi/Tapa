/**
 * M3 helpers layered on top of lib/api.ts — error-tolerant fetch wrappers
 * (the backend may be down while pages render) plus small pure utilities
 * shared by the article template and the listing pages.
 *
 * Deliberately additive: lib/api.ts stays untouched.
 */

import {
  ApiError,
  fetchArticle,
  fetchArticles,
  fetchFestival,
  fetchPanchangDate,
} from "./api";
import type { DeityHue } from "@/components/ContentCard";
import type {
  Article,
  Dpb,
  Observance,
  Paged,
  PanchangDay,
  VidhiStep,
} from "./types";
import { getSection, type NavSectionKey } from "./taxonomy";

const API_BASE =
  typeof window === "undefined"
    ? (process.env.API_BASE_URL ?? "http://localhost:8080")
    : "";

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

const DEITY_HUE: Record<string, DeityHue> = {
  shiva: "shiva",
  mahadev: "shiva",
  krishna: "krishna",
  vishnu: "vishnu",
  ganesh: "ganesh",
  ganesha: "ganesh",
  ganpati: "ganesh",
  devi: "devi",
  parvati: "devi",
  durga: "devi",
  lakshmi: "devi",
};

/** Free-text Observance.deity ("Shiva", "Parvati") → DeityHue, substring match. */
export function deityHue(deity: string | undefined, fallback: DeityHue = "gold"): DeityHue {
  if (!deity) return fallback;
  const key = deity.trim().toLowerCase();
  if (DEITY_HUE[key]) return DEITY_HUE[key];
  const found = Object.keys(DEITY_HUE).find((k) => key.includes(k));
  return found ? DEITY_HUE[found] : fallback;
}

/**
 * Canonical presiding deities for `Article.deity` — the admin picker and
 * the /all-articles facet read the same list, so they cannot drift.
 * Null/absent is legitimate: Panchang and most concepts serve no one deity.
 */
export const DEITIES = [
  { slug: "shiva", label: "Shiva" },
  { slug: "vishnu", label: "Vishnu" },
  { slug: "krishna", label: "Krishna" },
  { slug: "devi", label: "Devi" },
  { slug: "ganesha", label: "Ganesha" },
  { slug: "surya", label: "Surya" },
  { slug: "hanuman", label: "Hanuman" },
] as const;

/** Free-text or slug deity → canonical DEITIES slug, or null when unclaimed. */
export function normalizeDeity(deity: string | undefined | null): string | null {
  if (!deity) return null;
  const key = deity.trim().toLowerCase();
  const exact = DEITIES.find((d) => d.slug === key);
  if (exact) return exact.slug;
  // tolerate the aliases editors actually type ("Ganpati", "Mahadev", "Durga")
  const alias = DEITY_HUE[key] ?? DEITY_HUE[
    Object.keys(DEITY_HUE).find((k) => key.includes(k)) ?? ""
  ];
  if (alias === "ganesh") return "ganesha";
  return DEITIES.find((d) => d.slug === alias)?.slug ?? null;
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

/* ── Wave-2 additions (W2-A) ──────────────────────────────────── */

/**
 * The observance API also carries tithi start/end instants (naive IST),
 * which lib/types.ts doesn't model yet. Read them tolerantly.
 */
export interface ObservanceTithi {
  startsAt?: string;
  endsAt?: string;
}

export function observanceTithiOf(observance: Observance): ObservanceTithi {
  const raw = observance as unknown as Record<string, unknown>;
  return {
    startsAt:
      typeof raw.tithiStartsAt === "string" ? raw.tithiStartsAt : undefined,
    endsAt: typeof raw.tithiEndsAt === "string" ? raw.tithiEndsAt : undefined,
  };
}

/** Linked ritual-kit slug — present on the API DTO, not yet in lib/types. */
export function kitLinkedSlugOf(article: Article): string | undefined {
  const raw = (article as unknown as Record<string, unknown>).kitLinkedSlug;
  return typeof raw === "string" && raw.trim() !== "" ? raw : undefined;
}

/** Is this guide part of the ekadashi series (parana timing applies)? */
export function isEkadashiGuide(
  article: Article,
  observance: Observance | null,
): boolean {
  const key = `${observance?.series ?? ""} ${observance?.slug ?? ""} ${article.slug}`;
  return key.toLowerCase().includes("ekadashi");
}

/** Panchang day for a date — best effort, never throws. */
export async function fetchPanchangDaySafe(
  date: string,
): Promise<PanchangDay | null> {
  try {
    const res = await fetchPanchangDate(date);
    return res.day;
  } catch {
    return null;
  }
}

/** A dated, reader-reported correction the RI team marked fixed. */
export interface CorrectionEntry {
  date: string | null;
  note: string;
}

/** Public corrections log for an article — empty on any failure. */
export async function fetchCorrectionsSafe(
  slug: string,
): Promise<CorrectionEntry[]> {
  try {
    const res = await fetch(
      `${API_BASE}/api/v1/articles/${encodeURIComponent(slug)}/corrections`,
      { next: { revalidate: 300, tags: [`article:${slug}`] } },
    );
    if (!res.ok) return [];
    const body: unknown = await res.json();
    const data = (body as { data?: unknown })?.data;
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (e): e is { date?: unknown; note?: unknown } =>
          typeof e === "object" && e !== null,
      )
      .map((e) => ({
        date: typeof e.date === "string" ? e.date : null,
        note: typeof e.note === "string" ? e.note : "",
      }))
      .filter((e) => e.note !== "");
  } catch {
    return [];
  }
}

/** "2026-09-06" → "Sunday" (UTC-stable). */
export function weekdayOf(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    timeZone: "UTC",
  }).format(d);
}

/** Naive IST instant "2026-09-06T22:03:00" → "6 Sep, 10:03 PM". */
export function formatTithiInstant(naive: string | undefined): string {
  if (!naive) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(naive);
  if (!m) return naive;
  const d = new Date(
    Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5])),
  );
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC", // values are already IST wall-clock
  }).format(d);
}

/** Is the observance date still ahead of us (IST calendar day)? */
export function isFutureObservance(iso: string | undefined): boolean {
  if (!iso) return false;
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());
  return iso >= today;
}

/** #58 — "1 core practice · N scriptural elements · …" from the blocks. */
export function compositionCounts(article: Article): {
  scriptural: number;
  regional: number;
  corrections: number;
} {
  let scriptural = 0;
  let regional = 0;
  let corrections = 0;
  for (const block of article.lang.en.blocks) {
    if (block.type === "MYTHS") {
      corrections += block.myths?.length ?? 0;
    }
    // section-level tags (the concept template's per-section tag row)
    const sectionTag = block.dpb?.classification;
    if (sectionTag === "DHARMA" || sectionTag === "MIXED") scriptural += 1;
    else if (sectionTag === "PRATHA") regional += 1;
    else if (sectionTag === "BHRANTI") corrections += 1;
    for (const step of block.steps ?? []) {
      const tag = step.dpb?.classification;
      if (tag === "DHARMA" || tag === "MIXED") scriptural += 1;
      else if (tag === "PRATHA") regional += 1;
      else if (tag === "BHRANTI") corrections += 1;
    }
  }
  return { scriptural, regional, corrections };
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
