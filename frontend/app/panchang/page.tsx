import type { Metadata } from "next";
import Link from "next/link";
import { CategoryHero } from "@/components/CategoryHero";
import { WhatsAppNudge } from "@/components/WhatsAppNudge";
import { CountdownPill } from "@/components/CountdownPill";
import { SectionHeader } from "@/components/SectionHeader";
import {
  DataStateNote,
  SourceStrip,
  TimingDataTag,
  VerifyingPanel,
} from "@/components/panchang/DataMeta";
import { ConventionToggle } from "@/components/panchang/ConventionToggle";
import { ObservanceFilter } from "@/components/panchang/ObservanceFilter";
import {
  CitySelect,
  PdfDownloadLink,
} from "@/components/panchang/PanchangControls";
import {
  MuhuratStrip,
  PanchangDashboard,
} from "@/components/panchang/PanchangDashboard";
import { PanchangSubnav } from "@/components/panchang/PanchangSubnav";
import { ControlBar, ControlSep } from "@/components/panchang/ControlBar";
import {
  StickyActionBar,
  StickyLabel,
} from "@/components/panchang/StickyActionBar";
import {
  fetchCalendarMonth,
  fetchPanchangToday,
  fetchUpcoming,
} from "@/lib/api";
import {
  CITY_LABEL,
  daysBetween,
  fetchCalendarYear,
  fmtEnds,
  fmtLong,
  fmtShort,
  guideHref,
  mergeObservances,
  monthKey,
  safeFetch,
  todayIst,
} from "@/lib/panchangExtras";
import type { DayPayload, UpcomingObservance } from "@/lib/types";

/**
 * ISR at 5 minutes — this dashboard renders "today" strings server-side
 * (todayIst()), so a short window keeps the day rollover tight while the
 * `panchang` tag purges it instantly on admin edits.
 */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Panchang — Today's Tithi, Vrat & Festival Dates | Tapa",
  description:
    "Today's tithi, nakshatra, sunrise, Rahu Kaal — and every vrat and festival date of the year, calculated for Delhi-NCR (IST).",
};

/** Hero side card — compact snapshot of today. */
function TodaySnapshot({
  payload,
  now,
  next,
}: {
  payload: DayPayload | null;
  now: string;
  /** The nearest upcoming observance — rendered as the card's footer. */
  next?: UpcomingObservance | null;
}) {
  const day = payload?.day ?? null;
  if (!day) {
    return (
      <div>
        <p className="mb-2 text-[10px] font-bold tracking-[1px] text-eyebrow-dark uppercase">
          ☀ Today · {CITY_LABEL}
        </p>
        <p className="text-[14px] font-bold text-hero-text">{fmtLong(now)}</p>
        <p className="mt-2 text-[12px] leading-relaxed text-hero-text/65">
          Today&rsquo;s timing values are being verified — the full dashboard
          below will fill in shortly.
        </p>
      </div>
    );
  }
  const rows: [string, string][] = [
    ["Tithi", day.tithi ? `${day.tithi.name}${day.tithi.endsAt ? ` · ${fmtEnds(day.tithi.endsAt, day.date)}` : ""}` : "—"],
    ["Paksha", day.paksha ?? "—"],
    ["Nakshatra", day.nakshatra?.name ?? "—"],
    ["Sunrise / Sunset", day.sunrise && day.sunset ? `${day.sunrise} / ${day.sunset}` : "—"],
    ["Rahu Kaal", day.rahuKaal ? `${day.rahuKaal.from} – ${day.rahuKaal.to}` : "—"],
    [
      "Yoga · Karana",
      day.yoga || day.karana
        ? [day.yoga, day.karana].filter(Boolean).join(" · ")
        : "—",
    ],
  ];
  return (
    <div>
      <div className="mb-[10px] flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold tracking-[1px] text-eyebrow-dark uppercase">
          ☀ Today&rsquo;s Panchang
        </p>
        <p className="flex items-center gap-[6px] text-[10px] tracking-[0.5px] text-hero-text/60 uppercase">
          <span
            aria-hidden
            className="inline-block h-[5px] w-[5px] rounded-full bg-eyebrow-dark"
          />
          {day.city || CITY_LABEL}
        </p>
      </div>
      <p className="text-[15px] leading-snug font-bold text-hero-text">
        {day.lunarMonth ? `${day.lunarMonth} · ` : ""}
        {day.tithi?.name ?? fmtLong(day.date)}
      </p>
      <p className="mb-3 text-[11.5px] text-hero-text/60">{fmtLong(day.date)}</p>
      <dl>
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="flex items-baseline justify-between gap-3 border-t border-white/10 py-[7px]"
          >
            <dt className="text-[9.5px] font-bold tracking-[0.8px] text-hero-text/45 uppercase">
              {k}
            </dt>
            <dd className="text-right text-[12px] font-medium text-hero-text/90">
              {v}
            </dd>
          </div>
        ))}
      </dl>
      <DataStateNote
        stale={payload?.stale}
        verified={payload?.verified}
        className="mt-2 !text-hero-text/50"
      />
      {next && <NextMajorDate item={next} />}
    </div>
  );
}

