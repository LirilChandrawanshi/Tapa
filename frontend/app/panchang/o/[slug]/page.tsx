import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CountdownPill } from "@/components/CountdownPill";
import {
  SourceStrip,
  TimingDataTag,
  VerifyingPanel,
} from "@/components/panchang/DataMeta";
import {
  ObservanceRow,
  ObservanceTable,
} from "@/components/panchang/ObservanceRow";
import { TypeBadge } from "@/components/panchang/TypeBadge";
import { ApiError, fetchEkadashi, fetchFestival, fetchUpcoming } from "@/lib/api";
import {
  fmtLong,
  fmtRange,
  guideHref,
  safeFetch,
  todayIst,
} from "@/lib/panchangExtras";
import type { UpcomingObservance } from "@/lib/types";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await safeFetch(fetchFestival(slug));
  if (!data) return { title: "Observance | Tapa Panchang" };
  const o = data.observance;
  return {
    title: `${o.name} 2026 — Date, Tithi & Timing | Tapa Panchang`,
    description:
      o.blurb ??
      `${o.name} falls on ${fmtLong(o.date)}${o.tithiLabel ? ` (${o.tithiLabel})` : ""} — calculated for Delhi-NCR (IST).`,
  };
}

/** Series rail: the other dates of the same series this year. */
async function fetchSeriesMates(
  series: string,
  selfSlug: string,
  selfDate: string,
): Promise<UpcomingObservance[]> {
  const isEkadashi = series.toLowerCase().includes("ekadashi");
  const list = await safeFetch(isEkadashi ? fetchEkadashi() : fetchUpcoming(60));
  return (list ?? [])
    .filter(
      (u) =>
        u.observance.series === series &&
        !(u.observance.slug === selfSlug && u.observance.date === selfDate),
    )
    .sort((a, b) => a.observance.date.localeCompare(b.observance.date));
}

