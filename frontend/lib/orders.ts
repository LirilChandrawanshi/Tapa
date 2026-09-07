/**
 * Order aftercare client helpers (P2-M4).
 *
 * Same contract as lib/auth.ts: every call goes through the same-origin
 * `/api/v1` proxy (httpOnly cookies stay first-party) and resolves to an
 * `{ ok }` result — network failures and API errors never throw.
 *
 * Money is integer paise end-to-end; `formatPaise` is the only place it
 * becomes "₹1,751". (Deliberately a local copy — lib/shop.ts is owned by
 * the storefront build and we avoid cross-coupling.)
 */

export interface OrderLine {
  productSlug: string;
  title: string;
  qty: number;
  unitPricePaise: number;
  /** ISO date or null — last day this pre-book line could be ordered. */
  orderByDate?: string | null;
  /** ISO date or null — the occasion this line serves. */
  festivalDate?: string | null;
}

export interface OrderAddress {
  name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
}

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "CONFIRMED"
  | "PACKING"
  | "DISPATCHED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUND_INITIATED"
  | "REFUNDED";

/** Buyer-facing order — mirrors the API's OrderView (no internal ids). */
export interface OrderView {
  orderNumber: string;
  status: OrderStatus;
  statusNote?: string | null;
  items: OrderLine[];
  subtotalPaise: number;
  deliveryPaise: number;
  totalPaise: number;
  address: OrderAddress;
  /** ISO date. */
  expectedDelivery?: string | null;
  /** ISO date — earliest dated item's occasion; set means "pre-booked". */
  festivalDate?: string | null;
  /** ISO instant — free cancellation deadline. */
  cancellableUntil?: string | null;
  trackingId?: string | null;
  courier?: string | null;
  /** ISO instant. */
  createdAt?: string | null;
  /** ISO instant — set once the order is cancelled. */
  cancelledAt?: string | null;
  /** "upi" | "card" | "netbanking" — how the order was paid. */
  paymentMethod?: string | null;
  /** Refund amount in paise (full refund policy — equals totalPaise). */
  refundPaise?: number | null;
}

export type OrdersResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; code: string; message: string };

interface Envelope<T> {
  data?: T | null;
  error?: { code?: string; message?: string } | null;
}

const NETWORK_COPY =
  "We couldn't reach Tapa just now. Check your connection and try again.";
const GENERIC_COPY = "Something didn't go through. Please try again.";

async function call<T>(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  body?: unknown,
): Promise<OrdersResult<T>> {
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
    return { ok: false, status: 0, code: "network", message: NETWORK_COPY };
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
      message: envelope?.error?.message ?? GENERIC_COPY,
    };
  }
  return { ok: true, data: (envelope?.data ?? null) as T };
}

/** Account order history — newest first. 401 simply means signed out. */
export const getMyOrders = () => call<OrderView[]>("/me/orders");

/** Attaches guest orders placed with the account's phone. Safe to call often. */
export const claimGuestOrders = () =>
  call<{ claimed: number }>("/me/orders/claim", "POST");

/** Free cancellation (within the window); phone confirms ownership.
 *  `reason` is the optional buyer-picked reason — never required. */
export const cancelOrder = (orderNumber: string, phone: string, reason?: string) =>
  call<OrderView>(`/orders/${encodeURIComponent(orderNumber)}/cancel`, "POST", {
    phone,
    ...(reason ? { reason } : {}),
  });

/** Guest-friendly order lookup — order number + the phone it was placed with. */
export const getOrder = (orderNumber: string, phone: string) =>
  call<OrderView>(
    `/orders/${encodeURIComponent(orderNumber.trim())}?phone=${encodeURIComponent(phone.trim())}`,
  );

/* ---------- report a problem (#147/#160) ---------- */

export type IssueReason =
  | "BOX_DAMAGED"
  | "ITEM_BROKEN"
  | "ITEM_MISSING"
  | "WRONG_ITEM"
  | "OTHER";

/** Radio labels — plain words, no blame on the buyer. */
export const ISSUE_REASONS: { value: IssueReason; label: string }[] = [
  { value: "BOX_DAMAGED", label: "The box arrived damaged" },
  { value: "ITEM_BROKEN", label: "Something inside is broken" },
  { value: "ITEM_MISSING", label: "Something is missing from the kit" },
  { value: "WRONG_ITEM", label: "I received the wrong item" },
  { value: "OTHER", label: "Something else" },
];

