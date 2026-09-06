import { ContentCard } from "@/components/ContentCard";
import { CountdownPill } from "@/components/CountdownPill";
import { DpbBadge } from "@/components/DpbBadge";
import {
  articleHref,
  dpbTagOf,
  formatObservanceDate,
  hueFromClass,
} from "@/lib/articleExtras";
import type { Article } from "@/lib/types";

/** Maps API articles onto the M1 ContentCard grid. */
export function ArticleCardGrid({
  articles,
  now,
}: {
  articles: Article[];
  now: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => {
        const en = article.lang.en;
        return (
          <ContentCard
            key={article.slug}
            hue={hueFromClass(article.hueClass)}
            href={articleHref(article)}
            topLeft={
              article.observanceDate ? (
                <CountdownPill date={article.observanceDate} now={now} />
              ) : undefined
            }
            title={en.title}
            meta={formatObservanceDate(article.observanceDate) || undefined}
            summary={en.deck ?? en.heroSubtitle ?? ""}
            pills={
              article.dpb ? (
                <DpbBadge
                  tag={dpbTagOf(article.dpb)}
                  score={article.dpb.confidenceScore}
                  source={article.dpb.sourceClass}
                />
              ) : undefined
            }
            readTime={
              article.readMinutes ? `${article.readMinutes} min` : undefined
            }
          />
        );
      })}
    </div>
  );
}

/** Tasteful empty state for a section that has no published guides yet. */
export function EmptyShelf({ label }: { label: string }) {
  return (
    <div className="rounded-[15px] border border-dashed border-border bg-card/60 px-6 py-10 text-center">
      <p aria-hidden className="mb-2 text-xl text-cta">
        ✽
      </p>
      <p className="mb-1 text-[14.5px] font-bold text-ink">
        {label} guides land here as they&rsquo;re published
      </p>
      <p className="mx-auto max-w-[420px] text-[12.5px] leading-relaxed text-sub">
        Each one is sourced from a named text before it ships — we would
        rather publish slowly than publish rumour.
      </p>
    </div>
  );
}
