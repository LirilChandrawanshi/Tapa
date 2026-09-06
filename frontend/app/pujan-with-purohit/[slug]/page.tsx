import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PujaDetail } from "@/components/booking/PujaDetail";
import { fetchPuja, fetchPujas, priceHint } from "@/lib/booking";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const puja = await fetchPuja(slug);
  if (!puja) return { title: "Pujan with Purohit" };
  return {
    title: `${puja.name} — Book a Purohit`,
    description: puja.description,
  };
}

export default async function PujaDetailPage({ params }: Props) {
  const { slug } = await params;
  const [puja, catalog] = await Promise.all([fetchPuja(slug), fetchPujas()]);

  if (!puja) {
    // Backend down is indistinguishable from a bad slug here; 404 keeps the
    // page honest either way — the landing page carries the recovery path.
    notFound();
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Purohit & Puja", href: "/pujan-with-purohit" },
          { label: puja.name },
        ]}
      />

      {/* hue hero */}
      <section className={`${puja.hueClass} relative overflow-hidden`}>
        <div
          aria-hidden
          className="absolute inset-0 [background:radial-gradient(ellipse_60%_80%_at_80%_30%,rgba(255,255,255,0.06)_0%,transparent_62%)]"
        />
        <div className="relative mx-auto max-w-[720px] px-4 py-8 md:px-6 md:py-10">
          <p className="mb-2 text-[10px] font-bold tracking-[1px] text-eyebrow-dark uppercase">
            Pujan with Purohit
          </p>
          <h1 className="flex flex-wrap items-baseline gap-x-3 text-[27px] leading-[1.15] font-bold tracking-[-0.6px] text-hero-text md:text-[34px]">
            {puja.name}
            <span className="font-devanagari text-[20px] font-normal text-hero-text/75 md:text-[24px]">
              {puja.nameHi}
            </span>
          </h1>
          <p className="mt-3 max-w-[560px] text-[13.5px] leading-[1.8] text-hero-text/75 md:text-[14.5px]">
            {puja.description}
          </p>
          <p className="mt-3 text-[12.5px] font-bold text-eyebrow-dark">
            {priceHint(puja.variants)} · verified purohits · Delhi NCR
          </p>
        </div>
      </section>

      <PujaDetail puja={puja} slots={catalog.slots} />

      <p className="mx-auto max-w-[720px] px-4 pb-8 text-[12px] text-sub md:px-6">
        Free cancellation until 24 hours before the puja —{" "}
        <Link
          href="/policies/cancellation"
          className="font-semibold text-cta hover:underline"
        >
          cancellation policy
        </Link>
        .
      </p>
    </div>
  );
}
