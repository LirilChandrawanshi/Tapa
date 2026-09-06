/**
 * Pujan with Purohit — booking domain (P4-M2).
 *
 * Everything the purohit-booking flow needs lives here: puja-type DTOs and
 * error-tolerant server fetchers, the client wizard helpers (availability,
 * booking, mock payment, tracking, cancellation, account history), the
 * paise → "₹7,100" formatter and the time-slot label helpers.
 *
 * Server components call the fetchers directly (they hit API_BASE_URL);
 * client islands go through the same-origin `/api/v1` rewrite proxy so
 * session cookies stay first-party. Deliberately self-contained — no
 * imports from lib/shop.ts or lib/orders.ts (those belong to the kits
 * storefront; cross-coupling is avoided on purpose).
 */

import { track } from "./analytics";

/* ────────────────────────────── DTOs ────────────────────────────── */

export interface PujaVariant {
  key: string;
  name: string;
  /** e.g. "45 min" */
  duration: string;
  /** e.g. "core vidhi" */
  scope: string;
  pricePaise: number;
}

export interface TimeSlot {
  key: string;
  /** e.g. "Early morning" */
  label: string;
  /** e.g. "6–9 am" */
  window: string;
}

export interface PujaType {
  slug: string;
  name: string;
  nameHi: string;
  description: string;
  vidhiOverview: string;
  vidhiPreviewSteps: string[];
  hueClass: string;
  variants: PujaVariant[];
  allowedSlots: string[];
  kitIncludedDefault: boolean;
  kitNote: string;
  annual?: boolean;
  seasonNote?: string | null;
  linkedGuideSlug?: string | null;
  active?: boolean;
}

export interface PurohitAvailability {
  slug: string;
  name: string;
  rating: number;
  pujaCount: number;
  languages: string[];
  lineageNote: string;
  /** Slot keys still free on the requested date. */
  freeSlots: string[];
}

export interface BookingAddress {
  name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
}

export type BookingPaymentMethod = "upi" | "card" | "netbanking";

export interface BookingPayload {
  pujaSlug: string;
  variantKey: string;
  purohitSlug: string;
  /** ISO date, at least tomorrow. */
  date: string;
  slot: string;
  kitIncluded: boolean;
  address: BookingAddress;
  paymentMethod: BookingPaymentMethod;
  phone: string;
}

export interface BookingCreated {
  bookingNumber: string;
  pricePaise: number;
  payment: { provider: string; confirmUrl: string; providerRef: string };
}

export type BookingStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUND_INITIATED"
  | "REFUNDED";

/** Buyer-facing booking — mirrors the API's BookingView (no internal ids). */
export interface BookingView {
  bookingNumber: string;
  status: BookingStatus;
  statusNote?: string | null;
  pujaName: string;
  variantName: string;
  purohitName: string;
  /** ISO date. */
  date: string;
  slot: string;
  /** e.g. "6–9 am" */
  slotWindow: string;
  kitIncluded: boolean;
  pricePaise: number;
  address: BookingAddress;
  /** ISO instant — free cancellation deadline. */
  cancellableUntil?: string | null;
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

export type BookingResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; code: string; message: string };

const NETWORK_COPY =
  "We couldn't reach Tapa just now. Check your connection and try again.";
const GENERIC_COPY = "Something didn't go through. Please try again.";

