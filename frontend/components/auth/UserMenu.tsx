"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AUTH_EVENT, getMe, logout, type Me } from "@/lib/auth";

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.19 8.19 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23Z" />
    </svg>
  );
}

function initialsOf(name: string, phone: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return phone.slice(-2);
}

const MENU_LINKS = [
  { label: "My Account", href: "/account" },
  { label: "Saved Rituals", href: "/account" },
  { label: "Orders", href: "/account/orders" },
  { label: "Puja Bookings", href: "/account/bookings" },
] as const;

/**
 * The nav's auth affordance. Signed out → the Sign in button; signed in → an
 * initials avatar with the account menu (per the Header spec). Refreshes on
 * mount, window focus and the AUTH_EVENT fired by sign-in/sign-out.
 */
export function UserMenu({
  variant,
  showCreateAccount = true,
}: {
  variant: "desktop" | "drawer";
  /** Desktop only — phase 2 drops "Create account" in favour of the cart. */
  showCreateAccount?: boolean;
}) {
  const [me, setMe] = useState<Me | null>(null);
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const result = await getMe();
    setMe(result.ok ? result.data : null);
    setChecked(true);
  }, []);

  useEffect(() => {
    void refresh();
    const onChange = () => void refresh();
    window.addEventListener(AUTH_EVENT, onChange);
    window.addEventListener("focus", onChange);
    return () => {
      window.removeEventListener(AUTH_EVENT, onChange);
      window.removeEventListener("focus", onChange);
    };
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const onLogout = async () => {
    setOpen(false);
    await logout();
    window.location.href = "/";
  };

  /* ---------- drawer (mobile) ---------- */
  if (variant === "drawer") {
    if (!me) {
      return (
        <div className="flex flex-col gap-[9px]">
          <Link
            href="/tapa-circle?from=/"
            className="flex items-center justify-center gap-[9px] rounded-xl bg-wa py-[14px] text-center text-[14.5px] font-bold text-white"
          >
            <WhatsAppIcon /> Join the Tapa Circle
          </Link>
          <Link
            href="/sign-in"
            className="block w-full rounded-xl bg-cta py-[14px] text-center text-[14.5px] font-bold text-white"
          >
            Create account
          </Link>
          <Link
            href="/sign-in"
            className="block w-full rounded-xl border-[1.5px] border-border py-[14px] text-center text-[14.5px] font-bold text-body"
          >
            Sign in
          </Link>
        </div>
      );
    }
    return (
      <Link
        href="/account"
        className="mb-[9px] flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cta text-[13px] font-bold text-white">
          {initialsOf(me.name, me.phone)}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-bold text-ink">
            {me.name || "My Account"}
          </span>
          <span className="block text-[11.5px] text-sub">{me.phone}</span>
        </span>
        <span aria-hidden className="ml-auto text-sub">
          ›
        </span>
      </Link>
    );
  }

  /* ---------- desktop ---------- */
  if (!checked || !me) {
    return (
      <div className="hidden items-center gap-[9px] lg:flex">
        <Link
          href="/sign-in"
          className="rounded-[10px] border-[1.5px] border-border px-[17px] py-[10px] text-[13.5px] font-semibold whitespace-nowrap text-body"
        >
          Sign in
        </Link>
        {showCreateAccount && (
          <Link
            href="/sign-in"
            className="rounded-[10px] bg-cta px-[19px] py-[11px] text-[13.5px] font-bold whitespace-nowrap text-white"
          >
            Create account
          </Link>
        )}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative hidden lg:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-cta text-[13.5px] font-bold text-white hover:opacity-90"
      >
        {initialsOf(me.name, me.phone)}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-[70] mt-2 w-[230px] overflow-hidden rounded-[13px] border border-border bg-card shadow-lg"
        >
          <div className="border-b border-border-light px-4 py-3">
            <p className="truncate text-[13.5px] font-bold text-ink">
              {me.name || "Tapa Member"}
            </p>
            <p className="text-[11.5px] text-sub">{me.phone}</p>
          </div>
          {MENU_LINKS.map((link, i) =>
            // "My Account" and "Saved Rituals" share a target; skip the dup row
            i === 1 ? null : (
              <Link
                key={link.label}
                role="menuitem"
                href={link.href}
                onClick={() => setOpen(false)}
                className="block px-4 py-[10px] text-[13px] font-semibold text-body hover:bg-bg"
              >
                {link.label}
              </Link>
            ),
          )}
          <button
            role="menuitem"
            onClick={() => void onLogout()}
            className="block w-full border-t border-border-light px-4 py-[10px] text-left text-[13px] font-semibold text-cta hover:bg-bg"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
