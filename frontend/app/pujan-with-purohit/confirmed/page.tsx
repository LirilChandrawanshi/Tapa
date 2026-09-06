import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingConfirmed } from "@/components/booking/BookingConfirmed";

export const metadata: Metadata = {
  title: "Booking confirmed",
  robots: { index: false },
};

export default function BookingConfirmedPage() {
  return (
    // useSearchParams (?bn=&phone=) requires a Suspense boundary
    <Suspense
      fallback={
        <p className="py-14 text-center text-[13.5px] text-sub">
          Fetching your booking…
        </p>
      }
    >
      <BookingConfirmed />
    </Suspense>
  );
}
