import { CategoryHero } from "@/components/CategoryHero";
import { PanchangLoadingBody } from "@/components/panchang/PanchangLoadingBody";
import { PanchangSubnav } from "@/components/panchang/PanchangSubnav";

export default function Loading() {
  return (
    <div>
      <CategoryHero
        variant="pa"
        eyebrow="Panchang · Calendar"
        title="2026 Vrat Calendar"
        description="Every Ekadashi, Pradosh, Chaturthi, Purnima and Amavasya of the year — with the tithi each one follows, so you can check any of it against your own panchang."
        meta={[
          { value: "—", label: "dates" },
          { value: "—", label: "Ekadashis" },
          { value: "—", label: "Pradosh vrats" },
        ]}
        side={
          <div className="h-[86px] animate-pulse rounded-xl bg-white/10" />
        }
      />
      <PanchangSubnav active="vrat" />
      <PanchangLoadingBody />
    </div>
  );
}
