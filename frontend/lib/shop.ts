/**
 * Shop domain — Phase 2 storefront (P2-M3).
 *
 * Everything commerce lives here: product DTOs and fetchers, the client
 * cart (localStorage), the paise → "₹1,751" formatter, and the checkout /
 * mock-payment / tracking / cancellation / pincode helpers.
 *
 * Server components call the fetchers directly (they hit API_BASE_URL);
 * client islands go through the same-origin `/api/v1` rewrite proxy so
 * session cookies stay first-party. Every helper is error-tolerant — the
 * storefront must render even while the backend is down.
 */

import { track } from "./analytics";

/* ────────────────────────────── DTOs ────────────────────────────── */

export type Availability = "PREBOOK" | "LIVE" | "COMING_SOON" | "SOLD_OUT";

export interface KitItem {
  n: number;
  name: string;
  qty: number;
  note?: string;
}

export interface Product {
  slug: string;
  category: string;
  title: string;
  titleDevanagari: string;
  eyebrow: string;
  season?: string;
  description: string;
  pricePaise: number;
  mrpPaise?: number;
  taxInclusive: boolean;
  hueClass: string;
  /** Media asset ids, first one leads the PDP gallery. Empty → hue-gradient plate. */
  imageIds?: string[];
  items: KitItem[];
  availability: Availability;
  orderByDate?: string;
  dispatchFrom?: string;
  festivalDate?: string;
  stock?: number;
  cancellationHours: number;
  linkedGuideSlugs?: string[];
  linkedObservanceSlug?: string;
  significanceHtml?: string;
  howToUseNote?: string;
}

export interface PincodeInfo {
  serviceable: boolean;
  etaDays?: number;
  /** Already the AND of the master switch and this pincode's own flag. */
  codAllowed?: boolean;
  /** Largest order the courier will collect cash for, in paise. */
  codMaxPaise?: number;
  /** Cash-handling fee added to a COD total, in paise. Usually 0. */
  codFeePaise?: number;
  /** Whether dated pre-book kits may go COD (normally false). */
  codOnPrebook?: boolean;
  area?: string;
}

export interface OrderAddress {
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
}

export interface OrderLine {
  productSlug: string;
  title: string;
  qty: number;
  unitPricePaise: number;
  orderByDate?: string;
  festivalDate?: string;
}

export interface OrderView {
  orderNumber: string;
  status: string;
  statusNote?: string;
  items: OrderLine[];
  subtotalPaise: number;
  deliveryPaise: number;
  totalPaise: number;
  address: OrderAddress;
  expectedDelivery?: string;
  festivalDate?: string;
  cancellableUntil?: string;
  trackingId?: string;
  courier?: string;
  createdAt: string;
  /** set once a dispatched order is running late */
  revisedDeliveryDate?: string;
  /** buyer chose "I will refuse the delivery" on a delayed order */
  refusalRequested?: boolean;
}

export type PaymentMethod = "upi" | "card" | "netbanking" | "cod";

export interface CheckoutPayload {
  items: { productSlug: string; qty: number }[];
  address: OrderAddress;
  paymentMethod: PaymentMethod;
  phone: string;
}

/** Dev/mock intent — the client confirms it itself, no gateway involved. */
export interface MockPayment {
  provider: "mock";
  confirmUrl: string;
  providerRef: string;
}

/** Everything checkout.js needs to open Razorpay's modal. */
export interface RazorpayPayment {
  provider: "razorpay";
  keyId: string;
  razorpayOrderId: string;
  amountPaise: number;
  currency: string;
  orderNumber: string;
  preferredMethod: PaymentMethod;
  testMode: boolean;
  verifyUrl: string;
}

/**
 * A prepaid checkout returns a gateway intent; a COD checkout returns what is
 * owed at the door and no providerRef — the order is already CONFIRMED.
 */
export type CheckoutPayment =
  | RazorpayPayment
  | MockPayment
  | { method: "cod"; amountDuePaise: number };

export function isCodPayment(
  p: CheckoutPayment,
): p is { method: "cod"; amountDuePaise: number } {
  return "method" in p && p.method === "cod";
}

export function isRazorpayPayment(p: CheckoutPayment): p is RazorpayPayment {
  return "provider" in p && p.provider === "razorpay";
}

export interface CheckoutResult {
  orderNumber: string;
  totalPaise: number;
  payment: CheckoutPayment;
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

export type ShopResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string };

const NETWORK_COPY =
  "We couldn't reach Tapa just now. Check your connection and try again.";

