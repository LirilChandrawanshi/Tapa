import type { ObservanceType } from "@/lib/types";

const TYPE_STYLES: Record<ObservanceType, { label: string; classes: string }> = {
  VRAT: {
    label: "VRAT",
    classes: "border-data-bd bg-data-bg text-data-fg",
  },
  FESTIVAL: {
    label: "FESTIVAL",
    classes: "border-cta/25 bg-cta/10 text-cta",
  },
  SPECIAL_SEASONAL: {
    label: "SEASONAL",
    classes: "border-pratha-bd bg-pratha-bg text-pratha-fg",
  },
  PURNIMA_AMAVASYA: {
    label: "PURNIMA · AMAVASYA",
    classes: "border-border bg-bg text-mid",
  },
  ECLIPSE: {
    label: "ECLIPSE",
    classes: "border-ink bg-ink text-hero-text",
  },
};

export function TypeBadge({
  type,
  className = "",
}: {
  type: ObservanceType;
  className?: string;
}) {
  const s = TYPE_STYLES[type];
  return (
    <span
      className={`inline-flex items-center rounded-[5px] border px-[7px] py-[2px] text-[9px] font-bold tracking-[0.6px] whitespace-nowrap ${s.classes} ${className}`}
    >
      {s.label}
    </span>
  );
}

const LEGEND: { type: ObservanceType; note: string }[] = [
  { type: "VRAT", note: "a fast you keep" },
  { type: "FESTIVAL", note: "a day you celebrate" },
  { type: "SPECIAL_SEASONAL", note: "a period, not a day" },
  { type: "PURNIMA_AMAVASYA", note: "the lunar anchors" },
];

/** The 4-badge legend shown above grouped calendars. */
export function TypeLegend({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[11px] border border-border bg-card px-4 py-[10px] ${className}`}
    >
      {LEGEND.map((l) => (
        <span key={l.type} className="flex items-center gap-[6px]">
          <TypeBadge type={l.type} />
          <span className="text-[11.5px] text-sub">{l.note}</span>
        </span>
      ))}
    </div>
  );
}
