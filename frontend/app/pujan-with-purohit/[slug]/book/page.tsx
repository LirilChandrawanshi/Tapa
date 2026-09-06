import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { fetchPuja, fetchPujas } from "@/lib/booking";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Select purohit & book",
};

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BookPujaPage({ params }: Props) {
  const { slug } = await params;
  const [puja, catalog] = await Promise.all([fetchPuja(slug), fetchPujas()]);
  if (!puja) notFound();

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Purohit & Puja", href: "/pujan-with-purohit" },
          { label: puja.name, href: `/pujan-with-purohit/${puja.slug}` },
          { label: "Book" },
        ]}
      />
      {/* useSearchParams (variant) requires a Suspense boundary */}
      <Suspense
        fallback={
          <p className="py-14 text-center text-[13.5px] text-sub">
            Preparing your booking…
          </p>
        }
      >
        <BookingWizard puja={puja} slots={catalog.slots} />
      </Suspense>
    </div>
  );
}
