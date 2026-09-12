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
  /** Whether the guide actually has an audio recording to jump to. */
  hasAudio?: boolean;
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

/**
 * A homepage band whose copy is edited in the CMS. `fields` holds the flat
 * slots, `items` the repeatable rows. Layout and colour stay in the component.
 */
export interface HomeSection {
  key: string;
  label?: string;
  published?: boolean;
  fields?: Record<string, string>;
  items?: Record<string, string>[];
}

/** Published bands keyed by section id. Unpublished bands are simply absent. */
export type HomeSections = Record<string, HomeSection | undefined>;

/** Where an editor-placed band sits on the page. */
export type PromoPlacement =
  | "AFTER_HERO"
  | "AFTER_CALENDAR"
  | "BEFORE_CIRCLE"
  | "PAGE_END";

/**
 * A banner, offer or product push placed from the CMS. Product fields are
 * resolved server-side from the linked product, so a price shown here is
 * always the price Products holds.
 */
export interface HomePromo {
  id: string;
  eyebrow?: string | null;
  title?: string | null;
  body?: string | null;
  badge?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  style?: "BOLD" | "SUBTLE";
  placement?: PromoPlacement;
  productTitle?: string | null;
  productPricePaise?: number | null;
  productMrpPaise?: number | null;
  productAvailability?: string | null;
  productHueClass?: string | null;
}

/** Live promos grouped by slot. Absent slots simply have nothing in them. */
export type HomePromos = Partial<Record<PromoPlacement, HomePromo[]>>;

export interface HomePayload {
  hero: HomeCard[];
  panchangToday: DayPayload | null;
  nextObservances: UpcomingObservance[];
  guidesRail: HomeCard[];
  counts: HomeCounts;
  sections: HomeSections;
  promos: HomePromos;
  flags: HomeFlags;
}

/**
 * Reads one copy slot, falling back to the value the component ships with.
 * Every band keeps its literals, so a downed API or an empty collection still
 * renders the page it rendered before any of this existed.
 */
export function sectionText(
  section: HomeSection | undefined,
  key: string,
  fallback: string,
): string {
  const v = section?.fields?.[key];
  return v === undefined || v === "" ? fallback : v;
}

/** Repeatable rows for a band, or the component's own defaults when unset. */
export function sectionItems<T extends Record<string, string>>(
  section: HomeSection | undefined,
  fallback: readonly T[],
): readonly (T | Record<string, string>)[] {
  const items = section?.items;
  return items && items.length > 0 ? items : fallback;
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
      sections: asSections(record.sections),
      promos: asPromos(record.promos),
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

/** Shapes the payload's `sections` map, dropping anything malformed. */
function asSections(raw: unknown): HomeSections {
  if (typeof raw !== "object" || raw === null) return {};
  const out: HomeSections = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof value !== "object" || value === null) continue;
    const v = value as Record<string, unknown>;
    out[key] = {
      key,
      label: typeof v.label === "string" ? v.label : undefined,
      published: typeof v.published === "boolean" ? v.published : true,
      fields:
        typeof v.fields === "object" && v.fields !== null
          ? (v.fields as Record<string, string>)
          : {},
      items: Array.isArray(v.items) ? (v.items as Record<string, string>[]) : [],
    };
  }
  return out;
}

/** Shapes the payload's `promos` map, dropping anything malformed. */
function asPromos(raw: unknown): HomePromos {
  if (typeof raw !== "object" || raw === null) return {};
  const out: HomePromos = {};
  for (const [slot, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!Array.isArray(value)) continue;
    const rows = value.filter(
      (v): v is HomePromo =>
        typeof v === "object" && v !== null && typeof (v as HomePromo).id === "string",
    );
    if (rows.length > 0) out[slot as PromoPlacement] = rows;
  }
  return out;
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
