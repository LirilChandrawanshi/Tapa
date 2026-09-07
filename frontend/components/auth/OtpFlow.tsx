"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import {
  requestOtp,
  updateMe,
  verifyOtp,
  type AuthUser,
} from "@/lib/auth";

export type OtpContext = "save" | "signin";

const OTP_LENGTH = 6;
const DEFAULT_RESEND_SECONDS = 28;
const DEFAULT_CITY = "Delhi-NCR";

const HEADINGS: Record<OtpContext, string> = {
  save: "Save this to your rituals",
  signin: "Sign in to Tapa",
};

export const DISMISS_LABELS: Record<OtpContext, string> = {
  save: "Continue without saving",
  signin: "Continue without an account",
};

/** Fear-free copy for known API error codes; falls back to the API message. */
function errorCopy(code: string, apiMessage: string): string {
  switch (code) {
    case "otp_invalid":
      return apiMessage || "That code didn't match. Try again.";
    case "otp_throttled":
      return apiMessage || "A code is already on its way. Give it a moment.";
    case "network":
      return apiMessage;
    default:
      return apiMessage || "Something didn't go through. Please try again.";
  }
}

const inputBase =
  "w-full rounded-lg border-[1.5px] border-border bg-card px-3 py-[10px] text-[14px] text-body outline-none focus:border-cta";

const primaryBtn =
  "w-full rounded-lg bg-cta py-3 text-[14px] font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40";

type Step = "phone" | "otp" | "profile";

/**
 * The three-step contextual OTP flow (phone → code → first-time profile).
 * Rendered inside OtpBottomSheet as a modal, or inline as a card on
 * /sign-in and /account. Never shows a corner ✕ — the only dismiss is the
 * full-width "Continue without…" text button.
 */
