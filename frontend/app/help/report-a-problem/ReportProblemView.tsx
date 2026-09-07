"use client";

/**
 * Report-a-problem form (#147/#160). Order number + phone prefill from
 * ?on= & ?phone=; no photo upload yet — we request photos on WhatsApp.
 * After submit: "WHAT HAPPENS NEXT" — replacement or refund, buyer's choice,
 * reply within one working day. All copy fear-free.
 */

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ISSUE_REASONS,
  reportIssue,
  type IssueReason,
  type IssueView,
} from "@/lib/orders";

const inputCls =
  "w-full rounded-[9px] border border-border bg-bg px-[13px] py-[10px] text-[13.5px] text-ink outline-none focus:border-cta";

export function ReportProblemView() {
  const params = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(params.get("on") ?? "");
  const [phone, setPhone] = useState(
    (params.get("phone") ?? "").replace(/^\+91/, "").replace(/\D/g, ""),
  );
  const [reason, setReason] = useState<IssueReason | null>(null);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<IssueView | null>(null);

  const canSubmit =
    orderNumber.trim().length > 0 && /^\d{10}$/.test(phone) && reason !== null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || busy || reason === null) return;
    setBusy(true);
    setError("");
    const res = await reportIssue(orderNumber, {
      phone,
      reason,
      details: details.trim(),
    });
    setBusy(false);
    if (res.ok) {
      setDone(res.data);
    } else {
      setError(
        res.status === 404
          ? "We couldn't find that order. Check the order number and the phone it was placed with."
          : res.message,
      );
    }
  };

  /* ---- after submit: what happens next ---- */
  if (done) {
    return (
      <div className="mx-auto max-w-[560px]">
        <div className="mb-4 rounded-[14px] border border-border bg-card p-[18px] text-center">
          <p
            aria-hidden
            className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-dharma-bg text-xl text-dharma-fg"
          >
            ✓
          </p>
          <h2 className="mb-1 text-[18px] font-bold text-ink">
            We&apos;ve got it — order {done.orderNumber}
          </h2>
          <p className="text-[13px] text-sub">
            Your report is with the team. Nothing more to do right now.
          </p>
        </div>

        <div className="rounded-[14px] border border-border bg-card p-[18px]">
          <p className="mb-3 text-[10px] font-bold tracking-[0.8px] text-sub uppercase">
            What happens next
          </p>
          <ol className="space-y-[10px]">
            {[
              "We reply within one working day — usually much sooner.",
              "We'll request photos on WhatsApp if they help resolve this faster. No forms.",
              "Your choice of fix: an item-level replacement, or a refund for what went wrong. You decide, not us.",
            ].map((step, i) => (
              <li
                key={step}
                className="flex gap-3 text-[13px] leading-relaxed text-body"
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-bg text-[10.5px] font-bold text-gold">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
          <p className="mt-3 border-t border-border-light pt-3 text-[12px] text-sub">
            Prefer email? Write to{" "}
            <a
              href="mailto:help@thetapaco.com"
              className="font-bold text-cta hover:underline"
            >
              help@thetapaco.com
            </a>{" "}
            with your order number.
          </p>
        </div>

        <p className="mt-5 text-center">
          <Link
            href={`/orders/track?on=${encodeURIComponent(done.orderNumber)}&phone=${encodeURIComponent(phone)}`}
            className="text-[13.5px] font-bold text-cta"
          >
            Back to your order ›
          </Link>
        </p>
      </div>
    );
  }

  /* ---- the form ---- */
  return (
    <form onSubmit={submit} className="mx-auto max-w-[560px]">
      <div className="rounded-[14px] border border-border bg-card p-[18px]">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-[10.5px] font-bold tracking-[0.6px] text-sub uppercase">
              Order number
            </span>
            <input
              type="text"
              placeholder="TK-2026-0001"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className={inputCls}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10.5px] font-bold tracking-[0.6px] text-sub uppercase">
              Mobile number
            </span>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="The number the order was placed with"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              className={inputCls}
            />
          </label>
        </div>

        <fieldset className="mt-4">
          <legend className="mb-2 text-[10.5px] font-bold tracking-[0.6px] text-sub uppercase">
            What went wrong?
          </legend>
          <div className="space-y-2">
            {ISSUE_REASONS.map((r) => {
              const on = reason === r.value;
              return (
                <label
                  key={r.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-[11px] border px-4 py-[10px] ${
                    on ? "border-cta bg-bhranti-bg" : "border-border bg-bg"
                  }`}
                >
                  <input
                    type="radio"
                    name="issue-reason"
                    value={r.value}
                    checked={on}
                    onChange={() => setReason(r.value)}
                    className="accent-[var(--color-cta)]"
                  />
                  <span className="text-[13.5px] font-semibold text-ink">
                    {r.label}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <label className="mt-4 block">
          <span className="mb-1 block text-[10.5px] font-bold tracking-[0.6px] text-sub uppercase">
            Tell us a little more (optional)
          </span>
          <textarea
            rows={4}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Which item, what happened — anything that helps us fix it faster."
            className={`${inputCls} resize-y`}
          />
        </label>

        <p className="mt-3 text-[11.5px] leading-relaxed text-sub">
          No photo upload needed here — we&apos;ll request photos on WhatsApp
          if they help resolve this faster.
        </p>

        {error && (
          <p className="mt-3 rounded-[10px] border border-pratha-bd bg-pratha-bg px-4 py-3 text-[12.5px] text-pratha-fg">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit || busy}
          className="mt-4 w-full rounded-[10px] bg-cta px-6 py-[12px] text-[14px] font-bold text-white hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Sending…" : "Send the report"}
        </button>
        <p className="mt-2 text-center text-[11.5px] text-sub">
          Item-level replacement or refund — your choice. We reply within one
          working day.
        </p>
      </div>
    </form>
  );
}
