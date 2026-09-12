import Link from "next/link";
import { CITY_LABEL, fmtEnds, fmtLong, guideHref } from "@/lib/panchangExtras";
import type { DayPayload, UpcomingObservance } from "@/lib/types";

interface Row {
  key: string;
  value: string;
}

/**
 * Compact panchang card for the hero's second grid column (mock `.pcard`):
 * head, tithi headline, four stacked rows, and a one-line foot naming the
 * observance that falls on today's tithi, if any. Cells never render
 * blank — a dead backend shows "Being verified" instead.
 */
export function PanchangCard({
  payload,
  nextObservance,
  now,
}: {
  payload: DayPayload | null;
  nextObservance: UpcomingObservance | null;
  now: string;
}) {
  const day = payload?.day ?? null;

  const rows: Row[] = day
    ? [
        { key: "Paksha", value: day.paksha ?? "Being verified" },
        {
          key: "Nakshatra",
          value: day.nakshatra?.name
            ? `${day.nakshatra.name}${
                day.nakshatra.endsAt ? ` · ${fmtEnds(day.nakshatra.endsAt, day.date)}` : ""
              }`
            : "Being verified",
        },
        { key: "Sunrise", value: day.sunrise ?? "Being verified" },
        {
          key: "Rahu Kaal",
          value: day.rahuKaal ? `${day.rahuKaal.from} – ${day.rahuKaal.to}` : "Being verified",
        },
      ]
    : [
        { key: "Paksha", value: "Being verified" },
        { key: "Nakshatra", value: "Being verified" },
        { key: "Sunrise", value: "Being verified" },
        { key: "Rahu Kaal", value: "Being verified" },
      ];

  const next =
    nextObservance?.countdownDays === 0 ? nextObservance.observance : null;

  return (
    <div className="overflow-hidden rounded-[18px] border border-white/[0.14] bg-white/[0.055] backdrop-blur-[4px]">
      <div className="flex items-center justify-between border-b border-white/[0.11] px-5 py-[14px]">
        <span className="text-[11px] font-bold tracking-[0.7px] text-eyebrow-dark uppercase">
          ☀ Today&rsquo;s Panchang
        </span>
        <span className="flex items-center gap-[6px] text-[11px] text-hero-text/70">
          <span
            aria-hidden
            className="live-dot h-[6px] w-[6px] rounded-full bg-[#3FBF6A] shadow-[0_0_0_3px_rgba(63,191,106,0.22)]"
          />
          {day?.city || CITY_LABEL}
        </span>
      </div>

      <div className="border-b border-white/[0.09] px-5 py-4">
        <p className="text-[23px] leading-[1.15] font-bold text-hero-text">
          {day?.tithi?.name ?? "Being verified"}
        </p>
        <p className="mt-1 text-[12px] text-hero-text/60">{fmtLong(day?.date ?? now)}</p>
      </div>

      <div className="px-5">
        {rows.map((r) => (
          <div
            key={r.key}
            className="flex items-baseline justify-between gap-[14px] border-b border-white/[0.07] py-[10px] last:border-b-0"
          >
            <span className="text-[11px] tracking-[0.4px] text-hero-text/55 uppercase">
              {r.key}
            </span>
            <span className="text-right text-[13px] font-semibold text-hero-text">
              {r.value}
            </span>
          </div>
        ))}
      </div>

      {next ? (
        <div className="flex items-center justify-between gap-3 bg-cta/[0.16] px-5 py-[13px]">
          <span className="text-[12px] leading-[1.5] text-hero-text/85">
            <b className="font-bold text-hero-text">{next.name}</b> falls on
            this tithi.{next.tithiLabel ? ` ${next.tithiLabel}.` : ""}
          </span>
          <Link
            href={next.articleSlug ? guideHref(next.articleSlug) : "/panchang"}
            className="shrink-0 text-[12px] font-bold whitespace-nowrap text-eyebrow-dark hover:text-hero-text"
          >
            Open guide ›
          </Link>
        </div>
      ) : (
        <div className="px-5 py-[10px] text-[11px] leading-relaxed text-hero-text/45 italic">
          Every date checked by hand.
        </div>
      )}
    </div>
  );
}
