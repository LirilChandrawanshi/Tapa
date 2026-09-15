import Image from "next/image";
import Link from "next/link";
import { SectionHeader } from "@/components/SectionHeader";
import { deityHue } from "@/lib/articleExtras";
import { mediaUrl } from "@/lib/media";
import { fmtShort, guideHref } from "@/lib/panchangExtras";
import type { UpcomingObservance } from "@/lib/types";

/**
 * "Next Four Weeks" calendar shelf — up to 4 upcoming observances as
 * gradient-banner cards. Deliberately skips a per-card DPB tag/score (would
 * mean one extra fetch per card); a dead-or-thin backend just shows fewer
 * cards rather than a fake placeholder row.
 */
export function CalendarShelf({ observances }: { observances: UpcomingObservance[] }) {
  const cards = observances.slice(0, 4);
  if (cards.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1280px] px-4 pt-10 md:px-10">
      <SectionHeader
        eyebrow="The next four weeks"
        title="What's coming, and when"
        description="Every guide is complete before the date arrives — the vidhi, the katha, the fasting rules, and the corrections to whatever you have been forwarded."
        viewAllHref="/panchang"
        viewAllLabel="Full 2026 calendar"
      />
      <div className="grid grid-cols-2 gap-[14px] lg:grid-cols-4">
        {cards.map(({ observance, imageId }) => {
          // A guide, when one has been written for the occasion. Otherwise the
          // occasion's own page — tithi, timings, what it is — rather than the
          // generic panchang landing, which answers nothing the card asked.
          const hasGuide = Boolean(observance.articleSlug);
          const href = hasGuide
            ? guideHref(observance.articleSlug as string)
            : `/panchang/o/${observance.slug}`;
          return (
            <Link
              key={observance.slug}
              href={href}
              className="group flex flex-col overflow-hidden rounded-[15px] border border-border bg-card"
            >
              {/* the deity gradient is the floor, not the ceiling: an image
                  from the fallback chain sits on it when one resolves */}
              <div
                className={`h-${deityHue(observance.deity)} relative h-[96px] overflow-hidden`}
              >
                {imageId && (
                  <>
                    <Image
                      src={mediaUrl(imageId)}
                      alt=""
                      aria-hidden
                      fill
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.06]"
                    />
                    <div
                      aria-hidden
                      className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"
                    />
                  </>
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <p className="mb-1 text-[15px] leading-[1.3] font-bold text-ink">
                  {observance.name}
                </p>
                <p className="mb-[7px] text-[12px] font-semibold text-pratha-fg">
                  {fmtShort(observance.date)}
                  {observance.tithiLabel ? ` · ${observance.tithiLabel}` : ""}
                </p>
                {observance.blurb && (
                  // Two-up on a phone leaves ~140px of copy, so an unclamped
                  // blurb ran to four lines and the four cards ended up
                  // ragged. Clamped there, full from `sm` where there is room.
                  <p className="line-clamp-2 flex-1 text-[12px] leading-relaxed text-sub sm:line-clamp-none">
                    {observance.blurb}
                  </p>
                )}
                <span className="mt-[11px] text-[11.5px] font-bold text-cta group-hover:underline">
                  {hasGuide ? "Read the guide ›" : "See the timings ›"}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
