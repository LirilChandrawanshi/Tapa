/**
 * Panchang-page helpers that sit beside lib/api.ts.
 *
 * Panchang pages are `force-dynamic` and must render a decent page with the
 * backend down, so every fetch goes through `safeFetch` (error → null) and the
 * page shows a "being verified" state instead of crashing the build.
 */

import type { Observance, PanchangDay, UpcomingObservance } from "./types";

/**
 * Fields the API now returns on observances but that predate lib/types.ts.
 * Kept here (additive) so panchang surfaces can read them without touching
 * the shared DTO file.
 */
export interface ObservanceExtras {
  /** ISO instant the observed tithi begins, e.g. "2026-09-06T22:03:00". */
  tithiStartsAt?: string;
  /** ISO instant the observed tithi ends. */
  tithiEndsAt?: string;
  /** Amanta-convention civil date, present only for month-boundary dates. */
  dateAmanta?: string;
  /** One-line WhatsApp Circle teaser. */
  circleTeaser?: string;
}

export type ObservanceX = Observance & ObservanceExtras;

/** Read the additive fields off any observance without widening lib/types. */
export function obsX(o: Observance): ObservanceX {
  return o as ObservanceX;
}

/** Resolve a promise to null on any failure — dead backend, bad JSON, 5xx. */
export async function safeFetch<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch {
    return null;
  }
}

/* ── Dates ──────────────────────────────────────────────────────────────
 * All panchang dates are IST calendar dates serialised as "YYYY-MM-DD".
 * We parse them as UTC midnight and format with timeZone UTC so the label
 * never shifts with the server's own zone. */

const DAY_MS = 86_400_000;

function asUtc(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

/** Today's calendar date in IST, as "YYYY-MM-DD". */
export function todayIst(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());
}

/** "14 September 2026" */
export function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(asUtc(iso));
}

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

/** "14 Sep" (fixed abbreviations — en-GB Intl renders "Sept"). */
export function fmtShort(iso: string): string {
  const d = asUtc(iso);
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`;
}

/** "Monday" */
export function weekday(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    timeZone: "UTC",
  }).format(asUtc(iso));
}

/** "till 10:03 pm" (adds "· 7 Sep" when the window ends on a later date) */
export function fmtEnds(endsAtIso: string, dayIso?: string): string {
  const [datePart, timePart] = endsAtIso.split("T");
  if (!timePart) {
    return `till ${fmtShort(endsAtIso)}`;
  }
  const [h, m] = timePart.split(":").map(Number);
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const suffix = h < 12 ? "am" : "pm";
  const time = `${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
  const rollsOver = dayIso && datePart && !datePart.startsWith(dayIso.slice(0, 10));
  return rollsOver ? `till ${time} · ${fmtShort(datePart)}` : `till ${time}`;
}

/** "Monday, 14 September 2026" */
export function fmtLong(iso: string): string {
  return `${weekday(iso)}, ${fmtDate(iso)}`;
}

/** "7 Sep · 11:22 pm" from an ISO instant; date-only inputs → "7 Sep". */
export function fmtAt(iso?: string | null): string | null {
  if (!iso) return null;
  const [datePart, timePart] = iso.split("T");
  if (!timePart) return fmtShort(iso);
  const [h, m] = timePart.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return fmtShort(datePart);
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const suffix = h < 12 ? "am" : "pm";
  return `${fmtShort(datePart)} · ${hour12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** `iso` shifted by `n` calendar days, as "YYYY-MM-DD". */
export function addDays(iso: string, n: number): string {
  const d = asUtc(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

const MONTHS_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

/** "September 2026" for a "2026-09" month key. */
export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  if (!y || !m || m < 1 || m > 12) return key;
  return `${MONTHS_FULL[m - 1]} ${y}`;
}

/** "Sep" for a "2026-09" month key. */
export function monthShort(key: string): string {
  const m = Number(key.split("-")[1]);
  return m >= 1 && m <= 12 ? MONTHS_SHORT[m - 1] : key;
}

/** "waning" / "waxing" gloss for a paksha name; null when unknown. */
export function pakshaNote(paksha?: string | null): string | null {
  if (!paksha) return null;
  if (/krishna/i.test(paksha)) return "waning";
  if (/shukla/i.test(paksha)) return "waxing";
  return null;
}

/* ── Parana (fast-breaking) window ───────────────────────────────────── */

export interface ParanaWindow {
  /** Civil date the window falls on (the morning after the vrat). */
  date: string;
  from: string;
  to: string;
}

/**
 * Locate the parana window for a vrat on `date`.
 * The contract puts it in the NEXT day's muhurats; seeded data carries it on
 * the vrat day itself labelled "Parana (next day)" — accept either.
 */
export function findParana(
  vratDay: PanchangDay | null | undefined,
  nextDay: PanchangDay | null | undefined,
  date: string,
): ParanaWindow | null {
  const onNext = nextDay?.muhurats?.find((m) => /parana/i.test(m.label));
  if (onNext) return { date: addDays(date, 1), from: onNext.from, to: onNext.to };
  const onDay = vratDay?.muhurats?.find((m) => /parana/i.test(m.label));
  if (onDay) {
    return {
      date: /next\s*day/i.test(onDay.label) ? addDays(date, 1) : date,
      from: onDay.from,
      to: onDay.to,
    };
  }
  return null;
}

/** "14–23 September 2026" or across months "26 Sep – 11 Oct 2026". */
export function fmtRange(startIso: string, endIso?: string): string {
  if (!endIso || endIso === startIso) return fmtDate(startIso);
  const s = asUtc(startIso);
  const e = asUtc(endIso);
  if (
    s.getUTCMonth() === e.getUTCMonth() &&
    s.getUTCFullYear() === e.getUTCFullYear()
  ) {
    return `${s.getUTCDate()}–${fmtDate(endIso)}`;
  }
  return `${fmtShort(startIso)} – ${fmtShort(endIso)} ${e.getUTCFullYear()}`;
}

/** Month key "2026-09" for `iso`, shifted by `offsetMonths`. */
export function monthKey(iso: string, offsetMonths = 0): string {
  const d = asUtc(iso);
  d.setUTCMonth(d.getUTCMonth() + offsetMonths, 1);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Whole days from `fromIso` to `toIso` (negative if past). */
export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((asUtc(toIso).getTime() - asUtc(fromIso).getTime()) / DAY_MS);
}

/* ── Observance list utilities ───────────────────────────────────────── */

/** Merge month payloads, de-duplicate by slug+date, sort by date. */
export function mergeObservances(
  ...lists: (UpcomingObservance[] | null)[]
): UpcomingObservance[] {
  const seen = new Set<string>();
  const out: UpcomingObservance[] = [];
  for (const list of lists) {
    for (const u of list ?? []) {
      const key = `${u.observance.slug}:${u.observance.date}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(u);
    }
  }
  return out.sort((a, b) => a.observance.date.localeCompare(b.observance.date));
}

