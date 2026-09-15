"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ACTION_BTN,
  type ActionTone,
  actionSkin,
} from "@/components/article/actionTone";
import { OtpBottomSheet } from "@/components/auth/OtpBottomSheet";
import { track } from "@/lib/analytics";
import { getMe, getSavedRituals, saveRitual, unsaveRitual } from "@/lib/auth";

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

/** Save + Share controls, either in a light bar or over a dark hero. */
export function SaveShareButtons({
  slug,
  title,
  tone = "bar",
}: {
  slug: string;
  title: string;
  tone?: ActionTone;
}) {
  const { saved, copied, onSave, onShare, extras } = useSaveShare(slug, title);
  const skin = actionSkin(tone);

  return (
    <>
      <button
        type="button"
        className={`${ACTION_BTN} ${
          saved
            ? tone === "hero"
              ? "border-white/60 bg-white/20 font-bold text-hero-text backdrop-blur"
              : "border-cta bg-bhranti-bg font-bold text-cta"
            : skin
        }`}
        aria-pressed={saved}
        onClick={() => void onSave()}
      >
        <span aria-hidden className={saved ? "" : "opacity-60 grayscale"}>
          🔖
        </span>{" "}
        {saved ? "Saved" : "Save"}
      </button>
      <button
        type="button"
        className={`${ACTION_BTN} ${skin}`}
        onClick={() => void onShare()}
      >
        <span aria-hidden>↗</span> {copied ? "Copied" : "Share"}
      </button>
      {extras}
    </>
  );
}
