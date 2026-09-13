import { sectionText, type HomeSection } from "@/lib/homeExtras";

/**
 * Section 9 — PUJAN WITH PUROHIT STRIP. Always visible, dark, and honest:
 * the service is Phase 2+, so the card announces it with no dead links.
 * Copy is CMS-editable (`purohit-strip`), with these literals as the fallback.
 */
export function PurohitStrip({ section }: { section?: HomeSection }) {
  return (
    <section className="mx-auto max-w-[1280px] px-4 pt-10 md:px-10">
      {/* Stacks below `sm`. flex-wrap alone did not work here: the middle
          column carries flex-1 + min-w-0, so under pressure it shrank to a
          ~150px ribbon instead of wrapping, and the heading broke to one or
          two words a line on a phone. */}
      <div className="hero-dc flex flex-col gap-4 rounded-2xl px-6 py-7 sm:flex-row sm:items-center sm:gap-x-5 md:px-9">
        <div className="flex min-w-0 flex-1 items-start gap-4">
        <span aria-hidden className="shrink-0 text-[26px] leading-none">
          {sectionText(section, "emoji", "\u{1F64F}")}
        </span>
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold text-hero-text">
            {sectionText(section, "title", "Pujan with Purohit — Coming soon")}
          </h2>
          <p className="mt-1 max-w-[560px] text-[12.5px] leading-relaxed text-hero-text/70">
            {sectionText(
              section,
              "body",
              "Book a verified purohit for your pujan. A purohit is convenience, not validity — the guides remain free either way.",
            )}
          </p>
        </div>
        </div>
        <span className="shrink-0 self-start rounded-[7px] border border-white/25 bg-white/10 px-3 py-[6px] text-[10px] font-bold tracking-[0.6px] text-hero-text/80 uppercase sm:self-auto">
          {sectionText(section, "badge", "Opening with Phase 2")}
        </span>
      </div>
    </section>
  );
}
