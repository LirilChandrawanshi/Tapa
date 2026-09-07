import Link from "next/link";
import { NotifyMe } from "@/components/home/NotifyMe";
import { KitRailCard } from "@/components/shop/KitRailCard";
import { fetchProductsCached } from "@/lib/shop";

/**
 * Section 6 — RITUAL KITS SHELF. Flag-gated (DB-driven, never a deploy):
 * pre-launch it is a dark teaser card with a phone capture; once
 * `kits_launched` flips, the live commerce rail renders — a horizontal
 * card rail fetched here (revalidate 300, tag "home") so app/page.tsx
 * stays untouched. Error-tolerant: a dead backend degrades to a quiet
 * placeholder, never a blank section.
 */
export async function KitsShelf({ kitsLaunched }: { kitsLaunched: boolean }) {
  if (kitsLaunched) {
    const products = await fetchProductsCached();

    if (products.length === 0) {
      return (
        <section className="mx-auto max-w-[1280px] px-4 pt-10 md:px-10">
          <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-8 text-center">
            <p className="text-[14.5px] font-bold text-ink">
              Ritual Pujans are live — the shelf is being stocked
            </p>
            <p className="mx-auto mt-1 max-w-[460px] text-[12.5px] text-sub">
              Samagri kits for every ritual guide, delivered before the date.
            </p>
            <Link
              href="/ritual-pujans"
              className="mt-3 inline-block text-[13px] font-bold text-cta"
            >
              All Ritual Pujans ›
            </Link>
          </div>
        </section>
      );
    }

    return (
      <section className="mx-auto max-w-[1280px] px-4 pt-10 md:px-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-1 text-[10px] font-bold tracking-[1px] text-gold uppercase">
              🪔 Ritual Pujans
            </p>
            <h2 className="text-[20px] leading-snug font-bold text-ink md:text-[22px]">
              Kits, matched to the guides
            </h2>
            <p className="mt-1 max-w-[560px] text-[12.5px] leading-relaxed text-sub">
              You do not need a kit to pray — every guide stays free. These are
              for when you want the sourcing done.
            </p>
          </div>
          <Link
            href="/ritual-pujans"
            className="text-[13px] font-bold whitespace-nowrap text-cta"
          >
            All kits ›
          </Link>
        </div>
        <div className="flex snap-x gap-4 overflow-x-auto pb-2">
          {products.map((p) => (
            <KitRailCard key={p.slug} product={p} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1280px] px-4 pt-10 md:px-10">
      <div className="hero-rk rounded-2xl px-6 py-8 md:px-9 md:py-10">
        <div className="grid items-center gap-6 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="mb-2 text-[10px] font-bold tracking-[1px] text-eyebrow-dark uppercase">
              🪔 Ritual Pujans
            </p>
            <h2 className="text-[20px] leading-snug font-bold text-hero-text md:text-[24px]">
              Ritual Pujans — pre-booking opens soon
            </h2>
            <p className="mt-2 max-w-[520px] text-[13px] leading-relaxed text-hero-text/70">
              Samagri kits matched to every ritual guide — everything the
              vidhi calls for, delivered before the date, with the guide
              attached. Knowledge first; the kit only when you want it.
            </p>
          </div>
          <NotifyMe context="kits" />
        </div>
      </div>
    </section>
  );
}
