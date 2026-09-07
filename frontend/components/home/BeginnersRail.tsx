import Link from "next/link";
import { SectionHeader } from "@/components/SectionHeader";

const BEGINNERS_HREF = "/ritual-guides/beginners-guides";

const STEPS = [
  {
    n: "01",
    title: "Your first vrat, start to finish",
    copy: "What a vrat actually asks of you — and what it doesn't. Sankalp, the fast, and how the day ends.",
  },
  {
    n: "02",
    title: "Daily puja at home",
    copy: "A simple morning practice in ten minutes — no elaborate setup, nothing you must buy.",
  },
  {
    n: "03",
    title: "Reading the panchang",
    copy: "Tithi, paksha and nakshatra in plain language, so a date on the calendar starts to make sense.",
  },
] as const;

/**
 * Beginner's rail (#26) — three numbered starting points into the
 * Beginner's Guides shelf. Static by design: no tags, no citations,
 * no Sanskrit to look up.
 */
export function BeginnersRail() {
  return (
    <section className="mx-auto max-w-[1280px] px-4 pt-10 md:px-10">
      <SectionHeader
        eyebrow="New to all this?"
        title="Start here — no Sanskrit required"
        description="Written for the first time you do anything: no tags, no citations, no words to look up. The sourced versions are one tap away when you want them."
        viewAllHref={BEGINNERS_HREF}
        viewAllLabel="All beginner's guides"
      />
      <div className="grid gap-4 md:grid-cols-3">
        {STEPS.map((step) => (
          <Link
            key={step.n}
            href={BEGINNERS_HREF}
            className="group rounded-[15px] border border-border bg-card px-[19px] py-5 transition-colors hover:border-cta"
          >
            <p
              aria-hidden
              className="mb-[10px] text-[26px] leading-none font-bold tracking-[-1px] text-cta/35 group-hover:text-cta/60"
            >
              {step.n}
            </p>
            <p className="mb-[6px] text-[15px] font-bold text-ink">
              {step.title}
            </p>
            <p className="text-[12.5px] leading-relaxed text-sub">
              {step.copy}
            </p>
            <p className="mt-3 text-[12px] font-bold text-cta">
              Begin ›
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
