"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMe, type Me } from "@/lib/auth";
import {
  getReminders,
  removeReminder,
  setReminderEnabled,
  type Reminder,
} from "@/lib/account";

/** "Sat, 10 Oct 2026" in IST — the evening the WhatsApp nudge goes out. */
function sendDay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

function observanceDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function RemindersPage() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);
  const [items, setItems] = useState<Reminder[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [meRes, listRes] = await Promise.all([getMe(), getReminders()]);
      if (cancelled) return;
      setMe(meRes.ok ? meRes.data : null);
      setItems(listRes.ok ? listRes.data : []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle(reminder: Reminder) {
    if (busyId) return;
    setBusyId(reminder.id);
    const res = await setReminderEnabled(reminder.id, !reminder.enabled);
    setBusyId(null);
    if (res.ok) {
      setItems((list) =>
        list.map((r) => (r.id === reminder.id ? res.data : r)),
      );
    }
  }

  async function remove(id: string) {
    if (busyId) return;
    setBusyId(id);
    const res = await removeReminder(id);
    setBusyId(null);
    if (res.ok) {
      setItems((list) => list.filter((r) => r.id !== id));
    }
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-[560px] px-4 py-10">
        <div className="h-[180px] animate-pulse rounded-2xl border border-border bg-card" />
      </main>
    );
  }

  if (!me) {
    return (
      <main className="mx-auto w-full max-w-[440px] px-4 py-14 text-center">
        <div className="rounded-2xl border border-border bg-card p-7">
          <h1 className="text-[18px] font-bold text-ink">
            Sign in to see your reminders
          </h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-sub">
            Your vrat reminders live with your account.
          </p>
          <Link
            href="/account"
            className="mt-5 inline-block rounded-lg bg-cta px-6 py-3 text-[14px] font-bold text-white hover:opacity-90"
          >
            Go to account
          </Link>
        </div>
      </main>
    );
  }

  // The API sorts soonest-first; the first still-enabled one fires next.
  const nextId = items.find((r) => r.enabled)?.id ?? null;

  return (
    <main className="mx-auto w-full max-w-[560px] px-4 py-8">
      <Link
        href="/account"
        className="text-[12.5px] font-semibold text-sub hover:text-body"
      >
        ‹ Back to account
      </Link>

      <h1 className="mt-3 text-[22px] font-bold leading-tight text-ink">
        My Reminders
      </h1>
      <p className="mt-2 text-[13.5px] leading-relaxed text-sub">
        One WhatsApp message per vrat, sent the evening before so you can
        prepare in time.
      </p>

      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-card p-7 text-center">
          <div aria-hidden className="text-[26px]">
            ⏰
          </div>
          <p className="mt-3 text-[14px] font-semibold text-body">
            No reminders yet
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-sub">
            Open any vrat or festival guide and tap{" "}
            <b>Remind me</b> — we&apos;ll nudge you on WhatsApp the evening
            before.
          </p>
          <Link
            href="/ritual-guides"
            className="mt-4 inline-block rounded-lg bg-cta px-6 py-3 text-[13.5px] font-bold text-white hover:opacity-90"
          >
            Browse ritual guides
          </Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border-light overflow-hidden rounded-2xl border border-border bg-card">
          {items.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-4 py-[14px]">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[14px] font-semibold text-body">
                    {r.title}
                  </p>
                  {r.id === nextId && (
                    <span className="shrink-0 rounded-[5px] bg-cta px-[7px] py-[2px] text-[9.5px] font-bold tracking-[0.6px] text-white">
                      NEXT
                    </span>
                  )}
                </div>
                <p className="mt-[3px] text-[12px] text-sub">
                  WhatsApp · {sendDay(r.sendAt)}, 7:00 PM
                  <span className="text-border"> · </span>
                  vrat on {observanceDay(r.observanceDate)}
                </p>
              </div>

              {/* enable toggle */}
              <button
                type="button"
                role="switch"
                aria-checked={r.enabled}
                aria-label={`${r.enabled ? "Disable" : "Enable"} reminder for ${r.title}`}
                disabled={busyId === r.id}
                onClick={() => void toggle(r)}
                className={`relative h-[24px] w-[42px] shrink-0 rounded-full transition-colors disabled:opacity-40 ${
                  r.enabled ? "bg-wa" : "bg-border"
                }`}
              >
                <span
                  aria-hidden
                  className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow transition-all ${
                    r.enabled ? "left-[21px]" : "left-[3px]"
                  }`}
                />
              </button>

              <button
                type="button"
                disabled={busyId === r.id}
                onClick={() => void remove(r.id)}
                className="shrink-0 text-[12px] font-semibold text-sub underline underline-offset-2 hover:text-cta disabled:opacity-40"
                aria-label={`Remove reminder for ${r.title}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Circle upsell — always below the list */}
      <div className="mt-5 rounded-2xl border border-border bg-card p-4">
        <p className="text-[13.5px] font-bold text-ink">
          Tired of setting them one by one?
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-sub">
          The Tapa Circle does this automatically for <b>every</b> vrat on the
          calendar — one WhatsApp message the evening before, free, leave any
          time.
        </p>
        <Link
          href="/tapa-circle"
          className="mt-3 inline-block rounded-lg border border-wa px-5 py-[10px] text-[13px] font-bold text-wa hover:bg-wa hover:text-white"
        >
          Join the Tapa Circle
        </Link>
      </div>
    </main>
  );
}
