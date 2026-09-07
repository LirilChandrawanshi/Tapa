import type { PanchangDay } from "@/lib/types";
import { fmtEnds, fmtShort, weekday } from "@/lib/panchangExtras";

/**
 * Multi-day festival sections (W2-D #2): the day-by-day panchang table, the
 * day-1 muhurat windows and the kshaya/vriddhi "unusual this year" band.
 * Tolerant of missing day payloads — a row renders with "—" rather than
 * dropping out.
 */

export interface FestivalDay {
  date: string;
  day: PanchangDay | null;
}

/** Devi / colour / offering strip — practitioner custom, navratri only. */
const NAVRATRI_ROWS = [
  { devi: "Shailputri", colour: "Orange", offering: "Cow's ghee" },
  { devi: "Brahmacharini", colour: "White", offering: "Sugar" },
  { devi: "Chandraghanta", colour: "Red", offering: "Milk" },
  { devi: "Kushmanda", colour: "Royal blue", offering: "Malpua" },
  { devi: "Skandamata", colour: "Yellow", offering: "Banana" },
  { devi: "Katyayani", colour: "Green", offering: "Honey" },
  { devi: "Kaalratri", colour: "Grey", offering: "Jaggery" },
  { devi: "Mahagauri", colour: "Purple", offering: "Coconut" },
  { devi: "Siddhidatri", colour: "Peacock green", offering: "Sesame" },
] as const;

/** Notable-day flag for one row — simple derived rules, never invented data. */
function notableFlag(
  days: FestivalDay[],
  index: number,
  isNavratri: boolean,
): string | null {
  const tithi = days[index]?.day?.tithi?.name ?? null;
  const prevTithi = index > 0 ? days[index - 1]?.day?.tithi?.name ?? null : null;
  if (tithi && prevTithi && tithi === prevTithi) {
    return `${tithi} continues — tithi vriddhi`;
  }
  if (!isNavratri) return null;
  if (index === 0) return "Ghatasthapana";
  if (tithi && /ashtami/i.test(tithi)) return "Durga Ashtami · Sandhi Puja";
  if (tithi && /navami/i.test(tithi)) return "Maha Navami";
  if (index === 7) return "Ashtami · Sandhi Puja";
  if (index === 8) return "Maha Navami";
  return null;
}

