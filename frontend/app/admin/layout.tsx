"use client";

/**
 * Admin shell — internal tool, role-gated client-side (the API enforces
 * ROLE_EDITOR/ROLE_ADMIN server-side regardless). Compact left nav, dense
 * content column, Tapa tokens without the consumer polish.
 */

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { checkAdminAccess, type AdminAccess } from "@/lib/admin";

const NAV: { href: string; label: string }[] = [
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/mandali", label: "Mandali" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/purohits", label: "Purohits" },
  { href: "/admin/articles", label: "Articles" },
  { href: "/admin/panchang", label: "Panchang" },
  { href: "/admin/observances", label: "Observances" },
  { href: "/admin/glossary", label: "Glossary" },
  { href: "/admin/search", label: "Search" },
  { href: "/admin/corrections", label: "Corrections" },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/notify", label: "Notify list" },
  { href: "/admin/flags", label: "Flags" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [access, setAccess] = useState<AdminAccess | "loading">("loading");
  const pathname = usePathname();

  useEffect(() => {
    void checkAdminAccess().then(setAccess);
  }, []);

  if (access === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-[12px] text-sub">
        Checking access…
      </div>
    );
  }

  if (access !== "ok") {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-[440px] items-center px-4">
        <div className="w-full rounded-lg border border-border bg-card p-5 text-[13px]">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[1px] text-gold">
            Tapa · Admin
          </p>
          {access === "unauthenticated" && (
            <>
              <p className="mb-3 text-body">
                You are not signed in. Admin access uses the same phone-OTP
                sign-in as the site — use an admin phone number.
              </p>
              <Link
                href="/sign-in?next=/admin"
                className="inline-block rounded-[5px] bg-cta px-3 py-1.5 text-[12px] font-bold text-white"
              >
                Sign in with OTP →
              </Link>
            </>
          )}
          {access === "forbidden" && (
            <p className="text-body">
              Your account does not carry the EDITOR/ADMIN role. Ask an admin
              to add your phone to <code className="text-gold">tapa.admin.phones</code>,
              then sign in again.
            </p>
          )}
          {access === "error" && (
            <p className="text-body">
              Could not reach the API. Is the backend running on port 8080?
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1240px] gap-4 px-3 py-4">
      <aside className="w-[168px] shrink-0">
        <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[1.2px] text-gold">
          Tapa · Admin
        </p>
        <nav className="flex flex-col gap-0.5">
          {NAV.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-[5px] px-2 py-1 text-[12px] ${
                  active
                    ? "bg-card font-bold text-ink shadow-sm"
                    : "text-mid hover:bg-card hover:text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <p className="mt-4 px-2 text-[10px] leading-4 text-sub">
          Internal tool. Everything here changes the live site.
        </p>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
