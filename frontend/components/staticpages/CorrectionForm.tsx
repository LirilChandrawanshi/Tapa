"use client";

import { useState, type FormEvent } from "react";
import {
  isValidEmail,
  isValidIndianMobile,
  submitCorrection,
} from "@/lib/staticExtras";

interface Fields {
  pageUrl: string;
  lineAsItStands: string;
  whatItShouldSay: string;
  source: string;
  isPratha: boolean;
  name: string;
  email: string;
  whatsapp: string;
}

const EMPTY: Fields = {
  pageUrl: "",
  lineAsItStands: "",
  whatItShouldSay: "",
  source: "",
  isPratha: false,
  name: "",
  email: "",
  whatsapp: "",
};

type Errors = Partial<Record<keyof Fields, string>>;

/** Fear-free, per-field validation copy — nothing scolds, everything guides. */
function validate(f: Fields): Errors {
  const errors: Errors = {};
  if (!f.pageUrl.trim())
    errors.pageUrl =
      "Tell us which page — a link is ideal, the title works too.";
  if (!f.lineAsItStands.trim())
    errors.lineAsItStands =
      "Paste the line as it stands, so we review exactly what you read.";
  if (!f.whatItShouldSay.trim())
    errors.whatItShouldSay =
      "Tell us what you believe it should say — a rough note is fine.";
  if (!f.name.trim())
    errors.name = "Your name, so we know who to thank.";
  if (!f.email.trim())
    errors.email = "An email address, so we can write back with the outcome.";
  else if (!isValidEmail(f.email.trim()))
    errors.email = "That does not look like an email address — worth a second glance.";
  if (f.whatsapp.trim() && !isValidIndianMobile(f.whatsapp.trim()))
    errors.whatsapp =
      "A 10-digit mobile number, digits only — or leave it blank, it is optional.";
  return errors;
}

const NEXT_STEPS = [
  {
    title: "Received",
    body: "Your correction reaches our Ritual Intelligence Team — every one is read by a person.",
  },
  {
    title: "RI team review",
    body: "We examine the source you shared alongside the source already cited — against the source edition, not a digest.",
  },
  {
    title: "Correction published on the article, dated",
    body: "Where a correction is warranted, the article changes and the change is recorded on the page with its date. We do not correct silently.",
  },
  {
    title: "You are credited, if you wish",
    body: "We write back with the outcome either way — including when we reach a different conclusion, with our reasoning.",
  },
] as const;

