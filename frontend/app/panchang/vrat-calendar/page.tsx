import type { Metadata } from "next";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CategoryHero } from "@/components/CategoryHero";
import {
  SourceStrip,
  TimingDataTag,
  VerifyingPanel,
} from "@/components/panchang/DataMeta";
import { VratList } from "@/components/panchang/VratList";
import { fetchUpcoming } from "@/lib/api";
import {
  CALENDAR_PDF_HREF,
  CITY_LABEL,
  safeFetch,
  todayIst,
} from "@/lib/panchangExtras";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "2026 Vrat Calendar — Every Ekadashi, Teej, Purnima & Amavasya | Tapa",
  description:
    "Every vrat date of 2026 with the tithi each one follows — Ekadashi, Teej, Sawan Somwar, Purnima and Amavasya, calculated for Delhi-NCR (IST).",
};

export default async function VratCalendarPage() {
  const now = todayIst();
  const upcoming = await safeFetch(fetchUpcoming(120));

  return (
    <main className="pb-16">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Panchang", href: "/panchang" },
          { label: "2026 Vrat Calendar" },
        ]}
      />

      <CategoryHero
        variant="pa"
        eyebrow="Panchang · Calendar"
        title="2026 Vrat Calendar"
        description="Every Ekadashi, Teej, Sawan Somwar, Purnima and Amavasya of the year — with the tithi each one follows, so you can check any date against your own panchang."
        meta={[
          { value: CITY_LABEL, label: "IST timings" },
          { value: "Purnimanta", label: "month reckoning" },
          { value: "Drik Panchang", label: "source" },
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

      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 md:px-10">
          <TimingDataTag />
          <SourceStrip className="ml-auto" />
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-4 pt-7 md:px-10">
        {upcoming && upcoming.length > 0 ? (
          <VratList items={upcoming} now={now} />
        ) : (
          <VerifyingPanel
            title="The vrat calendar is being verified"
            note="Dates are entered and checked by hand before they appear here — never auto-fetched. Check back shortly."
          />
        )}

        {/* Bottom CTA */}
        <div className="hero-pa mt-10 flex flex-col items-start justify-between gap-4 rounded-[15px] p-6 md:flex-row md:items-center">
          <div>
            <p className="mb-1 text-[10px] font-bold tracking-[0.8px] text-eyebrow-dark uppercase">
              📿 All the year&rsquo;s dates, on one page
            </p>
            <p className="text-[16px] font-bold text-hero-text">
              Download the full 2026 calendar
            </p>
            <p className="mt-1 text-[12.5px] text-hero-text/65">
              Every tithi, vrat and festival date as a PDF — ready to print or
              forward.
            </p>
          </div>
          <a
            href={CALENDAR_PDF_HREF}
            className="shrink-0 rounded-[9px] bg-cta px-4 py-2 text-[12.5px] font-bold text-white"
          >
            Download full 2026 calendar
          </a>
        </div>
      </div>
    </main>
  );
}
