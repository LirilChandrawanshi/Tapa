"use client";

/**
 * Feature flags — the PRD's phase switches. Data, not deploys: flipping one
 * changes the live site immediately, so every toggle asks for confirmation.
 */

import { useCallback, useEffect, useState } from "react";
import { fmtDateTime, listFlags, setFlag, type AdminFlag } from "@/lib/admin";
import {
  Btn,
  Loading,
  Msg,
  PageHead,
  SectionCard,
} from "@/components/admin/ui";

const KNOWN: Record<string, string> = {
  kits_launched:
    "Unhides the Ritual Pujans pillar (nav, listing pages, kit CTAs). Phase-2 launch lever.",
  purohit_tab_visible:
    "Shows the Purohit services tab across the site.",
};

export default function AdminFlagsPage() {
  const [flags, setFlags] = useState<AdminFlag[] | null>(null);
  const [error, setError] = useState("");
  const [busyKey, setBusyKey] = useState("");

  const load = useCallback(async () => {
    setError("");
    const res = await listFlags();
    if (res.ok) setFlags(res.data ?? []);
    else setError(res.message);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggle(flag: AdminFlag) {
    const key = flag.key ?? "";
    const next = !(flag.value ?? false);
    const confirmed = confirm(
      `Turn ${key} ${next ? "ON" : "OFF"}?\n\nThis flips the live site instantly — no deploy, no review step.`,
    );
    if (!confirmed) return;
    setBusyKey(key);
    const res = await setFlag(key, next);
    setBusyKey("");
    if (!res.ok) setError(res.message);
    else void load();
  }

  return (
    <div>
      <PageHead title="Feature flags" />
      {error && <Msg kind="error">{error}</Msg>}
      {!flags && !error && <Loading />}
      {flags &&
        flags.map((flag) => (
          <SectionCard
            key={flag.key}
            title={flag.key ?? "?"}
            aside={
              <Btn
                kind={flag.value ? "danger" : "primary"}
                disabled={busyKey === flag.key}
                onClick={() => void toggle(flag)}
              >
                {busyKey === flag.key
                  ? "Flipping…"
                  : flag.value
                    ? "Turn OFF"
                    : "Turn ON"}
              </Btn>
            }
          >
            <div className="flex items-center gap-3">
              <span
                className={`rounded-[4px] border px-2 py-0.5 text-[11px] font-bold ${
                  flag.value
                    ? "border-dharma-bd bg-dharma-bg text-dharma-fg"
                    : "border-border bg-bg text-sub"
                }`}
              >
                {flag.value ? "ON" : "OFF"}
              </span>
              <p className="text-[12px] text-body">
                {KNOWN[flag.key ?? ""] ?? "Custom flag."}
              </p>
            </div>
            <p className="mt-1.5 text-[10px] text-sub">
              Last changed {fmtDateTime(flag.updatedAt)}
              {flag.updatedBy ? ` by ${flag.updatedBy}` : ""}.
            </p>
          </SectionCard>
        ))}
    </div>
  );
}
