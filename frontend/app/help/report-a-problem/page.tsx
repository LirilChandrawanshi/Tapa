import type { Metadata } from "next";
import { Suspense } from "react";
import { ReportProblemView } from "./ReportProblemView";

export const metadata: Metadata = {
  title: "Report a problem",
  description:
    "Something wrong with a kit order? Tell us what happened — replacement or refund, your choice, within one working day.",
};

export default function ReportProblemPage() {
  return (
    <div className="mx-auto max-w-[1080px] px-4 py-8 md:px-10">
      <h1 className="mb-1 text-center text-2xl font-bold tracking-[-0.4px] text-ink">
        Report a problem
      </h1>
      <p className="mb-6 text-center text-[13.5px] text-sub">
        Tell us what happened — we make it right, your choice of fix.
      </p>
      <Suspense
        fallback={
          <p className="py-14 text-center text-[13.5px] text-sub">Loading…</p>
        }
      >
        <ReportProblemView />
      </Suspense>
    </div>
  );
}
