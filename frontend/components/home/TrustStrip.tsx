/**
 * Section 4 — TRUST BADGE STRIP. Four fixed badges in a locked order
 * (PRD): Scripturally sourced · Pratha-aware · Fear-free · Shraddha-first.
 * Never reorder.
 */

const BADGES = [
  {
    icon: "📜",
    label: "Scripturally sourced",
    note: "Every claim traceable to a named text",
  },
  {
    icon: "🏡",
    label: "Pratha-aware",
    note: "Family custom named as custom, never dismissed",
  },
  {
    icon: "🕊️",
    label: "Fear-free",
    note: "Corrections, not warnings",
  },
  {
    icon: "🪔",
    label: "Shraddha-first",
    note: "Devotion over dread, always",
  },
] as const;

export function TrustStrip() {
  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-x-4 gap-y-4 px-4 py-5 md:grid-cols-4 md:px-10">
        {BADGES.map((b) => (
          <div key={b.label} className="flex items-start gap-[10px]">
            <span aria-hidden className="text-[18px] leading-none">
              {b.icon}
            </span>
            <div>
              <p className="text-[12.5px] leading-tight font-bold text-ink">
                {b.label}
              </p>
              <p className="mt-[2px] text-[11px] leading-snug text-sub">
                {b.note}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
