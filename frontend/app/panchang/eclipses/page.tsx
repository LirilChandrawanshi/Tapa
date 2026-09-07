import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CategoryHero } from "@/components/CategoryHero";
import { CountdownPill } from "@/components/CountdownPill";
import { SourceStrip, TimingDataTag } from "@/components/panchang/DataMeta";
import { PanchangSubnav } from "@/components/panchang/PanchangSubnav";
import { TypeBadge } from "@/components/panchang/TypeBadge";
import { fetchCalendarMonth } from "@/lib/api";
import {
  fmtLong,
  mergeObservances,
  safeFetch,
  todayIst,
} from "@/lib/panchangExtras";
import type { UpcomingObservance } from "@/lib/types";

export const revalidate = 3600; // ISR — purged via the `panchang` tag

export const metadata: Metadata = {
  title: "Eclipses & Sutak Kaal — Why Visibility Decides Everything | Tapa",
  description:
    "How solar and lunar eclipses work in the panchang, when Sutak Kaal begins, and why an eclipse you cannot see from your city changes nothing.",
};

/** Every ECLIPSE observance seeded for the current year, in date order. */
async function fetchYearEclipses(now: string): Promise<UpcomingObservance[]> {
  const year = now.slice(0, 4);
  const months = Array.from(
    { length: 12 },
    (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`,
  );
  const payloads = await Promise.all(
    months.map((m) => safeFetch(fetchCalendarMonth(m))),
  );
  return mergeObservances(...payloads).filter(
    (u) => u.observance.type === "ECLIPSE",
  );
}

const MYTHS = [
  {
    myth: "“An eclipse affects everyone in India the same way, whether or not it can be seen here.”",
    correction:
      "Visibility determines applicability. This is the consistent position across panchang authorities: where an eclipse cannot be seen, Sutak Kaal and the associated restrictions are not observed. Messages that treat every eclipse worldwide as equally significant everywhere are not reflecting the rule.",
  },
  {
    myth: "“Food cooked before an eclipse becomes poisoned and must be thrown away.”",
    correction:
      "Setting cooked food aside during an eclipse is a custom kept in many households — it is not a physical claim the panchang makes, and nothing measurable happens to food during a grahan. Where the eclipse is not visible, even the customary restriction does not apply in traditional reckoning.",
  },
] as const;

export default async function EclipsesPage() {
  const now = todayIst();
  const eclipses = await fetchYearEclipses(now);

  return (
    <main className="pb-16">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Panchang", href: "/panchang" },
          { label: "Eclipses" },
        ]}
      />

      <CategoryHero
        variant="pa"
        eyebrow="Panchang · Explainer"
        title="Eclipses & Sutak: visibility decides everything"
        description="Grahan timings are pure astronomy — but what you observe depends entirely on whether the eclipse is visible from your city. That one rule resolves most confusion."
        meta={[
          { value: "Surya", label: "solar grahan" },
          { value: "Chandra", label: "lunar grahan" },
          { value: "Sutak", label: "the period before" },
        ]}
        side={
          <div>
            <p className="mb-2 text-[10px] font-bold tracking-[1px] text-eyebrow-dark uppercase">
              The one-line version
            </p>
            <p className="text-[13px] leading-relaxed text-hero-text/80">
              If an eclipse is not visible from your city, tradition holds
              that no Sutak applies there — however dramatic the headlines. An
              eclipse over the Pacific changes nothing in Delhi.
            </p>
          </div>
        }
      />

      <PanchangSubnav active="eclipses" />

      <div className="mx-auto max-w-[760px] px-4 pt-8 md:px-10">
        <TimingDataTag className="mb-6" />

        {/* Per-eclipse cards — rendered only when ECLIPSE observances exist.
            No seeded eclipse data means no cards: never fake a grahan. */}
        {eclipses.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-3 text-[17px] font-bold text-ink">
              The {now.slice(0, 4)} eclipses
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {eclipses.map((u) => {
                const o = u.observance;
                return (
                  <div
                    key={`${o.slug}-${o.date}`}
                    className="flex flex-col rounded-[15px] border border-border bg-card p-5"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <TypeBadge type={o.type} />
                      <CountdownPill date={o.date} now={now} />
                      {!o.verified && (
                        <span className="text-[10px] text-sub italic">
                          provisional
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/panchang/o/${o.slug}`}
                      className="text-[15.5px] font-bold text-ink hover:text-cta"
                    >
                      {o.name}
                    </Link>
                    <p className="mt-[3px] text-[12px] text-data-fg">
                      {fmtLong(o.date)}
                    </p>
                    {o.blurb && (
                      <p className="mt-2 text-[12.5px] leading-relaxed text-sub">
                        {o.blurb}
                      </p>
                    )}
                    <div className="mt-auto pt-3">
                      <Link
                        href={`/panchang/o/${o.slug}`}
                        className="text-[12px] font-bold text-data-fg"
                      >
                        Timing &amp; visibility →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
            <SourceStrip className="mt-2" />
          </section>
        )}

        <article className="space-y-5 text-[15px] leading-[1.85] text-body">
          <p>
            <b>What an eclipse is, in panchang terms.</b> A solar eclipse
            (Surya Grahan) can only occur on Amavasya, when the Moon stands
            between the Earth and the Sun; a lunar eclipse (Chandra Grahan)
            only on Purnima, when the Earth stands between the two. The
            panchang treats a grahan as a precisely bounded window — first
            contact to last contact — computed astronomically. There is no
            ambiguity in the timing itself; every almanac agrees to the
            minute.
          </p>
          <p>
            <b>Sutak Kaal is the period before.</b> Tradition marks an
            inauspicious span leading into the eclipse: reckoned as four
            prahars (about twelve hours) before a solar eclipse and three
            prahars (about nine hours) before a lunar one. During Sutak,
            custom holds that temples close their doors, new undertakings and
            cooked food are set aside, and routine puja pauses until the
            eclipse ends and spaces are cleansed. How strictly households
            observe this varies widely by region and family practice.
          </p>
          <p>
            <b>Visibility is the deciding rule.</b> Sutak applies only where
            the eclipse itself can be seen. A penumbral lunar eclipse that is
            imperceptible to the eye, or an eclipse that occurs below your
            horizon, carries no Sutak in the traditional reckoning — which is
            why one grahan fills the news yet your local temple keeps normal
            hours, and the next one quietly reorders the whole day. Before
            changing any plan, the only two questions that matter are: is it
            visible from my city, and between which times.
          </p>
        </article>

        {/* The rule, framed */}
        <section className="hero-pa mt-8 rounded-[15px] p-6 md:p-7">
          <p className="mb-1 text-[10px] font-bold tracking-[1px] text-eyebrow-dark uppercase">
            The rule that decides everything
          </p>
          <p className="text-[17px] leading-snug font-bold text-hero-text">
            The religious effect of an eclipse applies where the eclipse is
            visible. Not everywhere on Earth at once.
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-hero-text/70">
            An eclipse that is total and dramatic over Spain has no Sutak
            relevance in India if it cannot be seen from India. This single
            fact is what forwarded eclipse warnings almost always leave out —
            and it is the most useful thing on this page. The only question
            that matters: can you see it from where you are?
          </p>
        </section>

        {/* Myths & Facts */}
        <section className="mt-8">
          <h2 className="mb-3 text-[17px] font-bold text-ink">
            Myths &amp; facts
          </h2>
          <div className="space-y-4">
            {MYTHS.map((m) => (
              <div
                key={m.myth}
                className="overflow-hidden rounded-[15px] border border-border bg-card"
              >
                <p className="border-b border-border-light px-5 py-4 text-[13.5px] leading-relaxed font-bold text-ink">
                  {m.myth}
                </p>
                <div className="px-5 py-4">
                  <p className="mb-1 text-[9.5px] font-bold tracking-[0.9px] text-data-fg uppercase">
                    Correction
                  </p>
                  <p className="text-[13px] leading-relaxed text-sub">
                    {m.correction}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {eclipses.length === 0 && (
          <div className="mt-8 rounded-[13px] border border-data-bd bg-data-bg px-5 py-4">
            <p className="text-[12.5px] leading-relaxed text-data-fg">
              <b>Detailed guides land soon</b> — each 2026 grahan with its
              city-wise visibility and Sutak window will get its own timing
              page. Until then, the{" "}
              <Link href="/panchang/festival-calendar" className="font-bold underline">
                festival calendar
              </Link>{" "}
              carries every confirmed date of the year.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
