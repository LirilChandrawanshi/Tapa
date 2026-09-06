/**
 * Admin API client (M9). Everything goes through the same-origin `/api/v1`
 * rewrite proxy so the httpOnly auth cookies ride along first-party.
 *
 * This is an internal tool: types are deliberately loose (unknown-heavy) —
 * the backend owns validation, the editor round-trips documents.
 */

import type { Block } from "./types";

export type AdminResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; code: string; message: string };

interface Envelope<T> {
  data?: T | null;
  error?: { code?: string; message?: string } | null;
}

async function call<T>(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: unknown,
): Promise<AdminResult<T>> {
  let res: Response;
  try {
    res = await fetch(`/api/v1${path}`, {
      method,
      credentials: "include",
      cache: "no-store",
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    return {
      ok: false,
      status: 0,
      code: "network",
      message: "Could not reach the API. Is the backend running?",
    };
  }
  let envelope: Envelope<T> | null = null;
  try {
    envelope = (await res.json()) as Envelope<T>;
  } catch {
    envelope = null;
  }
  if (!res.ok || envelope?.error) {
    return {
      ok: false,
      status: res.status,
      code: envelope?.error?.code ?? "unknown",
      message: envelope?.error?.message ?? `API ${res.status} on ${path}`,
    };
  }
  return { ok: true, data: (envelope?.data ?? null) as T };
}

export const adminGet = <T>(path: string) => call<T>(`/admin${path}`, "GET");
export const adminPost = <T>(path: string, body?: unknown) =>
  call<T>(`/admin${path}`, "POST", body);
export const adminPut = <T>(path: string, body?: unknown) =>
  call<T>(`/admin${path}`, "PUT", body);
export const adminDelete = <T>(path: string) =>
  call<T>(`/admin${path}`, "DELETE");

/** Public endpoints the admin UI also needs (taxonomy for category selects). */
export const publicGet = <T>(path: string) => call<T>(path, "GET");

export type AdminAccess = "ok" | "unauthenticated" | "forbidden" | "error";

/**
 * Two-step gate: /me answers "signed in?", a cheap admin probe answers
 * "does the JWT carry EDITOR/ADMIN?".
 */
export async function checkAdminAccess(): Promise<AdminAccess> {
  const me = await call<unknown>("/me");
  if (!me.ok) {
    if (me.status === 401 || me.status === 403) return "unauthenticated";
    return "error";
  }
  const probe = await adminGet<unknown>("/flags");
  if (probe.ok) return "ok";
  if (probe.status === 403 || probe.status === 401) return "forbidden";
  return "error";
}

/* ---------- loose admin document shapes ---------- */

export interface AdminDpb {
  classification?: string | null;
  confidenceScore?: number | null;
  sourceName?: string | null;
  sourceRef?: string | null;
  sourceClass?: string | null;
  confidenceNote?: string | null;
  prathaScope?: string | null;
}

export interface AdminArticleContent {
  title?: string;
  heroSubtitle?: string;
  deck?: string;
  introHtml?: string;
  blocks?: Block[];
  audioGuideMediaId?: string;
  [key: string]: unknown;
}

export interface AdminArticle {
  id?: string;
  slug?: string;
  type?: string;
  status?: string;
  category?: string;
  subCategory?: string;
  lang?: Record<string, AdminArticleContent>;
  dpb?: AdminDpb | null;
  heroImageId?: string;
  waImageId?: string;
  hueClass?: string;
  readMinutes?: number | null;
  observanceDate?: string | null;
  linkedObservanceSlug?: string | null;
  circleTeaser?: string | null;
  isFeatured?: boolean;
  heroOrder?: number | null;
  relatedSlugs?: string[];
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface AdminPaged<T> {
  items: T[];
  page: number;
  totalPages: number;
  totalItems: number;
}

export interface AdminPanchangDay {
  id?: string;
  date?: string;
  city?: string;
  tithi?: { name?: string; endsAt?: string } | null;
  paksha?: string;
  lunarMonth?: string;
  nakshatra?: { name?: string; endsAt?: string } | null;
  yoga?: string;
  karana?: string;
  sunrise?: string;
  sunset?: string;
  moonrise?: string;
  moonset?: string;
  rahuKaal?: { from?: string; to?: string } | null;
  abhijitMuhurat?: { from?: string; to?: string } | null;
  muhurats?: unknown[];
  verified?: boolean;
  source?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface AdminObservance {
  id?: string;
  slug?: string;
  name?: string;
  nameHi?: string;
  type?: string;
  series?: string;
  seriesPosition?: string;
  date?: string;
  dateAmanta?: string;
  endDate?: string;
  tithiLabel?: string;
  deity?: string;
  seasonBlock?: string;
  tithiStartsAt?: string;
  tithiEndsAt?: string;
  blurb?: string;
  circleTeaser?: string;
  articleSlug?: string;
  notes?: string[];
  verified?: boolean;
  [key: string]: unknown;
}

export interface AdminGlossaryTerm {
  id?: string;
  slug?: string;
  term?: string;
  devanagari?: string;
  transliteration?: string;
  definition?: string;
  definitionHi?: string;
  category?: string;
  language?: string;
  conceptArticleSlug?: string;
  lookupCount?: number;
  [key: string]: unknown;
}

export interface ZeroResultQuery {
  id?: string;
  query?: string;
  normalizedQuery?: string;
  resultCount?: number;
  at?: string;
}

export interface AdminPopularSearch {
  id?: string;
  label?: string;
  targetUrl?: string;
  order?: number;
  active?: boolean;
}

export interface AdminCorrection {
  id?: string;
  pageUrl?: string;
  lineAsItStands?: string;
  whatItShouldSay?: string;
  source?: string;
  isPratha?: boolean;
  name?: string;
  email?: string;
  whatsapp?: string;
  status?: string;
  createdAt?: string;
}

export interface AdminApplication {
  id?: string;
  type?: string;
  fields?: Record<string, unknown>;
  status?: string;
  createdAt?: string;
}

export interface AdminNotifyRequest {
  id?: string;
  context?: string;
  phone?: string;
  articleSlug?: string;
  createdAt?: string;
}

export interface AdminFlag {
  key?: string;
  value?: boolean;
  updatedBy?: string;
  updatedAt?: string;
}

/* ---------- typed helpers ---------- */

export const listAdminArticles = (status?: string) =>
  adminGet<AdminPaged<AdminArticle>>(
    status ? `/articles?status=${status}` : "/articles",
  );
export const getAdminArticle = (slug: string) =>
  adminGet<AdminArticle>(`/articles/${slug}`);
export const createAdminArticle = (article: AdminArticle) =>
  adminPost<AdminArticle>("/articles", article);
export const updateAdminArticle = (slug: string, article: AdminArticle) =>
  adminPut<AdminArticle>(`/articles/${slug}`, article);
export const submitArticleReview = (slug: string) =>
  adminPost<AdminArticle>(`/articles/${slug}/submit-review`);
export const publishArticle = (slug: string) =>
  adminPost<AdminArticle>(`/articles/${slug}/publish`);
export const unpublishArticle = (slug: string) =>
  adminPost<AdminArticle>(`/articles/${slug}/unpublish`);

export const listPanchangDays = (from: string, to: string, city: string) =>
  adminGet<AdminPanchangDay[]>(
    `/panchang/days?from=${from}&to=${to}&city=${encodeURIComponent(city)}`,
  );
export const upsertPanchangDay = (
  date: string,
  city: string,
  day: AdminPanchangDay,
) =>
  adminPut<AdminPanchangDay>(
    `/panchang/days/${date}?city=${encodeURIComponent(city)}`,
    day,
  );
export const importPanchangDays = (days: unknown[]) =>
  adminPost<{ imported: number }>("/panchang/days/import", days);

export const listAdminObservances = (year: number) =>
  adminGet<AdminObservance[]>(`/observances?year=${year}`);
export const upsertObservance = (slug: string, body: AdminObservance) =>
  adminPut<AdminObservance>(`/observances/${slug}`, body);
export const toggleObservanceVerified = (slug: string) =>
  adminPost<AdminObservance>(`/observances/${slug}/verify`);

export const listAdminGlossary = () =>
  adminGet<AdminGlossaryTerm[]>("/glossary");
export const upsertGlossaryTerm = (slug: string, body: AdminGlossaryTerm) =>
  adminPut<AdminGlossaryTerm>(`/glossary/${slug}`, body);
export const deleteGlossaryTerm = (slug: string) =>
  adminDelete<{ deleted: boolean }>(`/glossary/${slug}`);

export const getZeroResults = (limit = 50) =>
  adminGet<ZeroResultQuery[]>(`/reports/zero-results?limit=${limit}`);
export const getPopularSearches = () =>
  adminGet<AdminPopularSearch[]>("/popular-searches");
export const replacePopularSearches = (list: AdminPopularSearch[]) =>
  adminPut<AdminPopularSearch[]>("/popular-searches", list);

export const listCorrections = (status: string) =>
  adminGet<AdminCorrection[]>(`/corrections?status=${status}`);
export const setCorrectionStatus = (id: string, status: string) =>
  adminPost<AdminCorrection>(`/corrections/${id}/status`, { status });

export const listApplications = (type?: string) =>
  adminGet<AdminApplication[]>(
    type ? `/applications?type=${type}` : "/applications",
  );
export const listNotifyRequests = () =>
  adminGet<AdminNotifyRequest[]>("/notify-requests");

export const listFlags = () => adminGet<AdminFlag[]>("/flags");
export const setFlag = (key: string, value: boolean) =>
  adminPut<AdminFlag>(`/flags/${key}`, { value });

/* ---------- client-side DPB rule mirror (warnings only; server enforces) ---------- */

export function dpbWarnings(dpb: AdminDpb | null | undefined, where: string): string[] {
  const warnings: string[] = [];
  if (!dpb || !dpb.classification) return warnings;
  const score = dpb.confidenceScore ?? null;
  const blank = (s?: string | null) => !s || s.trim() === "";
  switch (dpb.classification) {
    case "DHARMA":
      if (score === null || score < 3 || score > 5)
        warnings.push(`DHARMA (${where}) needs a confidence score of 3–5.`);
      if (blank(dpb.sourceName))
        warnings.push(`DHARMA (${where}) needs a named scripture source.`);
      break;
    case "PRATHA":
      if (score === null || score < 1 || score > 2)
        warnings.push(`PRATHA (${where}) needs a confidence score of 1–2.`);
      if (blank(dpb.prathaScope))
        warnings.push(`PRATHA (${where}) needs a regional scope.`);
      break;
    case "BHRANTI":
      if (score !== null)
        warnings.push(`BHRANTI (${where}) carries no confidence score.`);
      break;
    case "MIXED":
      if (score === null)
        warnings.push(`MIXED (${where}) needs a confidence score for its Dharma core.`);
      if (blank(dpb.sourceName))
        warnings.push(`MIXED (${where}) needs a named scripture source.`);
      break;
  }
  return warnings;
}

export const wordCount = (text: string | undefined | null) =>
  !text || text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

export const fmtDateTime = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};
