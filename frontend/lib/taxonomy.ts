/**
 * Static navigation taxonomy — Aug-30 spec.
 *
 * This becomes API-driven later; keep the shape clean and serialisable
 * so it can be swapped for a fetched payload without touching consumers.
 */

export type NavSectionKey =
  | "ritual-guides"
  | "panchang"
  | "dharmic-concepts"
  | "ritual-pujans";

export interface TaxonomyLink {
  readonly label: string;
  readonly href: string;
  /** One-line descriptor shown under the label in dropdowns/footers. */
  readonly description?: string;
  /** Leads its group visually (pink, bold) — e.g. Beginner's Guides. */
  readonly lead?: boolean;
}

export interface NavSection {
  readonly key: NavSectionKey;
  readonly label: string;
  readonly href: string;
  /** Feature flag that must be on for this section to be live. */
  readonly gatedBy?: "kits_launched" | "purohit_tab_visible" | "mandali_visible";
  readonly children: readonly TaxonomyLink[];
}

export const FALLBACK_TAXONOMY: readonly NavSection[] = [
  {
    key: "ritual-guides",
    label: "Ritual Guides",
    href: "/ritual-guides",
    children: [
      {
        label: "Beginner's Guides",
        href: "/ritual-guides/beginners-guides",
        description: "No tags, no citations, no Sanskrit to look up",
        lead: true,
      },
      {
        label: "Festive Pujans",
        href: "/ritual-guides/festive-pujans",
        description: "Fixed to a tithi",
      },
      {
        label: "All-Year Pujans",
        href: "/ritual-guides/all-year-pujans",
        description: "Recurring observances",
      },
      {
        label: "Sanskar & Life Events",
        href: "/ritual-guides/sanskar-life-events",
        description: "Birth to the last rites",
      },
    ],
  },
  {
    key: "panchang",
    label: "Panchang",
    href: "/panchang",
    children: [
      {
        label: "Today's Panchang",
        href: "/panchang/today",
        description: "Tithi, nakshatra, sunrise, Rahu Kaal",
        lead: true,
      },
      {
        label: "Vrat Calendar",
        href: "/panchang/vrat-calendar",
        description: "Every vrat date this year",
      },
      {
        label: "Festival Calendar",
        href: "/panchang/festival-calendar",
        description: "Month by month",
      },
      {
        label: "Tithi & Paksha",
        href: "/panchang/tithi-paksha",
        description: "How the lunar day works",
      },
      {
        label: "Eclipses",
        href: "/panchang/eclipses",
        description: "Visibility decides everything",
      },
    ],
  },
  {
    key: "dharmic-concepts",
    label: "Dharmic Concepts",
    href: "/dharmic-concepts",
    children: [
      {
        label: "Materials",
        href: "/dharmic-concepts/materials",
        description: "Objects and what they mean",
      },
      {
        label: "Meanings & Practices",
        href: "/dharmic-concepts/meanings-practices",
        description: "Acts and ideas behind the ritual",
      },
      {
        label: "Daily Puja",
        href: "/dharmic-concepts/daily-puja",
        description: "The everyday practice",
      },
      {
        label: "Dharma vs Pratha",
        href: "/dharmic-concepts/dharma-vs-pratha",
        description: "Scripture, custom and the line between",
      },
      {
        label: "Mantras",
        href: "/dharmic-concepts/mantras",
        description: "What they mean, how to say them",
      },
    ],
  },
  {
    key: "ritual-pujans",
    label: "Ritual Pujans",
    href: "/ritual-pujans",
    gatedBy: "kits_launched",
    children: [
      {
        label: "By Festival",
        href: "/ritual-pujans/by-festival",
        description: "Dated kits, with a cut-off",
      },
      {
        label: "By Ritual",
        href: "/ritual-pujans/by-ritual",
        description: "All-year pujans",
      },
      {
        label: "Griha & Life Events",
        href: "/ritual-pujans/griha-life-events",
        description: "Home and sanskar occasions",
      },
      {
        label: "Daily Puja Essentials",
        href: "/ritual-pujans/daily-puja-essentials",
        description: "Restocked, not ritual-specific",
      },
    ],
  },
];

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8080";

export async function fetchTaxonomy(): Promise<NavSection[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/taxonomy`, {
      next: { revalidate: 3600, tags: ["taxonomy"] },
    });
    if (!res.ok) return [...FALLBACK_TAXONOMY];
    const body = await res.json().catch(() => null);
    const pillars = body?.data?.pillars;
    if (!Array.isArray(pillars) || pillars.length === 0) return [...FALLBACK_TAXONOMY];
    return pillars.map((p: any) => ({
      key: p.key as NavSectionKey,
      label: p.labelEn,
      href: p.href,
      gatedBy: p.gateFlag as "kits_launched" | "purohit_tab_visible" | "mandali_visible" | undefined,
      children: (p.children || []).map((n: any) => ({
        label: n.labelEn,
        href: n.href,
        description: undefined,
        lead: false,
      })),
    })) as NavSection[];
  } catch {
    return [...FALLBACK_TAXONOMY];
  }
}

export const TAXONOMY = FALLBACK_TAXONOMY;

export function getSection(key: NavSectionKey): NavSection {
  const section = FALLBACK_TAXONOMY.find((s) => s.key === key);
  if (!section) throw new Error(`Unknown nav section: ${key}`);
  return section;
}
