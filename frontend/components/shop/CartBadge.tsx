"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CART_EVENT,
  cartCount,
  fetchProducts,
  formatDateShortCaps,
  formatPaise,
  readCart,
  type CartLine,
  type Product,
} from "@/lib/shop";

function CartIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 7h12l1.2 12.2a1.5 1.5 0 0 1-1.5 1.8H6.3a1.5 1.5 0 0 1-1.5-1.8L6 7Z" />
      <path d="M9 10V6a3 3 0 0 1 6 0v4" />
    </svg>
  );
}

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      aria-hidden
      className="absolute -top-[5px] -right-[5px] flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-cta px-[4px] text-[9.5px] leading-none font-bold text-white"
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

/**
 * Header cart entry — live item-count badge fed by localStorage `tapa-cart`
 * (via the `tapa:cart-change` CustomEvent, plus cross-tab `storage`).
 * Desktop: click opens a mini-cart dropdown; mobile: the icon links
 * straight to /cart. Rendered only while `kits_launched` is on.
 */
export function CartBadge() {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [products, setProducts] = useState<Map<string, Product> | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Count is client-only state; first paint is 0 to keep hydration clean.
  useEffect(() => {
    const sync = () => setCount(cartCount());
    sync();
    window.addEventListener(CART_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CART_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  // Resolve line items when the panel opens (and keep them live while open).
  useEffect(() => {
    if (!open) return;
    const syncLines = () => setLines(readCart());
    syncLines();
    window.addEventListener(CART_EVENT, syncLines);
    if (!products) {
      void fetchProducts().then((all) =>
        setProducts(new Map(all.map((p) => [p.slug, p]))),
      );
    }
    return () => window.removeEventListener(CART_EVENT, syncLines);
  }, [open, products]);

  // Outside click / ESC closes the panel.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const resolved = useMemo(() => {
    if (!products) return null;
    return lines
      .map((l) => {
        const product = products.get(l.productSlug);
        return product ? { ...l, product } : null;
      })
      .filter((l): l is CartLine & { product: Product } => l !== null);
  }, [lines, products]);

  const subtotal =
    resolved?.reduce((n, l) => n + l.product.pricePaise * l.qty, 0) ?? 0;

  const iconClasses =
    "relative flex h-10 w-10 items-center justify-center rounded-[10px] border-[1.5px] border-border bg-bg text-sub hover:text-cta";

  return (
    <div ref={rootRef} className="relative">
      {/* Mobile — straight to the cart page. */}
      <Link
        href="/cart"
        aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
        className={`${iconClasses} lg:hidden`}
      >
        <CartIcon />
        <Badge count={count} />
      </Link>

      {/* Desktop — mini-cart dropdown. */}
      <button
        type="button"
        aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`${iconClasses} hidden lg:flex ${open ? "border-cta text-cta" : ""}`}
      >
        <CartIcon />
        <Badge count={count} />
      </button>

      {open && (
        <div className="absolute top-[calc(100%+10px)] right-0 z-[130] hidden w-[340px] rounded-[14px] border border-border bg-card shadow-[0_14px_34px_rgba(28,23,18,0.16)] lg:block">
          {lines.length === 0 ? (
            <div className="px-5 py-7 text-center">
              <p className="mb-1 text-[14px] font-bold text-ink">
                Your cart is empty
              </p>
              <p className="mb-3 text-[12px] leading-relaxed text-sub">
                Every guide stays free whether you buy or not.
              </p>
              <Link
                href="/ritual-pujans"
                onClick={() => setOpen(false)}
                className="text-[13px] font-bold text-cta"
              >
                Browse Ritual Pujans ›
              </Link>
            </div>
          ) : resolved === null ? (
            <p className="px-5 py-7 text-center text-[13px] text-sub">
              Loading your bag…
            </p>
          ) : (
            <>
              <ul className="max-h-[300px] overflow-y-auto">
                {resolved.map(({ product: p, qty }) => (
                  <li
                    key={p.slug}
                    className="flex gap-[11px] border-b border-border-light px-4 py-3 last:border-b-0"
                  >
                    <Link
                      href={`/ritual-pujans/p/${p.slug}`}
                      onClick={() => setOpen(false)}
                      className={`${p.hueClass} flex size-[44px] shrink-0 items-center justify-center rounded-[9px]`}
                    >
                      <span className="font-devanagari text-[15px] text-white/90">
                        {p.titleDevanagari}
                      </span>
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/ritual-pujans/p/${p.slug}`}
                          onClick={() => setOpen(false)}
                          className="truncate text-[13px] font-bold text-ink hover:text-cta"
                        >
                          {p.title}
                        </Link>
                        <span className="text-[13px] font-bold whitespace-nowrap text-ink">
                          {formatPaise(p.pricePaise * qty)}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-sub">
                        {qty} × {formatPaise(p.pricePaise)}
                      </p>
                      {p.orderByDate && (
                        <span className="mt-[3px] inline-flex rounded-[4px] border border-amber/40 bg-pratha-bg px-[6px] py-[1px] text-[8.5px] font-bold tracking-[0.4px] text-pratha-fg">
                          ORDER BY {formatDateShortCaps(p.orderByDate)}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="border-t border-border px-4 py-3">
                <div className="mb-3 flex items-baseline justify-between text-[13.5px]">
                  <span className="text-sub">Subtotal</span>
                  <span className="font-bold text-ink">
                    {formatPaise(subtotal)}
                  </span>
                </div>
                <Link
                  href="/cart"
                  onClick={() => setOpen(false)}
                  className="block rounded-[10px] bg-cta px-5 py-[10px] text-center text-[13.5px] font-bold text-white hover:opacity-90"
                >
                  Checkout ›
                </Link>
                <p className="mt-2 text-center text-[10.5px] leading-snug text-sub">
                  Dated kits are prepaid. Free cancellation until dispatch.
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