export function DayByDayTable({
  days,
  isNavratri,
}: {
  days: FestivalDay[];
  isNavratri: boolean;
}) {
  const cols = isNavratri
    ? "grid-cols-[36px_96px_1.2fr_1fr_0.75fr_0.85fr]"
    : "grid-cols-[44px_110px_1.2fr_1fr]";
  return (
    <div className="overflow-x-auto">
      <div
        className={`overflow-hidden rounded-[15px] border border-border bg-card ${
          isNavratri ? "min-w-[680px]" : "min-w-[520px]"
        }`}
      >
        <div
          className={`grid gap-3 border-b border-border bg-bg px-5 py-[9px] text-[9.5px] font-bold tracking-[0.9px] text-sub uppercase ${cols}`}
        >
          <span>Day</span>
          <span>Date</span>
          <span>Tithi</span>
          {isNavratri && <span>Devi</span>}
          {isNavratri && <span>Colour</span>}
          {isNavratri ? <span>Offering</span> : <span>Notable</span>}
        </div>
        {days.map((d, i) => {
          const flag = notableFlag(days, i, isNavratri);
          const nav = isNavratri ? NAVRATRI_ROWS[i] : undefined;
          return (
            <div
              key={d.date}
              className={`grid items-baseline gap-3 border-b border-border-light px-5 py-[11px] last:border-b-0 ${cols}`}
            >
              <span className="text-[13.5px] font-bold text-data-fg">
                {i + 1}
              </span>
              <span>
                <span className="block text-[13px] font-bold text-ink">
                  {fmtShort(d.date)}
                </span>
                <span className="block text-[10.5px] text-sub">
                  {weekday(d.date)}
                </span>
              </span>
              <span>
                <span className="block text-[12.5px] font-medium text-ink">
                  {d.day?.tithi?.name ?? "—"}
                </span>
                {d.day?.tithi?.endsAt && (
                  <span className="block text-[10.5px] text-sub">
                    {fmtEnds(d.day.tithi.endsAt, d.date)}
                  </span>
                )}
                {flag && (
                  <span className="mt-[3px] inline-flex rounded-[5px] border border-data-bd bg-data-bg px-[6px] py-[1px] text-[9px] font-bold tracking-[0.4px] text-data-fg uppercase">
                    {flag}
                  </span>
                )}
              </span>
              {isNavratri && (
                <span className="text-[12.5px] font-medium text-ink">
                  {nav?.devi ?? "—"}
                </span>
              )}
              {isNavratri && (
                <span className="text-[12px] text-mid">{nav?.colour ?? "—"}</span>
              )}
              {isNavratri ? (
                <span className="text-[12px] text-mid">
                  {nav?.offering ?? "—"}
                </span>
              ) : (
                <span className="text-[11.5px] text-sub">{flag ?? "—"}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Muhurat windows (day 1) ─────────────────────────────────────────── */

export function MuhuratWindows({ day1 }: { day1: PanchangDay | null }) {
  const muhurats = day1?.muhurats ?? [];
  const abhijit = day1?.abhijitMuhurat ?? null;
  if (muhurats.length === 0 && !abhijit) return null;
  const hasGhatasthapana = muhurats.some((m) =>
    /ghatasthapana/i.test(m.label),
  );
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {muhurats.map((m) => (
        <div
          key={`${m.label}-${m.from}`}
          className="rounded-[13px] border border-data-bd bg-data-bg px-4 py-[14px]"
        >
          <p className="mb-1 text-[9.5px] font-bold tracking-[0.9px] text-data-fg/60 uppercase">
            {m.label} — {m.kind}
          </p>
          <p className="text-[16px] font-bold text-data-fg">
            {m.from} – {m.to}
          </p>
        </div>
      ))}
      {abhijit && (
        <div className="rounded-[13px] border border-data-bd bg-data-bg px-4 py-[14px]">
          <p className="mb-1 text-[9.5px] font-bold tracking-[0.9px] text-data-fg/60 uppercase">
            Abhijit — fallback
          </p>
          <p className="text-[16px] font-bold text-data-fg">
            {abhijit.from} – {abhijit.to}
          </p>
          <p className="mt-[2px] text-[11px] text-data-fg/70">
            Use if the first window is missed.
          </p>
        </div>
      )}
      {hasGhatasthapana && (
        <div className="rounded-[13px] border border-border bg-bg px-4 py-[14px]">
          <p className="mb-1 text-[9.5px] font-bold tracking-[0.9px] text-sub uppercase">
            After Hindu midday
          </p>
          <p className="text-[16px] font-bold text-mid">Not performed</p>
          <p className="mt-[2px] text-[11px] text-sub">
            Ghatasthapana is not done after midday.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── "What's unusual this year" band ─────────────────────────────────── */

export interface TithiAnomaly {
  tithi: string;
  dates: [string, string];
}

/** Consecutive civil days carrying the same sunrise tithi → vriddhi. */
export function detectAnomalies(days: FestivalDay[]): TithiAnomaly[] {
  const out: TithiAnomaly[] = [];
  for (let i = 1; i < days.length; i++) {
    const a = days[i - 1]?.day?.tithi?.name;
    const b = days[i]?.day?.tithi?.name;
    if (a && b && a === b) {
      out.push({ tithi: a, dates: [days[i - 1].date, days[i].date] });
    }
  }
  return out;
}

export function UnusualBand({ anomalies }: { anomalies: TithiAnomaly[] }) {
  if (anomalies.length === 0) return null;
  return (
    <section className="rounded-[15px] border border-pratha-bd bg-pratha-bg p-6">
      <p className="mb-1 text-[10px] font-bold tracking-[0.8px] text-pratha-fg uppercase">
        What&rsquo;s unusual this year
      </p>
      {anomalies.map((a) => (
        <p
          key={`${a.tithi}-${a.dates[0]}`}
          className="mt-2 text-[13px] leading-relaxed text-pratha-fg"
        >
          <b>{a.tithi} is long.</b> It covers both {fmtShort(a.dates[0])} and{" "}
          {fmtShort(a.dates[1])}, so two civil days carry the same tithi label
          and the observance stretches a day further than usual. This is
          normal tithi vriddhi — nothing has gone wrong.
        </p>
      ))}
    </section>
  );
}
