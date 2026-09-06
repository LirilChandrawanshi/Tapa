import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { MandaliTrackView } from "@/components/mandali/MandaliTrackView";

export const metadata: Metadata = {
  title: "Track your mandali request",
  description:
    "Track a bhajan mandali request with the TM- number and the phone it was requested with — no account needed.",
};

export default function TrackMandaliPage() {
  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Bhajan Mandali", href: "/bhajan-mandali" },
          { label: "Track your request" },
        ]}
      />
      <div className="mx-auto max-w-[640px] px-4 py-8 md:px-6">
        <h1 className="mb-5 text-center text-2xl font-bold tracking-[-0.4px] text-ink">
          Track your mandali request
        </h1>
        <Suspense
          fallback={
            <p className="py-14 text-center text-[13.5px] text-sub">Loading…</p>
          }
        >
          <MandaliTrackView />
        </Suspense>
      </div>
    </div>
  );
}
