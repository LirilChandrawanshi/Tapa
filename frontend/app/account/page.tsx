"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CountdownPill } from "@/components/CountdownPill";
import { LANG_EVENT, type Lang } from "@/components/LangToggle";
import { OtpBottomSheet } from "@/components/auth/OtpBottomSheet";
import {
  getMe,
  getSavedRituals,
  logout,
  unsaveRitual,
  updateMe,
  type Me,
  type SavedRitual,
} from "@/lib/auth";
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

function prettyCategory(category: string): string {
  return category
    .split("-")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

/** Mirrors lib/articleExtras.articleHref — saved items don't carry subCategory. */
function savedHref(item: SavedRitual): string {
  const base =
    item.category === "dharmic-concepts"
      ? "/dharmic-concepts"
      : "/ritual-guides";
  return `${base}/all/${item.articleSlug}`;
}

function prettyDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const ROW =
  "flex w-full items-center gap-3 px-4 py-[14px] text-left text-[14px]";

export default function AccountPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);
  const [savedItems, setSavedItems] = useState<SavedRitual[]>([]);
  const [savedOpen, setSavedOpen] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);
  const [mandaliCount, setMandaliCount] = useState(0);
  const [reminderCount, setReminderCount] = useState(0);
  const [circleStatus, setCircleStatus] = useState<string>("NONE");
  const [circleOpen, setCircleOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const [langBusy, setLangBusy] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

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
    setSavedItems(savedRes.ok ? savedRes.data : []);
    setOrderCount(ordersRes.ok ? (ordersRes.data ?? []).length : 0);
    setBookingCount(bookingsRes.ok ? (bookingsRes.data ?? []).length : 0);
    setMandaliCount(mandaliRes.ok ? (mandaliRes.data ?? []).length : 0);
    setReminderCount(remindersRes.ok ? (remindersRes.data ?? []).length : 0);
    setCircleStatus(circleRes?.data?.status ?? "NONE");
    setLoading(false);
  }, []);

  useEffect(() => {
    setNow(new Date());
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

  async function removeSaved(slug: string) {
    if (removing) return;
    setRemoving(slug);
    const res = await unsaveRitual(slug);
    setRemoving(null);
    if (res.ok) {
      setSavedItems((items) => items.filter((i) => i.articleSlug !== slug));
      setMe((m) =>
        m ? { ...m, savedCount: Math.max(0, m.savedCount - 1) } : m,
      );
    }
  }

  async function onLogout() {
    await logout();
    setMe(null);
    setSavedItems([]);
    setSavedOpen(false);
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
  const savedCount = savedItems.length || me.savedCount;

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

      {/* rows */}
      <div className="mt-6 divide-y divide-border-light overflow-hidden rounded-2xl border border-border bg-card">
        {/* Saved Rituals (expandable) */}
        <div>
          <button
            type="button"
            className={`${ROW} hover:bg-bg/60`}
            aria-expanded={savedOpen}
            onClick={() => setSavedOpen((v) => !v)}
          >
            <span aria-hidden>🔖</span>
            <span className="flex-1 font-semibold text-body">
              Saved Rituals
            </span>
            <span className="text-[12px] text-sub">{savedCount}</span>
            <span
              aria-hidden
              className={`text-[11px] text-sub transition-transform ${savedOpen ? "rotate-180" : ""}`}
            >
              ▼
            </span>
          </button>

          {savedOpen && (
            <div className="border-t border-border-light bg-bg/40 px-4 py-2">
              {savedItems.length === 0 ? (
                <p className="py-3 text-[13px] text-sub">
                  Nothing saved yet. Tap <b>🔖 Save</b> on any ritual guide and
                  it will wait for you here.
                </p>
              ) : (
                <ul className="divide-y divide-border-light">
                  {savedItems.map((item) => (
                    <li
                      key={item.articleSlug}
                      className={`flex items-center gap-3 py-3 ${item.past ? "opacity-50" : ""}`}
                    >
                      <div className="min-w-0 flex-1">
                        <Link
                          href={savedHref(item)}
                          className="block truncate text-[13.5px] font-semibold text-body hover:text-cta"
                        >
                          {item.title}
                        </Link>
                        <p className="mt-[2px] text-[11px] uppercase tracking-[0.5px] text-sub">
                          {prettyCategory(item.category)}
                          {item.observanceDate &&
                            ` · ${prettyDate(item.observanceDate)}`}
                        </p>
                      </div>
                      {item.past ? (
                        <span className="rounded-[5px] border border-border bg-card px-[8px] py-[3px] text-[9.5px] font-bold tracking-[0.4px] text-sub">
                          RETURNS 2027
                        </span>
                      ) : (
                        item.observanceDate &&
                        now && (
                          <CountdownPill date={item.observanceDate} now={now} />
                        )
                      )}
                      <button
                        type="button"
                        disabled={removing === item.articleSlug}
                        onClick={() => void removeSaved(item.articleSlug)}
                        className="text-[12px] font-semibold text-sub underline underline-offset-2 hover:text-cta disabled:opacity-40"
                        aria-label={`Remove ${item.title} from saved rituals`}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Orders */}
        <Link href="/account/orders" className={`${ROW} hover:bg-bg/60`}>
          <span aria-hidden>📦</span>
          <span className="flex-1 font-semibold text-body">Orders</span>
          <span className="text-[12px] text-sub">{orderCount}</span>
          <span aria-hidden className="text-[11px] text-sub">
            ›
          </span>
        </Link>

        {/* Puja Bookings */}
        <Link href="/account/bookings" className={`${ROW} hover:bg-bg/60`}>
          <span aria-hidden>🪔</span>
          <span className="flex-1 font-semibold text-body">Puja Bookings</span>
          <span className="text-[12px] text-sub">{bookingCount}</span>
          <span aria-hidden className="text-[11px] text-sub">
            ›
          </span>
        </Link>

        {/* Mandali Requests */}
        <Link href="/bhajan-mandali/track" className={`${ROW} hover:bg-bg/60`}>
          <span aria-hidden>🎶</span>
          <span className="flex-1 font-semibold text-body">Mandali Requests</span>
          <span className="text-[12px] text-sub">{mandaliCount}</span>
          <span aria-hidden className="text-[11px] text-sub">
            ›
          </span>
        </Link>

        {/* My Reminders */}
        <Link href="/account/reminders" className={`${ROW} hover:bg-bg/60`}>
          <span aria-hidden>⏰</span>
          <span className="flex-1 font-semibold text-body">My Reminders</span>
          <span className="text-[12px] text-sub">{reminderCount}</span>
          <span aria-hidden className="text-[11px] text-sub">
            ›
          </span>
        </Link>

        {/* Language */}
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

        {/* Notification Preferences */}
        <Link href="/account/notifications" className={`${ROW} hover:bg-bg/60`}>
          <span aria-hidden>🔔</span>
          <span className="flex-1 font-semibold text-body">
            Notification Preferences
          </span>
          <span aria-hidden className="text-[11px] text-sub">
            ›
          </span>
        </Link>

        {/* Help & Support */}
        <a href="mailto:help@thetapaco.com" className={`${ROW} hover:bg-bg/60`}>
          <span aria-hidden>💬</span>
          <span className="flex-1 font-semibold text-body">
            Help &amp; Support
          </span>
          <span className="text-[12px] text-sub">help@thetapaco.com</span>
        </a>

        {/* Log out — always last */}
        <button
          type="button"
          onClick={() => void onLogout()}
          className={`${ROW} hover:bg-bg/60`}
        >
          <span aria-hidden>↩</span>
          <span className="flex-1 font-bold text-cta">Log out</span>
        </button>
      </div>

      {/* danger zone */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-red-300 bg-card">
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
    </main>
  );
}
