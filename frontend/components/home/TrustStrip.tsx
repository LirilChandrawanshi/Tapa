import { getFlags } from "@/lib/flags";

/**
 * Section 4 — TRUST BADGE STRIP. Two phases, both locked orders (PRD):
 *   P1 (kits off): Scripturally sourced · Pratha-aware · Fear-free ·
 *   Shraddha-first. Never reorder.
 *   P2 (kits_launched): the commerce trust tiles — delivery promise,
 *   prepaid-only, sourcing, Gyan Patrika.
 * The flag can be passed in; when it isn't (app/page.tsx renders bare),
 * it is read here from the DB-driven flags endpoint.
 */

const P1_BADGES = [
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

const P2_BADGES = [
  {
    icon: "📦",
    label: "Delivered before the date",
    note: "— or your money back",
  },
  {
    icon: "💳",
    label: "Prepaid only",
    note: "No COD surprises",
  },
  {
    icon: "🧺",
    label: "Sourced, not resold",
    note: "Chandni Chowk, Moradabad, Khurja, Haridwar, Varanasi",
  },
  {
    icon: "📖",
    label: "A Gyan Patrika booklet",
    note: "In every kit",
  },
] as const;

export async function TrustStrip({ kitsLaunched }: { kitsLaunched?: boolean }) {
  const launched = kitsLaunched ?? (await getFlags()).kits_launched;
  const badges = launched ? P2_BADGES : P1_BADGES;

  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto grid max-w-[1280px] grid-cols-2 gap-x-4 gap-y-4 px-4 py-5 md:grid-cols-4 md:px-10">
        {badges.map((b) => (
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