export interface IssueView {
  id: string;
  orderNumber: string;
  reason: IssueReason;
  details: string;
  photoNote: string;
  status: "NEW" | "IN_REVIEW" | "RESOLVED";
  createdAt?: string | null;
}

export const reportIssue = (
  orderNumber: string,
  body: { phone: string; reason: IssueReason; details: string },
) =>
  call<IssueView>(
    `/orders/${encodeURIComponent(orderNumber.trim())}/issues`,
    "POST",
    body,
  );

/* ---------- address book (#158) ---------- */

export interface SavedAddress {
  id: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  /** Live pincode serviceability, joined by the API on every read. */
  serviceable: boolean;
  etaDays?: number | null;
}

export interface AddressInput {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

/** 401 simply means signed out. Default address first. */
export const getAddresses = () => call<SavedAddress[]>("/me/addresses");

export const createAddress = (body: AddressInput) =>
  call<SavedAddress>("/me/addresses", "POST", body);

export const updateAddress = (id: string, body: AddressInput) =>
  call<SavedAddress>(`/me/addresses/${encodeURIComponent(id)}`, "PUT", body);

export const deleteAddress = (id: string) =>
  call<{ deleted: boolean }>(`/me/addresses/${encodeURIComponent(id)}`, "DELETE");

export const setDefaultAddress = (id: string) =>
  call<SavedAddress>(`/me/addresses/${encodeURIComponent(id)}/default`, "POST");

/* ---------- money ---------- */

const rupeeFmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const rupeePaiseFmt = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 175100 → "₹1,751"; 175150 → "₹1,751.50". Always the ₹ sign, en-IN grouping. */
export function formatPaise(paise: number): string {
  const rupees = paise / 100;
  return paise % 100 === 0
    ? `₹${rupeeFmt.format(rupees)}`
    : `₹${rupeePaiseFmt.format(rupees)}`;
}

/* ---------- status display metadata ---------- */

export type StatusTone = "neutral" | "progress" | "good" | "attention";

export interface StatusMeta {
  /** Short human label — never the raw enum. */
  label: string;
  tone: StatusTone;
  /**
   * Index on the 4-step timeline (0 pre-booked/confirmed · 1 packing ·
   * 2 dispatched · 3 delivered), or null when the order left the happy path.
   */
  step: 0 | 1 | 2 | 3 | null;
}

export const STATUS_META: Record<OrderStatus, StatusMeta> = {
  PENDING_PAYMENT: { label: "Payment pending", tone: "attention", step: 0 },
  CONFIRMED: { label: "Confirmed", tone: "good", step: 0 },
  PACKING: { label: "Being packed", tone: "progress", step: 1 },
  DISPATCHED: { label: "On its way", tone: "progress", step: 2 },
  DELIVERED: { label: "Delivered", tone: "good", step: 3 },
  CANCELLED: { label: "Cancelled", tone: "neutral", step: null },
  REFUND_INITIATED: { label: "Refund on its way", tone: "progress", step: null },
  REFUNDED: { label: "Refunded in full", tone: "good", step: null },
};

export const statusMeta = (status: string): StatusMeta =>
  STATUS_META[status as OrderStatus] ?? {
    label: status,
    tone: "neutral",
    step: null,
  };

/** First timeline step reads "Pre-booked" for festival kits, else "Confirmed". */
export const timelineSteps = (preBooked: boolean): string[] => [
  preBooked ? "Pre-booked" : "Confirmed",
  "Packing",
  "Dispatched",
  "Delivered",
];

const CANCELLABLE_STATUSES: ReadonlySet<OrderStatus> = new Set([
  "PENDING_PAYMENT",
  "CONFIRMED",
  "PACKING",
]);

/** True while free cancellation is still open for this order. */
export function canCancel(order: OrderView, now: Date): boolean {
  if (!CANCELLABLE_STATUSES.has(order.status)) return false;
  if (!order.cancellableUntil) return false;
  const until = new Date(order.cancellableUntil);
  return !Number.isNaN(until.getTime()) && now.getTime() < until.getTime();
}

/* ---------- date copy ---------- */

/** "2026-09-14" → "14 September" (adds the year when it isn't the current one). */
export function formatDay(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso.includes("T") ? iso : `${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

/** ISO instant → "14 September, 6:30 pm" for the cancellation deadline. */
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
