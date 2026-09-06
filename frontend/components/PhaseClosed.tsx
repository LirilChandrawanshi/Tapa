import Link from "next/link";
import { NotifyMe } from "@/components/home/NotifyMe";

/**
 * The pre-launch state for a gated section. Direct URLs land here while the
 * section's feature flag is off — the flag gates the WHOLE surface, not just
 * the nav entry points (the backend refuses orders/bookings too).
 */
export function PhaseClosed({
  section,
}: {
  section: "kits" | "purohit";
}) {
  const copy =
    section === "kits"
      ? {
          eyebrow: "RITUAL PUJANS",
          title: "Pre-booking has not opened yet",
          body: "Samagri kits for every ritual guide — sourced, weighed and sealed, delivered before the date. Leave your number and we'll tell you the moment pre-booking opens. Until then, every guide is free.",
          context: "kits" as const,
        }
      : {
          eyebrow: "PUJAN WITH PUROHIT",
          title: "Purohit booking opens soon",
          body: "Vetted purohits who perform the full vidhi and explain it as they go — samagri included. Leave your number and we'll call you first when booking opens.",
          context: "purohit" as const,
        };

  return (
    <main className="mx-auto max-w-[760px] px-4 py-14 md:px-10">
      <div className="hero-rk overflow-hidden rounded-2xl px-6 py-10 text-center md:px-12">
        <p className="text-[10px] font-bold tracking-[1.2px] text-eyebrow-dark uppercase">
          {copy.eyebrow}
        </p>
        <h1 className="mt-3 text-[24px] leading-tight font-bold text-hero-text md:text-[30px]">
          {copy.title}
        </h1>
        <p className="mx-auto mt-3 max-w-[480px] text-[13.5px] leading-relaxed text-hero-text/70">
          {copy.body}
        </p>
        <div className="mx-auto mt-6 max-w-[360px]">
          <NotifyMe context={copy.context} />
        </div>
        <Link
          href="/ritual-guides"
          className="mt-5 inline-block text-[13px] font-semibold text-eyebrow-dark hover:underline"
        >
          Read the free guides meanwhile ›
        </Link>
      </div>
    </main>
  );
}
