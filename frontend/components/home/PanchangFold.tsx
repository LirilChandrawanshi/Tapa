import Link from "next/link";
import { CountdownPill } from "@/components/CountdownPill";
import { DataStateNote } from "@/components/panchang/DataMeta";
import {
  CITY_LABEL,
  fmtLong,
  guideHref,
} from "@/lib/panchangExtras";
import type { DayPayload, UpcomingObservance } from "@/lib/types";

interface Cell {
  key: string;
  value: string;
  sub?: string;
}

const VERIFYING_SUB = "checked by hand";

/**
 * Section 5 — PANCHANG FIRST FOLD. Four dark data cells (Tithi, Paksha,
 * Nakshatra, Sunrise) in the panchang blue-dark style, plus the next-vrat
 * countdown row. PRD rule: cells never render blank — a dead backend shows
 * "Being verified" placeholders instead.
 */
export function PanchangFold({
  payload,
  nextObservance,
  now,
}: {
  payload: DayPayload | null;
  nextObservance: UpcomingObservance | null;
  now: string;
}) {
  const day = payload?.day ?? null;

  const cells: Cell[] = day
    ? [
        {
          key: "Tithi",
          value: day.tithi?.name ?? "Being verified",
          sub: day.tithi?.endsAt ? `till ${day.tithi.endsAt}` : undefined,
        },
        {
          key: "Paksha",
          value: day.paksha ?? "Being verified",
          sub: day.lunarMonth,
        },
        {
          key: "Nakshatra",
          value: day.nakshatra?.name ?? "Being verified",
          sub: day.nakshatra?.endsAt ? `till ${day.nakshatra.endsAt}` : undefined,
        },
        {
          key: "Sunrise",
          value: day.sunrise ?? "Being verified",
          sub: day.sunset ? `Sunset ${day.sunset}` : "IST",
        },
      ]
    : [
        { key: "Tithi", value: "Being verified", sub: VERIFYING_SUB },
        { key: "Paksha", value: "Being verified", sub: VERIFYING_SUB },
        { key: "Nakshatra", value: "Being verified", sub: VERIFYING_SUB },
        { key: "Sunrise", value: "Being verified", sub: VERIFYING_SUB },
      ];

  const next = nextObservance?.observance ?? null;

  return (
    <section className="mx-auto max-w-[1280px] px-4 pt-8 md:px-10">
      <div className="hero-pa overflow-hidden rounded-2xl">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 px-5 py-[14px] md:px-7">
          <p className="text-[10px] font-bold tracking-[1px] text-eyebrow-dark uppercase">
            ☀ Today&rsquo;s Panchang
          </p>
          <p className="flex items-center gap-[7px] text-[11px] text-hero-text/60">
            <span
              aria-hidden
              className="inline-block h-[6px] w-[6px] rounded-full bg-eyebrow-dark"
            />
            {fmtLong(day?.date ?? now)} · {day?.city || CITY_LABEL}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4">
          {cells.map((c) => (
            <div
              key={c.key}
              className="-mb-px border-r border-b border-white/10 px-5 py-4 md:px-6 md:py-5"
            >
              <p className="mb-[6px] text-[9.5px] font-bold tracking-[0.9px] text-hero-text/45 uppercase">
                {c.key}
              </p>
              <p className="text-[15.5px] leading-snug font-bold text-hero-text">
                {c.value}
              </p>
              <p className="mt-[3px] min-h-[16px] text-[11px] text-eyebrow-dark/80">
                {c.sub ?? " "}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 px-5 py-[13px] md:px-7">
          {next ? (
            <>
              <CountdownPill date={next.date} now={now} />
              <p className="min-w-0 flex-1 text-[12.5px] text-hero-text/85">
                <span className="font-bold text-hero-text">{next.name}</span>
                {" · "}
                {fmtLong(next.date)}
                {next.tithiLabel ? ` · ${next.tithiLabel}` : ""}
              </p>
              {next.articleSlug && (
                <Link
                  href={guideHref(next.articleSlug)}
                  className="text-[12px] font-bold whitespace-nowrap text-cta"
                >
                  Open guide ›
                </Link>
              )}
            </>
          ) : (
            <p className="flex-1 text-[12.5px] text-hero-text/70">
              The next vrat date is being verified — the full calendar has
              every date of the year.
            </p>
          )}
          <Link
            href="/panchang"
            className="text-[12px] font-bold whitespace-nowrap text-eyebrow-dark hover:text-hero-text"
          >
            Full panchang →
          </Link>
        </div>
      </div>

      <DataStateNote
        stale={payload?.stale}
        verified={payload?.verified}
        className="mt-2"
      />
    </section>
  );
}
