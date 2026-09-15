"use client";

import { useEffect, useState } from "react";
import { OtpBottomSheet } from "@/components/auth/OtpBottomSheet";
import { clearMeCache, getMeCached, type Me } from "@/lib/auth";

export type NotifyContext = "kits" | "purohit" | "restock";

type Status = "idle" | "sending" | "done" | "error";
/** undefined = still checking the session; null = signed out. */
type Session = Me | null | undefined;

/** "+919876543210" → "98765 43210" (what the user recognises as their number). */
function prettyPhone(phone: string): string {
  const d = phone.replace(/\D/g, "").slice(-10);
  return d.length === 10 ? `${d.slice(0, 5)} ${d.slice(5)}` : phone;
}

/**
 * Pre-launch WhatsApp capture — POSTs { context, phone? } to /api/v1/notify-me.
 *
 * A signed-in visitor is never asked for a number they already gave us at
 * sign-in: they get a one-tap button and the API uses their session phone.
 * Signed out, `variant="inline"` captures the number in place (wide surfaces:
 * hero bands, PDP buy box) while `variant="compact"` — for a 272px rail card
 * where a phone field can only look cramped — opens the standard OTP sheet,
 * so the number lands verified and the tap also creates the account.
 *
 * Never throws: a dead backend or a missing endpoint surfaces the same inline
 * retry line rather than breaking the surface it sits on.
 */
