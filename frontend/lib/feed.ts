export type FeedRefType =
  | "PRODUCT"
  | "ARTICLE"
  | "OBSERVANCE"
  | "GLOSSARY_TERM"
  | "LINK"
  | "PROMO";

export type FeedLayout = "HERO" | "WIDE" | "STANDARD";

export interface FeedCard {
  id: string;
  refType: FeedRefType;
  title: string;
  imageUrl: string | null;
  subtitle: string | null;
  href: string;
  caption: string | null;
  order: number;
  hueClass: string | null;
  layout: FeedLayout | null;
  badge: string | null;
  ctaLabel: string | null;
}

const API_BASE = process.env.API_BASE_URL ?? "http://localhost:8080";

export async function fetchFeedSafe(): Promise<FeedCard[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/feed`, {
      next: { revalidate: 300, tags: ["feed"] },
    });
    if (!res.ok) return [];
    const body = (await res.json().catch(() => null)) as
      | { data?: unknown; error?: unknown }
      | null;
    const data = body?.data;
    if (!Array.isArray(data) || body?.error) return [];
    return data as FeedCard[];
  } catch {
    return [];
  }
}
