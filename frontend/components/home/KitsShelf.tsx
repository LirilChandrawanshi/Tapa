import { NotifyMe } from "@/components/home/NotifyMe";

/**
 * Section 6 — RITUAL KITS SHELF. Flag-gated (DB-driven, never a deploy):
 * pre-launch it is a dark teaser card with a phone capture; once
 * `kits_launched` flips, the commerce rail itself ships with Phase 2, so a
 * quiet placeholder holds the slot.
 */
export function KitsShelf({ kitsLaunched }: { kitsLaunched: boolean }) {
  if (kitsLaunched) {
    return (
      <section className="mx-auto max-w-[1280px] px-4 pt-10 md:px-10">
        <div className="rounded-2xl border border-dashed border-border bg-card/60 px-6 py-8 text-center">
          <p className="text-[14.5px] font-bold text-ink">
            Ritual Pujans are live — the kits rail lands with Phase 2
          </p>
          <p className="mx-auto mt-1 max-w-[460px] text-[12.5px] text-sub">
            Samagri kits for every ritual guide, delivered before the date.
          </p>
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
