/**
 * W2-C helpers shared by the SLP browser, the PLP landings and
 * /all-articles: derived facets (month, deity, confidence, reading
 * time), the client-side filter model, and a capped "fetch every
 * page" wrapper over the paged articles endpoint.
 *
 * Pure and serialisable — importable from server and client alike.
 */

import { fetchArticles } from "./api";
import type { Article, Dpb } from "./types";

/* ── deity (derived from hueClass — no deity field on Article) ─── */

export const DEITY_ORDER = [
  "Shiva",
  "Vishnu",
  "Devi",
  "Krishna",
  "Ganesha",
  "Other",
] as const;

export type DeityLabel = (typeof DEITY_ORDER)[number];

const HUE_TO_DEITY: Record<string, DeityLabel> = {
  "h-shiva": "Shiva",
  "h-vishnu": "Vishnu",
  "h-devi": "Devi",
  "h-teej": "Devi",
  "h-krishna": "Krishna",
  "h-ganesh": "Ganesha",
};

/** Derived deity facet — hueClass is the only signal the API carries. */
export function deityOf(article: Article): DeityLabel {
  return HUE_TO_DEITY[article.hueClass ?? ""] ?? "Other";
}

/* ── month (from observanceDate) ──────────────────────────────── */

/** "2026-10-20" → sortable key "2026-10", or null when undated. */
export function monthKeyOf(iso: string | undefined): string | null {
  if (!iso || !/^\d{4}-\d{2}/.test(iso)) return null;
  return iso.slice(0, 7);
}

