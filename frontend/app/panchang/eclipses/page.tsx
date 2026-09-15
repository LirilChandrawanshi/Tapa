import type { Metadata } from "next";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CategoryHero } from "@/components/CategoryHero";
import {
  NoTagNote,
  SourceStripBlock,
  TimingDataTag,
} from "@/components/panchang/DataMeta";
import {
  CONTROL_H,
  ControlBar,
  ControlSep,
} from "@/components/panchang/ControlBar";
import { CrumbActions } from "@/components/panchang/CrumbActions";
import {
  EclipseCard,
  VisibilityBadge,
} from "@/components/panchang/EclipseCard";
import { JumpChips } from "@/components/panchang/JumpChips";
import { ConventionToggle } from "@/components/panchang/ConventionToggle";
import {
  CitySelect,
  PdfDownloadLink,
} from "@/components/panchang/PanchangControls";
import { PanchangShell } from "@/components/panchang/PanchangShell";
import { PanchangSubnav } from "@/components/panchang/PanchangSubnav";
import { RelatedGrid } from "@/components/panchang/RelatedGrid";
import { RevenueBand } from "@/components/panchang/RevenueBand";
import { AtAGlance, SidebarCta } from "@/components/panchang/SidebarCards";
import {
  StickyActionBar,
  StickyLabel,
} from "@/components/panchang/StickyActionBar";
import { fetchCalendarMonth } from "@/lib/api";
import { getFlags } from "@/lib/flags";
import {
  CITY_LABEL,
  fetchCalendarYear,
  fmtShort,
  guideHref,
  todayIst,
} from "@/lib/panchangExtras";
import type { UpcomingObservance } from "@/lib/types";

export const revalidate = 3600; // ISR — purged via the `panchang` tag

export const metadata: Metadata = {
  title: "Eclipses & Sutak Kaal — Why Visibility Decides Everything | Tapa",
  description:
    "How solar and lunar eclipses work in the panchang, when Sutak Kaal begins, and why an eclipse you cannot see from your city changes nothing.",
};

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

const JUMP = [
  { id: "eclipses", label: "☀☾ The eclipses" },
  { id: "rule", label: "The rule" },
  { id: "measures", label: "What the Panchang measures" },
  { id: "myths", label: "✕ Myths" },
  { id: "plans", label: "Your plans" },
] as const;