export function NotifyMe({
  context,
  articleSlug,
  variant = "inline",
  tone = "dark",
  buttonLabel = "Notify me",
  doneCopy = "We'll message you when pre-booking opens.",
  note = "One WhatsApp message when pre-booking opens. Nothing else.",
}: {
  context: NotifyContext;
  articleSlug?: string;
  variant?: "inline" | "compact";
  /** The surface underneath: a dark hero band, or a light card. */
  tone?: "dark" | "light";
  buttonLabel?: string;
  doneCopy?: string;
  note?: string;
}) {
  const [me, setMe] = useState<Session>(undefined);
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const [gateOpen, setGateOpen] = useState(false);

  useEffect(() => {
    let live = true;
    void getMeCached().then((res) => {
      if (live) setMe(res.ok ? res.data : null);
    });
    return () => {
      live = false;
    };
  }, []);

  const digits = phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  const valid = /^[6-9]\d{9}$/.test(digits);

  async function register(withPhone?: string) {
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/v1/notify-me", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context,
          ...(withPhone ? { phone: withPhone } : {}),
          ...(articleSlug ? { articleSlug } : {}),
        }),
      });
      if (!res.ok) throw new Error(`notify-me ${res.status}`);
      setStatus("done");
      setMessage(doneCopy);
    } catch {
      setStatus("error");
      setMessage("Couldn't save your number just now — please try again.");
    }
  }

  function submitPhone(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) {
      setStatus("error");
      setMessage("Enter a 10-digit Indian mobile number.");
      return;
    }
    void register(`+91${digits}`);
  }

  const muted = tone === "dark" ? "text-hero-text/45" : "text-sub";
  const errorText = tone === "dark" ? "text-amber" : "text-cta";

  /* ── Done ─────────────────────────────────────────────────────────── */
  if (status === "done") {
    const doneClass =
      tone === "dark"
        ? "border-wa/40 bg-wa/10 text-hero-text"
        : "border-dharma-bd bg-dharma-bg text-dharma-fg";
    return (
      <p
        role="status"
        className={`rounded-[10px] border px-3 py-[9px] text-center font-bold ${doneClass} ${
          variant === "compact" ? "text-[11.5px]" : "text-[12.5px]"
        }`}
      >
        ✓ {message}
      </p>
    );
  }

  /* ── Still resolving the session on a wide surface ──────────────────── */
  // The compact card shows the same button either way, so it never waits;
  // the inline variant would otherwise flip from button to field mid-read.
  if (variant === "inline" && me === undefined) {
    return (
      <div className="max-w-[420px]" aria-hidden>
        <div
          className={`h-[42px] rounded-[10px] border ${
            tone === "dark"
              ? "border-white/15 bg-white/5"
              : "border-border bg-card"
          }`}
        />
        <p className={`mt-2 text-[10.5px] ${muted}`}>{note}</p>
      </div>
    );
  }

  /* ── One-tap: signed in, or the compact card (OTP sheet does the rest) ── */
  if (me || variant === "compact") {
    const onTap = () => {
      if (status === "sending") return;
      if (me) {
        void register();
        return;
      }
      if (me === undefined) {
        // session still resolving — settle it, then act on the answer
        void getMeCached().then((res) => {
          if (res.ok) {
            setMe(res.data);
            void register();
          } else {
            setMe(null);
            setGateOpen(true);
          }
        });
        return;
      }
      setGateOpen(true);
    };

    const compact = variant === "compact";
    const reassurance = (
      <p
        className={`leading-snug ${muted} ${
          compact ? "mb-[7px] text-center text-[10px]" : "mt-[7px] text-[10.5px]"
        }`}
      >
        {me ? `One WhatsApp message to +91 ${prettyPhone(me.phone)}.` : note}
      </p>
    );

    return (
      <>
        {/* on a card the line sits above, so every CTA in the rail shares a baseline */}
        {compact && reassurance}
        <button
          type="button"
          onClick={onTap}
          disabled={status === "sending"}
          className={`w-full rounded-[10px] bg-cta font-bold text-white hover:opacity-90 disabled:opacity-60 ${
            compact ? "px-3 py-[9px] text-[12.5px]" : "px-4 py-[11px] text-[13.5px]"
          }`}
        >
          <span aria-hidden>🔔</span>{" "}
          {status === "sending" ? "Saving…" : buttonLabel}
        </button>
        {!compact && reassurance}
        {status === "error" && (
          <p role="alert" className={`mt-1 text-[11px] font-semibold ${errorText}`}>
            {message}
          </p>
        )}

        <OtpBottomSheet
          open={gateOpen}
          context="save"
          heading="Get the alert on WhatsApp"
          dismissLabel="Continue without the alert"
          onClose={() => setGateOpen(false)}
          onSuccess={(user) => {
            clearMeCache();
            setGateOpen(false);
            setMe({
              phone: user.phone,
              name: user.name,
              languagePref: user.languagePref,
              city: "",
              savedCount: 0,
            });
            void register();
          }}
        />
      </>
    );
  }

  /* ── Signed out, wide surface: capture the number in place ───────────── */
  const fieldClass =
    tone === "dark"
      ? "border-white/25 bg-white/10 focus-within:border-white/50"
      : "border-border bg-card focus-within:border-cta";
  const textClass = tone === "dark" ? "text-hero-text" : "text-ink";
  const placeholderClass =
    tone === "dark" ? "placeholder:text-hero-text/40" : "placeholder:text-sub/70";

  return (
    <form onSubmit={submitPhone} className="max-w-[420px]" noValidate>
      <div className="flex items-stretch gap-2">
        <label
          className={`flex min-w-0 flex-1 items-center gap-2 rounded-[10px] border px-3 ${fieldClass}`}
        >
          <span className={`text-[12.5px] font-bold ${textClass} opacity-70`}>
            +91
          </span>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={11}
            autoComplete="tel-national"
            placeholder="98765 43210"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (status === "error") setStatus("idle");
            }}
            aria-label="Mobile number for the pre-booking alert"
            aria-invalid={status === "error"}
            className={`w-full min-w-0 bg-transparent py-[10px] text-[13px] focus:outline-none ${textClass} ${placeholderClass}`}
          />
        </label>
        <button
          type="submit"
          disabled={status === "sending"}
          className="shrink-0 rounded-[10px] bg-cta px-4 py-[10px] text-[12.5px] font-bold whitespace-nowrap text-white hover:opacity-90 disabled:opacity-60"
        >
          {status === "sending" ? "Saving…" : buttonLabel}
        </button>
      </div>
      {status === "error" && (
        <p role="alert" className={`mt-2 text-[11.5px] font-semibold ${errorText}`}>
          {message}
        </p>
      )}
      <p className={`mt-2 text-[10.5px] ${muted}`}>{note}</p>
    </form>
  );
}