async function call<T>(
  path: string,
  method: "GET" | "POST" = "GET",
  body?: unknown,
): Promise<BookingResult<T>> {
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

export interface PujaCatalog {
  items: PujaType[];
  slots: TimeSlot[];
}

/** All puja types + the canonical slot list. Empty catalog on any failure. */
export async function fetchPujas(): Promise<PujaCatalog> {
  const r = await call<PujaCatalog>("/pujas");
  if (!r.ok) return { items: [], slots: FALLBACK_SLOTS };
  return {
    items: r.data.items ?? [],
    slots: r.data.slots?.length ? r.data.slots : FALLBACK_SLOTS,
  };
}

/** One puja type by slug. `null` on any failure (backend down included). */
export async function fetchPuja(slug: string): Promise<PujaType | null> {
  const r = await call<PujaType>(`/pujas/${encodeURIComponent(slug)}`);
  return r.ok ? r.data : null;
}

/* ─────────────────────── client flow helpers ────────────────────── */

/** Purohits free on a date (422 below the one-day-notice line). */
export const fetchAvailability = (slug: string, date: string, city?: string) =>
  call<PurohitAvailability[]>(
    `/pujas/${encodeURIComponent(slug)}/availability?date=${encodeURIComponent(date)}${
      city ? `&city=${encodeURIComponent(city)}` : ""
    }`,
  );

export const submitBooking = (payload: BookingPayload) =>
  call<BookingCreated>("/bookings", "POST", payload);

export const confirmMockBookingPayment = (providerRef: string) =>
  call<BookingView>("/bookings/payments/mock/confirm", "POST", { providerRef });

/** Guest tracking — booking number + the phone it was booked with. */
export const fetchBooking = (bookingNumber: string, phone: string) =>
  call<BookingView>(
    `/bookings/${encodeURIComponent(bookingNumber.trim())}?phone=${encodeURIComponent(phone.trim())}`,
  );

/** Free cancellation (until 24h before the puja); phone confirms ownership. */
export const cancelBooking = (bookingNumber: string, phone: string) =>
  call<BookingView>(
    `/bookings/${encodeURIComponent(bookingNumber.trim())}/cancel`,
    "POST",
    { phone: phone.trim() },
  );

/** Account booking history — newest first. 401 simply means signed out. */
export const getMyBookings = () => call<BookingView[]>("/me/bookings");

/**
 * Booking analytics ride the existing commerce event names — the union in
 * lib/analytics.ts is closed, so bookings tag themselves via `flow` props.
 */
export const bookingTrack = (
  event: "checkout_started" | "payment_completed" | "payment_failed",
  props: Record<string, unknown> = {},
) => track(event, { flow: "purohit_booking", ...props });

/* ─────────────────────────── money ──────────────────────────────── */

/** Paise → "₹7,100" (en-IN grouping; shows paise only when non-zero). */
export function formatPaise(paise: number): string {
  const rupees = paise / 100;
  const hasPaise = Math.round(paise) % 100 !== 0;
  return `₹${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: hasPaise ? 2 : 0,
  }).format(rupees)}`;
}

/** Cheapest variant → "from ₹7,100" (or the exact price when only one). */
export function priceHint(variants: PujaVariant[]): string {
  if (variants.length === 0) return "";
  const min = Math.min(...variants.map((v) => v.pricePaise));
  return variants.length > 1 ? `from ${formatPaise(min)}` : formatPaise(min);
}

/* ─────────────────────────── slots ──────────────────────────────── */

/** Mirror of the backend slot table — used when the API can't be reached. */
export const FALLBACK_SLOTS: TimeSlot[] = [
  { key: "early-morning", label: "Early morning", window: "6–9 am" },
  { key: "morning", label: "Morning", window: "9 am–12 pm" },
  { key: "afternoon", label: "Afternoon", window: "12–4 pm" },
  { key: "evening", label: "Evening", window: "4–7 pm" },
];

const slotOf = (key: string, slots?: TimeSlot[]): TimeSlot | undefined =>
  (slots ?? FALLBACK_SLOTS).find((s) => s.key === key) ??
  FALLBACK_SLOTS.find((s) => s.key === key);

/** "early-morning" → "Early morning". Falls back to the raw key. */
export const slotLabel = (key: string, slots?: TimeSlot[]): string =>
  slotOf(key, slots)?.label ?? key;

/** "early-morning" → "6–9 am". Empty string when unknown. */
export const slotWindow = (key: string, slots?: TimeSlot[]): string =>
  slotOf(key, slots)?.window ?? "";

/** "early-morning" → "Early morning · 6–9 am". */
export function slotFull(key: string, slots?: TimeSlot[]): string {
  const s = slotOf(key, slots);
  return s ? `${s.label} · ${s.window}` : key;
}

/** Allowed-slots hint for listings: "Early morning or Morning". */
export function slotsHint(keys: string[], slots?: TimeSlot[]): string {
  const labels = keys.map((k) => slotLabel(k, slots));
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(", ")} or ${labels[labels.length - 1]}`;
}

/* ─────────────────────────── dates ──────────────────────────────── */

/** ISO date for the earliest bookable day (tomorrow, local time). */
export function minBookingDate(now = new Date()): string {
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

export type BookingTone = "neutral" | "progress" | "good" | "attention";

export interface BookingStatusMeta {
  /** Short human label — never the raw enum. */
  label: string;
  tone: BookingTone;
}

export const BOOKING_STATUS_META: Record<BookingStatus, BookingStatusMeta> = {
  PENDING_PAYMENT: { label: "Payment pending", tone: "attention" },
  CONFIRMED: { label: "Confirmed", tone: "good" },
  COMPLETED: { label: "Puja completed", tone: "good" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
  REFUND_INITIATED: { label: "Refund on its way", tone: "progress" },
  REFUNDED: { label: "Refunded in full", tone: "good" },
};

export const bookingStatusMeta = (status: string): BookingStatusMeta =>
  BOOKING_STATUS_META[status as BookingStatus] ?? {
    label: status,
    tone: "neutral",
  };

const CANCELLABLE: ReadonlySet<BookingStatus> = new Set([
  "PENDING_PAYMENT",
  "CONFIRMED",
]);

/** True while free cancellation (until 24h before the puja) is still open. */
export function canCancelBooking(booking: BookingView, now: Date): boolean {
  if (!CANCELLABLE.has(booking.status)) return false;
  if (!booking.cancellableUntil) return false;
  const until = new Date(booking.cancellableUntil);
  return !Number.isNaN(until.getTime()) && now.getTime() < until.getTime();
}

/** ISO instant → "9 September, 6:00 am" for the cancellation deadline. */
export function formatDeadline(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = d.toLocaleDateString("en-IN", { day: "numeric", month: "long" });
  const time = d
    .toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true })
    .replace(/\s?(am|pm)/i, (m) => m.toLowerCase());
  return `${day}, ${time}`;
}
