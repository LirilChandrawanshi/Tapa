/**
 * Bhajan Mandali — request domain (Phase 5).
 *
 * REQUEST-BASED model (locked for this build, flagged for Komal): the CTA is
 * "Check availability" — no instant confirm, no upfront payment. A request
 * gets a TM- number in REQUESTED; the team confirms within 24 hours from
 * admin (CONFIRMED with the final quote) or declines. Payment is collected
 * offline on the confirmation call.
 *
 * Server components call the tolerant fetchers (they hit API_BASE_URL);
 * client islands go through the same-origin `/api/v1` rewrite proxy. Kept
 * self-contained on purpose — no imports from lib/booking.ts or lib/shop.ts.
 */

/* ────────────────────────────── DTOs ────────────────────────────── */

export interface MandaliType {
  slug: string;
  name: string;
  nameHi: string;
  description: string;
  /** e.g. "5–7 member singing group". */
  inclusions: string[];
  /** "From ₹N" anchor — the final quote is confirmed per request. */
  startingPricePaise: number;
  /** e.g. "Navratri / all-year". */
  seasonNote?: string | null;
  hueClass: string;
  active?: boolean;
}

export type MandaliVenue = "HOME" | "TEMPLE";

/** Bucket keys — mirror of the backend's GUEST_BUCKETS list. */
export type GuestBucket = "under-25" | "25-50" | "50-100" | "100-plus";

export interface MandaliAddress {
  name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
}

export interface MandaliRequestPayload {
  mandaliTypeSlug: string;
  /** ISO date, at least tomorrow. */
  date: string;
  venueType: MandaliVenue;
  expectedGuests: GuestBucket;
  address: MandaliAddress;
  notes?: string;
  phone: string;
}

export type MandaliStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "DECLINED"
  | "COMPLETED"
  | "CANCELLED";

/** Requester-facing request — mirrors the API's MandaliRequestView. */
export interface MandaliRequestView {
  requestNumber: string;
  status: MandaliStatus;
  statusNote?: string | null;
  mandaliTypeSlug: string;
  mandaliName: string;
  /** ISO date. */
  date: string;
  venueType: MandaliVenue;
  expectedGuests: string;
  address: MandaliAddress;
  notes?: string | null;
  /** Set once CONFIRMED — the final quote. */
  quotedPricePaise?: number | null;
  /** ISO instant. */
  createdAt?: string | null;
}

/* ─────────────────────────── API plumbing ───────────────────────── */

const API_BASE =
  typeof window === "undefined"
    ? (process.env.API_BASE_URL ?? "http://localhost:8080")
    : ""; // browser goes through the Next.js rewrite proxy

interface Envelope<T> {
  data?: T | null;
  error?: { code?: string; message?: string } | null;
}

export type MandaliResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; code: string; message: string };

const NETWORK_COPY =
  "We couldn't reach Tapa just now. Check your connection and try again.";
const GENERIC_COPY = "Something didn't go through. Please try again.";

