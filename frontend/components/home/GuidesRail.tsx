import { ContentCard } from "@/components/ContentCard";
import { CountdownPill } from "@/components/CountdownPill";
import { DpbBadge } from "@/components/DpbBadge";
import { SectionHeader } from "@/components/SectionHeader";
import { formatObservanceDate, hueFromClass } from "@/lib/articleExtras";
import { badgeTagOf, cardHref, type HomeCard } from "@/lib/homeExtras";

/**
 * Section 8 — FROM RITUAL GUIDES. The curated guides rail as ContentCards:
 * four-up on desktop, a snap horizontal scroll on mobile. A dead backend
 * degrades to a tasteful empty shelf, never a blank section.
 */
export function GuidesRail({ cards, now }: { cards: HomeCard[]; now: string }) {
  return (
    <section className="mx-auto max-w-[1280px] px-4 pt-10 md:px-10">
      <SectionHeader
        eyebrow="From Ritual Guides"
        title="The complete vidhi, before the date arrives"
        description="Step by step, every claim tagged and traceable to a named text — with the misconceptions corrected at the end."
        viewAllHref="/ritual-guides"
      />
      {cards.length > 0 ? (
        <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
          {cards.map((card) => {
            const tag = badgeTagOf(card.dpbTag);
            return (
              <div
                key={card.slug}
                className="min-w-[260px] snap-start lg:min-w-0 [&>a]:h-full"
              >
                <ContentCard
                  hue={hueFromClass(card.hueClass ?? undefined)}
                  imageId={card.imageId}
                  href={cardHref(card)}
                  topLeft={
                    card.observanceDate ? (
                      <CountdownPill date={card.observanceDate} now={now} />
                    ) : undefined
                  }
                  title={card.title}
                  meta={
                    formatObservanceDate(card.observanceDate ?? undefined) ||
                    undefined
                  }
                  summary={card.subtitle ?? ""}
                  pills={
                    tag ? (
                      <DpbBadge
                        tag={tag}
                        score={
                          tag !== "bhranti"
                            ? (card.dpbScore ?? undefined)
                            : undefined
                        }
                      />
                    ) : undefined
                  }
                  readTime={
                    card.readMinutes ? `${card.readMinutes} min` : undefined
                  }
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[15px] border border-dashed border-border bg-card/60 px-6 py-10 text-center">
          <p aria-hidden className="mb-2 text-xl text-cta">
            ✽
          </p>
          <p className="mb-1 text-[14.5px] font-bold text-ink">
            Guides land here as they&rsquo;re published
          </p>
          <p className="mx-auto max-w-[420px] text-[12.5px] leading-relaxed text-sub">
            Each one is sourced from a named text before it ships — we would
            rather publish slowly than publish rumour.
          </p>
        </div>
      )}
    </section>
  );
}
