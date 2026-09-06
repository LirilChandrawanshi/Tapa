"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CIRCLE_JOINED_KEY,
  CIRCLE_JOIN_URL,
  isValidIndianMobile,
} from "@/lib/staticExtras";

type JoinState = "idle" | "waiting" | "active";

/**
 * The single join control for /tapa-circle. Flow per the Circle v2 spec:
 * the typed number is registered as a pending join (held 24h), the visitor
 * is handed to wa.me to send JOIN — that inbound message is the consent —
 * and this page polls until the webhook confirms. The waiting state must
 * never claim success on its own.
 */
export function CircleJoin() {
  const [number, setNumber] = useState("");
  const [touched, setTouched] = useState(false);
  const [state, setState] = useState<JoinState>("idle");
  const [deepLink, setDeepLink] = useState(CIRCLE_JOIN_URL);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const valid = isValidIndianMobile(number);
  const showError = touched && number.length > 0 && !valid;

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => stopPolling, [stopPolling]);

  const startPolling = useCallback(
    (phone: string) => {
      stopPolling();
      pollRef.current = setInterval(async () => {
        try {
          const res = await fetch(
            `/api/v1/circle/status?phone=${encodeURIComponent(phone)}`,
            { cache: "no-store" },
          );
          if (!res.ok) return;
          const body = (await res.json()) as {
            data?: { status?: string };
          };
          if (body.data?.status === "ACTIVE") {
            stopPolling();
            setState("active");
            try {
              localStorage.setItem(CIRCLE_JOINED_KEY, "true");
            } catch {
              // storage unavailable — membership is real regardless
            }
          }
        } catch {
          // transient network hiccups are fine; keep polling
        }
      }, 3000);
    },
    [stopPolling],
  );

  const onJoin = async () => {
    setTouched(true);
    if (!valid) return;

    let link = CIRCLE_JOIN_URL;
    try {
      const res = await fetch("/api/v1/circle/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: `+91${number}`,
          entryPointPage: "/tapa-circle",
        }),
      });
      if (res.ok) {
        const body = (await res.json()) as { data?: { deepLink?: string } };
        if (body.data?.deepLink) link = body.data.deepLink;
      }
    } catch {
      // registration is best-effort; the inbound JOIN alone is sufficient
    }
    setDeepLink(link);
    setState("waiting");
    startPolling(`+91${number}`);
    window.open(link, "_blank", "noopener,noreferrer");
  };

  if (state === "active") {
    return (
      <div className="rounded-2xl border border-wa/50 bg-wa/15 px-[22px] py-6 text-center">
        <p className="text-[22px]" aria-hidden>
          ✓
        </p>
        <p className="mt-1 text-[15px] font-bold text-hero-text">
          You&rsquo;re in the Circle
        </p>
        <p className="mt-2 text-[12.5px] leading-relaxed text-hero-text/70">
          Your welcome message is on its way on WhatsApp. The next reminder
          arrives the evening before the next vrat on the calendar — and
          nothing on quiet days.
        </p>
      </div>
    );
  }

  if (state === "waiting") {
    return (
      <div className="rounded-2xl border border-white/[0.14] bg-white/[0.07] px-[22px] py-6 text-center">
        <p
          aria-hidden
          className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-wa border-t-transparent"
        />
        <p className="mt-3 text-[14px] font-bold text-hero-text">
          One message to go
        </p>
        <p className="mt-2 text-[12.5px] leading-relaxed text-hero-text/70">
          Send the pre-filled <b className="text-hero-text">JOIN</b> message in
          WhatsApp to finish joining. This page will confirm the moment it
          arrives.
        </p>
        <a
          href={deepLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block rounded-[11px] bg-wa px-5 py-[10px] text-[13px] font-bold text-white"
        >
          Open WhatsApp again ›
        </a>
        <button
          onClick={() => {
            stopPolling();
            setState("idle");
          }}
          className="mt-3 block w-full py-1 text-[12px] font-semibold text-hero-text/50"
        >
          Change number
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.14] bg-white/[0.07] px-[22px] py-5">
      <p className="mb-2 text-[10px] font-bold tracking-[0.8px] text-eyebrow-dark uppercase">
        WhatsApp number
      </p>
      <div className="mb-2 flex items-stretch gap-2">
        <span
          aria-hidden
          className="flex items-center rounded-[11px] border border-white/20 bg-white/10 px-3 text-[14px] font-bold text-hero-text select-none"
        >
          +91
        </span>
        <input
          type="tel"
          inputMode="numeric"
          maxLength={10}
          value={number}
          onChange={(e) =>
            setNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
          }
          onBlur={() => setTouched(true)}
          placeholder="10-digit number"
          aria-label="Your WhatsApp number, without the +91"
          aria-invalid={showError}
          className={`min-w-0 flex-1 rounded-[11px] border bg-white/10 px-3 py-[11px] text-[15px] tracking-[0.5px] text-hero-text outline-none placeholder:text-hero-text/40 ${
            showError ? "border-cta" : "border-white/20 focus:border-eyebrow-dark"
          }`}
        />
      </div>
      {showError && (
        <p className="mb-2 text-[11.5px] leading-relaxed text-[#FFB3CE]">
          A 10-digit mobile number, digits only — the one your WhatsApp is on.
        </p>
      )}
      <button
        onClick={onJoin}
        disabled={!valid}
        className="w-full rounded-[11px] bg-wa px-5 py-[12px] text-[13.5px] font-bold text-white disabled:opacity-50"
      >
        Join on WhatsApp ›
      </button>
      <p className="mt-3 text-[11.5px] leading-relaxed text-hero-text/60">
        You&rsquo;ll send one message — <b className="text-hero-text">JOIN</b> —
        from your WhatsApp. That message is your consent. Leave whenever you
        wish by replying STOP.
      </p>
    </div>
  );
}
