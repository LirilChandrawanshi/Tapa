/**
 * M5 homepage helpers layered on top of lib/api.ts — the composed
 * GET /api/v1/home payload, an error-tolerant fetcher (the backend may be
 * down while the page renders), and small pure utilities for the hero and
 * rail cards.
 *
 * Deliberately additive: lib/api.ts stays untouched.
 */

import type { DpbTag as BadgeTag } from "@/components/DpbBadge";
import type { DayPayload, DpbTag, UpcomingObservance } from "./types";

/** Card shape shared by `hero` and `guidesRail` in the /home payload. */
export interface HomeCard {
  slug: string;
  title: string;
  subtitle?: string | null;
  category?: string | null;
  subCategory?: string | null;
  hueClass?: string | null;
  readMinutes?: number | null;
  observanceDate?: string | null;
  dpbTag?: DpbTag | null;
  dpbScore?: number | null;
}

export interface HomeCounts {
  ritualGuides?: number;
  dharmicConcepts?: number;
  glossaryTerms?: number;
}

export interface HomeFlags {
  kits_launched: boolean;
  purohit_tab_visible: boolean;
}

export interface HomePayload {
  hero: HomeCard[];
  panchangToday: DayPayload | null;
  nextObservances: UpcomingObservance[];
  guidesRail: HomeCard[];
  counts: HomeCounts;
  flags: HomeFlags;
}

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8080";

const EMPTY_FLAGS: HomeFlags = {
  kits_launched: false,
  purohit_tab_visible: false,
};

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asCard(value: unknown): HomeCard | null {
  if (typeof value !== "object" || value === null) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.slug !== "string" || typeof record.title !== "string") {
    return null;
  }
  return record as unknown as HomeCard;
}

/**
 * One-round-trip homepage payload. Every failure path — dead backend, bad
 * JSON, error envelope — resolves to null so the page renders its fallbacks
 * instead of crashing the build (`force-dynamic` + graceful sections).
 */
export async function fetchHomeSafe(): Promise<HomePayload | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/home`, {
      next: { revalidate: 300, tags: ["home", "panchang", "articles", "flags"] },
    });
    if (!res.ok) return null;
    const body = (await res.json().catch(() => null)) as {
      data?: unknown;
      error?: unknown;
    } | null;
    const d = body?.data;
    if (typeof d !== "object" || d === null || body?.error) return null;
    const record = d as Record<string, unknown>;

    const flagsRaw = (record.flags ?? {}) as Record<string, unknown>;
    const countsRaw = (record.counts ?? {}) as Record<string, unknown>;

    return {
      hero: asArray(record.hero)
        .map(asCard)
        .filter((c): c is HomeCard => c !== null),
      panchangToday: (record.panchangToday as DayPayload | undefined) ?? null,
      nextObservances: asArray<UpcomingObservance>(record.nextObservances),
      guidesRail: asArray(record.guidesRail)
        .map(asCard)
        .filter((c): c is HomeCard => c !== null),
      counts: {
        ritualGuides:
          typeof countsRaw.ritualGuides === "number"
            ? countsRaw.ritualGuides
            : undefined,
        dharmicConcepts:
          typeof countsRaw.dharmicConcepts === "number"
            ? countsRaw.dharmicConcepts
            : undefined,
        glossaryTerms:
          typeof countsRaw.glossaryTerms === "number"
            ? countsRaw.glossaryTerms
            : undefined,
      },
      flags: {
        kits_launched:
          typeof flagsRaw.kits_launched === "boolean"
            ? flagsRaw.kits_launched
            : EMPTY_FLAGS.kits_launched,
        purohit_tab_visible:
          typeof flagsRaw.purohit_tab_visible === "boolean"
            ? flagsRaw.purohit_tab_visible
            : EMPTY_FLAGS.purohit_tab_visible,
      },
    };
  } catch {
    return null;
  }
}

/* ── pure helpers ─────────────────────────────────────────────── */

/** Canonical article path for a home card — mirrors articleExtras.articleHref. */
export function cardHref(card: HomeCard): string {
  const base =
    card.category === "dharmic-concepts" ? "/dharmic-concepts" : "/ritual-guides";
  return `${base}/${card.subCategory ?? "all"}/${card.slug}`;
}

/** Lowercase DpbBadge tag from the payload's uppercase classification. */
export function badgeTagOf(tag: DpbTag | null | undefined): BadgeTag | null {
  if (!tag) return null;
  if (tag === "PRATHA") return "pratha";
  if (tag === "BHRANTI") return "bhranti";
  return "dharma"; // DHARMA and MIXED both render dharma-styled
}
