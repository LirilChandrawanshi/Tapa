import { WhatsAppNudge } from "@/components/WhatsAppNudge";
import { CategoryTiles } from "@/components/home/CategoryTiles";
import { GuidesRail } from "@/components/home/GuidesRail";
import { HomeHero, HomeHeroFallback } from "@/components/home/HomeHero";
import { JourneyStepper } from "@/components/home/JourneyStepper";
import { KitsShelf } from "@/components/home/KitsShelf";
import { PanchangFold } from "@/components/home/PanchangFold";
import { PurohitStrip } from "@/components/home/PurohitStrip";
import { TrustStrip } from "@/components/home/TrustStrip";
import { fetchHomeSafe } from "@/lib/homeExtras";
import { todayIst } from "@/lib/panchangExtras";

/**
 * Homepage — the PRD's locked 12-section order. Sections 1 (announce bar),
 * 2 (top nav) and 12 (footer) come from app/layout.tsx; this page renders
 * 3–11 in order:
 *
 *   3. Hero            4. Trust badge strip   5. Panchang first fold
 *   6. Ritual kits     7. Journey stepper     8. From ritual guides
 *   9. Purohit strip  10. WhatsApp nudge     11. Explore by category
 *
 * One composed fetch (GET /api/v1/home); the backend may be down, so every
 * section carries its own fallback — nothing renders blank.
 */
export const dynamic = "force-dynamic";

export default async function Home() {
  const now = todayIst();
  const home = await fetchHomeSafe();

  const hero = home?.hero ?? [];
  const heroCard = hero[0] ?? null;
  const nextObservance = home?.nextObservances?.[0] ?? null;
  const kitsLaunched = home?.flags.kits_launched ?? false;

  return (
    <main>
      {/* 3 — HERO */}
      {hero.length > 0 ? (
        <HomeHero cards={hero} today={now} />
      ) : (
        <HomeHeroFallback today={now} />
      )}

      {/* 4 — TRUST BADGE STRIP */}
      <TrustStrip />

      {/* 5 — PANCHANG FIRST FOLD */}
      <PanchangFold
        payload={home?.panchangToday ?? null}
        nextObservance={nextObservance}
        now={now}
      />

      {/* 6 — RITUAL KITS SHELF */}
      <KitsShelf kitsLaunched={kitsLaunched} />

      {/* 7 — TODAY'S RITUAL JOURNEY STEPPER */}
      <JourneyStepper heroCard={heroCard} />

      {/* 8 — FROM RITUAL GUIDES */}
      <GuidesRail cards={home?.guidesRail ?? []} now={now} />

      {/* 9 — PUJAN WITH PUROHIT STRIP */}
      <PurohitStrip />

      {/* 10 — WHATSAPP NUDGE */}
      <div className="mx-auto max-w-[1280px] px-4 pt-5 md:px-10">
        <WhatsAppNudge copy="Never miss a vrat date" />
      </div>

      {/* 11 — EXPLORE BY CATEGORY */}
      <CategoryTiles counts={home?.counts ?? {}} kitsLaunched={kitsLaunched} />
    </main>
  );
}
