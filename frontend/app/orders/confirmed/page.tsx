import type { Metadata } from "next";
import { Suspense } from "react";
import { ConfirmedView } from "@/components/shop/ConfirmedView";

export const metadata: Metadata = {
  title: "Order placed",
  description: "Your pujan order is confirmed.",
};

export default function OrderConfirmedPage() {
  return (
    <div className="mx-auto max-w-[1080px] px-4 py-10 md:px-10">
      <Suspense
        fallback={
          <p className="py-14 text-center text-[13.5px] text-sub">
            Fetching your order…
          </p>
        }
      >
        <ConfirmedView />
      </Suspense>
    </div>
  );
}
