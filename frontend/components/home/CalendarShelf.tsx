import Link from "next/link";
import { SectionHeader } from "@/components/SectionHeader";
import { deityHue } from "@/lib/articleExtras";
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
        {cards.map(({ observance }) => {
          const href = observance.articleSlug
            ? guideHref(observance.articleSlug)
            : "/panchang";
          return (
            <Link
              key={observance.slug}
              href={href}
              className="group flex flex-col overflow-hidden rounded-[15px] border border-border bg-card"
            >
              <div className={`h-${deityHue(observance.deity)} h-[96px]`} />
              <div className="flex flex-1 flex-col p-4">
                <p className="mb-1 text-[15px] leading-[1.3] font-bold text-ink">
                  {observance.name}
                </p>
                <p className="mb-[7px] text-[12px] font-semibold text-pratha-fg">
                  {fmtShort(observance.date)}
                  {observance.tithiLabel ? ` · ${observance.tithiLabel}` : ""}
                </p>
                {observance.blurb && (
                  <p className="flex-1 text-[12px] leading-relaxed text-sub">
                    {observance.blurb}
                  </p>
                )}
                <span className="mt-[11px] text-[11.5px] font-bold text-cta group-hover:underline">
                  Read the guide ›
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