export function CorrectionForm() {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<"editing" | "sending" | "sent" | "failed">(
    "editing",
  );

  const set = <K extends keyof Fields>(key: K, value: Fields[K]) => {
    setFields((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validate(fields);
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;
    setStatus("sending");
    const ok = await submitCorrection({
      pageUrl: fields.pageUrl.trim(),
      lineAsItStands: fields.lineAsItStands.trim(),
      whatItShouldSay: fields.whatItShouldSay.trim(),
      source: fields.source.trim(),
      isPratha: fields.isPratha,
      name: fields.name.trim(),
      email: fields.email.trim(),
      whatsapp: fields.whatsapp.trim(),
    });
    setStatus(ok ? "sent" : "failed");
  };

  if (status === "sent") {
    return (
      <div className="rounded-[18px] border border-border bg-card px-5 py-7 md:px-[30px]">
        <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-dharma-bg text-xl text-dharma-fg">
          ✓
        </div>
        <h2 className="mb-2 text-[20px] font-bold text-ink">
          Thank you — it is with us.
        </h2>
        <p className="mb-5 max-w-[520px] text-[13px] leading-relaxed text-sub">
          Every correction is read with the same care. Here is what happens
          next:
        </p>
        <ol className="flex flex-col gap-3">
          {NEXT_STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-bg text-[12px] font-bold text-gold">
                {i + 1}
              </span>
              <span>
                <span className="block text-[13.5px] font-bold text-ink">
                  {step.title}
                </span>
                <span className="mt-[2px] block text-[12.5px] leading-relaxed text-sub">
                  {step.body}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    );
  }

  const inputCls = (bad: boolean) =>
    `w-full rounded-[10px] border bg-bg px-3 py-[10px] text-[13.5px] text-ink outline-none placeholder:text-sub focus:border-cta ${
      bad ? "border-cta" : "border-border"
    }`;
  const labelCls =
    "mb-[6px] block text-[10.5px] font-bold tracking-[0.7px] text-mid uppercase";
  const errCls = "mt-[5px] block text-[11.5px] leading-relaxed text-cta";

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-[18px] border border-border bg-card px-5 py-6 md:px-[30px] md:py-[28px]"
    >
      <div className="mb-4">
        <label htmlFor="cx-page" className={labelCls}>
          Which page <em className="font-medium normal-case">— link or title</em>
        </label>
        <input
          id="cx-page"
          type="text"
          value={fields.pageUrl}
          onChange={(e) => set("pageUrl", e.target.value)}
          placeholder="thetapaco.com/…"
          className={inputCls(!!errors.pageUrl)}
        />
        {errors.pageUrl && <span className={errCls}>{errors.pageUrl}</span>}
      </div>

      <div className="mb-4">
        <label htmlFor="cx-line" className={labelCls}>
          What needs correction{" "}
          <em className="font-medium normal-case">— quote the line as it stands</em>
        </label>
        <textarea
          id="cx-line"
          rows={3}
          value={fields.lineAsItStands}
          onChange={(e) => set("lineAsItStands", e.target.value)}
          placeholder="Paste the sentence or line from the page."
          className={inputCls(!!errors.lineAsItStands)}
        />
        {errors.lineAsItStands && (
          <span className={errCls}>{errors.lineAsItStands}</span>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="cx-should" className={labelCls}>
          What you believe it should say
        </label>
        <textarea
          id="cx-should"
          rows={3}
          value={fields.whatItShouldSay}
          onChange={(e) => set("whatItShouldSay", e.target.value)}
          placeholder="Your suggested correction."
          className={inputCls(!!errors.whatItShouldSay)}
        />
        {errors.whatItShouldSay && (
          <span className={errCls}>{errors.whatItShouldSay}</span>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="cx-source" className={labelCls}>
          Your source{" "}
          <em className="font-medium normal-case">
            — the text, and chapter or verse if known
          </em>
        </label>
        <input
          id="cx-source"
          type="text"
          value={fields.source}
          onChange={(e) => set("source", e.target.value)}
          placeholder="e.g. Skanda Purana, Vaishnava Khanda"
          className={inputCls(false)}
        />
        <label className="mt-3 flex items-start gap-[10px] text-[12.5px] leading-relaxed text-body">
          <input
            type="checkbox"
            checked={fields.isPratha}
            onChange={(e) => set("isPratha", e.target.checked)}
            className="mt-[3px] size-4 accent-cta"
          />
          <span>
            This comes from family or regional practice rather than a text. We
            recognise Pratha as an important part of our living culture, and
            record it as such.
          </span>
        </label>
      </div>

      <div className="mb-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cx-name" className={labelCls}>
            Your name <i className="text-cta">*</i>
          </label>
          <input
            id="cx-name"
            type="text"
            autoComplete="name"
            value={fields.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Your name"
            className={inputCls(!!errors.name)}
          />
          {errors.name && <span className={errCls}>{errors.name}</span>}
        </div>
        <div>
          <label htmlFor="cx-email" className={labelCls}>
            Your email <i className="text-cta">*</i>
          </label>
          <input
            id="cx-email"
            type="email"
            autoComplete="email"
            value={fields.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="your@email.com"
            className={inputCls(!!errors.email)}
          />
          {errors.email && <span className={errCls}>{errors.email}</span>}
        </div>
      </div>

      <div className="mb-5">
        <label htmlFor="cx-wa" className={labelCls}>
          Your WhatsApp number{" "}
          <em className="font-medium normal-case">— optional</em>
        </label>
        <div className="flex items-center gap-2">
          <span className="rounded-[10px] border border-border bg-bg px-3 py-[10px] text-[13.5px] font-semibold text-sub">
            +91
          </span>
          <input
            id="cx-wa"
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={fields.whatsapp}
            onChange={(e) =>
              set("whatsapp", e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            placeholder="10-digit number"
            className={inputCls(!!errors.whatsapp)}
          />
        </div>
        {errors.whatsapp && <span className={errCls}>{errors.whatsapp}</span>}
      </div>

      {status === "failed" && (
        <p className="mb-4 rounded-[10px] border border-pratha-bd bg-pratha-bg px-4 py-3 text-[12.5px] leading-relaxed text-pratha-fg">
          We could not send that just now — nothing you wrote is lost. Give it
          a moment and press submit again.
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="rounded-[11px] bg-cta px-[26px] py-[12px] text-[13px] font-bold text-white disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "Submit the correction"}
      </button>
      <p className="mt-3 text-[11.5px] leading-relaxed text-sub">
        If you share your email or WhatsApp number, we can write back with the
        outcome. Every correction is read with the same care.
      </p>
    </form>
  );
}
