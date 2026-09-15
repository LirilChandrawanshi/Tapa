import type {
  Article,
  DayPayload,
  GlossaryTerm,
  IntelligenceCard,
  Paged,
  UpcomingObservance,
} from "./types";

const API_BASE =
  typeof window === "undefined"
    ? (process.env.API_BASE_URL ?? "http://localhost:8080")
    : ""; // browser goes through the Next.js rewrite proxy

interface Envelope<T> {
  data: T | null;
  error?: { code: string; message: string } | null;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

async function get<T>(
  path: string,
  init?: { revalidate?: number; tags?: string[] },
): Promise<T> {
  const res = await fetch(`${API_BASE}/api/v1${path}`, {
    next: { revalidate: init?.revalidate ?? 300, tags: init?.tags },
  });
  const body = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (!res.ok || !body || body.error) {
    throw new ApiError(
      res.status,
      body?.error?.code ?? "unknown",
      body?.error?.message ?? `API ${res.status} on ${path}`,
    );
  }
  return body.data as T;
}

/** Content */
/**
 * The shared intelligence cards an article references, in the order it asked
 * for them. Cached under its own tag so correcting a card purges every guide
 * that carries it without touching the articles themselves.
 */
export const fetchIntelligenceCards = (slugs: string[]) =>
  get<IntelligenceCard[]>(
    `/intelligence-cards?slugs=${slugs.map(encodeURIComponent).join(",")}`,
    { revalidate: 3600, tags: ["intelligence-cards"] },
  );

export const fetchArticle = (slug: string) =>
  get<Article>(`/articles/${slug}`, {
    revalidate: 3600,
    tags: [`article:${slug}`, "articles"],
  });

export const fetchArticles = (params: {
  category?: string;
  subCategory?: string;
  page?: number;
  size?: number;
}) => {
  const q = new URLSearchParams();
  if (params.category) q.set("category", params.category);
  if (params.subCategory) q.set("subCategory", params.subCategory);
  if (params.page) q.set("page", String(params.page));
  if (params.size) q.set("size", String(params.size));
  return get<Paged<Article>>(`/articles?${q}`, {
    revalidate: 900,
    tags: ["articles"],
  });
};

export const fetchFeatured = () =>
  get<Article[]>("/articles/featured", { revalidate: 900, tags: ["articles"] });

/** Glossary */
export const fetchGlossary = (category?: string) =>
  get<{ items: GlossaryTerm[]; mostLookedUp: GlossaryTerm[] }>(
    category ? `/glossary?category=${category}` : "/glossary",
    { revalidate: 3600, tags: ["glossary"] },
  );

/** Panchang — 24h data with a shorter edge so "today" rolls over correctly */
export const fetchPanchangToday = (city?: string) =>
  get<DayPayload>(city ? `/panchang/today?city=${city}` : "/panchang/today", {
    revalidate: 900,
    tags: ["panchang"],
  });

export const fetchPanchangDate = (date: string, city?: string) =>
  get<DayPayload>(
    city ? `/panchang/date/${date}?city=${city}` : `/panchang/date/${date}`,
    { revalidate: 3600, tags: ["panchang"] },
  );

export const fetchUpcoming = (limit = 10) =>
  get<UpcomingObservance[]>(`/panchang/upcoming?limit=${limit}`, {
    revalidate: 900,
    tags: ["panchang"],
  });

export const fetchFestivals = () =>
  get<UpcomingObservance[]>("/panchang/festivals", {
    revalidate: 3600,
    tags: ["panchang"],
  });

export const fetchFestival = (slug: string) =>
  get<{
    observance: UpcomingObservance["observance"];
    countdownDays: number;
    /** Resolved server-side: override → linked guide → deity set → null. */
    imageId?: string | null;
  }>(
    `/panchang/festival/${slug}`,
    { revalidate: 900, tags: ["panchang"] },
  );

export const fetchCalendarMonth = (month: string) =>
  get<UpcomingObservance[]>(`/panchang/calendar/${month}`, {
    revalidate: 3600,
    tags: ["panchang"],
  });

export const fetchEkadashi = () =>
  get<UpcomingObservance[]>("/panchang/ekadashi", {
    revalidate: 3600,
    tags: ["panchang"],
  });
