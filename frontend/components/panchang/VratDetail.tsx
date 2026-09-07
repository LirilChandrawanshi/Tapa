import type { Observance, PanchangDay } from "@/lib/types";
import {
  type ParanaWindow,
  addDays,
  fmtAt,
  fmtDate,
  fmtEnds,
  fmtShort,
  obsX,
  pakshaNote,
} from "@/lib/panchangExtras";

/**
 * Vrat detail sections (W2-D #1): parana hero, the four timing tiles, the
 * horizontal fast timeline and the full computed table. All server-rendered;
 * every value degrades to "—" when the day payload or tithi window is absent.
 */

/* ── Parana hero ─────────────────────────────────────────────────────── */

export function ParanaHero({ parana }: { parana: ParanaWindow }) {
  return (
    <section className="overflow-hidden rounded-[15px] border border-data-bd bg-data-bg">
      <div className="px-5 py-5 md:px-7">
        <p className="text-[10px] font-bold tracking-[1px] text-data-fg/70 uppercase">
          ◷ When you can break the fast — Parana window ·{" "}
          {fmtDate(parana.date)}
        </p>
        <p className="mt-2 text-[26px] leading-none font-bold tracking-[-0.5px] text-data-fg md:text-[32px]">
          {parana.from} – {parana.to}
        </p>
        <p className="mt-2 max-w-[560px] text-[12.5px] leading-relaxed text-data-fg/80">
          Break the fast inside this window on the morning after, once the sun
          is up.
        </p>
      </div>
      <div className="border-t border-data-bd/60 px-5 py-3 md:px-7">
        <p className="text-[12px] leading-relaxed text-data-fg/80">
          <b>Why the window closes.</b> Parana must happen after sunrise and
          before Dwadashi tithi ends. Miss it and the tradition treats the vrat
          as incomplete — so this is the one timing worth setting an alarm for.
        </p>
      </div>
    </section>
  );
}

/* ── Four timing tiles ───────────────────────────────────────────────── */

export function VratTimingTiles({
  observance,
  day,
  parana,
}: {
  observance: Observance;
  day: PanchangDay | null;
  parana: ParanaWindow | null;
}) {
  const x = obsX(observance);
  const nextDay = addDays(observance.date, 1);
  const tiles: { key: string; value: string; sub?: string }[] = [
    {
      key: "Fast begins",
      value: day?.sunrise ? `Sunrise · ${day.sunrise}` : "Sunrise",
      sub: fmtShort(observance.date),
    },
    {
      key: "Tithi begins",
      value: fmtAt(x.tithiStartsAt) ?? "—",
    },
    {
      key: "Tithi ends",
      value: fmtAt(x.tithiEndsAt) ?? "—",
    },
    parana
      ? {
          key: "Parana",
          value: `${parana.from} – ${parana.to}`,
          sub: fmtShort(parana.date),
        }
      : {
          key: "Day after",
          value: fmtShort(nextDay),
          sub: "parana window to be confirmed",
        },
  ];
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

/* ── Horizontal fast timeline ────────────────────────────────────────── */

export interface TimelineStop {
  label: string;
  time: string;
  note?: string;
}

export function FastTimeline({
  stops,
  /** Index of the stop the reader is currently inside, or null. */
  activeIndex,
}: {
  stops: TimelineStop[];
  activeIndex: number | null;
}) {
  return (
    <div className="overflow-x-auto rounded-[15px] border border-border bg-card px-5 py-5 md:px-6">
      <ol className="flex min-w-[640px]">
        {stops.map((s, i) => {
          const here = i === activeIndex;
          return (
            <li key={s.label} className="relative flex-1 pr-3 last:pr-0">
              {/* connecting rail */}
              {i < stops.length - 1 && (
                <span
                  aria-hidden
                  className="absolute top-[5px] right-0 left-[14px] h-[2px] bg-border"
                />
              )}
              <span
                aria-hidden
                className={`relative z-[1] block h-3 w-3 rounded-full border-2 ${
                  here
                    ? "border-cta bg-cta"
                    : "border-data-fg/50 bg-card"
                }`}
              />
              {here && (
                <span className="mt-[6px] inline-flex items-center rounded-[5px] bg-cta px-[7px] py-[2px] text-[8.5px] font-bold tracking-[0.5px] text-white uppercase">
                  You are here
                </span>
              )}
              <p className="mt-[7px] pr-2 text-[12px] leading-snug font-bold text-ink">
                {s.label}
              </p>
              <p className="mt-[2px] pr-2 text-[11px] font-medium text-data-fg">
                {s.time}
              </p>
              {s.note && (
                <p className="mt-[3px] pr-2 text-[10.5px] leading-relaxed text-sub">
                  {s.note}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ── Full computed table ─────────────────────────────────────────────── */

export function ComputedTable({
  observance,
  day,
  parana,
}: {
  observance: Observance;
  day: PanchangDay | null;
  parana: ParanaWindow | null;
}) {
  const x = obsX(observance);
  const begins = fmtAt(x.tithiStartsAt);
  const ends = fmtAt(x.tithiEndsAt);
  const tithiSub =
    begins || ends
      ? [begins ? `Begins ${begins}` : null, ends ? `ends ${ends}` : null]
          .filter(Boolean)
          .join(" · ")
      : undefined;
  const pak = day?.paksha ?? null;
  const pakGloss = pakshaNote(pak);

  const rows: { key: string; value: string; sub?: string }[] = [
    {
      key: "Tithi",
      value: day?.tithi?.name ?? observance.tithiLabel ?? "—",
      sub: tithiSub,
    },
    {
      key: "Paksha",
      value: pak ? `${pak}${pakGloss ? ` — ${pakGloss}` : ""}` : "—",
    },
    {
      key: "Nakshatra",
      value: day?.nakshatra?.name ?? "—",
      sub: day?.nakshatra?.endsAt
        ? `Until ${fmtEnds(day.nakshatra.endsAt, day.date).replace(/^till /, "")}`
        : undefined,
    },
    { key: "Yoga", value: day?.yoga ?? "—" },
    { key: "Karana", value: day?.karana ?? "—" },
    { key: "Sunrise", value: day?.sunrise ?? "—" },
    { key: "Sunset", value: day?.sunset ?? "—" },
    {
      key: "Rahu Kaal",
      value: day?.rahuKaal ? `${day.rahuKaal.from} – ${day.rahuKaal.to}` : "—",
      sub: day?.rahuKaal
        ? "Avoided by convention for new beginnings"
        : undefined,
    },
    {
      key: "Parana",
      value: parana ? `${fmtShort(parana.date)} · ${parana.from} – ${parana.to}` : "—",
    },
  ];

  return (
    <div className="overflow-hidden rounded-[15px] border border-border bg-card">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border bg-bg px-5 py-[10px]">
        <p className="text-[10px] font-bold tracking-[0.9px] text-sub uppercase">
          The full panchang for this date
        </p>
        <p className="text-[10px] font-bold tracking-[0.9px] text-data-fg/70 uppercase">
          Computed values · Purnimanta
        </p>
      </div>
      <dl className="divide-y divide-border-light">
        {rows.map((r) => (
          <div
            key={r.key}
            className="grid grid-cols-[120px_1fr] items-baseline gap-3 px-5 py-[11px] md:grid-cols-[160px_1fr]"
          >
            <dt className="text-[10px] font-bold tracking-[0.8px] text-sub uppercase">
              {r.key}
            </dt>
            <dd>
              <p className="text-[13.5px] font-bold text-ink">{r.value}</p>
              {r.sub && <p className="mt-[2px] text-[11.5px] text-sub">{r.sub}</p>}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