async function call<T>(
  path: string,
  method: "GET" | "POST" = "GET",
  body?: unknown,
): Promise<MandaliResult<T>> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/v1${path}`, {
      method,
      credentials: "include",
      cache: "no-store",
      headers: body === undefined ? {} : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    return { ok: false, status: 0, code: "network", message: NETWORK_COPY };
  }

  let envelope: Envelope<T> | null = null;
  try {
    envelope = (await res.json()) as Envelope<T>;
  } catch {
    envelope = null;
  }

  if (!res.ok || envelope?.error || envelope?.data == null) {
    return {
      ok: false,
      status: res.status,
      code: envelope?.error?.code ?? "unknown",
      message: envelope?.error?.message ?? GENERIC_COPY,
    };
  }
  return { ok: true, data: envelope.data };
}

/* ─────────────────── server fetchers (error-tolerant) ────────────── */

export interface MandaliCatalog {
  items: MandaliType[];
  guestBuckets: string[];
}

/** Active mandali types + bucket keys. Empty catalog on any failure. */
export async function fetchMandaliTypes(): Promise<MandaliCatalog> {
  const r = await call<MandaliCatalog>("/mandali");
  if (!r.ok) return { items: [], guestBuckets: GUEST_BUCKET_KEYS };
  return {
    items: r.data.items ?? [],
    guestBuckets: r.data.guestBuckets?.length
      ? r.data.guestBuckets
      : GUEST_BUCKET_KEYS,
  };
}

/** One mandali type by slug. `null` on any failure (backend down included). */
export async function fetchMandaliType(
  slug: string,
): Promise<MandaliType | null> {
  const r = await call<MandaliType>(`/mandali/${encodeURIComponent(slug)}`);
  return r.ok ? r.data : null;
}

/* ─────────────────────── client flow helpers ────────────────────── */

/** "Check availability" → TM- request in REQUESTED (422s surface inline). */
export const submitMandaliRequest = (payload: MandaliRequestPayload) =>
  call<MandaliRequestView>("/mandali/requests", "POST", payload);

/** Guest tracking — request number + the phone it was requested with. */
export const fetchMandaliRequest = (requestNumber: string, phone: string) =>
  call<MandaliRequestView>(
    `/mandali/requests/${encodeURIComponent(requestNumber.trim())}?phone=${encodeURIComponent(phone.trim())}`,
  );

/** Requester cancellation — free while REQUESTED/CONFIRMED (nothing paid). */
export const cancelMandaliRequest = (requestNumber: string, phone: string) =>
  call<MandaliRequestView>(
    `/mandali/requests/${encodeURIComponent(requestNumber.trim())}/cancel`,
    "POST",
    { phone: phone.trim() },
  );

/** Account request history — newest first. 401 simply means signed out. */
export const getMyMandaliRequests = () =>
  call<MandaliRequestView[]>("/me/mandali");

/* ─────────────────────────── money ──────────────────────────────── */

/** Paise → "₹4,500" (en-IN grouping; shows paise only when non-zero). */
export function formatPaise(paise: number): string {
  const rupees = paise / 100;
  const hasPaise = Math.round(paise) % 100 !== 0;
  return `₹${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: hasPaise ? 2 : 0,
  }).format(rupees)}`;
}

/* ─────────────────────────── buckets ────────────────────────────── */

export const GUEST_BUCKET_KEYS: GuestBucket[] = [
  "under-25",
  "25-50",
  "50-100",
  "100-plus",
];

const GUEST_BUCKET_LABELS: Record<GuestBucket, string> = {
  "under-25": "Under 25 guests",
  "25-50": "25–50 guests",
  "50-100": "50–100 guests",
  "100-plus": "100+ guests",
};

/** "25-50" → "25–50 guests". Falls back to the raw key. */
export const guestBucketLabel = (key: string): string =>
  GUEST_BUCKET_LABELS[key as GuestBucket] ?? key;

export const VENUE_LABELS: Record<MandaliVenue, string> = {
  HOME: "Home",
  TEMPLE: "Temple",
};

export const venueLabel = (key: string): string =>
  VENUE_LABELS[key as MandaliVenue] ?? key;

/* ─────────────────────────── dates ──────────────────────────────── */

/** ISO date for the earliest requestable day (tomorrow, local time). */
export function minRequestDate(now = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** "2026-09-10" → "10 September" (adds the year when it isn't the current one). */
export function formatDay(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso.includes("T") ? iso : `${iso.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/* ─────────────────── status display metadata ────────────────────── */

export type MandaliTone = "neutral" | "progress" | "good" | "attention";

export interface MandaliStatusMeta {
  /** Short human label — never the raw enum. */
  label: string;
  tone: MandaliTone;
}

export const MANDALI_STATUS_META: Record<MandaliStatus, MandaliStatusMeta> = {
  REQUESTED: { label: "Request received", tone: "progress" },
  CONFIRMED: { label: "Confirmed", tone: "good" },
  DECLINED: { label: "Couldn't arrange", tone: "neutral" },
  COMPLETED: { label: "Completed", tone: "good" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
};

export const mandaliStatusMeta = (status: string): MandaliStatusMeta =>
  MANDALI_STATUS_META[status as MandaliStatus] ?? {
    label: status,
    tone: "neutral",
  };

const CANCELLABLE: ReadonlySet<MandaliStatus> = new Set([
  "REQUESTED",
  "CONFIRMED",
]);

/** True while the requester can still cancel (nothing was paid). */
export const canCancelMandaliRequest = (request: MandaliRequestView): boolean =>
  CANCELLABLE.has(request.status);
