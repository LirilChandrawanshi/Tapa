import type { Metadata } from "next";
import { Suspense } from "react";
import { RefundStatusView } from "./RefundStatusView";

export const metadata: Metadata = {
  title: "Refund status",
  description:
    "Where your refund is, stage by stage — from cancellation to the money reaching your account.",
};

export default function RefundStatusPage() {
  return (
    <div className="mx-auto max-w-[1080px] px-4 py-8 md:px-10">
      <h1 className="mb-1 text-center text-2xl font-bold tracking-[-0.4px] text-ink">
        Refund status
      </h1>
      <p className="mb-6 text-center text-[13.5px] text-sub">
        Every refund is full and automatic — this page just shows where it is.
      </p>
      <Suspense
        fallback={
          <p className="py-14 text-center text-[13.5px] text-sub">Loading…</p>
        }
      >
        <RefundStatusView />
      </Suspense>
    </div>
  );
}
