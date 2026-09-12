import type { EclipseVisibility, Observance } from "@/lib/types";
import { fmtLong, weekday } from "@/lib/panchangExtras";

/**
 * Eclipse detail card from the spec: the kind of eclipse, its date, and the
 * four rows that actually decide anything — visibility, path, Sutak, timing.
 *
 * Visibility is the page's whole argument, so it is never inferred. An
 * observance with no `visibility` set renders UNCONFIRMED and the note says
 * to check a local panchang, rather than implying an answer we do not have.
 */

const VISIBILITY_LABEL: Record<EclipseVisibility, string> = {
  VISIBLE: "Visible",
  NOT_VISIBLE: "Not visible",
  UNCONFIRMED: "Unconfirmed",
};

const VISIBILITY_STYLE: Record<EclipseVisibility, string> = {
  VISIBLE: "border-dharma-bd bg-dharma-bg text-dharma-fg",
  NOT_VISIBLE: "border-bhranti-bd bg-bhranti-bg text-bhranti-fg",
  UNCONFIRMED: "border-pratha-bd bg-pratha-bg text-pratha-fg",
};

export function VisibilityBadge({
  visibility,
  className = "",
}: {
  visibility?: EclipseVisibility;
  className?: string;
}) {
  const v = visibility ?? "UNCONFIRMED";
  return (
    <span
      className={`inline-flex items-center rounded-[5px] border px-[8px] py-[2px] text-[9.5px] font-bold tracking-[0.6px] uppercase ${VISIBILITY_STYLE[v]} ${className}`}
    >
      {VISIBILITY_LABEL[v]}
    </span>
  );
}

export function EclipseCard({
  observance: o,
  city,
}: {
  observance: Observance;
  city: string;
}) {
  const v = o.visibility ?? "UNCONFIRMED";
  const rows: { key: string; value: React.ReactNode }[] = [
    {
      key: `Visible from ${city}`,
      value: <VisibilityBadge visibility={v} />,
    },
    {
      key: "Path of totality",
      value: o.pathOfTotality ?? "Being verified",
    },
    {
      key: "Sutak Kaal here",
      value:
        o.sutakNote ??
        (v === "NOT_VISIBLE"
          ? "Does not apply"
          : "Follows visibility — check your local panchang"),
    },
    {
      key: "Timing",
      value: o.timingNote ?? "Check Drik Panchang for your city",
    },
  ];

  return (
    <div className="overflow-hidden rounded-[15px] border border-border bg-card">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border bg-bg px-5 py-[11px]">
        <p className="text-[14.5px] font-bold text-ink">{o.name}</p>
        <p className="text-[12px] text-sub">
          {weekday(o.date)}, {fmtLong(o.date)}
        </p>
      </div>
      <dl className="divide-y divide-border-light">
        {rows.map((r) => (
          <div
            key={r.key}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-[11px]"
          >
            <dt className="text-[11.5px] text-sub">{r.key}</dt>
            <dd className="max-w-[60%] text-right text-[12.5px] font-medium text-ink">
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
      {(o.blurb || !o.timingNote) && (
        <p className="border-t border-border-light bg-bg px-5 py-[11px] text-[11.5px] leading-relaxed text-sub">
          {o.blurb ?? (
            <>
              <b>Why no exact minutes here.</b> Reported start and end times
              vary noticeably between sources. Rather than print a figure we
              have not verified, we point you at the almanac — check close to
              the date for your city.
            </>
          )}
        </p>
      )}
    </div>
  );
}
