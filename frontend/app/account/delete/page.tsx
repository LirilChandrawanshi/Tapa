"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getMe, logout, type Me } from "@/lib/auth";
import {
  deleteAccount,
  getDeletionPreview,
  type DeletionPreview,
} from "@/lib/account";

const CONFIRM_WORD = "DELETE";

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export default function DeleteAccountPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);
  const [preview, setPreview] = useState<DeletionPreview | null>(null);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [meRes, previewRes] = await Promise.all([
        getMe(),
        getDeletionPreview(),
      ]);
      if (cancelled) return;
      setMe(meRes.ok ? meRes.data : null);
      setPreview(previewRes.ok ? previewRes.data : null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onDelete() {
    if (busy || confirm.trim() !== CONFIRM_WORD) return;
    setBusy(true);
    setError(null);
    const res = await deleteAccount();
    if (!res.ok) {
      setBusy(false);
      setError(res.message);
      return;
    }
    // Cookies are already cleared by the API; logout() just announces the
    // auth change so the nav updates, then we go home.
    await logout();
    router.replace("/");
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-[560px] px-4 py-10">
        <div className="h-[220px] animate-pulse rounded-2xl border border-border bg-card" />
      </main>
    );
  }

  /* signed out — nothing to delete */
  if (!me) {
    return (
      <main className="mx-auto w-full max-w-[440px] px-4 py-14 text-center">
        <div className="rounded-2xl border border-border bg-card p-7">
          <h1 className="text-[18px] font-bold text-ink">
            You&apos;re not signed in
          </h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-sub">
            Sign in first from your account page to manage or delete your Tapa
            account.
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

  const inFlight = preview?.inFlightOrders ?? 0;
  const armed = confirm.trim() === CONFIRM_WORD;

  return (
    <main className="mx-auto w-full max-w-[560px] px-4 py-8">
      <Link
        href="/account"
        className="text-[12.5px] font-semibold text-sub hover:text-body"
      >
        ‹ Back to account
      </Link>

      <h1 className="mt-3 text-[22px] font-bold leading-tight text-ink">
        Delete your Tapa account
      </h1>
      <p className="mt-2 text-[13.5px] leading-relaxed text-sub">
        This is permanent and takes effect immediately. Here is exactly what
        happens to your data.
      </p>

      {/* in-flight order warning */}
      {inFlight > 0 && (
        <div className="mt-5 rounded-xl border border-amber bg-pratha-bg px-4 py-3">
          <p className="text-[13px] font-bold text-pratha-fg">
            You have {plural(inFlight, "order", "orders")} still on the way
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-body">
            Deleting your account will not cancel{" "}
            {inFlight === 1 ? "it" : "them"} — the kit will still arrive and
            dispatch messages will still reach your phone. If you want a refund
            instead, cancel the order first from{" "}
            <Link href="/account/orders" className="font-semibold underline">
              your orders
            </Link>
            .
          </p>
        </div>
      )}

      {/* deleted immediately */}
      <section className="mt-5 overflow-hidden rounded-2xl border border-red-200 bg-card">
        <h2 className="border-b border-red-100 bg-red-50 px-4 py-3 text-[11px] font-bold uppercase tracking-[1px] text-red-700">
          Deleted immediately
        </h2>
        <ul className="divide-y divide-border-light px-4 text-[13.5px] text-body">
          <li className="flex items-center justify-between py-3">
            <span>Your account — name, phone, city, language</span>
            <span aria-hidden className="text-red-600">
              ✕
            </span>
          </li>
          <li className="flex items-center justify-between py-3">
            <span>
              Saved rituals
              {preview ? ` — ${plural(preview.savedRituals, "guide", "guides")}` : ""}
            </span>
            <span aria-hidden className="text-red-600">
              ✕
            </span>
          </li>
          <li className="flex items-center justify-between py-3">
            <span>
              Vrat reminders
              {preview ? ` — ${preview.reminders} set` : ""}
            </span>
            <span aria-hidden className="text-red-600">
              ✕
            </span>
          </li>
          <li className="flex items-center justify-between py-3">
            <span>This session — you&apos;ll be signed out everywhere</span>
            <span aria-hidden className="text-red-600">
              ✕
            </span>
          </li>
        </ul>
      </section>

      {/* kept, by law */}
      <section className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        <h2 className="border-b border-border-light bg-bg px-4 py-3 text-[11px] font-bold uppercase tracking-[1px] text-mid">
          Kept, by law
        </h2>
        <div className="px-4 py-3 text-[13px] leading-relaxed text-body">
          <p>
            Tax invoices for your{" "}
            <b>{plural(preview?.orders ?? 0, "kit order", "kit orders")}</b> and{" "}
            <b>{plural(preview?.bookings ?? 0, "puja booking", "puja bookings")}</b>
            {(preview?.mandaliRequests ?? 0) > 0 && (
              <>
                {" "}
                (and {plural(preview!.mandaliRequests, "mandali request", "mandali requests")})
              </>
            )}{" "}
            must be preserved for the statutory retention period under GST and
            consumer-protection rules. They are unlinked from your account and
            kept only against your phone number, so you can still claim a
            refund or warranty.
          </p>
          <p className="mt-2 border-t border-border-light pt-2 text-[12.5px] text-sub">
            <b className="text-body">Tapa Circle</b> lives on WhatsApp and is
            separate from this account. To erase it, reply <b>DELETE</b> to the
            Circle on WhatsApp — that removes your number there too.
          </p>
        </div>
      </section>

      {/* confirm */}
      <section className="mt-6 rounded-2xl border border-red-200 bg-card p-4">
        <label
          htmlFor="confirm-delete"
          className="block text-[13px] font-semibold text-body"
        >
          Type <b className="font-mono text-red-600">{CONFIRM_WORD}</b> to
          confirm
        </label>
        <input
          id="confirm-delete"
          type="text"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={CONFIRM_WORD}
          className="mt-2 w-full rounded-lg border border-border bg-bg px-3 py-[10px] font-mono text-[14px] tracking-[2px] text-ink outline-none focus:border-red-400"
        />
        {error && (
          <p role="alert" className="mt-2 text-[12.5px] font-semibold text-red-600">
            {error}
          </p>
        )}
        <button
          type="button"
          disabled={!armed || busy}
          onClick={() => void onDelete()}
          className="mt-3 w-full rounded-lg bg-red-600 py-3 text-[14px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? "Deleting…" : "Delete my account permanently"}
        </button>
        <Link
          href="/account"
          className="mt-2 block w-full py-2 text-center text-[13px] font-semibold text-sub hover:text-body"
        >
          Keep my account
        </Link>
      </section>
    </main>
  );
}
