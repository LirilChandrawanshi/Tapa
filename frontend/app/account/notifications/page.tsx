"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMe, type Me } from "@/lib/auth";
import {
  getNotificationPrefs,
  updateNotificationPrefs,
  type NotificationPrefs,
} from "@/lib/account";

type PrefKey = keyof NotificationPrefs;

interface ToggleRow {
  key: PrefKey;
  label: string;
  note: string;
}

const RITUAL_ROWS: ToggleRow[] = [
  {
    key: "ritual_reminders_whatsapp",
    label: "WhatsApp reminders",
    note: "The evening-before vrat nudge you asked for.",
  },
  {
    key: "ritual_reminders_sms_fallback",
    label: "SMS fallback",
    note: "Plain SMS only if WhatsApp can't deliver.",
  },
];

const MARKETING_ROWS: ToggleRow[] = [
  {
    key: "updates_new_guides",
    label: "New ritual guides",
    note: "When we publish a guide for a festival you may follow.",
  },
  {
    key: "updates_kit_launches",
    label: "Kit launches",
    note: "When a new puja samagri kit goes on sale.",
  },
];

function Toggle({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`relative h-[24px] w-[42px] shrink-0 rounded-full transition-colors disabled:opacity-40 ${
        checked ? "bg-wa" : "bg-border"
      }`}
    >
      <span
        aria-hidden
        className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow transition-all ${
          checked ? "left-[21px]" : "left-[3px]"
        }`}
      />
    </button>
  );
}

export default function NotificationPrefsPage() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [busyKey, setBusyKey] = useState<PrefKey | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [meRes, prefsRes] = await Promise.all([
        getMe(),
        getNotificationPrefs(),
      ]);
      if (cancelled) return;
      setMe(meRes.ok ? meRes.data : null);
      setPrefs(prefsRes.ok ? prefsRes.data : null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle(key: PrefKey) {
    if (!prefs || busyKey) return;
    setBusyKey(key);
    const res = await updateNotificationPrefs({ [key]: !prefs[key] });
    setBusyKey(null);
    if (res.ok) setPrefs(res.data);
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-[560px] px-4 py-10">
        <div className="h-[180px] animate-pulse rounded-2xl border border-border bg-card" />
      </main>
    );
  }

  if (!me || !prefs) {
    return (
      <main className="mx-auto w-full max-w-[440px] px-4 py-14 text-center">
        <div className="rounded-2xl border border-border bg-card p-7">
          <h1 className="text-[18px] font-bold text-ink">
            Sign in to manage notifications
          </h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-sub">
            Your notification preferences live with your account.
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

  return (
    <main className="mx-auto w-full max-w-[560px] px-4 py-8">
      <Link
        href="/account"
        className="text-[12.5px] font-semibold text-sub hover:text-body"
      >
        ‹ Back to account
      </Link>

      <h1 className="mt-3 text-[22px] font-bold leading-tight text-ink">
        Notification Preferences
      </h1>
      <p className="mt-2 text-[13.5px] leading-relaxed text-sub">
        Grouped by what each message is <em>for</em>, so you switch off exactly
        what you don&apos;t want.
      </p>

      {/* ritual reminders */}
      <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
        <h2 className="border-b border-border-light bg-bg px-4 py-3 text-[11px] font-bold uppercase tracking-[1px] text-mid">
          Ritual reminders
        </h2>
        <ul className="divide-y divide-border-light">
          {RITUAL_ROWS.map((row) => (
            <li key={row.key} className="flex items-center gap-3 px-4 py-[14px]">
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-body">
                  {row.label}
                </p>
                <p className="mt-[2px] text-[12px] text-sub">{row.note}</p>
              </div>
              <Toggle
                checked={prefs[row.key]}
                disabled={busyKey === row.key}
                onChange={() => void toggle(row.key)}
                label={row.label}
              />
            </li>
          ))}
        </ul>
      </section>

      {/* orders — always on, deliberately no toggle */}
      <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        <h2 className="border-b border-border-light bg-bg px-4 py-3 text-[11px] font-bold uppercase tracking-[1px] text-mid">
          Your orders
        </h2>
        <div className="flex items-center gap-3 px-4 py-[14px]">
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-body">
              Order &amp; dispatch updates
            </p>
            <p className="mt-[2px] text-[12px] leading-relaxed text-sub">
              Always on — you cannot miss a dispatch message. These are
              transactional updates about money you&apos;ve already paid, so
              there is nothing to opt out of.
            </p>
          </div>
          <span className="shrink-0 rounded-[5px] bg-dharma-bg px-[8px] py-[3px] text-[9.5px] font-bold tracking-[0.5px] text-dharma-fg">
            ALWAYS ON
          </span>
        </div>
      </section>

      {/* from us — marketing, opt-in */}
      <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        <h2 className="border-b border-border-light bg-bg px-4 py-3 text-[11px] font-bold uppercase tracking-[1px] text-mid">
          From us
        </h2>
        <ul className="divide-y divide-border-light">
          {MARKETING_ROWS.map((row) => (
            <li key={row.key} className="flex items-center gap-3 px-4 py-[14px]">
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-body">
                  {row.label}
                </p>
                <p className="mt-[2px] text-[12px] text-sub">{row.note}</p>
              </div>
              <Toggle
                checked={prefs[row.key]}
                disabled={busyKey === row.key}
                onChange={() => void toggle(row.key)}
                label={row.label}
              />
            </li>
          ))}
        </ul>
        <p className="border-t border-border-light bg-bg/50 px-4 py-3 text-[11.5px] leading-relaxed text-sub">
          These are off until you switch them on — we never assume consent for
          marketing.
        </p>
      </section>

      <p className="mt-5 text-[11.5px] leading-relaxed text-sub">
        We only ever message the number on your account, and we never sell or
        share it. Changing a preference takes effect immediately.
      </p>
    </main>
  );
}