/** Today-card footer: the nearest observance and the way into its page. */
function NextMajorDate({ item }: { item: UpcomingObservance }) {
  const o = item.observance;
  return (
    <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 border-t border-white/10 pt-3">
      <p className="text-[11.5px] text-hero-text/75">
        <b className="font-bold text-hero-text">Next major date —</b>{" "}
        {o.name}, {fmtShort(o.date)}
      </p>
      <Link
        href={o.articleSlug ? guideHref(o.articleSlug) : `/panchang/o/${o.slug}`}
        className="text-[11.5px] font-bold whitespace-nowrap text-eyebrow-dark hover:underline"
      >
        {o.articleSlug ? "Open guide ›" : "Timing details ›"}
      </Link>
    </div>
  );
}

/**
 * "Four ways in" — the spec's sub-category cards. The CTA carries a live
 * count where we have one, so the card states the size of what it opens.
 */
function fourWaysIn(counts: {
  year: string;
  vrat: number;
  festival: number;
  eclipse: number;
}) {
  return [
    {
      icon: "☀",
      title: "Today's Panchang",
      text: "The full day — tithi, nakshatra, yoga, karana, sunrise, sunset and Rahu Kaal.",
      href: "/panchang",
      cta: "You are here",
    },
    {
      icon: "📿",
      title: `${counts.year} Vrat Calendar`,
      text: "Every Ekadashi, Pradosh, Chaturthi, Purnima and Amavasya for the year.",
      href: "/panchang/vrat-calendar",
      cta: counts.vrat > 0 ? `${counts.vrat} dates ›` : "Open the calendar ›",
    },
    {
      icon: "🎆",
      title: "Festival Calendar",
      text: "Gregorian dates month by month, for anyone who thinks in months rather than tithis.",
      href: "/panchang/festival-calendar",
      cta:
        counts.festival > 0
          ? `${counts.festival} festivals ›`
          : "Browse by month ›",
    },
    {
      icon: "🌑",
      title: "Eclipse & Grahan",
      text: "Upcoming eclipses, visibility by city, and what actually determines Sutak Kaal.",
      href: "/panchang/eclipses",
      cta:
        counts.eclipse > 0
          ? `${counts.eclipse} in ${counts.year} ›`
          : "Read the explainer ›",
    },
  ] as const;
}

