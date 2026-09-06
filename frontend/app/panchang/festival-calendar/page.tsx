import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CategoryHero } from "@/components/CategoryHero";
import { CountdownPill } from "@/components/CountdownPill";
import {
  SourceStrip,
  TimingDataTag,
  VerifyingPanel,
} from "@/components/panchang/DataMeta";
import { TypeBadge, TypeLegend } from "@/components/panchang/TypeBadge";
import { fetchFestivals } from "@/lib/api";
import {
  CITY_LABEL,
  fmtRange,
  fmtShort,
  guideHref,
  safeFetch,
  todayIst,
  weekday,
} from "@/lib/panchangExtras";
import type { UpcomingObservance } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Festival Calendar 2026 — Season by Season | Tapa",
  description:
    "Every festival of 2026 grouped by season, with Gregorian dates first and the tithi beneath — calculated for Delhi-NCR (IST).",
};

/** Sort chronologically, then group consecutive runs of the same season. */
function groupBySeason(
  items: UpcomingObservance[],
): { season: string; items: UpcomingObservance[] }[] {
  const sorted = items
    .slice()
    .sort((a, b) => a.observance.date.localeCompare(b.observance.date));
  const groups: { season: string; items: UpcomingObservance[] }[] = [];
  for (const u of sorted) {
    const season = u.observance.seasonBlock ?? "Through the year";
    const last = groups[groups.length - 1];
    if (last && last.season === season) last.items.push(u);
    else groups.push({ season, items: [u] });
  }
  return groups;
}

function FestivalCard({ item, now }: { item: UpcomingObservance; now: string }) {
  const o = item.observance;
  const multiDay = Boolean(o.endDate && o.endDate !== o.date);
  return (
    <div className="flex overflow-hidden rounded-[15px] border border-border bg-card">
      <div className="hero-pa flex w-[76px] shrink-0 flex-col items-center justify-center px-2 py-4 text-center">
        <span className="text-[21px] leading-none font-bold text-hero-text">
          {fmtShort(o.date).split(" ")[0]}
        </span>
        <span className="mt-[3px] text-[9.5px] font-bold tracking-[1px] text-eyebrow-dark uppercase">
          {fmtShort(o.date).split(" ")[1]}
        </span>
        <span className="mt-1 text-[9.5px] text-hero-text/55">
          {weekday(o.date).slice(0, 3)}
        </span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/panchang/o/${o.slug}`}
            className="text-[14.5px] font-bold text-ink hover:text-cta"
          >
            {o.name}
          </Link>
          <TypeBadge type={o.type} />
        </div>
        <p className="mt-[3px] text-[11.5px] text-data-fg">
          {multiDay ? fmtRange(o.date, o.endDate) : fmtRange(o.date)}
          {o.tithiLabel ? ` · ${o.tithiLabel}` : ""}
          {!o.verified ? " · provisional" : ""}
        </p>
        <div className="mt-auto flex items-center gap-3 pt-2">
          <CountdownPill date={o.date} now={now} />
          {o.articleSlug ? (
            <Link
              href={guideHref(o.articleSlug)}
              className="text-[11.5px] font-bold text-cta"
            >
              View guide →
            </Link>
          ) : (
            <span className="text-[11px] text-sub">Guide soon</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function FestivalCalendarPage() {
  const now = todayIst();
  const festivals = await safeFetch(fetchFestivals());
  const groups = festivals ? groupBySeason(festivals) : [];

  return (
    <main className="pb-16">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Panchang", href: "/panchang" },
          { label: "Festival Calendar" },
        ]}
      />

      <CategoryHero
        variant="pa"
        eyebrow="Panchang · Calendar"
        title="Festival Calendar 2026"
        description="For anyone who plans in months rather than tithis. Gregorian dates first, with the tithi beneath — so you can book leave and still know which lunar day you are actually observing."
        meta={[
          {
            value: festivals ? String(festivals.length) : "—",
            label: "festival dates",
          },
          { value: CITY_LABEL, label: "IST timings" },
          { value: "Drik Panchang", label: "source" },
        ]}
        side={
          <div>
            <p className="mb-2 text-[10px] font-bold tracking-[1px] text-eyebrow-dark uppercase">
              Grouped by season
            </p>
            <p className="text-[12.5px] leading-relaxed text-hero-text/75">
              The festival year moves in blocks — Sawan into the Bhadrapada
              festivals, Pitru Paksha into Navratri and Deepavali. Each block
              below is one stretch of the year, in order.
            </p>
          </div>
        }
      />

      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 md:px-10">
          <TimingDataTag />
          <SourceStrip className="ml-auto" />
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-4 pt-6 md:px-10">
        {groups.length > 0 ? (
          <>
            <TypeLegend />
            {groups.map((g) => (
              <section key={g.season} className="mt-8">
                <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-border pb-2">
                  <h2 className="text-[17px] font-bold tracking-[-0.2px] text-ink">
                    {g.season}
                  </h2>
                  <span className="text-[11.5px] text-sub">
                    {g.items.length} date{g.items.length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {g.items.map((u) => (
                    <FestivalCard
                      key={`${u.observance.slug}-${u.observance.date}`}
                      item={u}
                      now={now}
                    />
                  ))}
                </div>
              </section>
            ))}
          </>
        ) : (
          <VerifyingPanel
            title="The festival calendar is being verified"
            note="Festival dates are entered and checked by hand before they appear here. Check back shortly."
          />
        )}
      </div>
    </main>
  );
}
