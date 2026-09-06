import Link from "next/link";
import { SectionHeader } from "@/components/SectionHeader";
import { cardHref, type HomeCard } from "@/lib/homeExtras";

/**
 * Section 7 — TODAY'S RITUAL JOURNEY STEPPER. The six movements every guide
 * walks through, derived statically from the hero article's structure.
 * Horizontal scroll on mobile; the first step is active.
 */
const STEPS = [
  {
    label: "Sankalp",
    note: "The vow that opens the vrat — said once, in your own name",
  },
  {
    label: "Samagri",
    note: "What you actually need, and what is optional",
  },
  {
    label: "Vidhi",
    note: "The puja, step by step, each step tagged",
  },
  {
    label: "Mantra",
    note: "What to say, what it means, how many times",
  },
  {
    label: "Fasting",
    note: "The recognised forms — nirjala is rarely mandatory",
  },
  {
    label: "Aarti",
    note: "The closing — and the katha that goes with it",
  },
] as const;

export function JourneyStepper({ heroCard }: { heroCard: HomeCard | null }) {
  const href = heroCard ? cardHref(heroCard) : null;

  return (
    <section className="mx-auto max-w-[1280px] px-4 pt-10 md:px-10">
      <SectionHeader
        eyebrow="Today's ritual journey"
        title="Six steps, start to finish"
        description={
          heroCard
            ? `Every guide walks the same path. Today that path is ${heroCard.title}.`
            : "Every guide walks the same path — from the vow to the aarti."
        }
      />
      <ol className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-6 md:overflow-visible md:px-0">
        {STEPS.map((step, i) => {
          const active = i === 0;
          const body = (
            <>
              <span
                className={`mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                  active ? "bg-cta text-white" : "bg-bg text-mid"
                }`}
              >
                {i + 1}
              </span>
              <span
                className={`text-[13.5px] font-bold ${active ? "text-cta" : "text-ink"}`}
              >
                {step.label}
              </span>
              <span className="mt-1 text-[11px] leading-snug text-sub">
                {step.note}
              </span>
              {active && (
                <span className="mt-2 text-[9.5px] font-bold tracking-[0.6px] text-cta uppercase">
                  Start here
                </span>
              )}
            </>
          );
          const cardClass = `flex min-w-[150px] snap-start flex-col rounded-[13px] border p-4 md:min-w-0 ${
            active ? "border-cta bg-card" : "border-border bg-card"
          }`;
          return (
            <li key={step.label} className="flex">
              {href ? (
                <Link href={href} className={`${cardClass} transition-colors hover:border-cta`}>
                  {body}
                </Link>
              ) : (
                <div className={cardClass}>{body}</div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
