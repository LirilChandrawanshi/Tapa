import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { TrackView } from "@/components/shop/TrackView";

export const metadata: Metadata = {
  title: "Track your order",
  description:
    "Track a pujan order with the order number and the phone it was placed with — no account needed.",
};

export default function TrackOrderPage() {
  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Ritual Pujans", href: "/ritual-pujans" },
          { label: "Track your order" },
        ]}
      />
      <div className="mx-auto max-w-[1080px] px-4 py-8 md:px-10">
        <h1 className="mb-5 text-center text-2xl font-bold tracking-[-0.4px] text-ink">
          Track your order
        </h1>
        <Suspense
          fallback={
            <p className="py-14 text-center text-[13.5px] text-sub">
              Loading…
            </p>
          }
        >
          <TrackView />
        </Suspense>
      </div>
    </div>
  );
}