/* ── Vrat-calendar filter chips ──────────────────────────────────────── */

export const VRAT_FILTERS = [
  { key: "all", label: "All" },
  { key: "ekadashi", label: "Ekadashi" },
  { key: "teej", label: "Teej" },
  { key: "sawan-somwar", label: "Sawan Somwar" },
  { key: "purnima", label: "Purnima" },
  { key: "amavasya", label: "Amavasya" },
  { key: "pradosh", label: "Pradosh" },
  { key: "eclipse", label: "Eclipse" },
] as const;

export type VratFilterKey = (typeof VRAT_FILTERS)[number]["key"];

/** Match on series first, falling back to name/tithi wording. */
export function matchesVratFilter(o: Observance, f: VratFilterKey): boolean {
  if (f === "all") return true;
  const hay = `${o.series ?? ""} ${o.name} ${o.tithiLabel ?? ""}`.toLowerCase();
  switch (f) {
    case "ekadashi":
      return hay.includes("ekadashi");
    case "teej":
      return hay.includes("teej");
    case "sawan-somwar":
      return hay.includes("somwar") || hay.includes("somvar");
    case "purnima":
      return hay.includes("purnima") || hay.includes("poornima");
    case "amavasya":
      return hay.includes("amavasya");
    case "pradosh":
      return hay.includes("pradosh");
    case "eclipse":
      return (
        o.type === "ECLIPSE" ||
        hay.includes("grahan") ||
        hay.includes("eclipse")
      );
  }
}

/* ── Constants shared by the panchang pages ──────────────────────────── */

/**
 * Ritual-guide articles live at /ritual-guides/[category]/[slug]; the page
 * resolves by slug alone (the category segment is presentational), and
 * observances fixed to a tithi are festive pujans — so that is the segment
 * we link through.
 */
export function guideHref(articleSlug: string): string {
  return `/ritual-guides/festive-pujans/${articleSlug}`;
}

export const CITY_LABEL = "Delhi-NCR";
export const SOURCE_LINE =
  "Drik Panchang · calculated for Delhi-NCR (IST) · regenerates annually";
export const CALENDAR_PDF_HREF = "/api/v1/panchang/calendar.pdf";