export default async function ObservancePage({ params }: Props) {
  const { slug } = await params;
  const now = todayIst();

  let data: Awaited<ReturnType<typeof fetchFestival>> | null = null;
  let backendDown = false;
  try {
    data = await fetchFestival(slug);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    backendDown = true;
  }

  if (backendDown || !data) {
    return (
      <main className="pb-16">
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Panchang", href: "/panchang" },
            { label: "Observance" },
          ]}
        />
        <div className="mx-auto max-w-[860px] px-4 pt-10 md:px-10">
          <VerifyingPanel
            title="This observance is being verified"
            note="Its timing data could not be loaded right now. The vrat calendar has every confirmed date of the year."
          />
          <p className="mt-4 text-center">
            <Link
              href="/panchang/vrat-calendar"
              className="text-[13px] font-bold text-cta"
            >
              Open the 2026 vrat calendar ›
            </Link>
          </p>
        </div>
      </main>
    );
  }

  const o = data.observance;
  const mates = o.series ? await fetchSeriesMates(o.series, o.slug, o.date) : [];

  const tiles: { key: string; value: string; sub?: string }[] = [
    {
      key: "Date",
      value: fmtRange(o.date, o.endDate),
      sub: weekdaySub(o.date, o.endDate),
    },
    { key: "Tithi", value: o.tithiLabel ?? "—" },
    { key: "Deity", value: o.deity ?? "—" },
    { key: "Season", value: o.seasonBlock ?? "—" },
  ];

  return (
    <main className="pb-16">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Panchang", href: "/panchang" },
          { label: "Vrat Calendar", href: "/panchang/vrat-calendar" },
          { label: o.name },
        ]}
      />

      {/* Hero */}
      <section className="hero-pa relative overflow-hidden py-8 md:py-11">
        <div className="relative mx-auto max-w-[1280px] px-4 md:px-10">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <TimingDataTag />
            <TypeBadge type={o.type} />
            {!o.verified && (
              <span className="text-[10.5px] text-hero-text/55 italic">
                provisional
              </span>
            )}
          </div>
          <h1 className="text-[28px] leading-[1.12] font-bold tracking-[-0.6px] text-hero-text md:text-[38px]">
            {o.name}
            {o.nameHi && (
              <span className="ml-3 align-middle text-[0.6em] font-medium text-eyebrow-dark">
                {o.nameHi}
              </span>
            )}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <CountdownPill date={o.date} now={now} />
            <span className="text-[14px] text-hero-text/80">
              {fmtLong(o.date)}
              {o.endDate && o.endDate !== o.date
                ? ` — until ${fmtLong(o.endDate)}`
                : ""}
            </span>
            {o.tithiLabel && (
              <span className="text-[13px] text-eyebrow-dark">
                {o.tithiLabel}
              </span>
            )}
            {o.seriesPosition && (
              <span className="text-[12px] text-hero-text/55">
                {o.seriesPosition}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-4 md:px-10">
        {/* Timing tiles */}
        <section className="mt-7">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {tiles.map((t) => (
              <div
                key={t.key}
                className="rounded-[13px] border border-data-bd bg-data-bg px-4 py-[14px]"
              >
                <p className="mb-1 text-[9.5px] font-bold tracking-[0.9px] text-data-fg/60 uppercase">
                  {t.key}
                </p>
                <p className="text-[14.5px] leading-snug font-bold text-data-fg">
                  {t.value}
                </p>
                {t.sub && (
                  <p className="mt-[2px] text-[11px] text-data-fg/70">{t.sub}</p>
                )}
              </div>
            ))}
          </div>
          <SourceStrip className="mt-2" />
        </section>

        {/* Blurb */}
        {o.blurb && (
          <section className="mt-7 max-w-[720px]">
            <p className="text-[15px] leading-[1.8] text-body">{o.blurb}</p>
          </section>
        )}

        {/* WHEN vs HOW cross-link */}
        <section className="mt-7 max-w-[720px]">
          {o.articleSlug ? (
            <div className="flex flex-col items-start gap-4 rounded-[15px] border border-border bg-card p-6 md:flex-row md:items-center">
              <div className="flex-1">
                <p className="mb-1 text-[10px] font-bold tracking-[0.8px] text-gold uppercase">
                  This page answers when
                </p>
                <p className="text-[15px] font-bold text-ink">
                  For <em>how</em> — the vidhi, samagri and katha — read the
                  full guide
                </p>
                <p className="mt-1 text-[12.5px] text-sub">
                  Timing data carries no tag and no score. The ritual itself is
                  classified step by step in the guide.
                </p>
              </div>
              <Link
                href={guideHref(o.articleSlug)}
                className="shrink-0 rounded-[9px] bg-cta px-4 py-2 text-[12.5px] font-bold text-white"
              >
                Read the {o.name} guide →
              </Link>
            </div>
          ) : (
            <div className="rounded-[15px] border border-border bg-card p-6">
              <p className="mb-1 text-[10px] font-bold tracking-[0.8px] text-gold uppercase">
                This page answers when
              </p>
              <p className="text-[13px] leading-relaxed text-sub">
                The full how-to guide for {o.name} — vidhi, samagri, katha —
                is being written and will be linked here when it is live.
              </p>
            </div>
          )}
        </section>

        {/* Recurrence rail */}
        {o.series && mates.length > 0 && (
          <section className="mt-10">
            <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-border pb-2">
              <h2 className="text-[17px] font-bold text-ink">
                Other {o.series} dates this year
              </h2>
              <span className="text-[11.5px] text-sub">
                {mates.length} more
              </span>
            </div>
            <ObservanceTable>
              {mates.map((u) => (
                <ObservanceRow
                  key={`${u.observance.slug}-${u.observance.date}`}
                  item={u}
                  now={now}
                />
              ))}
            </ObservanceTable>
          </section>
        )}

        {/* Notes / FAQ */}
        <section className="mt-10 max-w-[720px]">
          <h2 className="mb-3 text-[17px] font-bold text-ink">
            Quick answers
          </h2>
          <dl className="divide-y divide-border-light overflow-hidden rounded-[15px] border border-border bg-card">
            <div className="px-5 py-4">
              <dt className="text-[13.5px] font-bold text-ink">
                When is {o.name} in {o.date.slice(0, 4)}?
              </dt>
              <dd className="mt-1 text-[13px] leading-relaxed text-sub">
                {fmtLong(o.date)}
                {o.endDate && o.endDate !== o.date
                  ? `, running until ${fmtLong(o.endDate)}`
                  : ""}
                , calculated for Delhi-NCR (IST).
                {o.verified
                  ? ""
                  : " This date is provisional and will be confirmed after verification."}
              </dd>
            </div>
            {o.tithiLabel && (
              <div className="px-5 py-4">
                <dt className="text-[13.5px] font-bold text-ink">
                  Which tithi does it follow?
                </dt>
                <dd className="mt-1 text-[13px] leading-relaxed text-sub">
                  {o.tithiLabel}. The Gregorian date shifts each year because
                  the observance follows the lunar day, not the calendar month.
                </dd>
              </div>
            )}
            <div className="px-5 py-4">
              <dt className="text-[13.5px] font-bold text-ink">
                Is this date the same in every city?
              </dt>
              <dd className="mt-1 text-[13px] leading-relaxed text-sub">
                Not always. A tithi that starts before sunrise in one city may
                start after it in another, moving the observed date by a day.
                These timings are computed for Delhi-NCR; more cities are
                coming.
              </dd>
            </div>
            {o.notes?.map((n) => (
              <div key={n} className="px-5 py-4">
                <dd className="text-[13px] leading-relaxed text-sub">☾ {n}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </main>
  );
}

function weekdaySub(date: string, endDate?: string): string {
  const start = fmtLong(date).split(",")[0];
  if (!endDate || endDate === date) return start;
  return `${start} onwards`;
}
