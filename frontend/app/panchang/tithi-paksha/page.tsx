import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CategoryHero } from "@/components/CategoryHero";
import { TimingDataTag } from "@/components/panchang/DataMeta";

export const metadata: Metadata = {
  title: "Tithi & Paksha — How the Lunar Day Works | Tapa Panchang",
  description:
    "What a tithi actually is, why it doesn't match the clock, and how the two pakshas divide every lunar month — the one explainer that makes every panchang readable.",
};

export default function TithiPakshaPage() {
  return (
    <main className="pb-16">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Panchang", href: "/panchang" },
          { label: "Tithi & Paksha" },
        ]}
      />

      <CategoryHero
        variant="pa"
        eyebrow="Panchang · Explainer"
        title="Tithi & Paksha: how the lunar day works"
        description="Almost every festival date is fixed by a tithi, not a calendar date. Learn to read this once and you will never have to ask which day a festival falls on."
        meta={[
          { value: "30", label: "tithis in a lunar month" },
          { value: "2", label: "pakshas" },
          { value: "27", label: "nakshatras" },
        ]}
        side={
          <div>
            <p className="mb-2 text-[10px] font-bold tracking-[1px] text-eyebrow-dark uppercase">
              The one-line version
            </p>
            <p className="text-[13px] leading-relaxed text-hero-text/80">
              A tithi is not a day on the clock — it is the time the Moon takes
              to move 12° further from the Sun. That single fact explains why
              festival dates shift, skip and sometimes repeat.
            </p>
          </div>
        }
      />

      <div className="mx-auto max-w-[760px] px-4 pt-8 md:px-10">
        <TimingDataTag className="mb-6" />

        <article className="space-y-5 text-[15px] leading-[1.85] text-body">
          <p>
            <b>A tithi is a lunar day.</b> It is the time the Moon takes to
            gain twelve degrees of separation from the Sun. Thirty tithis make
            one lunar month — from one new moon to the next. Because the
            Moon&rsquo;s speed varies along its orbit, a tithi is not a fixed
            length: it can run anywhere from roughly 19 to 26 hours. That is
            why a tithi rarely lines up with midnight-to-midnight, why a tithi
            can begin at 10 pm and end the next evening, and why two
            consecutive calendar days can carry the same tithi — or a tithi
            can vanish from the calendar entirely.
          </p>
          <p>
            <b>Paksha is the half of the month.</b> The thirty tithis divide
            into two fortnights of fifteen. Shukla Paksha is the bright,
            waxing half — from the new moon (Amavasya) up to the full moon
            (Purnima). Krishna Paksha is the dark, waning half — from the full
            moon back down to the new. Every tithi therefore has a full
            address: &ldquo;Bhadrapada Shukla Chaturthi&rdquo; means the
            fourth tithi of the waxing half of the month of Bhadrapada — and
            that address, not a Gregorian date, is what fixes Ganesh
            Chaturthi.
          </p>
          <p>
            <b>Which day do we observe, then?</b> Since a tithi can straddle
            two sunrises, the rule most observances follow is the tithi
            prevailing at a specific moment — sunrise for many vrats, midday
            for some, moonrise or midnight for others. This is also why the
            same festival can fall a day apart in two cities: sunrise itself
            differs, so the tithi &ldquo;present at sunrise&rdquo; can differ.
            Two panchangs showing different dates can both be right — for
            their own cities. Our dates are calculated for Delhi-NCR (IST).
          </p>
        </article>

        <div className="mt-8 rounded-[13px] border border-data-bd bg-data-bg px-5 py-4">
          <p className="text-[12.5px] leading-relaxed text-data-fg">
            <b>Detailed guides land soon</b> — tithi-by-tithi rules, Purnimanta
            vs Amanta month reckoning, and how parana times are fixed. Until
            then, today&rsquo;s values are always on the{" "}
            <Link href="/panchang" className="font-bold underline">
              panchang dashboard
            </Link>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
