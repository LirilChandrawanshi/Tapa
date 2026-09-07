"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { OtpBottomSheet } from "@/components/auth/OtpBottomSheet";
import { track } from "@/lib/analytics";
import {
  getMe,
  getSavedRituals,
  saveRitual,
  unsaveRitual,
} from "@/lib/auth";

/**
 * Save + Share behavior shared by the breadcrumb buttons and the utility
 * action bar (G17). The hook owns all state; `extras` carries the toast and
 * the contextual OTP gate so each consumer renders exactly one of each.
 *
 * Save is gated behind the OTP sheet for signed-out visitors; Share uses the
 * Web Share API with a clipboard fallback.
 */
export function useSaveShare(slug: string, title: string) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const toastTimer = useRef<number | undefined>(undefined);

  // On mount, check whether this article is already saved. A 401 just means
  // signed out — the button stays in its default state.
  useEffect(() => {
    let cancelled = false;
    void getSavedRituals().then((res) => {
      if (cancelled || !res.ok) return;
      setAuthed(true);
      setSaved(res.data.some((item) => item.articleSlug === slug));
    });
    return () => {
      cancelled = true;
      window.clearTimeout(toastTimer.current);
    };
  }, [slug]);

  function flash(message: string) {
    window.clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }

  async function doSave() {
    const res = await saveRitual(slug);
    if (res.ok) {
      setAuthed(true);
      setSaved(true);
      track("article_saved", { slug });
      flash(`Saved: ${title}`);
    } else {
      flash("That didn't save just now. Try again.");
    }
  }

  async function onSave() {
    if (busy) return;
    setBusy(true);
    try {
      if (saved) {
        const res = await unsaveRitual(slug);
        if (res.ok) {
          setSaved(false);
          flash(`Removed: ${title}`);
        } else {
          flash("That didn't go through. Try again.");
        }
        return;
      }
      if (authed) {
        await doSave();
        return;
      }
      const me = await getMe();
      if (me.ok) {
        setAuthed(true);
        await doSave();
      } else if (me.status === 401 || me.status === 403) {
        setGateOpen(true);
      } else {
        flash("That didn't save just now. Try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function onShare() {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        track("article_shared", { slug, channel: "native" });
        return;
      }
      await navigator.clipboard.writeText(url);
      track("article_shared", { slug, channel: "clipboard" });
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* user dismissed the sheet — nothing to do */
    }
  }

  const extras: ReactNode = (
    <>
      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[110] flex max-w-[92vw] -translate-x-1/2 items-center gap-2 rounded-lg bg-ink px-4 py-[10px] text-[13px] font-semibold text-white shadow-xl"
        >
          <span aria-hidden>🔖</span>
          <span className="truncate">{toast}</span>
        </div>
      )}
      <OtpBottomSheet
        open={gateOpen}
        context="save"
        heading={`Save “${title}” to your rituals`}
        onClose={() => setGateOpen(false)}
        onSuccess={() => {
          setGateOpen(false);
          void doSave();
        }}
      />
    </>
  );

  return { saved, copied, onSave, onShare, flash, extras };
}

/** Save + Share controls in the breadcrumb row (all breakpoints). */
export function SaveShareButtons({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const { saved, copied, onSave, onShare, extras } = useSaveShare(slug, title);

  const btn =
    "flex h-[35px] items-center gap-[6px] rounded-lg border-[1.5px] px-[14px] text-[13px] hover:border-cta";

  return (
    <>
      <button
        type="button"
        className={`${btn} ${
          saved
            ? "border-cta bg-bhranti-bg font-bold text-cta"
            : "border-border bg-card text-body"
        }`}
        aria-pressed={saved}
        onClick={() => void onSave()}
      >
        <span aria-hidden className={saved ? "" : "opacity-60 grayscale"}>
          🔖
        </span>{" "}
        {saved ? "Saved" : "Save"}
      </button>
      <button type="button" className={`${btn} border-border bg-card text-body`} onClick={() => void onShare()}>
        <span aria-hidden>↗</span> {copied ? "Copied" : "Share"}
      </button>
      {extras}
    </>
  );
}