/** "2026-10" → "October 2026". */
export function monthLabelOf(key: string): string {
  const d = new Date(`${key}-01T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return key;
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
}

/** Distinct future-or-current months covered by dated articles. */
export function monthsAhead(articles: Article[], nowIso: string): number {
  const nowKey = monthKeyOf(nowIso);
  const keys = new Set<string>();
  for (const a of articles) {
    const k = monthKeyOf(a.observanceDate);
    if (k && (!nowKey || k >= nowKey)) keys.add(k);
  }
  return keys.size;
}

/* ── confidence bands (from dpb) ──────────────────────────────── */

export type ConfidenceBand = "d5" | "d4" | "d3" | "p12";

export const CONFIDENCE_BANDS: readonly {
  key: ConfidenceBand;
  label: string;
}[] = [
  { key: "d5", label: "Dharma 5/5" },
  { key: "d4", label: "Dharma 4/5" },
  { key: "d3", label: "Dharma 3/5" },
  { key: "p12", label: "Pratha 1–2/5" },
];

export function confidenceBandOf(dpb: Dpb | undefined): ConfidenceBand | null {
  if (!dpb) return null;
  if (dpb.classification === "PRATHA") return "p12";
  if (dpb.classification === "BHRANTI") return null;
  const score = dpb.confidenceScore;
  if (score === undefined) return null;
  if (score >= 5) return "d5";
  if (score === 4) return "d4";
  if (score === 3) return "d3";
  return "p12"; // a 1–2 score reads as custom-strength evidence
}

export function confidenceLabelOf(band: ConfidenceBand): string {
  return CONFIDENCE_BANDS.find((b) => b.key === band)?.label ?? band;
}

/* ── reading-time bands (from readMinutes) ────────────────────── */

export type ReadBand = "short" | "mid" | "long";

export const READ_BANDS: readonly { key: ReadBand; label: string }[] = [
  { key: "short", label: "Under 8 min" },
  { key: "mid", label: "8–12 min" },
  { key: "long", label: "Over 12 min" },
];

export function readBandOf(readMinutes: number | undefined): ReadBand | null {
  if (readMinutes === undefined || readMinutes <= 0) return null;
  if (readMinutes < 8) return "short";
  if (readMinutes <= 12) return "mid";
  return "long";
}

export function readBandLabelOf(band: ReadBand): string {
  return READ_BANDS.find((b) => b.key === band)?.label ?? band;
}

/* ── corrections (Bhranti myths inside the article body) ──────── */

/** True when the article carries a MYTHS block (a Bhranti correction). */
export function hasCorrection(article: Article): boolean {
  const blocks = article.lang?.en?.blocks ?? [];
  return blocks.some(
    (b) => b.type === "MYTHS" && (b.myths?.length ?? 0) > 0,
  );
}

export function correctionsCount(articles: Article[]): number {
  return articles.filter(hasCorrection).length;
}

/* ── facet model ──────────────────────────────────────────────── */

export interface FacetOption<K extends string = string> {
  key: K;
  label: string;
  count: number;
}

export interface ListingFacets {
  months: FacetOption[]; // key "2026-10", chronological
  deities: FacetOption<DeityLabel>[];
  confidence: FacetOption<ConfidenceBand>[];
  readBands: FacetOption<ReadBand>[];
}

export function buildFacets(articles: Article[]): ListingFacets {
  const months = new Map<string, number>();
  const deities = new Map<DeityLabel, number>();
  const confidence = new Map<ConfidenceBand, number>();
  const reads = new Map<ReadBand, number>();

  for (const a of articles) {
    const mk = monthKeyOf(a.observanceDate);
    if (mk) months.set(mk, (months.get(mk) ?? 0) + 1);
    const d = deityOf(a);
    deities.set(d, (deities.get(d) ?? 0) + 1);
    const c = confidenceBandOf(a.dpb);
    if (c) confidence.set(c, (confidence.get(c) ?? 0) + 1);
    const r = readBandOf(a.readMinutes);
    if (r) reads.set(r, (reads.get(r) ?? 0) + 1);
  }

  return {
    months: [...months.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, count]) => ({ key, label: monthLabelOf(key), count })),
    deities: DEITY_ORDER.filter((d) => deities.has(d)).map((d) => ({
      key: d,
      label: d,
      count: deities.get(d) ?? 0,
    })),
    confidence: CONFIDENCE_BANDS.filter((b) => confidence.has(b.key)).map(
      (b) => ({ key: b.key, label: b.label, count: confidence.get(b.key) ?? 0 }),
    ),
    readBands: READ_BANDS.filter((b) => reads.has(b.key)).map((b) => ({
      key: b.key,
      label: b.label,
      count: reads.get(b.key) ?? 0,
    })),
  };
}

/* ── filter selection + application ───────────────────────────── */

export interface FacetSelection {
  months: string[];
  deities: DeityLabel[];
  confidence: ConfidenceBand[];
  readBands: ReadBand[];
}

export const EMPTY_SELECTION: FacetSelection = {
  months: [],
  deities: [],
  confidence: [],
  readBands: [],
};

export function selectionCount(sel: FacetSelection): number {
  return (
    sel.months.length +
    sel.deities.length +
    sel.confidence.length +
    sel.readBands.length
  );
}

/** AND across facet groups, OR within a group — standard facet logic. */
export function applySelection(
  articles: Article[],
  sel: FacetSelection,
): Article[] {
  return articles.filter((a) => {
    if (sel.months.length > 0) {
      const mk = monthKeyOf(a.observanceDate);
      if (!mk || !sel.months.includes(mk)) return false;
    }
    if (sel.deities.length > 0 && !sel.deities.includes(deityOf(a))) {
      return false;
    }
    if (sel.confidence.length > 0) {
      const c = confidenceBandOf(a.dpb);
      if (!c || !sel.confidence.includes(c)) return false;
    }
    if (sel.readBands.length > 0) {
      const r = readBandOf(a.readMinutes);
      if (!r || !sel.readBands.includes(r)) return false;
    }
    return true;
  });
}

/* ── PLP chip → SLP `?filter=` handoff ────────────────────────── */

/**
 * Chip values a PLP links into an SLP with (`?filter=…`):
 *   "coming-up"  → months within the next ~60 days
 *   "this-month" → the current month
 *   "deity:X"    → that deity's facet
 * Turned into an initial FacetSelection against the fetched set.
 */
export function selectionFromFilterParam(
  filter: string | undefined,
  facets: ListingFacets,
  nowIso: string,
): FacetSelection {
  if (!filter) return EMPTY_SELECTION;

  if (filter === "this-month" || filter === "coming-up") {
    const nowKey = monthKeyOf(nowIso);
    if (!nowKey) return EMPTY_SELECTION;
    const horizon = filter === "this-month" ? 1 : 2;
    const wanted = facets.months
      .map((m) => m.key)
      .filter((k) => k >= nowKey)
      .slice(0, horizon);
    return { ...EMPTY_SELECTION, months: wanted };
  }

  if (filter.startsWith("deity:")) {
    const label = filter.slice("deity:".length);
    const match = facets.deities.find((d) => d.key === label);
    return match ? { ...EMPTY_SELECTION, deities: [match.key] } : EMPTY_SELECTION;
  }

  return EMPTY_SELECTION;
}

/* ── alphabet helpers (A–Z view) ──────────────────────────────── */

export function firstLetterOf(title: string): string {
  const c = title.trim().charAt(0).toUpperCase();
  return /[A-Z]/.test(c) ? c : "#";
}

/* ── fetch every page, capped ─────────────────────────────────── */

/**
 * Walks the paged endpoint until `cap` articles are collected or the
 * pages run out. Degrades to whatever was gathered when a page fails —
 * an unreachable API yields an empty list, never an error page.
 */
export async function fetchAllArticlesSafe(
  params: { category?: string; subCategory?: string },
  cap = 200,
): Promise<Article[]> {
  const pageSize = 50;
  const items: Article[] = [];
  let page = 1;
  let totalPages = 1;

  while (items.length < cap && page <= totalPages) {
    try {
      const res = await fetchArticles({ ...params, page, size: pageSize });
      items.push(...res.items);
      totalPages = Math.max(1, res.totalPages);
      if (res.items.length === 0) break; // defensive: avoid a spin
    } catch {
      break;
    }
    page += 1;
  }
  return items.slice(0, cap);
}
