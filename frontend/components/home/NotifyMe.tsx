"use client";

import { useState } from "react";

type Status = "idle" | "sending" | "done" | "error";

/**
 * Pre-launch phone capture — POSTs { context, phone } to /api/v1/notify-me
 * through the dev rewrite proxy. The endpoint may not exist yet (404) and
 * the backend may be down entirely; both surface the same inline retry
 * message rather than breaking the shelf.
 */
export function NotifyMe({ context }: { context: string }) {
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const digits = phone.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  const valid = /^[6-9]\d{9}$/.test(digits);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) {
      setStatus("error");
      setMessage("Enter a 10-digit Indian mobile number.");
      return;
    }
    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/v1/notify-me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context, phone: `+91${digits}` }),
      });
      if (!res.ok) throw new Error(`notify-me ${res.status}`);
      setStatus("done");
      setMessage("Saved — we'll message you when pre-booking opens.");
    } catch {
      setStatus("error");
      setMessage("Couldn't save your number just now — please try again.");
    }
  }

  if (status === "done") {
    return (
      <p className="rounded-[10px] border border-wa/40 bg-wa/10 px-4 py-[11px] text-[12.5px] font-bold text-hero-text">
        ✓ {message}
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="max-w-[420px]" noValidate>
      <div className="flex items-stretch gap-2">
        <label className="flex flex-1 items-center gap-2 rounded-[10px] border border-white/25 bg-white/10 px-3 focus-within:border-white/50">
          <span className="text-[12.5px] font-bold text-hero-text/70">+91</span>
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="98765 43210"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (status === "error") setStatus("idle");
            }}
            aria-label="Mobile number for the pre-booking alert"
            aria-invalid={status === "error"}
            className="w-full min-w-0 bg-transparent py-[10px] text-[13px] text-hero-text placeholder:text-hero-text/40 focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-[10px] bg-cta px-4 py-[10px] text-[12.5px] font-bold whitespace-nowrap text-white hover:opacity-90 disabled:opacity-60"
        >
          {status === "sending" ? "Saving…" : "Notify me"}
        </button>
      </div>
      {status === "error" && (
        <p role="alert" className="mt-2 text-[11.5px] font-semibold text-amber">
          {message}
        </p>
      )}
      <p className="mt-2 text-[10.5px] text-hero-text/45">
        One WhatsApp message when pre-booking opens. Nothing else.
      </p>
    </form>
  );
}
