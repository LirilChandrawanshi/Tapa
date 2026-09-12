import { CategoryHero } from "@/components/CategoryHero";
import { PanchangLoadingBody } from "@/components/panchang/PanchangLoadingBody";
import { PanchangSubnav } from "@/components/panchang/PanchangSubnav";

/**
 * Instant pending UI for /panchang — same hero copy + the real subnav, so
 * switching tabs doesn't flash or reflow; only the data-dependent meta/side
 * numbers and the body below show a pulse until the real data lands.
 */
export default function Loading() {
  return (
    <div>
      <CategoryHero
        variant="pa"
        eyebrow="Panchang"
        title="The calendar that follows the Moon"
        description="Today's tithi, the year's vrat dates, and how to read any of it yourself. This page answers when — the ritual guides answer how."
        meta={[
          { value: "—", label: "days computed" },
          { value: "—", label: "IST timings" },
          { value: "—", label: "source" },
        ]}
        side={
          <div className="h-[86px] animate-pulse rounded-xl bg-white/10" />
        }
      />
      <PanchangSubnav active="today" />
      <PanchangLoadingBody />
    </div>
  );
}
