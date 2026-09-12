import Link from "next/link";
import { sectionText, type HomeSection } from "@/lib/homeExtras";

/**
 * The Tapa Circle — prominent homepage CTA card. The Aug-10 mock's copy
 * priced this at "₹499 a year"; that's stale — /tapa-circle and CLAUDE.md
 * both confirm the Circle is free (WhatsApp Circle v2), so this uses
 * free-framing copy instead of the mock's price line.
 *
 * Copy is CMS-editable (`circle-band`), with these literals as the fallback.
 */
export function CircleBand({ section }: { section?: HomeSection }) {
  return (
    <section className="mx-auto max-w-[1280px] px-4 pt-10 md:px-10">
      <div className="grid grid-cols-[auto_1fr] items-center gap-[22px] rounded-[18px] border border-border bg-card p-6 md:grid-cols-[auto_1fr_auto] md:p-7">
        <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[14px] bg-wa/10 text-2xl">
          {sectionText(section, "emoji", "\u{1F4AC}")}
        </span>
        <div className="col-span-2 md:col-span-1">
          <p className="mb-[5px] text-[10.5px] font-bold tracking-[0.6px] text-gold uppercase">
            {sectionText(section, "eyebrow", "The Tapa Circle")}
          </p>
          <h2 className="mb-[5px] text-[19px] leading-[1.3] font-bold text-ink md:text-[21px]">
            {sectionText(section, "title", "Never miss a date again")}
          </h2>
          <p className="text-[13.5px] leading-[1.72] text-sub">
            {sectionText(
              section,
              "body",
              "Festival and vrat reminders on WhatsApp, with the guide attached and the kit cut-off if there is one. Free, always.",
            )}
          </p>
        </div>
        <Link
          href={sectionText(section, "ctaHref", "/tapa-circle?from=/")}
          className="col-span-2 shrink-0 rounded-[12px] bg-wa px-6 py-[14px] text-center text-[14px] font-bold whitespace-nowrap text-white hover:opacity-90 md:col-span-1"
        >
          {sectionText(section, "ctaLabel", "Join the Tapa Circle ›")}
        </Link>
      </div>
    </section>
  );
}
