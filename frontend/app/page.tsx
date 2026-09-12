import { MethodBand } from "@/components/MethodBand";
import { BeginnersRail } from "@/components/home/BeginnersRail";
import { CalendarShelf } from "@/components/home/CalendarShelf";
import { CategorySpotlight } from "@/components/home/CategorySpotlight";
import { CategoryTiles } from "@/components/home/CategoryTiles";
import { CircleBand } from "@/components/home/CircleBand";
import { CorrectionsBand } from "@/components/home/CorrectionsBand";
import { GuidesRail } from "@/components/home/GuidesRail";
import { HomeHero, HomeHeroFallback } from "@/components/home/HomeHero";
import { JourneyStepper } from "@/components/home/JourneyStepper";
import { KitsShelf } from "@/components/home/KitsShelf";
import { LaunchBar } from "@/components/home/LaunchBar";
import { PanchangCard } from "@/components/home/PanchangCard";
import { PurohitStrip } from "@/components/home/PurohitStrip";
import { TrustStrip } from "@/components/home/TrustStrip";
import { fetchHomeSafe } from "@/lib/homeExtras";
import { todayIst } from "@/lib/panchangExtras";

/**
 * Homepage — matches the Home Phase 1 mock's locked order, sections 3–11
 * (1/2/12 — announce bar, top nav, footer — come from app/layout.tsx):
 *
 *   3. Launch bar         4. Hero (+ inline panchang card)
 *   5. Next four weeks    6. Three ways in (category tiles)
 *   7. Dharmic Concepts spotlight   8. Corrections, not warnings
 *   9. New to this?      10. How we decide what is true
 *  11. The Tapa Circle
 *
 * TrustStrip, KitsShelf, JourneyStepper, GuidesRail and PurohitStrip aren't
 * in that mock at all — kept and appended after it rather than cut, in
 * their prior relative order, so no live functionality is lost.
 *
 * One composed fetch (GET /api/v1/home); the backend may be down, so every
 * section carries its own fallback — nothing renders blank.
 */
export const revalidate = 300;

export default async function Home() {
  const now = todayIst();
  const home = await fetchHomeSafe();

  const hero = home?.hero ?? [];
  const heroCard = hero[0] ?? null;
  const nextObservances = home?.nextObservances ?? [];
  const kitsLaunched = home?.flags.kits_launched ?? false;

  const panchangSlot = (
    <PanchangCard
      payload={home?.panchangToday ?? null}
      nextObservance={nextObservances[0] ?? null}
      now={now}
    />
  );

  return (
    // pb-14 (56px) — sections only carry padding-top, so the last one needs
    // this or it sits flush against the footer. Matches the mock's
    // `.footer { margin-top: 56px }`.
    <main className="pb-14">
      {/* 3 — LAUNCH BAR */}
      <LaunchBar />

      {/* 4 — HERO (+ inline panchang card) */}
      {hero.length > 0 ? (
        <HomeHero cards={hero} today={now} panchangSlot={panchangSlot} />
      ) : (
        <HomeHeroFallback today={now} panchangSlot={panchangSlot} />
      )}

      {/* 5 — NEXT FOUR WEEKS */}
      <CalendarShelf observances={nextObservances} />

      {/* 6 — THREE WAYS IN */}
      <CategoryTiles counts={home?.counts ?? {}} kitsLaunched={kitsLaunched} />

      {/* 7 — DHARMIC CONCEPTS SPOTLIGHT */}
      <CategorySpotlight />

      {/* 8 — CORRECTIONS, NOT WARNINGS */}
      <CorrectionsBand />

      {/* 9 — NEW TO THIS? */}
      <BeginnersRail />

      {/* 10 — HOW WE DECIDE WHAT IS TRUE */}
      <div className="mx-auto max-w-[1280px] px-4 pt-10 md:px-10">
        <MethodBand />
      </div>

      {/* 11 — THE TAPA CIRCLE */}
      <CircleBand />

      {/* — sections not in the Phase 1 mock, kept and appended — */}
      <TrustStrip />
      <KitsShelf kitsLaunched={kitsLaunched} />
      <JourneyStepper heroCard={heroCard} />
      <GuidesRail cards={home?.guidesRail ?? []} now={now} />
      <PurohitStrip />
    </main>
  );
}
