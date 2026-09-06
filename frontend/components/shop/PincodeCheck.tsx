"use client";

import { useState } from "react";
import { checkPincode, submitNotifyMe, type PincodeInfo } from "@/lib/shop";

type State =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "result"; info: PincodeInfo }
  | { kind: "error"; message: string };

/**
 * PDP pincode check — 6-digit input → "✓ Delivers in ~3 days to Lajpat
 * Nagar", or a notify-me capture when the pincode is not serviceable yet.
 */
export function PincodeCheck() {
  const [pincode, setPincode] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });
  const [phone, setPhone] = useState("");
  const [notify, setNotify] = useState<"idle" | "sending" | "done" | "error">(
    "idle",
  );

  const onCheck = async () => {
    if (!/^\d{6}$/.test(pincode)) {
      setState({ kind: "error", message: "Enter a 6-digit pincode." });
      return;
    }
    setState({ kind: "checking" });
    const r = await checkPincode(pincode);
    if (r.ok) {
      setState({ kind: "result", info: r.data });
      setNotify("idle");
    } else {
      setState({ kind: "error", message: r.message });
    }
  };

  const onNotify = async () => {
    if (!/^\d{10}$/.test(phone.trim())) {
      setNotify("error");
      return;
    }
    setNotify("sending");
    const r = await submitNotifyMe(phone);
    setNotify(r.ok ? "done" : "error");
  };

  return (
    <div className="mt-4 rounded-[12px] border border-border bg-bg px-4 py-[13px]">
      <p className="mb-2 text-[10px] font-bold tracking-[0.8px] text-sub uppercase">
        Check delivery to your pincode
      </p>
      <div className="flex items-stretch gap-2">
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="Enter pincode"
          value={pincode}
          onChange={(e) => {
            setPincode(e.target.value.replace(/\D/g, ""));
            if (state.kind !== "idle") setState({ kind: "idle" });
          }}
          onKeyDown={(e) => e.key === "Enter" && void onCheck()}
          className="min-w-0 flex-1 rounded-[9px] border border-border bg-card px-[13px] py-[9px] text-[13.5px] text-ink outline-none focus:border-cta"
        />
        <button
          type="button"
          onClick={onCheck}
          disabled={state.kind === "checking"}
          className="rounded-[9px] bg-ink px-[18px] py-[9px] text-[12.5px] font-bold text-white disabled:opacity-60"
        >
          {state.kind === "checking" ? "Checking…" : "Check"}
        </button>
      </div>

      {state.kind === "error" && (
        <p className="mt-2 text-[12px] text-cta">{state.message}</p>
      )}

      {state.kind === "result" && state.info.serviceable && (
        <p className="mt-2 text-[12.5px] font-semibold text-dharma-fg">
          ✓ Delivers in ~{state.info.etaDays ?? 3} days
          {state.info.area ? ` to ${state.info.area}` : ""}
        </p>
      )}

      {state.kind === "result" && !state.info.serviceable && (
        <div className="mt-2">
          <p className="text-[12.5px] font-semibold text-body">
            We do not deliver there yet — Notify me
          </p>
          {notify === "done" ? (
            <p className="mt-2 text-[12.5px] font-semibold text-dharma-fg">
              ✓ Noted. We&apos;ll message you when your area opens.
            </p>
          ) : (
            <div className="mt-2 flex items-stretch gap-2">
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, ""));
                  if (notify === "error") setNotify("idle");
                }}
                className="min-w-0 flex-1 rounded-[9px] border border-border bg-card px-[13px] py-[9px] text-[13.5px] text-ink outline-none focus:border-cta"
              />
              <button
                type="button"
                onClick={onNotify}
                disabled={notify === "sending"}
                className="rounded-[9px] bg-wa px-[18px] py-[9px] text-[12.5px] font-bold whitespace-nowrap text-white disabled:opacity-60"
              >
                Notify me
              </button>
            </div>
          )}
          {notify === "error" && (
            <p className="mt-2 text-[12px] text-cta">
              Enter the 10-digit mobile number you want the message on.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
