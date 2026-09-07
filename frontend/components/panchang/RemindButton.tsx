"use client";

import { useRef, useState } from "react";
import { OtpBottomSheet } from "@/components/auth/OtpBottomSheet";
import { addReminder } from "@/lib/account";

/**
 * "🔔 Remind me the evening before" — creates a vrat reminder for the
 * observance, gated behind the contextual OTP sheet for signed-out visitors.
 * The API resolves the next upcoming date and schedules 7 PM IST the evening
 * before.
 */
export function RemindButton({
  observanceSlug,
  name,
  className = "",
}: {
  observanceSlug: string;
  name: string;
  className?: string;
}) {
  const [set, setSet] = useState(false);
  const [busy, setBusy] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);

  function flash(message: string) {
    window.clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }

  async function create() {
    const res = await addReminder({ observanceSlug });
    if (res.ok) {
      setSet(true);
      flash(`Reminder set — the evening before ${name}`);
    } else if (res.status === 401 || res.status === 403) {
      setGateOpen(true);
    } else {
      flash("That didn't go through. Try again.");
    }
  }

  async function onClick() {
    if (busy || set) return;
    setBusy(true);
    try {
      await create();
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void onClick()}
        aria-pressed={set}
        className={`flex items-center gap-[6px] rounded-[9px] border-[1.5px] px-[14px] py-[7px] text-[12.5px] font-bold transition-colors ${
          set
            ? "border-cta bg-cta/10 text-cta"
            : "border-cta bg-cta text-white hover:opacity-90"
        } ${className}`}
      >
        <span aria-hidden>🔔</span>
        {set ? "Reminder set" : "Remind me the evening before"}
      </button>

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-[110] flex max-w-[92vw] -translate-x-1/2 items-center gap-2 rounded-lg bg-ink px-4 py-[10px] text-[13px] font-semibold text-white shadow-xl"
        >
          <span aria-hidden>🔔</span>
          <span className="truncate">{toast}</span>
        </div>
      )}

      <OtpBottomSheet
        open={gateOpen}
        context="save"
        heading={`Get a reminder for ${name}`}
        onClose={() => setGateOpen(false)}
        onSuccess={() => {
          setGateOpen(false);
          void create();
        }}
      />
    </>
  );
}
