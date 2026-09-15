"use client";

import { useEffect } from "react";
import type { AuthUser } from "@/lib/auth";
import { OtpFlow, type OtpContext } from "./OtpFlow";

/**
 * Contextual OTP gate — bottom sheet on mobile, centered modal on desktop.
 * The only dismiss is the flow's full-width "Continue without…" text button
 * (plus backdrop click / Escape); never a corner ✕.
 */
export function OtpBottomSheet({
  open,
  context,
  heading,
  dismissLabel,
  onSuccess,
  onClose,
}: {
  open: boolean;
  context: OtpContext;
  heading?: string;
  /** Overrides the context's default "Continue without…" copy. */
  dismissLabel?: string;
  onSuccess: (user: AuthUser) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/60 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={heading ?? "Sign in with your WhatsApp number"}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full rounded-t-2xl bg-card p-6 pb-7 shadow-2xl sm:max-w-[400px] sm:rounded-2xl sm:p-7">
        {/* drag-handle affordance for the mobile sheet */}
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border sm:hidden" />
        <OtpFlow
          context={context}
          heading={heading}
          dismissLabel={dismissLabel}
          onSuccess={onSuccess}
          onDismiss={onClose}
        />
      </div>
    </div>
  );
}
