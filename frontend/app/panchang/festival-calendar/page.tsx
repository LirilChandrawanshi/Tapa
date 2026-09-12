import type { Metadata } from "next";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CategoryHero } from "@/components/CategoryHero";
import { VerifyingPanel } from "@/components/panchang/DataMeta";
import { FestivalGrid } from "@/components/panchang/FestivalGrid";
import {
  PdfDownloadLink,
  StickyDownloadBar,
} from "@/components/panchang/PanchangControls";
import { PanchangSubnav } from "@/components/panchang/PanchangSubnav";
import { fetchCalendarMonth, fetchFestivals } from "@/lib/api";
import {
  CITY_LABEL,
  fetchCalendarYear,
  mergeObservances,
  safeFetch,
  todayIst,
} from "@/lib/panchangExtras";

export const revalidate = 900; // ISR — purged via the `panchang` tag

export const metadata: Metadata = {
  title: "Festival Calendar — Month by Month | Tapa",
  description:
    "Every festival of the year month by month, with Gregorian dates first and the tithi beneath — calculated for Delhi-NCR (IST).",
};

export default async function FestivalCalendarPage() {
  const now = todayIst();
  const year = now.slice(0, 4);

  // /festivals is the curated list; the year calendar backfills anything it
  // misses. Merging is idempotent (slug+date keyed), so overlap is harmless.
  const [curated, yearItems] = await Promise.all([
    safeFetch(fetchFestivals()),
    fetchCalendarYear(year, fetchCalendarMonth),
  ]);
  const festivals = mergeObservances(
    curated,
    yearItems.filter(
      (u) =>
        u.observance.type === "FESTIVAL" ||
        u.observance.type === "SPECIAL_SEASONAL",
    ),
  ).filter((u) => u.observance.date.startsWith(year));

  const withGuide = festivals.filter((u) => u.observance.articleSlug).length;
  const coming = festivals.length - withGuide;

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
        title={`Festival Calendar ${year}`}
        description="For anyone who plans in months rather than tithis. Gregorian dates first, with the tithi beneath — so you can book leave and still know which lunar day you are actually observing."
        meta={[
          {
            value: festivals.length > 0 ? String(festivals.length) : "—",
            label: "festivals",
          },
          withGuide > 0
            ? { value: String(withGuide), label: "with a full guide" }
            : { value: CITY_LABEL, label: "IST timings" },
          coming > 0
            ? { value: String(coming), label: "guides coming" }
            : { value: "Drik Panchang", label: "source" },
        ]}
        side={
          <div>
            <p className="mb-2 text-[10px] font-bold tracking-[1px] text-eyebrow-dark uppercase">
              Month by month
            </p>
            <p className="text-[12.5px] leading-relaxed text-hero-text/75">
              Pick a month above the grid and every festival in it appears
              with its Gregorian date first and the tithi beneath. Dates are
              computed for {CITY_LABEL} — change your city and they recompute.
            </p>
          </div>
        }
      />

      <PanchangSubnav active="festival" />

      {festivals.length > 0 ? (
        <FestivalGrid items={festivals} now={now} year={year} />
      ) : (
        <div className="mx-auto max-w-[1280px] px-4 pt-8 md:px-10">
          <VerifyingPanel
            title="The festival calendar is being verified"
            note="Festival dates are entered and checked by hand before they appear here. Check back shortly."
          />
        </div>
      )}

      <div className="mx-auto max-w-[1280px] px-4 md:px-10">
        <div className="hero-pa mt-10 flex flex-col items-start justify-between gap-4 rounded-[15px] p-6 md:flex-row md:items-center">
          <div>
            <p className="mb-1 text-[10px] font-bold tracking-[0.8px] text-eyebrow-dark uppercase">
              🎆 The whole year, month by month
            </p>
            <p className="text-[16px] font-bold text-hero-text">
              Every festival date for {year}
            </p>
            <p className="mt-1 text-[12.5px] text-hero-text/65">
              As a PDF — Gregorian dates with the tithi beneath each one.
            </p>
          </div>
          <PdfDownloadLink
            surface="festival-calendar-band"
            className="shrink-0 rounded-[9px] bg-cta px-4 py-2 text-[12.5px] font-bold text-white"
          >
            Download PDF ›
          </PdfDownloadLink>
        </div>
      </div>

      <StickyDownloadBar />
    </main>
  );
}
