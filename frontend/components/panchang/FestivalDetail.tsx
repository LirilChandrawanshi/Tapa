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
  { devi: "Shailputri", colour: "Orange", swatch: "#E8952A", offering: "Cow's ghee" },
  { devi: "Brahmacharini", colour: "White", swatch: "#FFFFFF", offering: "Sugar" },
  { devi: "Chandraghanta", colour: "Red", swatch: "#D02040", offering: "Milk" },
  { devi: "Kushmanda", colour: "Royal blue", swatch: "#1B4F9C", offering: "Malpua" },
  { devi: "Skandamata", colour: "Yellow", swatch: "#EFC42A", offering: "Banana" },
  { devi: "Katyayani", colour: "Green", swatch: "#3E8B4A", offering: "Honey" },
  { devi: "Kaalratri", colour: "Grey", swatch: "#8A8A8A", offering: "Jaggery" },
  { devi: "Mahagauri", colour: "Purple", swatch: "#7A4A96", offering: "Coconut" },
  { devi: "Siddhidatri", colour: "Peacock green", swatch: "#2E8B7A", offering: "Sesame" },
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
              className={`grid items-baseline gap-3 border-b border-border-light px-5 py-[11px] last:border-b-0 ${cols} ${
                flag ? "bg-data-bg/50" : ""
              }`}
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
                <span className="flex items-center gap-[6px] text-[12px] text-mid">
                  {nav && (
                    <span
                      aria-hidden
                      className="inline-block size-[11px] shrink-0 rounded-full border border-border"
                      style={{ backgroundColor: nav.swatch }}
                    />
                  )}
                  {nav?.colour ?? "—"}
                </span>
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
  kind: "vriddhi" | "merge";
  tithi: string;
  /** Both civil dates for a vriddhi; the single join date for a merge. */
  dates: string[];
  /** For a merge: the tithi that begins at the same moment. */
  into?: string;
}

/**
 * The two shapes the spec calls out by name.
 *
 * `vriddhi` — consecutive civil days carrying the same sunrise tithi, so the
 * observance stretches a day longer than its name suggests.
 * `merge` — one tithi ends and the next begins inside the same civil day, so
 * two numbered days collapse onto one date.
 *
 * Both are read off the tithi windows we already hold. Nothing is inferred
 * where a day payload is missing: an absent tithi simply yields no anomaly.
 */
export function detectAnomalies(days: FestivalDay[]): TithiAnomaly[] {
  const out: TithiAnomaly[] = [];
  for (let i = 1; i < days.length; i++) {
    const a = days[i - 1]?.day?.tithi?.name;
    const b = days[i]?.day?.tithi?.name;
    if (a && b && a === b) {
      out.push({
        kind: "vriddhi",
        tithi: a,
        dates: [days[i - 1].date, days[i].date],
      });
    }
  }
  // A tithi that ends part-way through its own civil day hands over to the
  // next one on that same date — the Ashtami/Navami join the spec describes.
  for (let i = 0; i < days.length - 1; i++) {
    const here = days[i]?.day?.tithi;
    const next = days[i + 1]?.day?.tithi?.name;
    if (!here?.name || !here.endsAt || !next || next === here.name) continue;
    if (here.endsAt.slice(0, 10) !== days[i].date) continue;
    out.push({
      kind: "merge",
      tithi: here.name,
      into: next,
      dates: [days[i].date],
    });
  }
  return out;
}

const ORDINAL = ["One", "Two", "Three", "Four"] as const;

export function UnusualBand({ anomalies }: { anomalies: TithiAnomaly[] }) {
  if (anomalies.length === 0) return null;
  return (
    <section>
      <div className="mb-3">
        <p className="text-[10px] font-bold tracking-[0.8px] text-gold uppercase">
          Stated, not smoothed over
        </p>
        <h2 className="text-[17px] font-bold text-ink">
          {anomalies.length === 1
            ? "One thing makes this year unusual"
            : `${anomalies.length} things make this year unusual`}
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {anomalies.slice(0, 4).map((a, i) => (
          <div
            key={`${a.kind}-${a.tithi}-${a.dates[0]}`}
            className="rounded-[15px] border border-pratha-bd bg-pratha-bg p-5"
          >
            <p className="mb-1 text-[9.5px] font-bold tracking-[0.9px] text-pratha-fg/70 uppercase">
              {ORDINAL[i] ?? `${i + 1}`}
            </p>
            {a.kind === "vriddhi" ? (
              <>
                <p className="text-[14.5px] font-bold text-pratha-fg">
                  {a.tithi} is long
                </p>
                <p className="mt-2 text-[12.5px] leading-relaxed text-pratha-fg/85">
                  It covers both {fmtShort(a.dates[0])} and{" "}
                  {fmtShort(a.dates[1])}, so two civil days carry the same
                  tithi label and the observance stretches a day further than
                  usual. This is normal tithi vriddhi and nothing has gone
                  wrong.
                </p>
              </>
            ) : (
              <>
                <p className="text-[14.5px] font-bold text-pratha-fg">
                  {a.tithi} and {a.into} merge
                </p>
                <p className="mt-2 text-[12.5px] leading-relaxed text-pratha-fg/85">
                  On {fmtShort(a.dates[0])}. {a.tithi} ends and {a.into}{" "}
                  begins at that same moment, so both fall on one civil date
                  and the sandhi window sits across the join.
                </p>
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── "Where panchangs disagree" ──────────────────────────────────────── */

export interface VarianceSource {
  name: string;
  position: string;
}

/**
 * The spec's variance block: when a tithi merge moves an observance between
 * two defensible dates, both readings are named and neither is presented as
 * the correct one. This is a difference of panchang convention, not of
 * scripture, and the PRD's truth-first rule says to state it rather than
 * pick a winner.
 */
export function PanchangVariance({
  lead,
  sources,
}: {
  lead: string;
  sources: readonly VarianceSource[];
}) {
  if (sources.length === 0) return null;
  return (
    <section className="rounded-[15px] border border-border bg-card p-6">
      <p className="mb-1 text-[10px] font-bold tracking-[0.8px] text-gold uppercase">
        Stated, not hidden
      </p>
      <h2 className="text-[16.5px] leading-snug font-bold text-ink">{lead}</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {sources.map((s) => (
          <div
            key={s.name}
            className="rounded-[13px] border border-data-bd bg-data-bg px-4 py-[14px]"
          >
            <p className="mb-1 text-[9.5px] font-bold tracking-[0.9px] text-data-fg/60 uppercase">
              {s.name}
            </p>
            <p className="text-[12.5px] leading-relaxed text-data-fg">
              {s.position}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[13px] leading-relaxed text-sub">
        Both are defensible. This is a difference of{" "}
        <b className="text-ink">panchang convention, not of scripture</b>, and
        we will not present one as the correct answer.
      </p>
      <p className="mt-2 text-[13px] leading-relaxed text-sub">
        Follow your family or community panchang. If you have none, follow the
        one your local temple uses.
      </p>
    </section>
  );
}
