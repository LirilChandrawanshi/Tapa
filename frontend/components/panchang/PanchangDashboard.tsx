import type { PanchangDay } from "@/lib/types";
import { CITY_LABEL, fmtEnds, fmtLong } from "@/lib/panchangExtras";

interface Cell {
  key: string;
  value: string;
  sub?: string;
}

function buildCells(day: PanchangDay): Cell[] {
  return [
    {
      key: "Tithi",
      value: day.tithi?.name ?? "—",
      sub: day.tithi?.endsAt ? fmtEnds(day.tithi.endsAt, day.date) : undefined,
    },
    {
      key: "Paksha",
      value: day.paksha ?? "—",
      sub: day.lunarMonth,
    },
    {
      key: "Nakshatra",
      value: day.nakshatra?.name ?? "—",
      sub: day.nakshatra?.endsAt ? fmtEnds(day.nakshatra.endsAt, day.date) : undefined,
    },
    {
      key: "Yoga",
      value: day.yoga ?? "—",
      sub: day.karana ? `Karana ${day.karana}` : undefined,
    },
    {
      key: "Sunrise",
      value: day.sunrise ?? "—",
      sub: day.moonrise ? `Moonrise ${day.moonrise}` : "IST",
    },
    {
      key: "Sunset",
      value: day.sunset ?? "—",
      sub: day.moonset ? `Moonset ${day.moonset}` : "IST",
    },
  ];
}

/**
 * The full-width dark 6-cell timing grid — Tithi, Paksha, Nakshatra, Yoga,
 * Sunrise, Sunset. Panchang blue-dark surface (hero-pa gradient), no DPB.
 */
export function PanchangDashboard({ day }: { day: PanchangDay }) {
  const cells = buildCells(day);
  return (
    <section className="hero-pa overflow-hidden rounded-2xl">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 px-5 py-[14px] md:px-7">
        <p className="text-[10px] font-bold tracking-[1px] text-eyebrow-dark uppercase">
          ☀ Today&rsquo;s Panchang
        </p>
        <p className="flex items-center gap-[7px] text-[11px] text-hero-text/60">
          <span
            aria-hidden
            className="inline-block h-[6px] w-[6px] rounded-full bg-eyebrow-dark"
          />
          {fmtLong(day.date)} · {day.city || CITY_LABEL}
        </p>
      </div>
      <div className="grid grid-cols-2 overflow-hidden md:grid-cols-3 lg:grid-cols-6">
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
              {c.sub ?? " "}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** Rahu Kaal (avoid) + Abhijit Muhurat (favourable) strip, data-blue. */
export function MuhuratStrip({ day }: { day: PanchangDay }) {
  const rahu = day.rahuKaal;
  const abhijit = day.abhijitMuhurat;
  if (!rahu && !abhijit) return null;
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {rahu && (
        <div className="flex items-center gap-3 rounded-[13px] border border-data-bd bg-data-bg px-4 py-3">
          <span aria-hidden className="text-lg">
            ⚠️
          </span>
          <div>
            <p className="text-[10px] font-bold tracking-[0.8px] text-data-fg uppercase">
              Rahu Kaal — avoid new beginnings
            </p>
            <p className="text-[14.5px] font-bold text-data-fg">
              {rahu.from} – {rahu.to}
            </p>
          </div>
        </div>
      )}
      {abhijit && (
        <div className="flex items-center gap-3 rounded-[13px] border border-data-bd bg-data-bg px-4 py-3">
          <span aria-hidden className="text-lg">
            ✳️
          </span>
          <div>
            <p className="text-[10px] font-bold tracking-[0.8px] text-data-fg uppercase">
              Abhijit Muhurat — favourable window
            </p>
            <p className="text-[14.5px] font-bold text-data-fg">
              {abhijit.from} – {abhijit.to}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
