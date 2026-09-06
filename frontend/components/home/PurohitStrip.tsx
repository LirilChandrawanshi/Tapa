/**
 * Section 9 — PUJAN WITH PUROHIT STRIP. Always visible, dark, and honest:
 * the service is Phase 2+, so the card announces it with no dead links.
 */
export function PurohitStrip() {
  return (
    <section className="mx-auto max-w-[1280px] px-4 pt-10 md:px-10">
      <div className="hero-dc flex flex-wrap items-center gap-x-5 gap-y-3 rounded-2xl px-6 py-7 md:px-9">
        <span aria-hidden className="text-[26px]">
          🙏
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-bold text-hero-text">
            Pujan with Purohit — Coming soon
          </h2>
          <p className="mt-1 max-w-[560px] text-[12.5px] leading-relaxed text-hero-text/70">
            Book a verified purohit for your pujan. A purohit is convenience,
            not validity — the guides remain free either way.
          </p>
        </div>
        <span className="rounded-[7px] border border-white/25 bg-white/10 px-3 py-[6px] text-[10px] font-bold tracking-[0.6px] text-hero-text/80 uppercase">
          Opening with Phase 2
        </span>
      </div>
    </section>
  );
}
