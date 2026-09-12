"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  deliveryPaiseFor,
  fetchProducts,
  formatDateShortCaps,
  formatPaise,
  FREE_DELIVERY_MIN_PAISE,
  MAX_QTY,
  readCart,
  removeFromCart,
  shopTrack,
  updateCartQty,
  type CartLine,
  type Product,
} from "@/lib/shop";

const TRUST_LINE =
  "Samagri is ritually verified and sourced from trusted suppliers.";

/** Cart page body — lines, live totals, the delivery rule, and checkout. */
export function CartView() {
  const [lines, setLines] = useState<CartLine[] | null>(null);
  const [products, setProducts] = useState<Map<string, Product> | null>(null);

  useEffect(() => {
    const cart = readCart();
    setLines(cart);
    shopTrack("cart_viewed", {
      lines: cart.length,
      units: cart.reduce((n, l) => n + l.qty, 0),
    });
    void fetchProducts().then((all) =>
      setProducts(new Map(all.map((p) => [p.slug, p]))),
    );
  }, []);

  const resolved = useMemo(() => {
    if (!lines || !products) return null;
    return lines
      .map((l) => {
        const product = products.get(l.productSlug);
        return product ? { ...l, product } : null;
      })
      .filter((l): l is CartLine & { product: Product } => l !== null);
  }, [lines, products]);

  if (lines === null) {
    return <p className="py-14 text-center text-[13.5px] text-sub">Loading your cart…</p>;
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-[420px] py-14 text-center">
        <p aria-hidden className="mb-3 text-4xl">
          🛍
        </p>
        <h2 className="mb-2 text-xl font-bold text-ink">Nothing here yet</h2>
        <p className="mb-5 text-[13.5px] leading-relaxed text-sub">
          Start with a ritual guide to find the right kit. Kits are optional
          anyway — every guide works without one.
        </p>
        <Link
          href="/ritual-guides"
          className="inline-block rounded-[10px] bg-cta px-6 py-[11px] text-[13.5px] font-bold text-white"
        >
          Browse the ritual guides ›
        </Link>
        <p className="mt-3">
          <Link
            href="/ritual-pujans"
            className="text-[12.5px] font-bold text-cta"
          >
            Or go straight to the Ritual Pujans ›
          </Link>
        </p>
      </div>
    );
  }

  if (!products) {
    return <p className="py-14 text-center text-[13.5px] text-sub">Loading your cart…</p>;
  }

  if (!resolved || resolved.length === 0) {
    return (
      <div className="mx-auto max-w-[420px] py-14 text-center">
        <h2 className="mb-2 text-xl font-bold text-ink">
          We couldn&apos;t load your cart just now
        </h2>
        <p className="text-[13.5px] leading-relaxed text-sub">
          Your items are safe on this device. Check your connection and
          refresh.
        </p>
      </div>
    );
  }

  const subtotal = resolved.reduce(
    (n, l) => n + l.product.pricePaise * l.qty,
    0,
  );
  const delivery = deliveryPaiseFor(subtotal);
  const total = subtotal + delivery;
  const shortOfFree = FREE_DELIVERY_MIN_PAISE - subtotal;

  const setQty = (slug: string, qty: number) => setLines(updateCartQty(slug, qty));

  return (
    <div className="grid items-start gap-6 md:grid-cols-[1.6fr_1fr]">
      <div>
        <ul className="overflow-hidden rounded-[14px] border border-border bg-card">
          {resolved.map(({ product: p, qty }) => (
            <li
              key={p.slug}
              className="flex gap-[14px] border-b border-border-light p-[15px] last:border-b-0"
            >
              <Link
                href={`/ritual-pujans/p/${p.slug}`}
                className={`${p.hueClass} flex size-[64px] shrink-0 items-center justify-center rounded-[10px]`}
              >
                <span className="font-devanagari text-[20px] text-white/90">
                  {p.titleDevanagari}
                </span>
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/ritual-pujans/p/${p.slug}`}
                      className="text-[14.5px] font-bold text-ink hover:text-cta"
                    >
                      {p.title}
                    </Link>
                    {p.orderByDate && (
                      <span className="ml-2 inline-flex rounded-[5px] border border-amber/40 bg-pratha-bg px-[7px] py-[2px] align-middle text-[9.5px] font-bold tracking-[0.4px] text-pratha-fg">
                        ORDER BY {formatDateShortCaps(p.orderByDate)}
                      </span>
                    )}
                    <p className="mt-[2px] text-[12px] text-sub">
                      {formatPaise(p.pricePaise)} each
                    </p>
                  </div>
                  <span className="text-[14.5px] font-bold whitespace-nowrap text-ink">
                    {formatPaise(p.pricePaise * qty)}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-4">
                  <div className="flex items-center rounded-[8px] border border-border">
                    <button
                      type="button"
                      aria-label={`Decrease quantity of ${p.title}`}
                      onClick={() => setQty(p.slug, qty - 1)}
                      className="px-3 py-[5px] text-[14px] font-bold text-body"
                    >
                      −
                    </button>
                    <span className="min-w-[22px] text-center text-[13px] font-bold text-ink">
                      {qty}
                    </span>
                    <button
                      type="button"
                      aria-label={`Increase quantity of ${p.title}`}
                      disabled={qty >= MAX_QTY}
                      onClick={() => setQty(p.slug, qty + 1)}
                      className="px-3 py-[5px] text-[14px] font-bold text-body disabled:text-border"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLines(removeFromCart(p.slug))}
                    className="text-[12px] font-semibold text-sub hover:text-cta"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[12.5px] text-sub">✓ {TRUST_LINE}</p>
      </div>

      <aside className="rounded-[14px] border border-border bg-card p-[18px] md:sticky md:top-[88px] md:max-h-[calc(100vh-104px)] md:overflow-y-auto md:overscroll-contain">
        <h2 className="mb-3 text-[15px] font-bold text-ink">Order summary</h2>
        <dl className="space-y-[9px] text-[13.5px]">
          <div className="flex justify-between">
            <dt className="text-sub">Subtotal</dt>
            <dd className="font-semibold text-ink">{formatPaise(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-sub">Delivery</dt>
            <dd
              className={
                delivery === 0 ? "font-bold text-dharma-fg" : "font-semibold text-ink"
              }
            >
              {delivery === 0 ? "Free" : formatPaise(delivery)}
            </dd>
          </div>
        </dl>
        {delivery > 0 && (
          <p className="mt-2 rounded-[8px] bg-pratha-bg px-3 py-2 text-[12px] text-pratha-fg">
            Add {formatPaise(shortOfFree)} more for free delivery — free at or
            above {formatPaise(FREE_DELIVERY_MIN_PAISE)}.
          </p>
        )}
        <div className="mt-3 flex justify-between border-t border-border pt-3 text-[15px] font-bold text-ink">
          <span>Total</span>
          <span>{formatPaise(total)}</span>
        </div>
        <p className="mt-1 text-[11.5px] text-sub">Inclusive of all taxes</p>
        <Link
          href="/checkout"
          className="mt-4 block rounded-[10px] bg-cta px-6 py-[12px] text-center text-[14px] font-bold text-white hover:opacity-90"
        >
          Checkout — {formatPaise(total)}
        </Link>
      </aside>
    </div>
  );
}
