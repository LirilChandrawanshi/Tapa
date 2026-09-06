"use client";

import { useState } from "react";
import {
  CIRCLE_JOINED_KEY,
  CIRCLE_JOIN_URL,
  isValidIndianMobile,
} from "@/lib/staticExtras";

/**
 * The single join control for /tapa-circle — one WhatsApp-number field
 * (+91 fixed) and a button that opens wa.me with the pre-filled JOIN
 * message. Phase 1 makes no backend call: the JOIN message the member
 * sends from their own WhatsApp is the consent and the signup (the
 * inbound webhook is Phase 2). Joining also quiets the site nudges.
 */
export function CircleJoin() {
  const [number, setNumber] = useState("");
  const [touched, setTouched] = useState(false);

  const valid = isValidIndianMobile(number);
  const showError = touched && number.length > 0 && !valid;

  const onJoin = () => {
    setTouched(true);
    if (!valid) return;
    try {
      localStorage.setItem(CIRCLE_JOINED_KEY, "true");
    } catch {
      // storage unavailable — the join still proceeds
    }
    window.open(CIRCLE_JOIN_URL, "_blank", "noopener,noreferrer");
  };

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
