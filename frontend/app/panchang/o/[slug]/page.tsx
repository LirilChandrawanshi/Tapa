import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CountdownPill } from "@/components/CountdownPill";
import {
  NoTagNote,
  SourceStripBlock,
  TimingDataTag,
  VerifyingPanel,
} from "@/components/panchang/DataMeta";
import { ConventionToggle } from "@/components/panchang/ConventionToggle";
import {
  ControlBar,
  ControlSep,
  ConventionWarnPill,
} from "@/components/panchang/ControlBar";
import { CrumbActions } from "@/components/panchang/CrumbActions";
import {
  DayByDayTable,
  type FestivalDay,
  MuhuratWindows,
  PanchangVariance,
  UnusualBand,
  detectAnomalies,
} from "@/components/panchang/FestivalDetail";
import { JumpChips, type JumpTarget } from "@/components/panchang/JumpChips";
import { OccurrenceStrip } from "@/components/panchang/OccurrenceStrip";
import { CitySelect } from "@/components/panchang/PanchangControls";
import { PanchangShell } from "@/components/panchang/PanchangShell";
import { PanchangSubnav } from "@/components/panchang/PanchangSubnav";
import { RelatedGrid } from "@/components/panchang/RelatedGrid";
import { RemindButton } from "@/components/panchang/RemindButton";
import { RevenueBand } from "@/components/panchang/RevenueBand";
import {
  AtAGlance,
  IntelligenceCard,
  SidebarCta,
} from "@/components/panchang/SidebarCards";
import {
  StickyActionBar,
  StickyLabel,
} from "@/components/panchang/StickyActionBar";
import { TypeBadge } from "@/components/panchang/TypeBadge";
import {
  ComputedTable,
  FastTimeline,
  ParanaHero,
  type TimelineStop,
  VratTimingTiles,
} from "@/components/panchang/VratDetail";
import {
  ApiError,
  fetchEkadashi,
  fetchFestival,
  fetchPanchangDate,
  fetchUpcoming,
} from "@/lib/api";
import { getFlags } from "@/lib/flags";
import { mediaUrl } from "@/lib/media";
import {
  CALENDAR_PDF_HREF,
  CITY_LABEL,
  addDays,
  findParana,
  fmtAt,
  fmtLong,
  fmtRange,
  fmtShort,
  guideHref,
  obsX,
  safeFetch,
  todayIst,
} from "@/lib/panchangExtras";
import type { DayPayload, Observance, UpcomingObservance } from "@/lib/types";

export const revalidate = 900; // ISR — purged via the `panchang` tag

/** No build-time enumeration — the backend may be down during `next build`. */
export function generateStaticParams(): { slug: string }[] {
  return [];
}

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await safeFetch(fetchFestival(slug));
  if (!data) return { title: "Observance | Tapa Panchang" };
  const o = data.observance;
  return {
    title: `${o.name} ${o.date.slice(0, 4)} — Date, Tithi & Timing | Tapa Panchang`,
    description:
      o.blurb ??
      `${o.name} falls on ${fmtLong(o.date)}${o.tithiLabel ? ` (${o.tithiLabel})` : ""} — calculated for Delhi-NCR (IST).`,
  };
}

/** Series rail: every date of the same series this year, current included. */
async function fetchSeriesMates(series: string): Promise<UpcomingObservance[]> {
  const isEkadashi = series.toLowerCase().includes("ekadashi");
  const list = await safeFetch(isEkadashi ? fetchEkadashi() : fetchUpcoming(60));
  return (list ?? [])
    .filter((u) => u.observance.series === series)
    .sort((a, b) => a.observance.date.localeCompare(b.observance.date));
}