export default async function EclipsesPage() {
  const now = todayIst();
  const year = now.slice(0, 4);
  const [yearItems, flags] = await Promise.all([
    fetchCalendarYear(year, fetchCalendarMonth),
    getFlags(),
  ]);
  const eclipses: UpcomingObservance[] = yearItems.filter(
    (u) => u.observance.type === "ECLIPSE",
  );

  const solar = eclipses.filter((u) => /surya|solar/i.test(u.observance.name));
  const lunar = eclipses.filter((u) =>
    /chandra|lunar/i.test(u.observance.name),
  );

  const glance = [
    ...eclipses.map((u) => ({
      key: `${u.observance.name} · ${fmtShort(u.observance.date)}`,
      value: <VisibilityBadge visibility={u.observance.visibility} />,
    })),
    { key: "Sutak Kaal", value: "Follows visibility" },
  ];

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
        actions={<CrumbActions title={`The ${year} eclipses`} tone="hero" />}
        eyebrow="Panchang · Eclipses"
        title="Eclipses & Sutak: visibility decides everything"
        description="Grahan timings are pure astronomy — but what you observe depends entirely on whether the eclipse is visible from your city. That one rule resolves most confusion."
        meta={[
          {
            value: eclipses.length > 0 ? String(eclipses.length) : "—",
            label: `in ${year}`,
          },
          { value: String(solar.length || "—"), label: "solar grahan" },
          { value: String(lunar.length || "—"), label: "lunar grahan" },
        ]}
        side={
          <div>
            <p className="mb-2 text-[10px] font-bold tracking-[1px] text-eyebrow-dark uppercase">
              ☾ Timing data · No tag, no score
            </p>
            <p className="text-[13px] leading-relaxed text-hero-text/80">
              If an eclipse is not visible from your city, tradition holds that
              no Sutak applies there — however dramatic the headlines. An
              eclipse over the Pacific changes nothing in {CITY_LABEL}.
            </p>
          </div>
        }
      />

      <PanchangSubnav active="eclipses" />

      <ControlBar>
        {/* Hidden in the sticky bar on a phone: it is a statement, not a
            control, and it pushed the city selector — the most important
            control on the page — off the visible row. SourceStrip still
            carries the provenance below. */}
        <span className="hidden md:contents">
          <TimingDataTag />
        </span>
        <ControlSep />
        <CitySelect />
        <ControlSep />
        <ConventionToggle />
        <PdfDownloadLink
          surface="eclipses-strip"
          className={`${CONTROL_H} ml-auto inline-flex items-center rounded-[9px] border border-data-fg bg-data-fg px-[14px] text-[12px] font-bold text-white hover:opacity-90`}
        >
          ↓ Download {year} calendar
        </PdfDownloadLink>
      </ControlBar>

      <JumpChips targets={JUMP} surface="eclipses" />

      <div className="pt-7">
        <PanchangShell
          sidebar={
            <>
              <SidebarCta
                icon="↓"
                title={`Download the ${year} calendar`}
                note="Every tithi, vrat and eclipse date"
                href="/api/v1/panchang/calendar.pdf"
                tone="dark"
              />
              <SidebarCta
                icon="💬"
                title="Join the Tapa Circle"
                note="WhatsApp reminders · ₹499 a year"
                href="/tapa-circle?from=/panchang/eclipses"
                tone="wa"
              />
              {glance.length > 1 && (
                <AtAGlance
                  heading={`At a glance · ${CITY_LABEL}`}
                  rows={glance}
                />
              )}
              <NoTagNote>
                Panchang carries{" "}
                <b>no Dharma or Pratha tag and no Confidence Score</b> — a date
                is not a ritual-authority claim. The corrections below are
                Bhranti badges: they correct a fear, they do not classify the
                page.
              </NoTagNote>
            </>
          }
        >
          <SourceStripBlock
            line="Drik Panchang, cross-checked against published astronomical timing sources · calculated for Delhi-NCR (IST)"
            note="No classification tag and no Confidence Score. This is timing data, not a ritual-authority claim. Eclipse data is year-specific and regenerates annually."
          />

          <p className="mt-6 text-[17px] leading-snug font-bold text-ink">
            An eclipse is astronomy. What it asks of you is decided by one
            thing: whether you can see it.
          </p>

          {/* Per-eclipse cards — never faked. No seeded eclipse, no card. */}
          {eclipses.length > 0 && (
            <section id="eclipses" className="mt-7 scroll-mt-[160px]">
              <h2 className="mb-3 text-[17px] font-bold text-ink">
                The {year} eclipses
              </h2>
              <div className="grid gap-4">
                {eclipses.map((u) => (
                  <EclipseCard
                    key={`${u.observance.slug}-${u.observance.date}`}
                    observance={u.observance}
                    city={CITY_LABEL}
                  />
                ))}
              </div>
            </section>
          )}

          <article className="mt-8 space-y-5 text-[15px] leading-[1.85] text-body">
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
          </article>

          {/* The rule, framed */}
          <section
            id="rule"
            className="hero-pa mt-8 scroll-mt-[160px] rounded-[15px] p-6 md:p-7"
          >
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

          {/* What the panchang measures vs what practice adds */}
          <section id="measures" className="mt-8 scroll-mt-[160px]">
            <h2 className="mb-3 text-[17px] font-bold text-ink">
              What the Panchang measures, and what people add to it
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[15px] border border-data-bd bg-data-bg p-5">
                <p className="mb-1 text-[9.5px] font-bold tracking-[0.9px] text-data-fg/70 uppercase">
                  The Panchang gives you
                </p>
                <p className="text-[15px] font-bold text-data-fg">
                  Two things, both computed
                </p>
                <p className="mt-2 text-[12.5px] leading-relaxed text-data-fg/80">
                  When the eclipse occurs, and where it is visible. That is the
                  whole of it.
                </p>
              </div>
              <div className="rounded-[15px] border border-pratha-bd bg-pratha-bg p-5">
                <p className="mb-1 text-[9.5px] font-bold tracking-[0.9px] text-pratha-fg/70 uppercase">
                  Everything else
                </p>
                <p className="text-[15px] font-bold text-pratha-fg">
                  Layered on by practice
                </p>
                <p className="mt-2 text-[12.5px] leading-relaxed text-pratha-fg/80">
                  What to do during Sutak, whether to eat, whether to bathe
                  afterwards, whether to keep an idol covered.
                </p>
              </div>
            </div>
            <p className="mt-3 text-[14px] leading-[1.8] text-body">
              Those practices are kept in many households with genuine
              sincerity, and they vary by family and region. They are not what
              the Panchang says.{" "}
              <strong>
                The Panchang gives you timing and visibility; what you do with
                that is your tradition&rsquo;s to decide, not ours to prescribe.
              </strong>
            </p>
          </section>

          {/* Myths & Facts */}
          <section id="myths" className="mt-8 scroll-mt-[160px]">
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
                    <p className="mb-1 text-[9.5px] font-bold tracking-[0.9px] text-bhranti-fg uppercase">
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

          {/* What this means for your plans */}
          <section id="plans" className="mt-8 scroll-mt-[160px]">
            <h2 className="mb-3 text-[17px] font-bold text-ink">
              What this means for your plans
            </h2>
            <div className="space-y-4 text-[15px] leading-[1.85] text-body">
              <p>
                If you have a ritual, a vrat or a booking around either date,
                the only thing that changes anything for you in India is whether
                the eclipse is actually visible from your city.
              </p>
              <p>
                <strong>
                  There is no need to move a festival, a vrat or anything else
                  on the basis of eclipse anxiety alone.
                </strong>{" "}
                Check your local panchang, and proceed normally unless it says
                otherwise for your location.
              </p>
            </div>
          </section>

          {eclipses.length === 0 && (
            <div className="mt-8 rounded-[13px] border border-data-bd bg-data-bg px-5 py-4">
              <p className="text-[12.5px] leading-relaxed text-data-fg">
                <b>No grahan is seeded for {year} yet.</b> Each eclipse gets its
                own card here with its visibility and Sutak window once the
                dates are entered and checked — we do not generate them.
              </p>
            </div>
          )}

          {/* Related */}
          <section className="mt-10">
            <h2 className="mb-3 text-[17px] font-bold text-ink">Related</h2>
            <RelatedGrid
              columns={[
                {
                  heading: "Related ritual guides",
                  items: eclipses
                    .filter((u) => u.observance.articleSlug)
                    .slice(0, 3)
                    .map((u) => ({
                      label: u.observance.name,
                      note: fmtShort(u.observance.date),
                      href: guideHref(u.observance.articleSlug!),
                    })),
                },
                {
                  heading: "Related concepts",
                  items: [
                    {
                      label: "How to read today's Panchang",
                      note: "Tithi, paksha, nakshatra explained",
                      href: "/panchang/tithi-paksha",
                    },
                  ],
                },
                {
                  heading: "Related dates",
                  items: [
                    {
                      label: `${year} Vrat Calendar`,
                      note: "Every date for the year",
                      href: "/panchang/vrat-calendar",
                    },
                    {
                      label: "Festival Calendar",
                      note: "Month by month",
                      href: "/panchang/festival-calendar",
                    },
                  ],
                },
                {
                  heading: "Download",
                  items: [
                    {
                      label: `Full ${year} calendar`,
                      note: "One PDF, computed for your city",
                      href: "/api/v1/panchang/calendar.pdf",
                    },
                  ],
                },
              ]}
            />
          </section>

          {/* Commerce, last — knowledge before commerce */}
          <section className="mt-10">
            <h2 className="mb-3 text-[17px] font-bold text-ink">
              Prefer to have it all taken care of?
            </h2>
            <RevenueBand
              flags={flags}
              purohitNote="Purohit booking opens later this year. We will tell you when it does."
              circleBlurb="Festival and vrat reminders on WhatsApp, with the guide attached. ₹499 a year."
              from="/panchang/eclipses"
            />
          </section>
        </PanchangShell>
      </div>

      <StickyActionBar
        secondary={
          <p className="min-w-0 truncate text-[12.5px] text-mid">
            <b className="text-ink">Visibility decides Sutak</b>
            <span className="hidden text-sub sm:inline">
              {" "}
              — check your city before changing any plan
            </span>
          </p>
        }
        primary={
          <PdfDownloadLink
            surface="eclipses-sticky"
            className="rounded-[9px] bg-cta px-4 py-[7px] text-[12px] font-bold text-white hover:opacity-90"
          >
            <StickyLabel title="Download PDF" note={`Every ${year} date`} />
          </PdfDownloadLink>
        }
      />
    </main>
  );
}
