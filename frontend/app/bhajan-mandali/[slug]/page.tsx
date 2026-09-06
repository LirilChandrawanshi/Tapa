import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { PhaseClosed } from "@/components/PhaseClosed";
import { MandaliRequestForm } from "@/components/mandali/MandaliRequestForm";
import { getFlags } from "@/lib/flags";
import { fetchMandaliType, formatPaise } from "@/lib/mandali";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const type = await fetchMandaliType(slug);
  if (!type) return { title: "Bhajan Mandali" };
  return {
    title: `${type.name} — Bhajan Mandali`,
    description: type.description,
  };
}

export default async function MandaliDetailPage({ params }: Props) {
  const __flags = await getFlags();
  if (!__flags.mandali_visible) {
    return <PhaseClosed section="mandali" />;
  }
  const { slug } = await params;
  const type = await fetchMandaliType(slug);

  if (!type) {
    // Backend down is indistinguishable from a bad slug here; 404 keeps the
    // page honest either way — the landing page carries the recovery path.
    notFound();
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Bhajan Mandali", href: "/bhajan-mandali" },
          { label: type.name },
        ]}
      />

      {/* hue hero */}
      <section className={`${type.hueClass} relative overflow-hidden`}>
        <div
          aria-hidden
          className="absolute inset-0 [background:radial-gradient(ellipse_60%_80%_at_80%_30%,rgba(255,255,255,0.06)_0%,transparent_62%)]"
        />
        <div className="relative mx-auto max-w-[720px] px-4 py-8 md:px-6 md:py-10">
          <p className="mb-2 text-[10px] font-bold tracking-[1px] text-eyebrow-dark uppercase">
            Bhajan Mandali
          </p>
          <h1 className="flex flex-wrap items-baseline gap-x-3 text-[27px] leading-[1.15] font-bold tracking-[-0.6px] text-hero-text md:text-[34px]">
            {type.name}
            <span className="font-devanagari text-[20px] font-normal text-hero-text/75 md:text-[24px]">
              {type.nameHi}
            </span>
          </h1>
          <p className="mt-3 max-w-[560px] text-[13.5px] leading-[1.8] text-hero-text/75 md:text-[14.5px]">
            {type.description}
          </p>
          <p className="mt-3 text-[12.5px] font-bold text-eyebrow-dark">
            From {formatPaise(type.startingPricePaise)}
            {type.seasonNote ? ` · ${type.seasonNote}` : ""} · Delhi NCR
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[720px] px-4 py-7 md:px-6">
        {/* What's included */}
        <section className="rounded-[14px] border border-border bg-card p-5">
          <p className="mb-3 text-[11px] font-bold tracking-[0.8px] text-sub uppercase">
            What&apos;s included
          </p>
          <ul className="flex flex-col gap-2">
            {(type.inclusions ?? []).map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-body"
              >
                <span aria-hidden className="mt-[1px] font-bold text-cta">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Starting price */}
        <section className="mt-4 rounded-[14px] border border-border bg-bg p-5">
          <p className="text-[11px] font-bold tracking-[0.8px] text-sub uppercase">
            Starting from
          </p>
          <p className="mt-1 text-[22px] font-bold text-ink">
            {formatPaise(type.startingPricePaise)}
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-sub">
            The final quote is confirmed with your slot — it depends on the
            date, venue and gathering size. Nothing is paid until we confirm.
          </p>
        </section>

        {/* Request form */}
        <MandaliRequestForm type={type} />

        <p className="mt-6 text-[12px] text-sub">
          Already sent a request?{" "}
          <Link
            href="/bhajan-mandali/track"
            className="font-semibold text-cta hover:underline"
          >
            Track it with your TM- number ›
          </Link>
        </p>
      </div>
    </div>
  );
}
