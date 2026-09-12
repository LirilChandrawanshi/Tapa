import type { RazorpayHandlerResponse, RazorpayPayment } from "@/lib/shop";

/**
 * Razorpay Standard Checkout, loaded on demand.
 *
 * The script is only fetched when a buyer actually reaches the Pay button —
 * putting it in the layout would cost every reader of a vrat guide a
 * third-party request they will never use.
 */

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  image?: string;
  prefill?: { name?: string; contact?: string; email?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  method?: Record<string, boolean>;
  handler: (response: RazorpayHandlerResponse) => void;
  modal?: { ondismiss?: () => void; confirm_close?: boolean };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, cb: (payload: unknown) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

let loading: Promise<boolean> | null = null;

/** Resolves false rather than throwing — the caller has a fallback to run. */
export function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (loading) return loading;

  loading = new Promise<boolean>((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`,
    );
    const script = existing ?? document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.addEventListener("load", () => resolve(Boolean(window.Razorpay)));
    script.addEventListener("error", () => {
      loading = null; // a blocked CDN now may not be blocked on the retry
      resolve(false);
    });
    if (!existing) document.body.appendChild(script);
  });
  return loading;
}

export interface OpenRazorpayArgs {
  payment: RazorpayPayment;
  buyerName: string;
  buyerPhone: string;
  onSuccess: (response: RazorpayHandlerResponse) => void;
  /** Buyer closed the sheet without paying — not an error, just a retry. */
  onDismiss: () => void;
  /** Gateway-side failure (wrong PIN, expired VPA, bank down). */
  onFailed: (description: string) => void;
}

/**
 * Opens the modal. Returns false when the script could not load, so the caller
 * can tell the buyer honestly instead of leaving the button spinning.
 */
export async function openRazorpayCheckout(args: OpenRazorpayArgs): Promise<boolean> {
  const ready = await loadRazorpay();
  if (!ready || !window.Razorpay) return false;

  const { payment, buyerName, buyerPhone } = args;
  const instance = new window.Razorpay({
    key: payment.keyId,
    amount: payment.amountPaise,
    currency: payment.currency,
    order_id: payment.razorpayOrderId,
    name: "the tapa company",
    description: `Ritual Pujan · ${payment.orderNumber}`,
    prefill: {
      name: buyerName,
      // Razorpay wants the country code; our form collects 10 digits.
      contact: buyerPhone ? `+91${buyerPhone}` : undefined,
    },
    notes: { tapa_order: payment.orderNumber },
    theme: { color: "#FD066D" },
    handler: (response) => args.onSuccess(response),
    modal: { ondismiss: () => args.onDismiss() },
  });

  instance.on("payment.failed", (payload) => {
    const description =
      (payload as { error?: { description?: string } })?.error?.description ??
      "The payment could not be completed.";
    args.onFailed(description);
  });

  instance.open();
  return true;
}
