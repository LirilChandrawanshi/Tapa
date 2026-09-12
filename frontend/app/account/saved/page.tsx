"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CountdownPill } from "@/components/CountdownPill";
import {
  getMe,
  getSavedRituals,
  unsaveRitual,
  type Me,
  type SavedRitual,
} from "@/lib/auth";

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

export default function SavedRitualsPage() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);
  const [items, setItems] = useState<SavedRitual[]>([]);
  const [now, setNow] = useState<Date | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setNow(new Date());
    void (async () => {
      const [meRes, savedRes] = await Promise.all([getMe(), getSavedRituals()]);
      if (cancelled) return;
      setMe(meRes.ok ? meRes.data : null);
      setItems(savedRes.ok ? savedRes.data : []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function remove(slug: string) {
    if (removing) return;
    setRemoving(slug);
    const res = await unsaveRitual(slug);
    setRemoving(null);
    if (res.ok) {
      setItems((list) => list.filter((i) => i.articleSlug !== slug));
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
            Sign in to see your saved rituals
          </h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-sub">
            Saved rituals live with your account.
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

  const upcoming = items.filter((i) => !i.past && i.observanceDate);
  const allYear = items.filter((i) => !i.past && !i.observanceDate);
  const past = items.filter((i) => i.past);
  // Closest date first, then all-year (most recently saved), then past (dimmed, kept).
  const ordered = [...upcoming, ...allYear, ...past];

  return (
    <main className="mx-auto w-full max-w-[560px] px-4 py-8">
      <Link
        href="/account"
        className="text-[12.5px] font-semibold text-sub hover:text-body"
      >
        ‹ Back to account
      </Link>

      <h1 className="mt-3 text-[22px] font-bold leading-tight text-ink">
        Saved Rituals
      </h1>
      <p className="mt-2 text-[13.5px] leading-relaxed text-sub">
        Whatever has a date coming up shows first — read again before it
        arrives.
      </p>

      {ordered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-card p-7 text-center">
          <div aria-hidden className="text-[26px]">
            🔖
          </div>
          <p className="mt-3 text-[14px] font-semibold text-body">
            Nothing saved yet
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-sub">
            Tap <b>🔖 Save</b> on any ritual guide and it will wait for you
            here.
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
          {ordered.map((item) => (
            <li
              key={item.articleSlug}
              className={`flex items-center gap-3 px-4 py-[14px] ${item.past ? "opacity-50" : ""}`}
            >
              <div className="min-w-0 flex-1">
                <Link
                  href={savedHref(item)}
                  className="block truncate text-[14px] font-semibold text-body hover:text-cta"
                >
                  {item.title}
                </Link>
                <p className="mt-[3px] text-[12px] uppercase tracking-[0.5px] text-sub">
                  {prettyCategory(item.category)}
                  {item.observanceDate && ` · ${prettyDate(item.observanceDate)}`}
                  {!item.observanceDate && !item.past && " · All year"}
                </p>
              </div>
              {item.past ? (
                <span className="shrink-0 rounded-[5px] border border-border bg-card px-[8px] py-[3px] text-[9.5px] font-bold tracking-[0.4px] text-sub">
                  RETURNS 2027
                </span>
              ) : (
                item.observanceDate &&
                now && <CountdownPill date={item.observanceDate} now={now} />
              )}
              <button
                type="button"
                disabled={removing === item.articleSlug}
                onClick={() => void remove(item.articleSlug)}
                className="shrink-0 text-[12px] font-semibold text-sub underline underline-offset-2 hover:text-cta disabled:opacity-40"
                aria-label={`Remove ${item.title} from saved rituals`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