export default async function PanchangPage() {
  const now = todayIst();
  const year = now.slice(0, 4);
  const [today, upcoming, monthA, monthB, yearItems] = await Promise.all([
    safeFetch(fetchPanchangToday()),
    safeFetch(fetchUpcoming(3)),
    safeFetch(fetchCalendarMonth(monthKey(now))),
    safeFetch(fetchCalendarMonth(monthKey(now, 1))),
    fetchCalendarYear(year, fetchCalendarMonth),
  ]);

  const day = today?.day ?? null;
  const next30 = mergeObservances(monthA, monthB).filter((u) => {
    const d = daysBetween(now, u.observance.date);
    return d >= 0 && d <= 30;
  });

  // Hero counters — real figures off the year, never a hardcoded "142".
  const vratCount = yearItems.filter(
    (u) =>
      u.observance.type === "VRAT" || u.observance.type === "PURNIMA_AMAVASYA",
  ).length;
  const eclipseCount = yearItems.filter(
    (u) => u.observance.type === "ECLIPSE",
  ).length;
  const festivalCount = yearItems.filter(
    (u) =>
      u.observance.type === "FESTIVAL" ||
      u.observance.type === "SPECIAL_SEASONAL",
  ).length;

  return (
    <main className="pb-16">
      <CategoryHero
        variant="pa"
        image="/brand/calender.png"
        eyebrow="Panchang"
        title="The calendar that follows the Moon"
        description="Today's tithi, the year's vrat dates, and how to read any of it yourself. This page answers when — the ritual guides answer how."
        meta={[
          { value: "365", label: "days computed" },
          vratCount > 0
            ? { value: String(vratCount), label: `vrat dates in ${year}` }
            : { value: CITY_LABEL, label: "IST timings" },
          { value: "Drik Panchang", label: "source" },
        ]}
        side={
          <TodaySnapshot payload={today} now={now} next={upcoming?.[0]} />
        }
      />

      <PanchangSubnav active="today" />

      {/* Control strip: marker, city, convention, PDF */}
      <ControlBar>
        <TimingDataTag />
        <CitySelect />
        <ControlSep />
        <ConventionToggle />
        <PdfDownloadLink
          surface="landing-strip"
          className="ml-auto rounded-[9px] border border-data-fg bg-data-fg px-[14px] py-[7px] text-[12px] font-bold text-white hover:opacity-90"
        >
          ↓ Download {year} calendar (PDF)
        </PdfDownloadLink>
      </ControlBar>

      <div className="mx-auto max-w-[1280px] px-4 md:px-10">
        {/* Dashboard */}
        <section className="mt-7">
          {day ? (
            <>
              <PanchangDashboard day={day} />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <SourceStrip />
                <DataStateNote stale={today?.stale} verified={today?.verified} />
              </div>
              <div className="mt-4">
                <MuhuratStrip day={day} />
              </div>
            </>
          ) : (
            <VerifyingPanel />
          )}
        </section>

        {/* Five limbs primer (#82) */}
        <section className="mt-8 rounded-[15px] border border-border bg-card p-5 md:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[10px] font-bold tracking-[0.8px] text-gold uppercase">
              Panch · ang — five limbs, tracked daily
            </p>
            <Link
              href="/panchang/tithi-paksha"
              className="text-[12px] font-bold text-cta"
            >
              How tithi &amp; paksha work ›
            </Link>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {(
              [
                ["1", "Tithi", "the lunar day — what almost every festival date is fixed by"],
                ["2", "Paksha", "the waxing or waning half of the lunar month"],
                ["3", "Nakshatra", "the star the Moon sits in today"],
                ["4", "Vara", "the weekday — the one limb you already know"],
                ["5", "Yoga & Karana", "the rest of the five — used for muhurat picking"],
              ] as const
            ).map(([n, name, note]) => (
              <div key={name} className="flex gap-[10px]">
                <span
                  aria-hidden
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-data-bd bg-data-bg text-[11px] font-bold text-data-fg"
                >
                  {n}
                </span>
                <div>
                  <p className="text-[13px] leading-tight font-bold text-ink">
                    {name}
                  </p>
                  <p className="mt-[2px] text-[11.5px] leading-relaxed text-sub">
                    {note}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Next vrats */}
        <section className="mt-10">
          <SectionHeader
            eyebrow="Coming up"
            title="The next three dates"
            description="The nearest observances, counted from today. Each links to its timing page — and to the full ritual guide where one is live."
            viewAllHref="/panchang/vrat-calendar"
            viewAllLabel="Full vrat calendar"
          />
          {upcoming && upcoming.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
              {upcoming.slice(0, 3).map((u) => (
                <div
                  key={`${u.observance.slug}-${u.observance.date}`}
                  className="flex flex-col rounded-[15px] border border-border bg-card p-5"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <CountdownPill date={u.observance.date} now={now} />
                    <span className="text-[11px] text-sub">
                      {fmtLong(u.observance.date)}
                    </span>
                  </div>
                  <Link
                    href={`/panchang/o/${u.observance.slug}`}
                    className="text-[16.5px] font-bold text-ink hover:text-cta"
                  >
                    {u.observance.name}
                  </Link>
                  {u.observance.tithiLabel && (
                    <p className="mt-[3px] text-[12px] text-data-fg">
                      {u.observance.tithiLabel}
                    </p>
                  )}
                  {u.observance.blurb && (
                    <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-sub">
                      {u.observance.blurb}
                    </p>
                  )}
                  <div className="mt-auto pt-3">
                    {u.observance.articleSlug ? (
                      <Link
                        href={guideHref(u.observance.articleSlug)}
                        className="text-[12.5px] font-bold text-cta"
                      >
                        View guide →
                      </Link>
                    ) : (
                      <Link
                        href={`/panchang/o/${u.observance.slug}`}
                        className="text-[12.5px] font-bold text-data-fg"
                      >
                        Timing details →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <VerifyingPanel title="Upcoming dates are being verified" />
          )}
        </section>

        {/* Four ways in */}
        <section className="mt-10">
          <SectionHeader
            eyebrow="Four ways in"
            title="What you can look up"
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {fourWaysIn({
              year,
              vrat: vratCount,
              festival: festivalCount,
              eclipse: eclipseCount,
            }).map((w) => (
              <Link
                key={w.title}
                href={w.href}
                className="group flex flex-col rounded-[15px] border border-border bg-card p-5 transition-colors hover:border-data-bd"
              >
                <span aria-hidden className="mb-2 text-[22px]">
                  {w.icon}
                </span>
                <span className="text-[15px] font-bold text-ink group-hover:text-cta">
                  {w.title}
                </span>
                <span className="mt-1 mb-3 text-[12.5px] leading-relaxed text-sub">
                  {w.text}
                </span>
                <span className="mt-auto text-[12px] font-bold text-data-fg">
                  {w.cta}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* Next 30 days */}
        <section className="mt-10">
          <SectionHeader
            eyebrow="Next 30 days"
            title="Coming up"
            description={`Dates shown for ${CITY_LABEL}. Every observance links to its timing page.`}
            count={next30.length > 0 ? `${next30.length} dates` : undefined}
            viewAllHref="/panchang/vrat-calendar"
            viewAllLabel="Full vrat calendar"
          />
          {next30.length > 0 ? (
            <>
              <ObservanceFilter items={next30} now={now} />
              <SourceStrip className="mt-2" />
            </>
          ) : (
            <VerifyingPanel title="The 30-day view is being verified" />
          )}
        </section>

        {/* Circle nudge (#16) — panchang context: the reader is already here for dates */}
        <WhatsAppNudge context="panchang" />

        {/* Learn + download band */}
        <section className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-[15px] border border-border bg-card p-6">
            <p className="mb-1 text-[10px] font-bold tracking-[0.8px] text-gold uppercase">
              Before you use any of this
            </p>
            <h2 className="text-[17px] font-bold text-ink">
              Learn to read it once, and never ask again
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-sub">
              Panch means five, ang means limb — five things tracked daily.
              Once you can read tithi and paksha, you will never have to ask
              anyone which day a festival falls on.
            </p>
            <Link
              href="/panchang/tithi-paksha"
              className="mt-3 inline-block text-[12.5px] font-bold text-cta"
            >
              How tithi &amp; paksha work ›
            </Link>
          </div>
          <div className="hero-pa flex flex-col justify-center rounded-[15px] p-6">
            <p className="mb-1 text-[10px] font-bold tracking-[0.8px] text-eyebrow-dark uppercase">
              📅 One PDF, the whole year
            </p>
            <h2 className="text-[17px] font-bold text-hero-text">
              The full {year} calendar
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-hero-text/65">
              Every tithi, vrat and festival date for the year — print it, or
              keep it on your phone.
            </p>
            <PdfDownloadLink
              surface="landing-band"
              className="mt-4 inline-block w-fit rounded-[9px] bg-cta px-4 py-2 text-[12.5px] font-bold text-white"
            >
              Download {year} calendar (PDF)
            </PdfDownloadLink>
          </div>
        </section>
      </div>

      {/* Sticky download bar — the spec pins the calendar to every panchang page */}
      <StickyActionBar
        secondary={
          <p className="min-w-0 truncate text-[12.5px] text-mid">
            <b className="text-ink">Download the full {year} calendar</b>
            <span className="hidden text-sub sm:inline">
              {" "}
              — every tithi, vrat and festival date
            </span>
          </p>
        }
        primary={
          <PdfDownloadLink
            surface="landing-sticky"
            className="rounded-[9px] bg-cta px-4 py-[7px] text-[12px] font-bold text-white hover:opacity-90"
          >
            <StickyLabel
              title="Download PDF"
              note={vratCount > 0 ? `${vratCount} vrat dates` : undefined}
            />
          </PdfDownloadLink>
        }
      />
    </main>
  );
}