/** date → endDate inclusive, capped at 10 civil days. */
function festivalDates(o: Observance): string[] {
  const out: string[] = [];
  let d = o.date;
  const end = o.endDate && o.endDate > o.date ? o.endDate : o.date;
  while (d <= end && out.length < 10) {
    out.push(d);
    d = addDays(d, 1);
  }
  return out;
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
              Open the vrat calendar ›
            </Link>
          </p>
        </div>
      </main>
    );
  }

  const o = data.observance;
  const x = obsX(o);
  const year = o.date.slice(0, 4);
  const flags = await getFlags();

  const isMultiDay = Boolean(o.endDate && o.endDate !== o.date);
  const isFestivalTemplate =
    isMultiDay && (o.type === "FESTIVAL" || o.type === "SPECIAL_SEASONAL");
  const isVratTemplate =
    !isFestivalTemplate &&
    (o.type === "VRAT" || o.type === "PURNIMA_AMAVASYA");
  const isEkadashi = /ekadashi/i.test(`${o.series ?? ""} ${o.name}`);
  const isNavratri = /navratri/i.test(`${o.slug} ${o.name}`);

  // ── Vrat template data: this day + the parana day ──
  let vratDay: DayPayload | null = null;
  let paranaDay: DayPayload | null = null;
  if (isVratTemplate) {
    [vratDay, paranaDay] = await Promise.all([
      safeFetch(fetchPanchangDate(o.date)),
      safeFetch(fetchPanchangDate(addDays(o.date, 1))),
    ]);
  }
  const parana = isVratTemplate
    ? findParana(vratDay?.day, paranaDay?.day, o.date)
    : null;

  // ── Festival template data: one payload per civil day (cap 10) ──
  let festDays: FestivalDay[] = [];
  if (isFestivalTemplate) {
    const dates = festivalDates(o);
    const payloads = await Promise.all(
      dates.map((d) => safeFetch(fetchPanchangDate(d))),
    );
    festDays = dates.map((date, i) => ({
      date,
      day: payloads[i]?.day ?? null,
    }));
  }
  const anomalies = detectAnomalies(festDays);
  const merge = anomalies.find((a) => a.kind === "merge");

  const mates = o.series ? await fetchSeriesMates(o.series) : [];

  // ── Fast timeline (vrat template) ──
  const paranaDate = parana?.date ?? addDays(o.date, 1);
  const sunrise = vratDay?.day?.sunrise ?? null;
  const dwadashiEnds = paranaDay?.day?.tithi?.endsAt ?? null;
  const timelineStops: TimelineStop[] = [
    {
      label: "Sankalp & sunrise",
      time: `${fmtShort(o.date)}${sunrise ? ` · ${sunrise}` : ""}`,
      note: "A simple resolve. The fast begins here.",
      tone: "start",
    },
    {
      label: "The fast",
      time: "Through the day and night",
      note: isEkadashi
        ? "No grains · fruit, milk and water permitted"
        : "Kept in the form your family follows",
      tone: "start",
    },
    {
      label: "Tithi ends",
      time: fmtAt(x.tithiEndsAt) ?? "—",
      note: "The fast continues past this point — it ends at parana, not at the tithi.",
      tone: "boundary",
    },
    {
      label: "Parana opens",
      time: parana
        ? `${fmtShort(parana.date)} · ${parana.from}`
        : `${fmtShort(paranaDate)} · sunrise`,
      tone: "parana",
    },
    {
      label: "Window closes",
      time: parana ? `${parana.to}` : isEkadashi ? "Dwadashi ends" : "—",
      note: "Break the fast before this.",
      tone: "parana",
    },
  ];
  let activeStop: number | null = null;
  if (now === o.date) activeStop = 1;
  else if (now > o.date && now <= paranaDate) activeStop = 3;

  // The four boundary rows inside the spec's parana card.
  const paranaRows = [
    {
      key: "Fast begins",
      value: `Sunrise, ${fmtShort(o.date)}${sunrise ? ` · ${sunrise}` : ""}`,
    },
    { key: "Tithi begins", value: fmtAt(x.tithiStartsAt) ?? "—" },
    { key: "Tithi ends", value: fmtAt(x.tithiEndsAt) ?? "—" },
    {
      key: isEkadashi ? "Dwadashi ends" : "Next tithi ends",
      value: dwadashiEnds
        ? (fmtAt(dwadashiEnds) ?? "—")
        : parana
          ? `${fmtShort(parana.date)} · ${parana.to}`
          : "—",
    },
  ];

  const genericTiles: { key: string; value: string; sub?: string }[] = [
    {
      key: "Date",
      value: fmtRange(o.date, o.endDate),
      sub: weekdaySub(o.date, o.endDate),
    },
    { key: "Tithi", value: o.tithiLabel ?? "—" },
    { key: "Deity", value: o.deity ?? "—" },
    { key: "Season", value: o.seasonBlock ?? "—" },
  ];

  const kindWord = isFestivalTemplate ? "festival" : "vrat";

  const jump: JumpTarget[] = [
    ...(isVratTemplate && parana
      ? [{ id: "parana", label: "◷ Parana window" }]
      : []),
    ...(isVratTemplate ? [{ id: "timeline", label: "The fast, end to end" }] : []),
    ...(isFestivalTemplate && festDays.length > 0
      ? [{ id: "days", label: "🗓 Day by day" }]
      : []),
    ...(isFestivalTemplate ? [{ id: "muhurat", label: "Muhurat" }] : []),
    ...(anomalies.length > 0
      ? [{ id: "unusual", label: `What's unusual in ${year}` }]
      : []),
    ...(merge ? [{ id: "variance", label: "Where panchangs disagree" }] : []),
    { id: "computed", label: "The full panchang" },
    { id: "answers", label: "Quick answers" },
  ];

  const hero = o.heroImageId ? mediaUrl(o.heroImageId) : null;

  return (
    <main className="pb-16">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Panchang", href: "/panchang" },
          isFestivalTemplate
            ? { label: "Festival Calendar", href: "/panchang/festival-calendar" }
            : { label: "Vrat Calendar", href: "/panchang/vrat-calendar" },
          { label: `${o.name} — ${fmtShort(o.date)}` },
        ]}
        actions={
          <CrumbActions title={o.name} articleSlug={o.articleSlug} />
        }
      />

      {/* Hero — the observance's own image when it has one, gradient otherwise */}
      <section className="hero-pa relative overflow-hidden py-8 md:py-11">
        {hero && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hero}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover opacity-40"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-r from-[#0c1a26]/95 via-[#0c1a26]/80 to-transparent"
            />
          </>
        )}
        <div className="relative mx-auto grid max-w-[1280px] items-center gap-6 px-4 md:px-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
          <div>
            <p className="mb-[10px] text-[10px] tracking-[1px] text-eyebrow-dark uppercase">
              Panchang · {isFestivalTemplate ? "Festival" : "Vrat date"}
            </p>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <TimingDataTag />
              <TypeBadge type={o.type} />
              <CountdownPill date={o.date} now={now} />
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
            <p className="mt-3 text-[15px] font-medium text-hero-text/85">
              {fmtLong(o.date)}
              {o.endDate && o.endDate !== o.date
                ? ` — until ${fmtLong(o.endDate)}`
                : ""}
            </p>
            <p className="mt-1 text-[12.5px] text-eyebrow-dark">
              {[o.tithiLabel, "Purnimanta", `computed for ${CITY_LABEL}`]
                .filter(Boolean)
                .join(" · ")}
              {o.seriesPosition ? ` · ${o.seriesPosition}` : ""}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <RemindButton observanceSlug={o.slug} name={o.name} />
              {o.articleSlug && (
                <Link
                  href={guideHref(o.articleSlug)}
                  className="flex items-center gap-[6px] rounded-[9px] border-[1.5px] border-white/25 bg-white/10 px-[14px] py-[8px] text-[12.5px] font-bold text-hero-text hover:border-white/50"
                >
                  <span aria-hidden>📖</span> How to observe this {kindWord}
                </Link>
              )}
            </div>
          </div>

          {/* Parana card sits in the hero on a vrat, as in the spec */}
          {isVratTemplate && parana && (
            <div className="rounded-2xl border border-white/[0.14] bg-white/[0.07] px-[22px] py-5">
              <p className="text-[10px] font-bold tracking-[1px] text-eyebrow-dark uppercase">
                ◷ When you can break the fast
              </p>
              <p className="mt-2 text-[10px] font-bold tracking-[0.8px] text-hero-text/55 uppercase">
                Parana window · {fmtShort(parana.date)}
              </p>
              <p className="mt-1 text-[24px] leading-none font-bold text-hero-text">
                {parana.from} – {parana.to}
              </p>
              <dl className="mt-4">
                {paranaRows.map((r) => (
                  <div
                    key={r.key}
                    className="flex items-baseline justify-between gap-3 border-t border-white/10 py-[7px]"
                  >
                    <dt className="text-[9.5px] font-bold tracking-[0.8px] text-hero-text/45 uppercase">
                      {r.key}
                    </dt>
                    <dd className="text-right text-[11.5px] font-medium text-hero-text/90">
                      {r.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </section>

      <PanchangSubnav active={isFestivalTemplate ? "festival" : "vrat"} />

      <ControlBar>
        <CitySelect />
        <ControlSep />
        <ConventionToggle />
        {isEkadashi && (
          <ConventionWarnPill>
            Ekadashi dates differ by convention — Vaishnava observers may fast
            on {fmtShort(addDays(o.date, 1))}
          </ConventionWarnPill>
        )}
      </ControlBar>

      <JumpChips targets={jump} surface="observance" />

      <div className="pt-7">
        <PanchangShell
          sidebar={
            <ObservanceSidebar
              observance={o}
              isVrat={isVratTemplate}
              isEkadashi={isEkadashi}
              parana={parana}
              year={year}
            />
          }
        >
          <SourceStripBlock />

          {/* ── VRAT template ─────────────────────────────────────────── */}
          {isVratTemplate && (
            <>
              {parana && (
                <section id="parana" className="mt-7 scroll-mt-[170px]">
                  <ParanaHero parana={parana} rows={paranaRows} />
                </section>
              )}

              <section className="mt-7">
                <VratTimingTiles
                  observance={o}
                  day={vratDay?.day ?? null}
                  parana={parana}
                />
              </section>

              <section id="timeline" className="mt-8 scroll-mt-[170px]">
                <div className="mb-3">
                  <p className="text-[10px] font-bold tracking-[0.8px] text-gold uppercase">
                    The fast, end to end
                  </p>
                  <h2 className="text-[17px] font-bold text-ink">
                    From sankalp to parana
                  </h2>
                  <p className="mt-1 text-[12.5px] text-sub">
                    The part most people get wrong is the end, not the
                    beginning.
                  </p>
                </div>
                <FastTimeline stops={timelineStops} activeIndex={activeStop} />
              </section>

              <section id="computed" className="mt-8 scroll-mt-[170px]">
                <h2 className="mb-3 text-[17px] font-bold text-ink">
                  The full panchang for {fmtLong(o.date)}
                </h2>
                <ComputedTable
                  observance={o}
                  day={vratDay?.day ?? null}
                  parana={parana}
                />
              </section>
            </>
          )}

          {/* ── FESTIVAL (multi-day) template ─────────────────────────── */}
          {isFestivalTemplate && (
            <>
              <section id="computed" className="mt-7 scroll-mt-[170px]">
                <TileGrid tiles={genericTiles} />
              </section>

              {festDays.length > 0 && (
                <section id="days" className="mt-8 scroll-mt-[170px]">
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="text-[17px] font-bold text-ink">
                      Day by day — {fmtRange(o.date, o.endDate)}
                    </h2>
                    <span className="text-[11.5px] text-sub">
                      {festDays.length} day{festDays.length === 1 ? "" : "s"}
                      {o.endDate &&
                      festDays.length === 10 &&
                      addDays(o.date, 9) < o.endDate
                        ? " shown"
                        : ""}
                    </span>
                  </div>
                  {isNavratri && (
                    <p className="mb-3 text-[11.5px] text-sub italic">
                      Colours and offerings are practitioner custom, not
                      scripture. They vary by year and by source.
                    </p>
                  )}
                  <DayByDayTable days={festDays} isNavratri={isNavratri} />
                </section>
              )}

              <section id="muhurat" className="mt-8 scroll-mt-[170px]">
                <h2 className="mb-3 text-[17px] font-bold text-ink">
                  Muhurat windows — day one
                </h2>
                <MuhuratWindows day1={festDays[0]?.day ?? null} />
                {!festDays[0]?.day?.muhurats?.length &&
                  !festDays[0]?.day?.abhijitMuhurat && (
                    <p className="text-[12.5px] text-sub">
                      Day-one muhurat windows are being verified and will
                      appear here.
                    </p>
                  )}
              </section>

              {anomalies.length > 0 && (
                <section id="unusual" className="mt-8 scroll-mt-[170px]">
                  <UnusualBand anomalies={anomalies} />
                </section>
              )}

              {merge && (
                <section id="variance" className="mt-8 scroll-mt-[170px]">
                  <PanchangVariance
                    lead={`Because ${merge.tithi} and ${merge.into} fall on the same civil day, panchangs differ on which date the observance is kept.`}
                    sources={[
                      {
                        name: "Drik Panchang",
                        position: `Lists both on ${fmtShort(merge.dates[0])}, the date the tithis actually meet.`,
                      },
                      {
                        name: "Others, including Prokerala",
                        position: `Keep ${merge.tithi} on the preceding day and ${merge.into} on ${fmtShort(merge.dates[0])}.`,
                      },
                    ]}
                  />
                </section>
              )}
            </>
          )}

          {/* ── Generic tiles for everything else ─────────────────────── */}
          {!isVratTemplate && !isFestivalTemplate && (
            <section id="computed" className="mt-7 scroll-mt-[170px]">
              <TileGrid tiles={genericTiles} />
            </section>
          )}

          {o.blurb && (
            <section className="mt-7 max-w-[720px]">
              <p className="text-[15px] leading-[1.8] text-body">{o.blurb}</p>
            </section>
          )}

          {/* WHEN vs HOW handoff */}
          <section className="mt-8">
            {o.articleSlug ? (
              <div className="flex flex-col items-start gap-4 rounded-[15px] border border-border bg-card p-6 md:flex-row md:items-center">
                <span
                  aria-hidden
                  className="flex size-11 shrink-0 items-center justify-center rounded-[12px] border border-border bg-bg text-[20px]"
                >
                  📖
                </span>
                <div className="flex-1">
                  <p className="mb-1 text-[9.5px] font-bold tracking-[0.9px] text-gold uppercase">
                    Ritual guide
                  </p>
                  <p className="text-[15px] font-bold text-ink">
                    How to observe {isEkadashi ? "an Ekadashi vrat" : o.name}
                  </p>
                  <p className="mt-1 text-[12.5px] leading-relaxed text-sub">
                    This page answers <em>when</em>. The vidhi, the samagri,
                    the katha and the corrections live in the guide — and they
                    do not change from one {kindWord} to the next. Timing data
                    carries no tag and no score; the ritual itself is
                    classified step by step there.
                  </p>
                </div>
                <Link
                  href={guideHref(o.articleSlug)}
                  className="shrink-0 rounded-[9px] bg-cta px-4 py-2 text-[12.5px] font-bold text-white"
                >
                  Read the guide ›
                </Link>
              </div>
            ) : (
              <div className="rounded-[15px] border border-border bg-card p-6">
                <p className="mb-1 text-[9.5px] font-bold tracking-[0.9px] text-gold uppercase">
                  This page answers when
                </p>
                <p className="text-[13px] leading-relaxed text-sub">
                  The full how-to guide for {o.name} — vidhi, samagri, katha —
                  is being written and will be linked here when it is live.
                </p>
              </div>
            )}
          </section>

          {/* Quick answers */}
          <section id="answers" className="mt-10 scroll-mt-[170px]">
            <div className="mb-3">
              <p className="text-[10px] font-bold tracking-[0.8px] text-gold uppercase">
                Asked every time
              </p>
              <h2 className="text-[17px] font-bold text-ink">
                Quick answers for this date
              </h2>
            </div>
            <dl className="divide-y divide-border-light overflow-hidden rounded-[15px] border border-border bg-card">
              {quickAnswers({
                observance: o,
                isEkadashi,
                isVrat: isVratTemplate,
                parana: Boolean(parana),
              }).map((qa) => (
                <div key={qa.q} className="px-5 py-4">
                  <dt className="text-[13.5px] font-bold text-ink">
                    <span aria-hidden className="mr-[6px] text-data-fg">
                      ?
                    </span>
                    {qa.q}
                  </dt>
                  <dd className="mt-[5px] text-[13px] leading-relaxed text-sub">
                    {qa.a}
                  </dd>
                </div>
              ))}
              {o.notes?.map((n) => (
                <div key={n} className="px-5 py-4">
                  <dd className="text-[13px] leading-relaxed text-sub">
                    ☾ {n}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Recurrence strip */}
          {o.series && mates.length > 1 && (
            <section className="mt-10">
              <div className="mb-3">
                <p className="text-[10px] font-bold tracking-[0.8px] text-gold uppercase">
                  This {kindWord} recurs
                </p>
                <h2 className="text-[17px] font-bold text-ink">
                  Every {o.series} in {year}
                </h2>
                <p className="mt-1 text-[12.5px] text-sub">
                  {mates.length} dates this year. Each has its own name and
                  its own timings.
                </p>
              </div>
              <OccurrenceStrip
                items={mates}
                current={{ slug: o.slug, date: o.date }}
              />
            </section>
          )}

          {/* Related */}
          <section className="mt-10">
            <h2 className="mb-3 text-[17px] font-bold text-ink">Related</h2>
            <RelatedGrid
              columns={[
                {
                  heading: "Related ritual guides",
                  items: o.articleSlug
                    ? [
                        {
                          label: `${o.name} — the full guide`,
                          note: "Vidhi, samagri, fasting and myths",
                          href: guideHref(o.articleSlug),
                        },
                      ]
                    : [],
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
                      href: CALENDAR_PDF_HREF,
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
              circleBlurb={
                x.circleTeaser ??
                "Festival and vrat reminders on WhatsApp, with the guide attached and the kit cut-off if there is one. ₹499 a year."
              }
              from={`/panchang/o/${o.slug}`}
            />
          </section>
        </PanchangShell>
      </div>

      <StickyActionBar
        secondary={
          o.articleSlug ? (
            <Link
              href={guideHref(o.articleSlug)}
              className="rounded-[9px] border-[1.5px] border-border bg-card px-[14px] py-[7px] text-[12px] font-bold text-body hover:border-cta"
            >
              📖 Guide
            </Link>
          ) : (
            <p className="min-w-0 truncate text-[12.5px] text-mid">
              <b className="text-ink">{o.name}</b>
              <span className="hidden text-sub sm:inline">
                {" "}
                — {fmtLong(o.date)}
              </span>
            </p>
          )
        }
        primary={<RemindButton observanceSlug={o.slug} name={o.name} />}
      />
    </main>
  );
}

/* ── Sidebar ──────────────────────────────────────────────────────────── */

function ObservanceSidebar({
  observance: o,
  isVrat,
  isEkadashi,
  parana,
  year,
}: {
  observance: Observance;
  isVrat: boolean;
  isEkadashi: boolean;
  parana: { date: string; from: string; to: string } | null;
  year: string;
}) {
  const glance = isVrat
    ? [
        { key: "Fast length", value: parana ? "~26 hours" : "One day" },
        { key: "Grains", value: isEkadashi ? "Avoided" : "As your family keeps it" },
        { key: "Water", value: isEkadashi ? "Permitted" : "Permitted" },
        { key: "Nirjala", value: "Optional" },
        { key: "Pandit needed", value: "No" },
        ...(parana
          ? [
              {
                key: "Parana",
                value: `${fmtShort(parana.date)} · ${parana.from}`,
              },
            ]
          : []),
      ]
    : [
        { key: "Date", value: fmtRange(o.date, o.endDate) },
        ...(o.tithiLabel ? [{ key: "Tithi", value: o.tithiLabel }] : []),
        ...(o.deity ? [{ key: "Deity", value: o.deity }] : []),
        ...(o.seasonBlock ? [{ key: "Season", value: o.seasonBlock }] : []),
        { key: "Convention", value: "Purnimanta" },
      ];

  return (
    <>
      <SidebarCta
        icon="🔔"
        title={`Remind me for this ${isVrat ? "vrat" : "festival"}`}
        note={
          parana
            ? "Evening before, and again at parana"
            : "The evening before, with the guide attached"
        }
        href={`/tapa-circle?from=/panchang/o/${o.slug}`}
        tone="pink"
      />

      <AtAGlance heading={`At a glance · ${CITY_LABEL}`} rows={glance} />

      {isEkadashi && (
        <IntelligenceCard
          href={o.articleSlug ? guideHref(o.articleSlug) : "/dharmic-concepts"}
          cta="What counts as a grain? ›"
        >
          Grain avoidance applies on every Ekadashi, not only this one. What
          counts as a grain — and what surprisingly does not — is explained
          once, and applies to all of them.
        </IntelligenceCard>
      )}

      <NoTagNote>
        This is a <b>Panchang page</b>. It carries computed dates and timings,
        so it takes no Dharma/Pratha/Bhranti tag and no Confidence Score. The
        claims about how to observe are tagged and scored — on the ritual
        guide.
      </NoTagNote>

      <SidebarCta
        icon="↓"
        title={`Download the ${year} calendar`}
        note="Every tithi, vrat and festival date"
        href={CALENDAR_PDF_HREF}
        tone="dark"
      />
    </>
  );
}

/* ── Bits ─────────────────────────────────────────────────────────────── */

function TileGrid({
  tiles,
}: {
  tiles: readonly { key: string; value: string; sub?: string }[];
}) {
  return (
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
  );
}

/**
 * The spec's hand-written questions, kept as answers to what people actually
 * ask about a date rather than restatements of the data above. Only the ones
 * that apply to this observance are rendered.
 */
function quickAnswers({
  observance: o,
  isEkadashi,
  isVrat,
  parana,
}: {
  observance: Observance;
  isEkadashi: boolean;
  isVrat: boolean;
  parana: boolean;
}): { q: string; a: React.ReactNode }[] {
  const out: { q: string; a: React.ReactNode }[] = [];

  if (isEkadashi) {
    out.push({
      q: `Do I fast on ${fmtShort(o.date)} or the day after?`,
      a: (
        <>
          <b>{fmtShort(o.date)}</b>, if you follow the Smarta convention —
          which most households without a formal sampradaya affiliation do.
          Vaishnava observers follow a different rule for the same tithi and
          may fast on <b>{fmtShort(addDays(o.date, 1))}</b>. Both are correct
          within their frameworks.
        </>
      ),
    });
  }

  if (parana) {
    out.push({
      q: "What if I wake up after the parana window has closed?",
      a: (
        <>
          Break the fast anyway, as soon as you can. The tradition treats a
          late parana as an imperfect observance, not a void one — and there
          is no penance attached. <b>Set an alarm next time.</b> That is the
          whole remedy.
        </>
      ),
    });
  }

  if (isVrat) {
    out.push({
      q: "Can I drink water during the fast?",
      a: isEkadashi ? (
        <>
          Yes. Nirjala — without water — is one form some observers choose,
          but it is not what the Ekadashi vrat asks for.{" "}
          <b>Fruit, milk and water are permitted</b> in the widely observed
          form. The rule that matters is the grain rule.
        </>
      ) : (
        <>
          In most forms of this vrat, yes. Nirjala — without water — is a
          stricter form some observers choose; it is a choice, not the
          requirement. Follow the form your family keeps.
        </>
      ),
    });
  }

  out.push({
    q: `When is ${o.name} in ${o.date.slice(0, 4)}?`,
    a: (
      <>
        {fmtLong(o.date)}
        {o.endDate && o.endDate !== o.date
          ? `, running until ${fmtLong(o.endDate)}`
          : ""}
        , calculated for {CITY_LABEL} (IST).
        {o.tithiLabel
          ? ` It follows ${o.tithiLabel}, so the Gregorian date shifts each year — the observance tracks the lunar day, not the calendar month.`
          : ""}
        {o.verified
          ? ""
          : " This date is provisional and will be confirmed after verification."}
      </>
    ),
  });

  out.push({
    q: "Why does the date differ between apps?",
    a: (
      <>
        A tithi starts at a fixed moment, but the Hindu day starts at sunrise
        — and sunrise differs by city. A tithi beginning before sunrise in
        Delhi may begin after it in Chennai, moving the date by a day.{" "}
        <b>Set your city above</b> and the page recomputes.
      </>
    ),
  });

  return out;
}

function weekdaySub(date: string, endDate?: string): string {
  const start = fmtLong(date).split(",")[0];
  if (!endDate || endDate === date) return start;
  return `${start} onwards`;
}
