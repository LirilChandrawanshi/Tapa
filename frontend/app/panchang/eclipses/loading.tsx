import { CategoryHero } from "@/components/CategoryHero";
import { PanchangLoadingBody } from "@/components/panchang/PanchangLoadingBody";
import { PanchangSubnav } from "@/components/panchang/PanchangSubnav";

export default function Loading() {
  return (
    <div>
      <CategoryHero
        variant="pa"
        eyebrow="Panchang · Eclipses"
        title="Eclipses & Sutak: visibility decides everything"
        description="Grahan timings are pure astronomy — but what you observe depends entirely on whether the eclipse is visible from your city. That one rule resolves most confusion."
        meta={[
          { value: "—", label: "in 2026" },
          { value: "—", label: "solar grahan" },
          { value: "—", label: "lunar grahan" },
        ]}
        side={
          <div className="h-[86px] animate-pulse rounded-xl bg-white/10" />
        }
      />
      <PanchangSubnav active="eclipses" />
      <PanchangLoadingBody />
    </div>
  );
}
