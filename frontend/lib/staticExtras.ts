/**
 * M10 helpers for the public static pages — search, glossary, corrections,
 * applications and the Tapa Circle. Layered on top of lib/api.ts and
 * lib/types.ts (both untouched); browser calls go through the /api/v1
 * rewrite proxy and every helper degrades gracefully when the backend
 * is down.
 */

import type { GlossaryTerm } from "./types";

/* ────────────────────────── site constants ────────────────────────── */

/** Canonical site origin for sitemap/robots. */
export const SITE_URL = process.env.SITE_URL ?? "https://thetapaco.com";

/**
 * TODO(business): placeholder WhatsApp business number for the Tapa
 * Circle. Replace with the real number before launch — the wa.me link
 * and the Phase-2 inbound-JOIN webhook both depend on it.
 */
export const CIRCLE_WHATSAPP_NUMBER = "919999999999";

/** wa.me deep link that pre-fills the single consent message. */
export const CIRCLE_JOIN_URL = `https://wa.me/${CIRCLE_WHATSAPP_NUMBER}?text=JOIN`;

/** localStorage key — set on join, read by WhatsAppNudge to go quiet. */
export const CIRCLE_JOINED_KEY = "tapa-circle-joined";

/* ────────────────────────────── search ─────────────────────────────── */

export interface SearchHit {
  resultType: string;
  title: string;
  subtitle?: string | null;
  href?: string | null;
  hueClass?: string | null;
  badge?: string | null;
}

export interface PopularSearch {
  label: string;
  targetUrl: string;
  order?: number;
}

export interface SearchPayload {
  query: string;
  totalCount: number;
  glossary: SearchHit[];
  guides: SearchHit[];
  pujas: SearchHit[];
  dates: SearchHit[];
  downloads: SearchHit[];
  kits: SearchHit[];
  didYouMean: string[];
  relatedSearches: string[];
  popular: PopularSearch[];
}

interface Envelope<T> {
  data: T | null;
  error?: { code: string; message: string } | null;
}

/** Browser-side search. Throws on failure so the UI can show its error state. */
export async function searchSite(query: string): Promise<SearchPayload> {
  const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}`);
  const body = (await res.json().catch(() => null)) as
    | Envelope<Partial<SearchPayload>>
    | null;
  if (!res.ok || !body?.data) throw new Error(`search failed (${res.status})`);
  const d = body.data;
  return {
    query: d.query ?? query,
    totalCount: d.totalCount ?? 0,
    glossary: d.glossary ?? [],
    guides: d.guides ?? [],
    pujas: d.pujas ?? [],
    dates: d.dates ?? [],
    downloads: d.downloads ?? [],
    kits: d.kits ?? [],
    didYouMean: d.didYouMean ?? [],
    relatedSearches: d.relatedSearches ?? [],
    popular: d.popular ?? [],
  };
}

/** Popular searches for the idle state — empty list when unreachable. */
export async function fetchPopularSearches(): Promise<PopularSearch[]> {
  try {
    const res = await fetch("/api/v1/search/popular");
    const body = (await res.json().catch(() => null)) as
      | Envelope<PopularSearch[]>
      | null;
    if (!res.ok || !body?.data) return [];
    return [...body.data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch {
    return [];
  }
}

/** Pill variant for a search-hit badge string ("DHARMA · 4/5" etc). */
export function badgeVariant(
  badge: string,
): "dharma" | "pratha" | "bhranti" | "data" | "default" {
  const b = badge.toUpperCase();
  if (b.startsWith("DHARMA")) return "dharma";
  if (b.startsWith("PRATHA")) return "pratha";
  if (b.startsWith("BHRANTI") || b.startsWith("CORRECTION")) return "bhranti";
  if (b.includes("CALENDAR") || b.includes("PANCHANG") || b.includes("TODAY"))
    return "data";
  return "default";
}

/* ──────────────────────────── corrections ──────────────────────────── */

export interface CorrectionSubmission {
  pageUrl: string;
  lineAsItStands: string;
  whatItShouldSay: string;
  source: string;
  isPratha: boolean;
  name: string;
  email: string;
  whatsapp: string;
}

/** POST /api/v1/corrections — resolves true on success, false otherwise. */
export async function submitCorrection(
  payload: CorrectionSubmission,
): Promise<boolean> {
  try {
    const res = await fetch("/api/v1/corrections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/* ─────────────────────────── applications ──────────────────────────── */

export type ApplicationType = "team" | "purohit" | "retailer";

/** POST /api/v1/applications — resolves true on success, false otherwise. */
export async function submitApplication(
  type: ApplicationType,
  fields: Record<string, string | boolean | string[]>,
): Promise<boolean> {
  try {
    const res = await fetch("/api/v1/applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, fields }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/* ────────────────────────────── glossary ───────────────────────────── */

/** A published article a glossary term appears in (#117). */
export interface GlossaryAppearance {
  slug: string;
  title: string;
  category: string;
  subCategory: string;
}

/**
 * Fetched per-entry on expand so the list payload stays light. Empty array
 * on any failure — the chip row simply does not render.
 */
export async function fetchGlossaryAppearsIn(
  slug: string,
): Promise<GlossaryAppearance[]> {
  try {
    const res = await fetch(`/api/v1/glossary/${encodeURIComponent(slug)}`);
    const body = (await res.json().catch(() => null)) as Envelope<{
      appearsIn?: GlossaryAppearance[];
    }> | null;
    if (!res.ok || !body?.data) return [];
    return body.data.appearsIn ?? [];
  } catch {
    return [];
  }
}

/** Route for an article a term appears in. */
export function appearanceHref(a: GlossaryAppearance): string {
  return `/${a.category || "ritual-guides"}/${a.subCategory || "all"}/${a.slug}`;
}

export type GlossaryCategoryFilter =
  | "all"
  | GlossaryTerm["category"];

export const GLOSSARY_CATEGORY_LABELS: Record<
  GlossaryTerm["category"],
  string
> = {
  MATERIAL: "Material",
  PRACTICE: "Practice",
  TIME_CALENDAR: "Time",
  TEXT_TERM: "Text",
};

export const GLOSSARY_FILTERS: readonly {
  key: GlossaryCategoryFilter;
  label: string;
}[] = [
  { key: "all", label: "All terms" },
  { key: "MATERIAL", label: "Materials" },
  { key: "PRACTICE", label: "Practices" },
  { key: "TIME_CALENDAR", label: "Time & calendar" },
  { key: "TEXT_TERM", label: "Texts & terms" },
] as const;

/** Group terms by first letter, alphabetically, for the A–Z list. */
export function groupTermsByLetter(
  terms: GlossaryTerm[],
): { letter: string; terms: GlossaryTerm[] }[] {
  const sorted = [...terms].sort((a, b) => a.term.localeCompare(b.term));
  const groups = new Map<string, GlossaryTerm[]>();
  for (const term of sorted) {
    const letter = (term.term[0] ?? "#").toUpperCase();
    const bucket = groups.get(letter);
    if (bucket) bucket.push(term);
    else groups.set(letter, [term]);
  }
  return [...groups.entries()].map(([letter, ts]) => ({ letter, terms: ts }));
}

/** Route for a glossary term's linked Dharmic Concept article. */
export function conceptHref(slug: string): string {
  // The article route resolves by slug; the category segment is cosmetic.
  return `/dharmic-concepts/meanings-practices/${slug}`;
}

/** 10-digit Indian mobile check — first digit 6–9, digits only. */
export function isValidIndianMobile(value: string): boolean {
  return /^[6-9][0-9]{9}$/.test(value);
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
