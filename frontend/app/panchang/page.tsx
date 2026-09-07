import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
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
import {
  ObservanceRow,
  ObservanceTable,
} from "@/components/panchang/ObservanceRow";
import {
  MuhuratStrip,
  PanchangDashboard,
} from "@/components/panchang/PanchangDashboard";
import {
  fetchCalendarMonth,
  fetchPanchangToday,
  fetchUpcoming,
} from "@/lib/api";
import {
  CALENDAR_PDF_HREF,
  CITY_LABEL,
  daysBetween,
  fmtEnds,
  fmtLong,
  guideHref,
  mergeObservances,
  monthKey,
  safeFetch,
  todayIst,
} from "@/lib/panchangExtras";
import type { DayPayload } from "@/lib/types";

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
function TodaySnapshot({ payload, now }: { payload: DayPayload | null; now: string }) {
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
    </div>
  );
}

const FOUR_WAYS = [
  {
    icon: "☀",
    title: "Today's Panchang",
    text: "The full day — tithi, nakshatra, yoga, sunrise, sunset and Rahu Kaal.",
    href: "/panchang",
    cta: "You are here",
  },
  {
    icon: "📿",
    title: "2026 Vrat Calendar",
    text: "Every Ekadashi, Teej, Purnima and Amavasya of the year, with its tithi.",
    href: "/panchang/vrat-calendar",
    cta: "Open the calendar ›",
  },
  {
    icon: "🎆",
    title: "Festival Calendar",
    text: "Season by season, for anyone who plans in months rather than tithis.",
    href: "/panchang/festival-calendar",
    cta: "Browse festivals ›",
  },
  {
    icon: "🌑",
    title: "Eclipses & Sutak",
    text: "What an eclipse means for puja, and why visibility decides everything.",
    href: "/panchang/eclipses",
    cta: "Read the explainer ›",
  },
] as const;

export default async function PanchangPage() {
  const now = todayIst();
  const [today, upcoming, monthA, monthB] = await Promise.all([
    safeFetch(fetchPanchangToday()),
    safeFetch(fetchUpcoming(3)),
    safeFetch(fetchCalendarMonth(monthKey(now))),
    safeFetch(fetchCalendarMonth(monthKey(now, 1))),
  ]);

  const day = today?.day ?? null;
  const next30 = mergeObservances(monthA, monthB).filter((u) => {
    const d = daysBetween(now, u.observance.date);
    return d >= 0 && d <= 30;
  });

  return (
    <main className="pb-16">
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Panchang" }]} />

      <CategoryHero
        variant="pa"
        eyebrow="Panchang"
        title="The calendar that follows the Moon"
        description="Today's tithi, the year's vrat dates, and how to read any of it yourself. This page answers when — the ritual guides answer how."
        meta={[
          { value: "365", label: "days computed" },
          { value: CITY_LABEL, label: "IST timings" },
          { value: "Drik Panchang", label: "source" },
        ]}
        side={<TodaySnapshot payload={today} now={now} />}
      />

      {/* Control strip: marker, city, PDF */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 md:px-10">
          <TimingDataTag />
          <button
            type="button"
            disabled
            title="More cities soon"
            className="flex items-center gap-2 rounded-[9px] border border-border bg-bg px-3 py-[6px] text-[12px] font-bold text-mid"
          >
            <span className="text-[9.5px] font-bold tracking-[0.7px] text-sub uppercase">
              Calculated for
            </span>
            {CITY_LABEL} ▾
            <span className="font-medium text-sub">— more cities soon</span>
          </button>
          <a
            href={CALENDAR_PDF_HREF}
            className="ml-auto rounded-[9px] border border-data-fg bg-data-fg px-[14px] py-[7px] text-[12px] font-bold text-white hover:opacity-90"
          >
            ↓ Download 2026 calendar (PDF)
          </a>
        </div>
      </div>

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
            {FOUR_WAYS.map((w) => (
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
              <ObservanceTable>
                {next30.map((u, i) => (
                  <ObservanceRow
                    key={`${u.observance.slug}-${u.observance.date}`}
                    item={u}
                    now={now}
                    highlight={i === 0}
                  />
                ))}
              </ObservanceTable>
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
              The full 2026 calendar
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-hero-text/65">
              Every tithi, vrat and festival date for the year — print it, or
              keep it on your phone.
            </p>
            <a
              href={CALENDAR_PDF_HREF}
              className="mt-4 inline-block w-fit rounded-[9px] bg-cta px-4 py-2 text-[12.5px] font-bold text-white"
            >
              Download 2026 calendar (PDF)
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
