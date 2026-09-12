"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LANG_EVENT, type Lang } from "@/components/LangToggle";
import { OtpBottomSheet } from "@/components/auth/OtpBottomSheet";
import { getMe, getSavedRituals, logout, updateMe, type Me } from "@/lib/auth";
import { getReminders } from "@/lib/account";
import { getMyBookings } from "@/lib/booking";
import { getMyMandaliRequests } from "@/lib/mandali";
import { getMyOrders } from "@/lib/orders";

function initialsOf(name: string, phone: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return phone.slice(-2);
}

const ROW =
  "flex w-full items-center gap-3 px-4 py-[14px] text-left text-[14px]";

const GROUP_HEADER =
  "border-b border-border-light bg-bg px-4 py-[10px] text-[11px] font-bold uppercase tracking-[1px] text-mid";

export default function AccountPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);
  const [savedCount, setSavedCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);
  const [mandaliCount, setMandaliCount] = useState(0);
  const [reminderCount, setReminderCount] = useState(0);
  const [circleStatus, setCircleStatus] = useState<string>("NONE");
  const [circleOpen, setCircleOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [langBusy, setLangBusy] = useState(false);

  const load = useCallback(async () => {
    const [
      meRes,
      savedRes,
      ordersRes,
      bookingsRes,
      mandaliRes,
      remindersRes,
      circleRes,
    ] = await Promise.all([
      getMe(),
      getSavedRituals(),
      getMyOrders(),
      getMyBookings(),
      getMyMandaliRequests(),
      getReminders(),
      fetch("/api/v1/me/circle", {
        credentials: "include",
        cache: "no-store",
      })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]);
    setMe(meRes.ok ? meRes.data : null);
    setSavedCount(
      savedRes.ok ? savedRes.data.length : (meRes.ok ? meRes.data.savedCount : 0),
    );
    setOrderCount(ordersRes.ok ? (ordersRes.data ?? []).length : 0);
    setBookingCount(bookingsRes.ok ? (bookingsRes.data ?? []).length : 0);
    setMandaliCount(mandaliRes.ok ? (mandaliRes.data ?? []).length : 0);
    setReminderCount(remindersRes.ok ? (remindersRes.data ?? []).length : 0);
    setCircleStatus(circleRes?.data?.status ?? "NONE");
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function chooseLang(next: Lang) {
    if (!me || langBusy || me.languagePref === next) return;
    setLangBusy(true);
    const res = await updateMe({ languagePref: next });
    setLangBusy(false);
    if (res.ok) {
      setMe({ ...me, languagePref: next });
      // Keep the site-wide toggle in step with the account preference.
      document.cookie = `tapa-lang=${next}; path=/; max-age=31536000; samesite=lax`;
      window.dispatchEvent(
        new CustomEvent<{ lang: Lang }>(LANG_EVENT, { detail: { lang: next } }),
      );
    }
  }

  async function onLogout() {
    await logout();
    setMe(null);
    router.refresh();
  }

  /* ---------- loading ---------- */
  if (loading) {
    return (
      <main className="mx-auto w-full max-w-[680px] px-4 py-10">
        <div className="h-[120px] animate-pulse rounded-2xl border border-border bg-card" />
      </main>
    );
  }

  /* ---------- signed out ---------- */
  if (!me) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-[440px] items-center px-4 py-10">
        <div className="w-full rounded-2xl border border-border bg-card p-7 text-center shadow-sm">
          <div
            aria-hidden
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-bg text-[26px]"
          >
            🔖
          </div>
          <h1 className="mt-4 text-[20px] font-bold text-ink">
            Your Tapa account
          </h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-sub">
            Sign in with your WhatsApp number to see your saved rituals, set
            reminders and manage your preferences.
          </p>
          <button
            type="button"
            onClick={() => setGateOpen(true)}
            className="mt-5 w-full rounded-lg bg-cta py-3 text-[14px] font-bold text-white hover:opacity-90"
          >
            Sign in
          </button>
          <Link
            href="/"
            className="mt-3 block w-full py-2 text-[13px] font-semibold text-sub hover:text-body"
          >
            Continue without an account
          </Link>
        </div>

        <OtpBottomSheet
          open={gateOpen}
          context="signin"
          onClose={() => setGateOpen(false)}
          onSuccess={() => {
            setGateOpen(false);
            setLoading(true);
            void load();
          }}
        />
      </main>
    );
  }

  /* ---------- signed in ---------- */
  const displayName = me.name || "Tapa Member";

  return (
    <main className="mx-auto w-full max-w-[680px] px-4 py-8">
      {/* header */}
      <header className="flex items-center gap-4">
        <div
          aria-hidden
          className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full bg-cta text-[18px] font-bold text-white"
        >
          {initialsOf(me.name, me.phone)}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-[20px] font-bold leading-tight text-ink">
            {displayName}
          </h1>
          <p className="mt-[2px] text-[13px] text-sub">
            {me.phone} · {me.city || "Delhi-NCR"}
          </p>
        </div>
      </header>

      {/* stat tiles */}
      <div className="mt-6 grid grid-cols-3 gap-2">
        {[
          { value: String(savedCount), label: "Saved Rituals", note: "with 🔖" },
          { value: String(orderCount), label: "Orders", note: "kits ordered" },
        ].map((tile) => (
          <div
            key={tile.label}
            className="rounded-xl border border-border bg-card px-3 py-4 text-center"
          >
            <div className="text-[22px] font-bold leading-none text-ink">
              {tile.value}
            </div>
            <div className="mt-[6px] text-[11.5px] font-bold text-body">
              {tile.label}
            </div>
            <div className="mt-[2px] text-[10.5px] text-sub">{tile.note}</div>
          </div>
        ))}
        {/* Circle tile — tappable, opens the manage sheet below */}
        <button
          type="button"
          aria-expanded={circleOpen}
          onClick={() => setCircleOpen((v) => !v)}
          className={`rounded-xl border px-3 py-4 text-center hover:bg-bg/60 ${
            circleOpen ? "border-cta bg-card" : "border-border bg-card"
          }`}
        >
          <div className="text-[22px] font-bold leading-none text-ink">
            {circleStatus === "ACTIVE"
              ? "●"
              : circleStatus === "STOPPED"
                ? "◌"
                : "—"}
          </div>
          <div className="mt-[6px] text-[11.5px] font-bold text-body">
            Tapa Circle
          </div>
          <div className="mt-[2px] text-[10.5px] text-sub">
            {circleStatus === "ACTIVE"
              ? "Active — reminders on"
              : circleStatus === "STOPPED"
                ? "left — rejoin any time"
                : "join on WhatsApp"}
            {" "}
            <span aria-hidden className="text-cta">
              {circleOpen ? "▴" : "▾"}
            </span>
          </div>
        </button>
      </div>

      {/* Circle manage sheet */}
      {circleOpen && (
        <div className="mt-2 rounded-xl border border-border bg-card px-4 py-4">
          <p className="text-[13px] font-bold text-ink">
            {circleStatus === "ACTIVE"
              ? "You're in the Tapa Circle."
              : circleStatus === "STOPPED"
                ? "You've left the Tapa Circle."
                : "You're not in the Tapa Circle yet."}
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-sub">
            Reminders arrive the evening before each vrat — one WhatsApp
            message, free, for every vrat on the calendar.
          </p>
          {circleStatus === "ACTIVE" ? (
            <p className="mt-2 border-t border-border-light pt-2 text-[12.5px] leading-relaxed text-sub">
              To leave, reply <b className="text-body">STOP</b> on WhatsApp —
              takes effect immediately, and we never message that number again.
            </p>
          ) : (
            <Link
              href="/tapa-circle"
              className="mt-3 inline-block rounded-lg border border-wa px-4 py-[8px] text-[12.5px] font-bold text-wa hover:bg-wa hover:text-white"
            >
              {circleStatus === "STOPPED"
                ? "Rejoin the Circle"
                : "Join the Circle"}
            </Link>
          )}
        </div>
      )}

      {/* WHAT I KEEP */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        <h2 className={GROUP_HEADER}>What I keep</h2>
        <div className="divide-y divide-border-light">
          <Link href="/account/saved" className={`${ROW} hover:bg-bg/60`}>
            <span aria-hidden>🔖</span>
            <span className="flex-1 font-semibold text-body">
              Saved Rituals
            </span>
            <span className="text-[12px] text-sub">{savedCount}</span>
            <span aria-hidden className="text-[11px] text-sub">
              ›
            </span>
          </Link>

          <Link href="/account/reminders" className={`${ROW} hover:bg-bg/60`}>
            <span aria-hidden>⏰</span>
            <span className="flex-1 font-semibold text-body">My Reminders</span>
            <span className="text-[12px] text-sub">{reminderCount}</span>
            <span aria-hidden className="text-[11px] text-sub">
              ›
            </span>
          </Link>
        </div>
      </section>

      {/* WHAT I BOUGHT */}
      <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        <h2 className={GROUP_HEADER}>What I bought</h2>
        <div className="divide-y divide-border-light">
          <Link href="/account/orders" className={`${ROW} hover:bg-bg/60`}>
            <span aria-hidden>📦</span>
            <span className="flex-1 font-semibold text-body">Orders</span>
            <span className="text-[12px] text-sub">{orderCount}</span>
            <span aria-hidden className="text-[11px] text-sub">
              ›
            </span>
          </Link>

          <Link href="/account/bookings" className={`${ROW} hover:bg-bg/60`}>
            <span aria-hidden>🪔</span>
            <span className="flex-1 font-semibold text-body">Puja Bookings</span>
            <span className="text-[12px] text-sub">{bookingCount}</span>
            <span aria-hidden className="text-[11px] text-sub">
              ›
            </span>
          </Link>

          <Link href="/bhajan-mandali/track" className={`${ROW} hover:bg-bg/60`}>
            <span aria-hidden>🎶</span>
            <span className="flex-1 font-semibold text-body">Mandali Requests</span>
            <span className="text-[12px] text-sub">{mandaliCount}</span>
            <span aria-hidden className="text-[11px] text-sub">
              ›
            </span>
          </Link>
        </div>
      </section>

      {/* SETTINGS */}
      <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        <h2 className={GROUP_HEADER}>Settings</h2>
        <div className="divide-y divide-border-light">
          <div className={ROW}>
            <span aria-hidden>🌐</span>
            <span className="flex-1 font-semibold text-body">Language</span>
            <div
              role="group"
              aria-label="Language preference"
              className="flex gap-[2px] rounded-lg bg-bg p-[3px]"
            >
              {(
                [
                  { value: "en", label: "EN" },
                  { value: "hi", label: "हिं" },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={langBusy}
                  aria-pressed={me.languagePref === option.value}
                  onClick={() => void chooseLang(option.value)}
                  className={`rounded-md px-[11px] py-[5px] text-xs font-bold ${
                    me.languagePref === option.value
                      ? "bg-cta text-white"
                      : "bg-transparent text-cta"
                  } ${option.value === "hi" ? "font-devanagari" : ""}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <Link href="/account/notifications" className={`${ROW} hover:bg-bg/60`}>
            <span aria-hidden>🔔</span>
            <span className="flex-1 font-semibold text-body">
              Notification Preferences
            </span>
            <span aria-hidden className="text-[11px] text-sub">
              ›
            </span>
          </Link>

          <a href="mailto:help@thetapaco.com" className={`${ROW} hover:bg-bg/60`}>
            <span aria-hidden>💬</span>
            <span className="flex-1 font-semibold text-body">
              Help &amp; Support
            </span>
            <span className="text-[12px] text-sub">help@thetapaco.com</span>
          </a>
        </div>
      </section>

      {/* ACCOUNT */}
      <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        <h2 className={GROUP_HEADER}>Account</h2>
        <div className="divide-y divide-border-light">
          <button
            type="button"
            onClick={() => void onLogout()}
            className={`${ROW} hover:bg-bg/60`}
          >
            <span aria-hidden>↩</span>
            <span className="flex-1 font-bold text-cta">Log out</span>
          </button>

          <Link href="/account/delete" className={`${ROW} hover:bg-red-50`}>
            <span aria-hidden>🗑</span>
            <span className="flex-1 font-bold text-red-600">
              Delete my account
            </span>
            <span className="text-[11.5px] text-sub">permanent</span>
            <span aria-hidden className="text-[11px] text-red-400">
              ›
            </span>
          </Link>
        </div>
      </section>
    </main>
  );
}
