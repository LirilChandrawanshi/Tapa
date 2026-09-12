import { CategoryHero } from "@/components/CategoryHero";
import { PanchangLoadingBody } from "@/components/panchang/PanchangLoadingBody";
import { PanchangSubnav } from "@/components/panchang/PanchangSubnav";

export default function Loading() {
  return (
    <div>
      <CategoryHero
        variant="pa"
        eyebrow="Panchang · Calendar"
        title="Festival Calendar 2026"
        description="For anyone who plans in months rather than tithis. Gregorian dates first, with the tithi beneath — so you can book leave and still know which lunar day you are actually observing."
        meta={[
          { value: "—", label: "festivals" },
          { value: "—", label: "with a full guide" },
          { value: "—", label: "guides coming" },
        ]}
        side={
          <div className="h-[86px] animate-pulse rounded-xl bg-white/10" />
        }
      />
      <PanchangSubnav active="festival" />
      <PanchangLoadingBody />
    </div>
  );
}