export function OtpFlow({
  context,
  heading,
  onSuccess,
  onDismiss,
  dismissLabel,
}: {
  context: OtpContext;
  heading?: string;
  onSuccess: (user: AuthUser) => void;
  /** Omit to hide the dismiss button (e.g. nothing sensible to go back to). */
  onDismiss?: () => void;
  dismissLabel?: string;
}) {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_RESEND_SECONDS);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [name, setName] = useState("");
  const [city, setCity] = useState(DEFAULT_CITY);

  const boxRefs = useRef<Array<HTMLInputElement | null>>([]);
  const phoneValid = /^[6-9]\d{9}$/.test(phone);

  /* Resend countdown */
  useEffect(() => {
    if (step !== "otp" || secondsLeft <= 0) return;
    const id = window.setInterval(
      () => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)),
      1000,
    );
    return () => window.clearInterval(id);
  }, [step, secondsLeft]);

  async function sendOtp(isResend = false) {
    if (busy || !phoneValid) return;
    if (!isResend) track("login_started", { context });
    setBusy(true);
    setError(null);
    const res = await requestOtp(`+91${phone}`);
    setBusy(false);
    if (res.ok) {
      setSecondsLeft(res.data?.resendAfterSeconds ?? DEFAULT_RESEND_SECONDS);
      if (!isResend) {
        setDigits(Array(OTP_LENGTH).fill(""));
        setStep("otp");
        window.setTimeout(() => boxRefs.current[0]?.focus(), 60);
      }
    } else if (res.code === "otp_throttled" && !isResend) {
      // A recent code is still valid — let them type it instead of blocking.
      setStep("otp");
      setSecondsLeft(DEFAULT_RESEND_SECONDS);
      setError(errorCopy(res.code, res.message));
    } else {
      setError(errorCopy(res.code, res.message));
    }
  }

  const verify = useCallback(
    async (code: string) => {
      if (busy) return;
      setBusy(true);
      setError(null);
      const res = await verifyOtp(`+91${phone}`, code);
      setBusy(false);
      if (!res.ok) {
        setError(errorCopy(res.code, res.message));
        setDigits(Array(OTP_LENGTH).fill(""));
        boxRefs.current[0]?.focus();
        return;
      }
      const verified = res.data.user;
      track("login_completed", { context, isNew: verified.isNew });
      setUser(verified);
      if (verified.isNew) {
        setName(verified.name);
        setStep("profile");
      } else {
        onSuccess(verified);
      }
    },
    [busy, phone, context, onSuccess],
  );

  function setDigit(index: number, raw: string) {
    const value = raw.replace(/\D/g, "");
    setError(null);
    // Pasting the whole code into any box fills all six.
    if (value.length > 1) {
      const next = Array(OTP_LENGTH).fill("");
      value
        .slice(0, OTP_LENGTH)
        .split("")
        .forEach((d, i) => (next[i] = d));
      setDigits(next);
      const filled = Math.min(value.length, OTP_LENGTH) - 1;
      boxRefs.current[filled]?.focus();
      if (value.length >= OTP_LENGTH) void verify(value.slice(0, OTP_LENGTH));
      return;
    }
    const next = [...digits];
    next[index] = value;
    setDigits(next);
    if (value && index < OTP_LENGTH - 1) boxRefs.current[index + 1]?.focus();
    const code = next.join("");
    if (code.length === OTP_LENGTH) void verify(code);
  }

  function onBoxKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      boxRefs.current[index - 1]?.focus();
    }
  }

  async function submitProfile(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !user) return;
    setBusy(true);
    setError(null);
    const res = await updateMe({
      name: name.trim(),
      city: city.trim() || DEFAULT_CITY,
    });
    setBusy(false);
    if (!res.ok) {
      setError(errorCopy(res.code, res.message));
      return;
    }
    onSuccess({ ...user, name: name.trim(), isNew: false });
  }

  const dismiss =
    onDismiss !== undefined ? (
      <button
        type="button"
        onClick={() => {
          track("login_skipped", { context, step });
          onDismiss();
        }}
        className="mt-3 w-full py-2 text-center text-[13px] font-semibold text-sub hover:text-body"
      >
        {dismissLabel ?? DISMISS_LABELS[context]}
      </button>
    ) : null;

  const errorLine = error ? (
    <p role="alert" className="mt-3 text-[12.5px] font-semibold text-cta">
      {error}
    </p>
  ) : null;

  /* ---- Step 1: phone ---- */
  if (step === "phone") {
    return (
      <div>
        <h2 className="text-[19px] font-bold leading-snug text-ink">
          {heading ?? HEADINGS[context]}
        </h2>
        <p className="mt-1 text-[13px] text-sub">
          Save rituals, track bookings, get reminders.
        </p>

        <form
          className="mt-5"
          onSubmit={(e) => {
            e.preventDefault();
            void sendOtp();
          }}
        >
          <label
            htmlFor="tapa-phone"
            className="mb-[6px] block text-[11.5px] font-bold uppercase tracking-[0.6px] text-mid"
          >
            Your WhatsApp number
          </label>
          <div className="flex items-stretch overflow-hidden rounded-lg border-[1.5px] border-border bg-card focus-within:border-cta">
            <span className="flex items-center border-r border-border bg-bg px-3 text-[14px] font-semibold text-mid">
              +91
            </span>
            <input
              id="tapa-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="98765 43210"
              maxLength={10}
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                setError(null);
              }}
              className="w-full bg-transparent px-3 py-[10px] text-[15px] tracking-[1px] text-body outline-none"
            />
          </div>

          <p className="mt-2 text-[11.5px] text-sub">
            We&rsquo;ll send a 6-digit code to verify.
          </p>

          {errorLine}

          <button
            type="submit"
            disabled={!phoneValid || busy}
            className={`mt-4 ${primaryBtn}`}
          >
            {busy ? "Sending…" : "Send OTP"}
          </button>
        </form>

        <p className="mt-3 text-center text-[11.5px] leading-relaxed text-sub">
          By continuing you agree to our <b>Terms</b> and <b>Privacy Policy</b>.
          One-time code on WhatsApp/SMS — no spam, ever.
        </p>

        {dismiss}
      </div>
    );
  }

  /* ---- Step 2: OTP ---- */
  if (step === "otp") {
    return (
      <div>
        <h2 className="text-[19px] font-bold leading-snug text-ink">
          Enter the 6-digit code
        </h2>
        <p className="mt-1 text-[13px] text-sub">
          Code sent to{" "}
          <b className="text-body">+91 XXXXX X{phone.slice(6)}</b> ·{" "}
          <button
            type="button"
            onClick={() => {
              setStep("phone");
              setError(null);
              setDigits(Array(OTP_LENGTH).fill(""));
            }}
            className="font-semibold text-cta underline underline-offset-2"
          >
            Change number
          </button>
        </p>

        <div className="mt-5 flex justify-between gap-2">
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                boxRefs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              aria-label={`OTP digit ${i + 1}`}
              value={digit}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => onBoxKeyDown(i, e)}
              onFocus={(e) => e.target.select()}
              className="h-12 w-full max-w-[46px] rounded-lg border-[1.5px] border-border bg-card text-center text-[18px] font-bold text-ink outline-none focus:border-cta"
            />
          ))}
        </div>

        {errorLine}

        <button
          type="button"
          disabled={digits.join("").length !== OTP_LENGTH || busy}
          onClick={() => void verify(digits.join(""))}
          className={`mt-4 ${primaryBtn}`}
        >
          {busy ? "Checking…" : context === "save" ? "Verify & save" : "Verify"}
        </button>

        <p className="mt-3 text-center text-[12.5px] text-sub">
          {secondsLeft > 0 ? (
            <>
              Resend OTP in{" "}
              <b className="tabular-nums text-body">
                00:{String(secondsLeft).padStart(2, "0")}
              </b>
            </>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={() => void sendOtp(true)}
              className="font-bold text-cta underline underline-offset-2"
            >
              Resend OTP
            </button>
          )}
        </p>

        {dismiss}
      </div>
    );
  }

  /* ---- Step 3: first-time profile ---- */
  return (
    <div>
      <h2 className="text-[19px] font-bold leading-snug text-ink">
        Welcome to Tapa 🙏
      </h2>
      <p className="mt-1 text-[13px] text-sub">
        Two quick details and you&apos;re set.
      </p>

      <form className="mt-5" onSubmit={submitProfile}>
        <label
          htmlFor="tapa-name"
          className="mb-[6px] block text-[11.5px] font-bold uppercase tracking-[0.6px] text-mid"
        >
          What should we call you?
        </label>
        <input
          id="tapa-name"
          type="text"
          autoComplete="name"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputBase}
        />

        <label
          htmlFor="tapa-city"
          className="mb-[6px] mt-4 block text-[11.5px] font-bold uppercase tracking-[0.6px] text-mid"
        >
          Your city
        </label>
        <input
          id="tapa-city"
          type="text"
          autoComplete="address-level2"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className={inputBase}
        />

        {errorLine}

        <button
          type="submit"
          disabled={!name.trim() || busy}
          className={`mt-5 ${primaryBtn}`}
        >
          {busy ? "Saving…" : "Save & continue"}
        </button>
      </form>
    </div>
  );
}
