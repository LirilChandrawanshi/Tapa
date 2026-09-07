import type { Metadata } from "next";
import { Suspense } from "react";
import { CancelledView } from "./CancelledView";

export const metadata: Metadata = {
  title: "Order cancelled",
  description:
    "Your order is cancelled and the full refund is on its way. The guide stays free either way.",
};

export default function OrderCancelledPage() {
  return (
    <div className="mx-auto max-w-[1080px] px-4 py-10 md:px-10">
      <Suspense
        fallback={
          <p className="py-14 text-center text-[13.5px] text-sub">Loading…</p>
        }
      >
        <CancelledView />
      </Suspense>
    </div>
  );
}
