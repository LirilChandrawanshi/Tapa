"use client";

import Link from "next/link";
import { useState } from "react";
import { OtpBottomSheet } from "@/components/auth/OtpBottomSheet";
import { addReminder } from "@/lib/account";
import { track } from "@/lib/analytics";
import { getMe } from "@/lib/auth";
import { useSaveShare } from "./SaveShareButtons";

/**
 * Utility action bar (G17, launch-blocking) — a horizontally scrollable row
 * of the six article actions, always visible including mobile, between the
 * hero and the content. Plus "Remind me" (#57/#92) when the observance date
 * is still ahead.
 */
export function ActionBar({
  slug,
  title,
  pdfHref,
  kitSlug,
  purohitVisible,
  remindEligible,
}: {
  slug: string;
  title: string;
  pdfHref: string;
  kitSlug?: string;
  purohitVisible: boolean;
  remindEligible: boolean;
}) {
  const { saved, copied, onSave, onShare, flash, extras } = useSaveShare(
    slug,
    title,
  );
  const [reminderSet, setReminderSet] = useState(false);
  const [remindGate, setRemindGate] = useState(false);
  const [remindBusy, setRemindBusy] = useState(false);

  async function doRemind() {
    const res = await addReminder({ articleSlug: slug });
    if (res.ok) {
      setReminderSet(true);
      flash("Reminder set · evening before, 7 PM");
    } else {
      flash(res.message);
    }
  }

  async function onRemind() {
    if (reminderSet || remindBusy) return;
    setRemindBusy(true);
    try {
      const me = await getMe();
      if (me.ok) {
        await doRemind();
      } else if (me.status === 401 || me.status === 403) {
        setRemindGate(true);
      } else {
        flash("That didn't go through. Try again.");
      }
    } finally {
      setRemindBusy(false);
    }
  }

  function onWhatsApp() {
    track("article_shared", { slug, channel: "whatsapp" });
    const text = `${title}\n${window.location.href}`;
    window.open(
      `https://wa.me/?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  const btn =
    "flex h-[38px] shrink-0 items-center gap-[7px] rounded-[10px] border-[1.5px] px-[15px] text-[13px] font-semibold whitespace-nowrap";
  const plain = `${btn} border-border bg-card text-body hover:border-cta`;

  return (
    <div className="border-b border-border bg-card">
      <div
        role="toolbar"
        aria-label="Guide actions"
        className="mx-auto flex max-w-[1280px] items-center gap-[9px] overflow-x-auto px-4 py-[10px] [scrollbar-width:none] md:px-10 [&::-webkit-scrollbar]:hidden"
      >
        {kitSlug ? (
          <Link
            href={`/ritual-pujans/p/${kitSlug}`}
            className={`${btn} border-cta bg-cta text-white hover:opacity-90`}
          >
            <span aria-hidden>🛒</span> Buy Ritual Kit
          </Link>
        ) : (
          <span
            aria-disabled="true"
            title="No kit for this guide — the samagri list is free"
            className={`${btn} cursor-not-allowed border-border bg-bg text-sub`}
          >
            <span aria-hidden className="grayscale">
              🛒
            </span>
            No kit for this guide — the samagri list is free
          </span>
        )}

        {purohitVisible && (
          <Link href="/pujan-with-purohit" className={plain}>
            <span aria-hidden>🙏</span> Book Purohit
          </Link>
        )}

        <a
          href={pdfHref}
          className={plain}
          onClick={() => track("pdf_downloaded", { slug, source: "action_bar" })}
        >
          <span aria-hidden>⬇</span> Download PDF
        </a>

        <button type="button" className={plain} onClick={onWhatsApp}>
          <span aria-hidden>🟢</span> WhatsApp
        </button>

        <button
          type="button"
          aria-pressed={saved}
          className={`${btn} ${
            saved
              ? "border-cta bg-bhranti-bg text-cta"
              : "border-border bg-card text-body hover:border-cta"
          }`}
          onClick={() => void onSave()}
        >
          <span aria-hidden className={saved ? "" : "opacity-60 grayscale"}>
            🔖
          </span>{" "}
          {saved ? "Saved" : "Save"}
        </button>

        <button type="button" className={plain} onClick={() => void onShare()}>
          <span aria-hidden>↗</span> {copied ? "Copied" : "Share"}
        </button>

        {remindEligible && (
          <button
            type="button"
            className={`${btn} ${
              reminderSet
                ? "border-dharma-bd bg-dharma-bg text-dharma-fg"
                : "border-border bg-card text-body hover:border-cta"
            }`}
            aria-pressed={reminderSet}
            onClick={() => void onRemind()}
          >
            <span aria-hidden>🔔</span>{" "}
            {reminderSet ? "Reminder set" : "Remind me"}
          </button>
        )}
      </div>

      {extras}
      <OtpBottomSheet
        open={remindGate}
        context="signin"
        heading="Sign in to get this reminder on WhatsApp"
        onClose={() => setRemindGate(false)}
        onSuccess={() => {
          setRemindGate(false);
          void doRemind();
        }}
      />
    </div>
  );
}