async function call<T>(
  path: string,
  init?: { method?: "GET" | "POST"; body?: unknown },
): Promise<ShopResult<T>> {
  try {
    const res = await fetch(`${API_BASE}/api/v1${path}`, {
      method: init?.method ?? "GET",
      credentials: "include",
      cache: "no-store",
      headers: init?.body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
    const body = (await res.json().catch(() => null)) as Envelope<T> | null;
    if (!res.ok || !body || body.error || body.data == null) {
      return {
        ok: false,
        status: res.status,
        message: body?.error?.message ?? NETWORK_COPY,
      };
    }
    return { ok: true, data: body.data };
  } catch {
    return { ok: false, status: 0, message: NETWORK_COPY };
  }
}

/* ─────────────────────────── Fetchers ───────────────────────────── */

/**
 * Cached product list for server components on ISR pages (homepage rail,
 * hero pre-book slide). 5-minute revalidate under the "home" tag — unlike
 * fetchProducts() this never opts the page into dynamic rendering. `[]` on
 * any failure; the storefront must render even while the backend is down.
 */
export async function fetchProductsCached(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/products`, {
      next: { revalidate: 300, tags: ["home"] },
    });
    if (!res.ok) return [];
    const body = (await res.json().catch(() => null)) as Envelope<
      Product[]
    > | null;
    return Array.isArray(body?.data) ? body.data : [];
  } catch {
    return [];
  }
}

/** All products, optionally filtered by category. `[]` on any failure. */
export async function fetchProducts(category?: string): Promise<Product[]> {
  const q = category ? `?category=${encodeURIComponent(category)}` : "";
  const r = await call<Product[]>(`/products${q}`);
  return r.ok ? r.data : [];
}

/** One product by slug. `null` on any failure (backend down included). */
export async function fetchProduct(slug: string): Promise<Product | null> {
  const r = await call<Product>(`/products/${encodeURIComponent(slug)}`);
  return r.ok ? r.data : null;
}

export const checkPincode = (pincode: string) =>
  call<PincodeInfo>(`/pincode/${encodeURIComponent(pincode)}`);

export const submitCheckout = (payload: CheckoutPayload) =>
  call<CheckoutResult>("/checkout", { method: "POST", body: payload });

export const confirmMockPayment = (providerRef: string) =>
  call<OrderView>("/payments/mock/confirm", {
    method: "POST",
    body: { providerRef },
  });

/** Razorpay's checkout.js success handler hands us exactly these three. */
export interface RazorpayHandlerResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/**
 * The fast path to a confirmation screen. The webhook is what actually decides
 * the order's fate, so a failure here is not a failed payment — it only means
 * we could not show the good news synchronously.
 */
export const verifyRazorpayPayment = (r: RazorpayHandlerResponse) =>
  call<OrderView>("/payments/razorpay/verify", { method: "POST", body: r });

export const fetchOrder = (orderNumber: string, phone: string) =>
  call<OrderView>(
    `/orders/${encodeURIComponent(orderNumber.trim())}?phone=${encodeURIComponent(phone.trim())}`,
  );

export const cancelOrder = (orderNumber: string, phone: string) =>
  call<OrderView>(`/orders/${encodeURIComponent(orderNumber.trim())}/cancel`, {
    method: "POST",
    body: { phone: phone.trim() },
  });

/** "I will refuse the delivery" on a delayed/dispatched order. */
export const refuseDelivery = (orderNumber: string, phone: string) =>
  call<OrderView>(`/orders/${encodeURIComponent(orderNumber.trim())}/refuse`, {
    method: "POST",
    body: { phone: phone.trim() },
  });

export const submitNotifyMe = (
  phone: string,
  opts?: { context?: "kits" | "purohit" | "restock"; articleSlug?: string },
) =>
  call<unknown>("/notify-me", {
    method: "POST",
    body: {
      context: opts?.context ?? "kits",
      phone: phone.trim(),
      ...(opts?.articleSlug ? { articleSlug: opts.articleSlug } : {}),
    },
  });

/* ─────────────────────────── Formatting ─────────────────────────── */

/** Paise → "₹1,751" (en-IN grouping; shows paise only when non-zero). */
export function formatPaise(paise: number): string {
  const rupees = paise / 100;
  const hasPaise = Math.round(paise) % 100 !== 0;
  return `₹${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: hasPaise ? 2 : 0,
  }).format(rupees)}`;
}

function parseIsoDate(iso: string): Date {
  // Dates arrive as "2026-10-01" — pin to UTC noon so no timezone shifts the day.
  return new Date(`${iso.slice(0, 10)}T12:00:00Z`);
}

/** "2026-10-04" → "4 October 2026" */
export function formatDateLong(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(parseIsoDate(iso));
}

/** "2026-10-04" → "4 October" */
export function formatDateMedium(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(parseIsoDate(iso));
}

/** "2026-10-01" → "1 OCT" — the badge form of the order-by cut-off. */
export function formatDateShortCaps(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })
    .format(parseIsoDate(iso))
    .toUpperCase();
}

/* ─────────────────────────── Delivery rule ──────────────────────── */

/** Delivery is free at or above ₹999; ₹49 below it. */
export const FREE_DELIVERY_MIN_PAISE = 99_900;
export const DELIVERY_FEE_PAISE = 4_900;

export function deliveryPaiseFor(subtotalPaise: number): number {
  return subtotalPaise >= FREE_DELIVERY_MIN_PAISE ? 0 : DELIVERY_FEE_PAISE;
}

/* ─────────────────────────── Client cart ────────────────────────── */

export interface CartLine {
  productSlug: string;
  qty: number;
}

const CART_KEY = "tapa-cart";
/** Dispatched on every cart write — the header badge can hook in later. */
export const CART_EVENT = "tapa:cart-change";

export const MAX_QTY = 10;
export const MIN_QTY = 1;

export function readCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l): l is CartLine =>
        typeof l === "object" &&
        l !== null &&
        typeof (l as CartLine).productSlug === "string" &&
        typeof (l as CartLine).qty === "number" &&
        (l as CartLine).qty > 0,
    );
  } catch {
    return [];
  }
}

function writeCart(lines: CartLine[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(lines));
    window.dispatchEvent(
      new CustomEvent(CART_EVENT, {
        detail: { count: lines.reduce((n, l) => n + l.qty, 0) },
      }),
    );
  } catch {
    // storage unavailable — the cart quietly does nothing
  }
}

const clampQty = (qty: number) =>
  Math.min(MAX_QTY, Math.max(MIN_QTY, Math.round(qty)));

/** Add `qty` of a product (merging with an existing line, capped at 10). */
export function addToCart(productSlug: string, qty = 1): CartLine[] {
  const lines = readCart();
  const existing = lines.find((l) => l.productSlug === productSlug);
  const next = existing
    ? lines.map((l) =>
        l.productSlug === productSlug
          ? { ...l, qty: clampQty(l.qty + qty) }
          : l,
      )
    : [...lines, { productSlug, qty: clampQty(qty) }];
  writeCart(next);
  return next;
}

/** Set a line's quantity outright; 0 (or less) removes the line. */
export function updateCartQty(productSlug: string, qty: number): CartLine[] {
  const next =
    qty < 1
      ? readCart().filter((l) => l.productSlug !== productSlug)
      : readCart().map((l) =>
          l.productSlug === productSlug ? { ...l, qty: clampQty(qty) } : l,
        );
  writeCart(next);
  return next;
}

export function removeFromCart(productSlug: string): CartLine[] {
  const next = readCart().filter((l) => l.productSlug !== productSlug);
  writeCart(next);
  return next;
}

export function clearCart(): void {
  writeCart([]);
}

export function cartCount(): number {
  return readCart().reduce((n, l) => n + l.qty, 0);
}

/* ─────────────────────────── Analytics ──────────────────────────── */

export type ShopEventName =
  | "kit_viewed"
  | "kit_added_to_cart"
  | "cart_viewed"
  | "checkout_started"
  | "payment_completed"
  | "payment_failed"
  /** Captured at the gateway, but our synchronous verify call did not land —
      the webhook still settles the order. */
  | "payment_verify_failed"
  /** COD order placed — confirmed at once, so there is no payment_completed. */
  | "order_placed_cod"
  /** Razorpay returned a signature the server would not verify. */
  | "payment_verify_failed";

/**
 * Shop funnel events fan out through the shared track() pipeline.
 * lib/analytics.ts is being extended by another milestone concurrently, so
 * the shop event names live here until its EventName union absorbs them.
 */
export function shopTrack(
  event: ShopEventName,
  props: Record<string, unknown> = {},
): void {
  (track as unknown as (e: string, p?: Record<string, unknown>) => void)(
    event,
    props,
  );
}

/* ──────────────────────── Display helpers ───────────────────────── */

/** Today's calendar date in IST, "YYYY-MM-DD" — cut-offs are Indian days. */
export function todayIstIso(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());
}

/**
 * A PREBOOK kit whose order-by date has passed. The backend already rejects
 * such orders at checkout; this drives the honest UI (closed buy box,
 * "PRE-BOOKING CLOSED" chips) instead of letting the failure surface late.
 */
export function prebookClosed(p: Product): boolean {
  return (
    p.availability === "PREBOOK" &&
    !!p.orderByDate &&
    todayIstIso() > p.orderByDate.slice(0, 10)
  );
}

/** Card chip: "PRE-BOOK · ORDER BY 1 OCT" / "IN STOCK" / "OPENS SOON" / "SOLD OUT". */
export function availabilityChip(p: Product): string {
  switch (p.availability) {
    case "PREBOOK":
      if (prebookClosed(p)) return "PRE-BOOKING CLOSED";
      return p.orderByDate
        ? `PRE-BOOK · ORDER BY ${formatDateShortCaps(p.orderByDate)}`
        : "PRE-BOOK";
    case "LIVE":
      return "IN STOCK";
    case "COMING_SOON":
      return "OPENS SOON";
    case "SOLD_OUT":
      return "SOLD OUT";
  }
}

/** Price CTA always carries the amount: "Pre-book — ₹1,751" / "Add to cart — ₹751". */
export function priceCtaLabel(p: Product): string {
  if (p.availability === "PREBOOK") return `Pre-book — ${formatPaise(p.pricePaise)}`;
  return `Add to cart — ${formatPaise(p.pricePaise)}`;
}

/** The terms line under the CTA, per availability mode. */
export function termsLine(p: Product): string {
  if (p.availability === "PREBOOK") {
    return `Full amount payable at pre-booking. Cancellable within ${p.cancellationHours} hours.`;
  }
  return `Cancellable within ${p.cancellationHours} hours.`;
}
