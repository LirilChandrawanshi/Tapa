import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CategoryHero } from "@/components/CategoryHero";
import { VerifyingPanel } from "@/components/panchang/DataMeta";
import {
  PdfDownloadLink,
  StickyDownloadBar,
} from "@/components/panchang/PanchangControls";
import { PanchangSubnav } from "@/components/panchang/PanchangSubnav";
import { VratList } from "@/components/panchang/VratList";
import { fetchCalendarMonth } from "@/lib/api";
import {
  CITY_LABEL,
  fetchCalendarYear,
  matchesVratFilter,
  todayIst,
} from "@/lib/panchangExtras";

export const revalidate = 900; // ISR — purged via the `panchang` tag

export const metadata: Metadata = {
  title: "Vrat Calendar — Every Ekadashi, Pradosh, Purnima & Amavasya | Tapa",
  description:
    "Every vrat date of the year with the tithi each one follows — Ekadashi, Pradosh, Chaturthi, Purnima and Amavasya, calculated for Delhi-NCR (IST).",
};

/** The three "why your city matters" assurances from the spec's learn band. */
const CITY_POINTS = [
  {
    title: "Set your city once",
    note: "Every date on the platform recomputes",
  },
  {
    title: "Purnimanta or Amanta",
    note: "North India uses Purnimanta — the default here",
  },
  {
    title: "Verified manually",
    note: "Entered and checked, never auto-fetched",
  },
] as const;

export default async function VratCalendarPage() {
  const now = todayIst();
  const year = now.slice(0, 4);
  const items = await fetchCalendarYear(year, fetchCalendarMonth);

  const vrats = items.filter(
    (u) =>
      u.observance.type === "VRAT" || u.observance.type === "PURNIMA_AMAVASYA",
  );
  const ekadashis = items.filter((u) =>
    matchesVratFilter(u.observance, "ekadashi"),
  ).length;
  const pradosh = items.filter((u) =>
    matchesVratFilter(u.observance, "pradosh"),
  ).length;

  return (
    <main className="pb-16">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Panchang", href: "/panchang" },
          { label: `${year} Vrat Calendar` },
        ]}
      />

      <CategoryHero
        variant="pa"
        eyebrow="Panchang · Calendar"
        title={`${year} Vrat Calendar`}
        description="Every Ekadashi, Pradosh, Chaturthi, Purnima and Amavasya of the year — with the tithi each one follows, so you can check any of it against your own panchang."
        meta={[
          vrats.length > 0
            ? { value: String(vrats.length), label: "dates" }
            : { value: CITY_LABEL, label: "IST timings" },
          ekadashis > 0
            ? { value: String(ekadashis), label: "Ekadashis" }
            : { value: "Purnimanta", label: "month reckoning" },
          pradosh > 0
            ? { value: String(pradosh), label: "Pradosh vrats" }
            : { value: "Drik Panchang", label: "source" },
        ]}
        side={
          <div>
            <p className="mb-2 text-[10px] font-bold tracking-[1px] text-eyebrow-dark uppercase">
              Why your city matters
            </p>
            <p className="text-[12.5px] leading-relaxed text-hero-text/75">
              A tithi begins at a fixed moment — but the Hindu day begins at
              sunrise, and sunrise is not the same everywhere. Two apps can
              show different dates, and both can be right. Every date here is
              computed for {CITY_LABEL}.
            </p>
          </div>
        }
      />

      <PanchangSubnav active="vrat" />

      {items.length > 0 ? (
        <VratList items={items} now={now} year={year} />
      ) : (
        <div className="mx-auto max-w-[1280px] px-4 pt-8 md:px-10">
          <VerifyingPanel
            title="The vrat calendar is being verified"
            note="Dates are entered and checked by hand before they appear here — never auto-fetched. Check back shortly."
          />
        </div>
      )}

      <div className="mx-auto max-w-[1280px] px-4 md:px-10">
        {/* "Why your city matters" learn band */}
        <section className="mt-10 grid gap-4 rounded-[15px] border border-border bg-card p-6 md:grid-cols-[1.1fr_0.9fr] md:gap-8">
          <div>
            <p className="mb-1 text-[10px] font-bold tracking-[0.8px] text-gold uppercase">
              Why your city matters
            </p>
            <h2 className="text-[17px] leading-snug font-bold text-ink">
              Two apps can show different dates, and both can be right
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-sub">
              A tithi begins at a fixed moment in time — but the Hindu day
              begins at sunrise, and sunrise is not the same everywhere. A
              tithi that starts before sunrise in Delhi may start after it in
              Mumbai, moving the date by a day.
            </p>
            <Link
              href="/panchang/tithi-paksha"
              className="mt-3 inline-block text-[12.5px] font-bold text-cta"
            >
              Read the full explanation ›
            </Link>
          </div>
          <ul className="flex flex-col gap-3">
            {CITY_POINTS.map((p) => (
              <li key={p.title} className="flex gap-[10px]">
                <span
                  aria-hidden
                  className="flex size-6 shrink-0 items-center justify-center rounded-full border border-data-bd bg-data-bg text-[11px] font-bold text-data-fg"
                >
                  ✓
                </span>
                <span>
                  <span className="block text-[13px] leading-tight font-bold text-ink">
                    {p.title}
                  </span>
                  <span className="mt-[2px] block text-[11.5px] leading-relaxed text-sub">
                    {p.note}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Download band */}
        <div className="hero-pa mt-6 flex flex-col items-start justify-between gap-4 rounded-[15px] p-6 md:flex-row md:items-center">
          <div>
            <p className="mb-1 text-[10px] font-bold tracking-[0.8px] text-eyebrow-dark uppercase">
              📿 All the year&rsquo;s dates, on one page
            </p>
            <p className="text-[16px] font-bold text-hero-text">
              {vrats.length > 0
                ? `All ${vrats.length} dates, on one page`
                : `Download the full ${year} calendar`}
            </p>
            <p className="mt-1 text-[12.5px] text-hero-text/65">
              The complete {year} vrat calendar as a PDF — computed for your
              city, ready to print or forward.
            </p>
          </div>
          <PdfDownloadLink
            surface="vrat-calendar-band"
            className="shrink-0 rounded-[9px] bg-cta px-4 py-2 text-[12.5px] font-bold text-white"
          >
            Download PDF ›
          </PdfDownloadLink>
        </div>
      </div>

      {/* Sticky mini download bar (#84) */}
      <StickyDownloadBar />
    </main>
  );
}
