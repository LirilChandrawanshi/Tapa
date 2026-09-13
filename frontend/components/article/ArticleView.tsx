import Link from "next/link";
import type { ReactNode } from "react";
import { ContentCard } from "@/components/ContentCard";
import { DpbBadge } from "@/components/DpbBadge";
import {
  DvpSplitCard,
  IntelligenceCardBlock,
} from "@/components/article/DvpSplitCard";
import { AudioPlayer } from "@/components/media/AudioPlayer";
import { SmartImage } from "@/components/media/SmartImage";
import { Pill } from "@/components/Pill";
import { SectionHeader } from "@/components/SectionHeader";
import { WhatsAppNudge } from "@/components/WhatsAppNudge";
import { fetchIntelligenceCards } from "@/lib/api";
import { getFlags } from "@/lib/flags";
import { ActionBar } from "./ActionBar";
import { ArticleAnalytics } from "./ArticleAnalytics";
import {
  CorrectionsLog,
  DpbPill,
  IntelligenceLayer,
  FastingCards,
  MythCards,
  Prose,
  QaAccordion,
  SankalpaCard,
  SectionTitle,
  SignificanceQuote,
  VidhiSteps,
} from "./blocks";
import { DesktopStickyBar } from "./DesktopStickyBar";
import { EkadashiGrainNote } from "./EkadashiGrainNote";
import { KathaCard } from "./KathaCard";
import { LangSection } from "./LangSection";
import { LangSwap } from "./LangSwap";
import { MantraChip } from "./MantraChip";
import { ModeSelector } from "./ModeSelector";
import { SamagriChecklist } from "./SamagriChecklist";
import {
  anchorId,
  articleHref,
  compositionCounts,
  dpbTagOf,
  fetchArticleSafe,
  fetchCorrectionsSafe,
  fetchObservanceSafe,
  fetchPanchangDaySafe,
  fetchRelatedSafe,
  formatObservanceDate,
  formatTithiInstant,
  hueFromClass,
  isEkadashiGuide,
  isFutureObservance,
  kitLinkedSlugOf,
  observanceTithiOf,
  subCategoryLabel,
  titleizeSlug,
  weekdayOf,
} from "@/lib/articleExtras";
import type { Article, Block, Dpb } from "@/lib/types";
import type { NavSectionKey } from "@/lib/taxonomy";

/* ── the article template ─────────────────────────────────────── */

export async function ArticleView({
  article,
  sectionKey,
  sectionLabel,
  sectionHref,
}: {
  article: Article;
  sectionKey: NavSectionKey;
  sectionLabel: string;
  sectionHref: string;
}) {
  const en = article.lang.en;
  const hi = article.lang.hi;
  const hiHasBlocks = (hi?.blocks.length ?? 0) > 0;
  const subLabel = subCategoryLabel(sectionKey, article.subCategory);
  const subHref = article.subCategory
    ? `${sectionHref}/${article.subCategory}`
    : sectionHref;
  const coreLabel =
    article.type === "DHARMIC_CONCEPT" ? "CORE CLAIM" : "CORE PRACTICE";
  const isBeginner = article.type === "BEGINNER_GUIDE";
  const nudgeContext =
    article.type === "DHARMIC_CONCEPT" ? "article-concept" : "article-vrat";

  const [
    observance,
    related,
    corrections,
    flags,
    panchangDay,
    companion,
    intelligenceCards,
  ] = await Promise.all([
      article.linkedObservanceSlug
        ? fetchObservanceSafe(article.linkedObservanceSlug)
        : Promise.resolve(null),
      article.relatedSlugs?.length
        ? fetchRelatedSafe(article.relatedSlugs)
        : Promise.resolve([]),
      fetchCorrectionsSafe(article.slug),
      getFlags(),
      article.observanceDate
        ? fetchPanchangDaySafe(article.observanceDate)
        : Promise.resolve(null),
      article.companionSlug
        ? fetchArticleSafe(article.companionSlug).then((r) => r.article)
        : Promise.resolve(null),
          article.intelligenceCardSlugs?.length
        ? fetchIntelligenceCards(article.intelligenceCardSlugs).catch(() => [])
        : Promise.resolve([]),
    ]);

  // A ritual guide's companion is its Beginner's Guide (quiet main-column banner);
  // a Beginner's Guide's companion is the full ritual guide (sidebar card).
  const companionBeginner =
    companion?.type === "BEGINNER_GUIDE" ? companion : null;
  const companionRitualGuide =
    companion && companion.type !== "BEGINNER_GUIDE" ? companion : null;

  const kitSlug = kitLinkedSlugOf(article);
  const ekadashi = isEkadashiGuide(article, observance);
  const tithi = observance ? observanceTithiOf(observance) : {};
  const paranaMuhurat = ekadashi
    ? panchangDay?.muhurats?.find((m) =>
        m.label.toLowerCase().includes("parana"),
      )
    : undefined;
  const counts = compositionCounts(article);

  const datelineParts = [
    formatObservanceDate(article.observanceDate),
    observance?.tithiLabel,
    "Delhi-NCR",
  ].filter(Boolean);

  const tocBlocks = en.blocks.filter(
    (b): b is Block & { title: string } => typeof b.title === "string",
  );
  const mythsBlock = en.blocks.find((b) => b.type === "MYTHS");
  const vidhiBlock = en.blocks.find((b) => b.type === "VIDHI");
  const samagriIndex = en.blocks.findIndex((b) => b.type === "SAMAGRI");
  const samagriBlock = samagriIndex >= 0 ? en.blocks[samagriIndex] : undefined;
  const samagriAnchor = samagriBlock
    ? samagriBlock.title
      ? anchorId(samagriBlock.title)
      : `section-${samagriIndex}`
    : null;
  const GLANCE_MAX = 6;
  const samagriAll = samagriBlock?.samagri ?? [];
  const samagriGlance = samagriAll.slice(0, GLANCE_MAX);
  const samagriRest = samagriAll.length - samagriGlance.length;
  const pdfHref = `/api/v1/cards/${article.slug}.pdf`;

  const relGuides = related.filter(
    (r) => !r.article || r.article.type !== "DHARMIC_CONCEPT",
  );
  const relConcepts = related.filter(
    (r) => r.article?.type === "DHARMIC_CONCEPT",
  );

  /* JSON-LD: Article + FAQPage (myths) + HowTo (vidhi) */
  const jsonLd: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: en.title,
      description: en.deck ?? en.heroSubtitle ?? "",
      inLanguage: "en",
      articleSection: subLabel || sectionLabel,
      datePublished: article.publishedAt ?? undefined,
      author: { "@type": "Organization", name: "The Tapa Co." },
      publisher: { "@type": "Organization", name: "The Tapa Co." },
    },
  ];
  if (mythsBlock?.myths?.length) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: mythsBlock.myths.map((m) => ({
        "@type": "Question",
        name: m.question,
        acceptedAnswer: { "@type": "Answer", text: m.answer },
      })),
    });
  }
  if (vidhiBlock?.steps?.length) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: `${en.title} — vidhi`,
      step: vidhiBlock.steps.map((s) => ({
        "@type": "HowToStep",
        position: s.number,
        name: s.title,
        text: s.description ?? s.title,
      })),
    });
  }

  function renderBlock(block: Block, index: number): ReactNode {
    const id = block.title ? anchorId(block.title) : `section-${index}`;
    let body: ReactNode;
    switch (block.type) {
      case "SIGNIFICANCE_QUOTE":
        body = <SignificanceQuote block={block} />;
        break;
      case "SANKALPA":
        body = <SankalpaCard block={block} />;
        break;
      case "SAMAGRI":
        body = (
          <SamagriChecklist
            slug={article.slug}
            title={en.title}
            items={block.samagri ?? []}
          />
        );
        break;
      case "VIDHI":
        body = <VidhiSteps block={block} showPills={!isBeginner} />;
        break;
      case "MANTRA":
        body = block.mantra ? (
          <MantraChip slug={article.slug} mantra={block.mantra} />
        ) : null;
        break;
      case "FASTING":
        body = <FastingCards block={block} />;
        break;
      case "DHARMA_VS_PRATHA":
        // The editorial method's central section — a real two-column split,
        // never prose, so neither column can be read as the other.
        body = block.dvp ? <DvpSplitCard dvp={block.dvp} /> : null;
        break;
      case "MYTHS":
        body = <MythCards block={block} />;
        break;
      case "QA":
        body = <QaAccordion block={block} />;
        break;
      case "KATHA":
        // the vrat katha card — a story panel, never plain prose (PRD §5.3)
        body = block.text ? (
          <KathaCard
            text={block.text}
            beats={block.beats}
            // `attribution` is the key the content actually carries (and what
            // SIGNIFICANCE_QUOTE uses); reading only `meta.source` silently
            // dropped the named scripture on every katha card.
            source={block.meta?.attribution ?? block.meta?.source}
            audioId={block.meta?.audioId}
          />
        ) : null;
        break;
      default:
        body = block.text ? <Prose text={block.text} /> : null;
    }
    return (
      <section key={`${block.type}-${index}`}>
        {block.title && <SectionTitle id={id} title={block.title} />}
        {body}
      </section>
    );
  }

  function relatedCard({
    slug,
    article: rel,
  }: {
    slug: string;
    article: Article | null;
  }): ReactNode {
    return rel ? (
      <ContentCard
        key={slug}
        hue={hueFromClass(rel.hueClass)}
        href={articleHref(rel)}
        title={rel.lang.en.title}
        meta={formatObservanceDate(rel.observanceDate)}
        summary={rel.lang.en.deck ?? rel.lang.en.heroSubtitle ?? ""}
        pills={
          rel.dpb ? (
            <DpbBadge
              tag={dpbTagOf(rel.dpb)}
              score={rel.dpb.confidenceScore}
              source={rel.dpb.sourceClass}
            />
          ) : undefined
        }
        readTime={rel.readMinutes ? `${rel.readMinutes} min` : undefined}
      />
    ) : (
      <ContentCard
        key={slug}
        hue="gold"
        href={`${subHref}/${slug}`}
        title={titleizeSlug(slug)}
        summary="Guide — opens in this collection."
      />
    );
  }

  /* Dates & parana strip tiles (#59) — omit any tile whose data is missing */
  const dateTiles: { label: string; value: string; sub?: string }[] = [];
  if (article.observanceDate) {
    dateTiles.push({
      label: "DATE",
      value: formatObservanceDate(article.observanceDate),
      sub: weekdayOf(article.observanceDate),
    });
    if (observance?.tithiLabel) {
      dateTiles.push({
        label: "TITHI",
        value: observance.tithiLabel,
        sub: tithi.startsAt
          ? `starts ${formatTithiInstant(tithi.startsAt)}`
          : undefined,
      });
    }
    if (tithi.endsAt) {
      dateTiles.push({
        label: "TITHI ENDS",
        value: formatTithiInstant(tithi.endsAt),
      });
    }
    if (paranaMuhurat) {
      dateTiles.push({
        label: "PARANA",
        value: `${paranaMuhurat.from}–${paranaMuhurat.to}`,
        sub: paranaMuhurat.label,
      });
    }
  }

  const stickyTitle = paranaMuhurat
    ? `Parana — ${paranaMuhurat.from}–${paranaMuhurat.to}`
    : en.title;
  const stickySubtitle = paranaMuhurat ? paranaMuhurat.label : en.heroSubtitle;

  return (
    <div className="pb-20 md:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticleAnalytics slug={article.slug} type={article.type} />

      {/* hero — ONE band (mock `.hero` + `.hero-bg` + `.hero-ov`). When a hero
          asset exists it becomes the background and the editorial chrome sits
          on top of a scrim; with no asset the hue gradient carries it. These
          used to be two stacked sections, which printed the title twice. */}
      <header
        className={`relative overflow-hidden ${article.heroImageId ? "bg-ink" : (article.hueClass ?? "h-devi")}`}
      >
        {article.heroImageId ? (
          <>
            <SmartImage
              id={article.heroImageId}
              alt=""
              hueClass={article.hueClass}
              aspect="1280 / 380"
              className="absolute inset-0 h-full w-full rounded-none! object-cover"
            />
            <div
              aria-hidden
              className="absolute inset-0 [background:linear-gradient(to_top,rgba(26,5,9,0.95)_12%,rgba(26,5,9,0.66)_48%,rgba(26,5,9,0.2)_100%)] md:[background:linear-gradient(to_right,rgba(26,5,9,0.94)_0%,rgba(26,5,9,0.7)_42%,rgba(26,5,9,0.16)_74%,rgba(26,5,9,0.02)_100%)]"
            />
          </>
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 [background:radial-gradient(ellipse_58%_60%_at_78%_30%,rgba(255,255,255,0.08)_0%,transparent_62%)]"
          />
        )}
        <div
          className={`relative mx-auto max-w-[1280px] px-4 py-9 md:px-10 md:py-[52px] ${
            article.heroImageId ? "flex min-h-[300px] items-end md:min-h-[380px]" : ""
          }`}
        >
          <div className="max-w-[680px]">
            <p className="mb-[9px] text-[11px] tracking-[0.9px] text-eyebrow-dark uppercase">
              {sectionLabel}
              {subLabel ? ` · ${subLabel}` : ""}
            </p>
            {!isBeginner && article.dpb && (
              <DpbBadge
                tag={dpbTagOf(article.dpb)}
                score={article.dpb.confidenceScore}
                source={article.dpb.sourceClass}
                className="mb-3"
              />
            )}
            <h1 className="mb-[10px] text-[28px] leading-[1.12] font-bold tracking-[-0.8px] text-hero-text md:text-[40px]">
              <LangSwap en={en.title} hi={hi?.title} />
            </h1>
            {(en.deck ?? en.heroSubtitle) && (
              <p className="mb-[9px] text-[15px] leading-[1.6] text-hero-text/75 md:text-[17px]">
                <LangSwap
                  en={en.deck ?? en.heroSubtitle ?? ""}
                  hi={hi?.deck ?? hi?.heroSubtitle}
                />
              </p>
            )}
            {datelineParts.length > 0 && (
              <p className="text-[13.5px] font-semibold text-amber">
                {datelineParts.join(" · ")}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* utility action bar (G17) — between hero and content, all viewports */}
      <ActionBar
        slug={article.slug}
        title={en.title}
        pdfHref={pdfHref}
        kitSlug={kitSlug}
        purohitVisible={flags.purohit_tab_visible}
        remindEligible={isFutureObservance(article.observanceDate)}
      />

      {/* trust chips + audio guide (G20) */}
      <div id="audio" className="scroll-mt-24 border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1280px] flex-col justify-between gap-[10px] px-4 py-[11px] md:flex-row md:items-center md:gap-5 md:px-10">
          <div className="flex flex-wrap items-center gap-4">
            {(
              [
                ["Scripturally sourced", "#27500A"],
                ["Region aware", "#E8A020"],
                ["Fear-free", "#EF0F54"],
              ] as const
            ).map(([label, dot]) => (
              <span
                key={label}
                className="flex items-center gap-[6px] text-[11.5px] font-medium whitespace-nowrap text-mid"
              >
                <span
                  aria-hidden
                  className="size-[6px] rounded-full"
                  style={{ backgroundColor: dot }}
                />
                {label}
              </span>
            ))}
          </div>
          <AudioPlayer
            enId={en.audioGuideMediaId}
            hiId={hi?.audioGuideMediaId}
            label="Listen to this guide"
            className="shrink-0 md:w-[360px]"
          />
        </div>
      </div>

      {/* sticky jump-to TOC */}
      {tocBlocks.length > 0 && (
        <nav
          aria-label="Jump to section"
          className="sticky top-[70px] z-50 border-b border-pratha-bd bg-pratha-bg lg:top-[72px]"
        >
          <div className="mx-auto flex max-w-[1280px] items-center gap-[9px] overflow-x-auto px-4 py-3 [scrollbar-width:none] md:px-10 [&::-webkit-scrollbar]:hidden">
            <span className="mr-1 text-[11.5px] font-bold tracking-[0.5px] whitespace-nowrap text-gold">
              JUMP TO
            </span>
            {tocBlocks.map((block) => (
              <a
                key={block.title}
                href={`#${anchorId(block.title)}`}
                className="shrink-0 rounded-[10px] border-[1.5px] border-border bg-card px-[15px] py-[8px] text-[13px] font-medium whitespace-nowrap text-ink hover:border-cta"
              >
                {block.title}
              </a>
            ))}
          </div>
        </nav>
      )}

      {/* body: main + sidebar */}
      <div className="mx-auto max-w-[1280px] px-4 pt-7 pb-16 md:px-10 md:pb-20 lg:pb-[104px]">
        <div className="grid items-start gap-11 lg:grid-cols-[minmax(0,1fr)_330px]">
          <main className="max-w-[740px] min-w-0">
            {/* mode selector (G18) — intent signal only, never filters */}
            <ModeSelector slug={article.slug} />

            {/* dates & parana strip (#59) */}
            {dateTiles.length > 0 && (
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {dateTiles.map((tile, i) => (
                    <div
                      key={tile.label}
                      className={`rounded-[13px] border px-[14px] py-[12px] ${
                        // An odd tile count left the last one stranded at half
                        // width on phones, with a hole beside it. Let it span
                        // the row instead. At md the grid is 4-up and a short
                        // final row reads as normal, so this is mobile-only.
                        i === dateTiles.length - 1 && dateTiles.length % 2 === 1
                          ? "col-span-2 md:col-span-1"
                          : ""
                      } ${
                        tile.label === "PARANA"
                          ? "border-dharma-bd bg-dharma-bg"
                          : "border-border bg-card"
                      }`}
                    >
                      <p className="mb-[3px] text-[10px] font-bold tracking-[0.6px] text-gold">
                        {tile.label}
                      </p>
                      <p className="text-[13.5px] leading-[1.4] font-bold text-ink">
                        {tile.value}
                      </p>
                      {tile.sub && (
                        <p className="mt-[2px] text-[11.5px] text-sub">
                          {tile.sub}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                {ekadashi && (
                  <p className="mt-2 text-[12.5px] leading-[1.7] text-sub italic">
                    The parana window is the only timing that matters here.
                  </p>
                )}
              </div>
            )}

            {ekadashi && <EkadashiGrainNote />}
            <DesktopStickyBar
              title={stickyTitle}
              subtitle={stickySubtitle}
              pdfHref={pdfHref}
              circleHref={`/tapa-circle?from=/ritual-guides/${article.slug}`}
            />

            {/* companion — ritual guide's Beginner's Guide, quiet, never a CTA */}
            {companionBeginner && (
              <Link
                href={articleHref(companionBeginner)}
                className="mb-6 flex w-full items-center gap-3 rounded-[12px] border border-dashed border-border bg-bg px-4 py-3 hover:border-pratha-bd hover:bg-pratha-bg"
              >
                <span className="flex size-[30px] shrink-0 items-center justify-center rounded-[8px] border border-pratha-bd bg-pratha-bg text-sm">
                  📖
                </span>
                <span className="min-w-0 flex-1 text-[14px] leading-[1.5] text-sub">
                  New to this? There&rsquo;s a Beginner&rsquo;s Guide first —{" "}
                  <b className="font-medium text-body">
                    {companionBeginner.lang.en.title}
                  </b>
                </span>
                <span aria-hidden className="shrink-0 text-sub">
                  ›
                </span>
              </Link>
            )}

            {/* beginner meta strip (#73) */}
            {isBeginner && (
              <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[13px] border border-dharma-bd bg-dharma-bg px-[17px] py-[13px] text-[13px] font-semibold text-dharma-fg">
                <span>📖 No prior reading needed</span>
                <span>🕉 No Sanskrit required</span>
                {article.readMinutes && (
                  <span>⏱ {article.readMinutes} min read</span>
                )}
                <span>✓ Start anywhere you like</span>
              </div>
            )}

            {/* source-of-truth card — suppressed on beginner guides (#73) */}
            {!isBeginner && article.dpb && (
              <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border-light px-5 py-3">
                  <span className="text-[11px] font-bold tracking-[0.6px] text-sub">
                    SOURCE OF TRUTH
                  </span>
                  <Link
                    href="/editorial-method"
                    className="text-xs font-bold text-cta"
                  >
                    How we decide ›
                  </Link>
                </div>
                <div className="px-5 py-[17px]">
                  <p className="mb-[6px] text-[11px] font-bold tracking-[0.6px] text-gold">
                    {coreLabel}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <DpbBadge
                      tag={dpbTagOf(article.dpb)}
                      score={article.dpb.confidenceScore}
                      source={article.dpb.sourceClass}
                    />
                    {article.dpb.sourceName && (
                      <Pill>
                        {[article.dpb.sourceName, article.dpb.sourceRef]
                          .filter(Boolean)
                          .join(" · ")}
                      </Pill>
                    )}
                  </div>
                </div>
                {article.dpb.confidenceNote && (
                  <p className="border-t border-border-light bg-[#FCFAF6] px-5 py-3 text-[12.5px] leading-[1.7] text-sub">
                    {article.dpb.confidenceNote}
                  </p>
                )}
                {/* composition counter (#58) */}
                <p className="border-t border-border-light px-5 py-3 text-[12.5px] leading-[1.7] text-sub">
                  This guide: <b className="text-ink">1 core practice</b> ·{" "}
                  {counts.scriptural} scriptural element
                  {counts.scriptural === 1 ? "" : "s"} · {counts.regional}{" "}
                  regional custom{counts.regional === 1 ? "" : "s"} ·{" "}
                  {counts.corrections} correction
                  {counts.corrections === 1 ? "" : "s"}
                </p>
              </div>
            )}

            {/* intro */}
            {en.introHtml && (
              <div className="mb-2 text-[15px] leading-[1.85] [&_p]:mb-[14px]">
                <LangSwap en={en.introHtml} hi={hi?.introHtml} html />
              </div>
            )}

            {/* ordered blocks — both languages server-rendered, toggled client-side */}
            {hiHasBlocks ? (
              <>
                <LangSection lang="en">
                  {en.blocks.map((block, i) => renderBlock(block, i))}
                </LangSection>
                <LangSection lang="hi">
                  {hi!.blocks.map((block, i) => renderBlock(block, i))}
                </LangSection>
              </>
            ) : (
              en.blocks.map((block, i) => renderBlock(block, i))
            )}

            {/* Circle nudge — after the last block, whatever it is (#18) */}
            <WhatsAppNudge context={nudgeContext} />

            {/* Tapa intelligence layer — suppressed on beginner guides */}
            {!isBeginner && (
              <IntelligenceLayer article={article} coreLabel={coreLabel} />
            )}

            {/* corrections log (#71/#134) — only when something was fixed */}
            {corrections.length > 0 && (
              <CorrectionsLog corrections={corrections} />
            )}

            {/* shared intelligence cards — the rule that outlives this one
                date, maintained once and referenced here (#grains in spec) */}
            {intelligenceCards.length > 0 && (
              <div className="mt-8 space-y-4">
                {intelligenceCards.map((card) => (
                  <IntelligenceCardBlock key={card.slug} card={card} />
                ))}
              </div>
            )}

            {/* related — grouped by what they are (#66) */}
            {(related.length > 0 || article.linkedObservanceSlug) && (
              <div className="mt-10 mb-4">
                <SectionHeader eyebrow="Keep reading" title="Related" />
                {relGuides.length > 0 && (
                  <div className="mb-6">
                    <p className="mb-3 text-[11px] font-bold tracking-[0.7px] text-gold">
                      RELATED RITUAL GUIDES
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {relGuides.map(relatedCard)}
                    </div>
                  </div>
                )}
                {relConcepts.length > 0 && (
                  <div className="mb-6">
                    <p className="mb-3 text-[11px] font-bold tracking-[0.7px] text-gold">
                      RELATED CONCEPTS
                    </p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {relConcepts.map(relatedCard)}
                    </div>
                  </div>
                )}
                {article.linkedObservanceSlug && (
                  <div>
                    <p className="mb-3 text-[11px] font-bold tracking-[0.7px] text-gold">
                      RELATED DATES
                    </p>
                    <Link
                      href={`/panchang/o/${article.linkedObservanceSlug}`}
                      className="flex items-center gap-[13px] rounded-[14px] border border-border bg-card px-[18px] py-[15px] hover:border-cta"
                    >
                      <span
                        aria-hidden
                        className="flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-pratha-bg text-lg"
                      >
                        📅
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] font-bold text-ink">
                          {observance?.name ?? "This date on the panchang"}
                        </span>
                        <span className="block text-xs text-sub">
                          {[
                            formatObservanceDate(
                              observance?.date ?? article.observanceDate,
                            ),
                            observance?.tithiLabel,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "Timings, tithi and the full day"}
                        </span>
                      </span>
                      <span aria-hidden className="text-cta">
                        ›
                      </span>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* cross-sell band (#67) — knowledge before commerce, stated */}
            <div className="mt-8 mb-12">
              <div className="grid gap-3 sm:grid-cols-3">
                {kitSlug ? (
                  <Link
                    href={`/ritual-pujans/p/${kitSlug}`}
                    className="rounded-[14px] border border-border bg-card px-[17px] py-[15px] hover:border-cta"
                  >
                    <p className="mb-1 text-lg" aria-hidden>
                      🛒
                    </p>
                    <p className="text-[13.5px] font-bold text-ink">
                      Ritual Kit
                    </p>
                    <p className="mt-[3px] text-xs leading-[1.6] text-sub">
                      Everything on the samagri list, in one box.
                    </p>
                    <p className="mt-2 text-xs font-bold text-cta">
                      Order the kit ›
                    </p>
                  </Link>
                ) : (
                  <div className="rounded-[14px] border border-border bg-bg px-[17px] py-[15px]">
                    <p className="mb-1 text-lg grayscale" aria-hidden>
                      🛒
                    </p>
                    <p className="text-[13.5px] font-bold text-ink">
                      Ritual Kit
                    </p>
                    <p className="mt-[3px] text-xs leading-[1.6] text-sub">
                      No kit for this guide — the samagri list above is free.
                    </p>
                  </div>
                )}
                {flags.purohit_tab_visible ? (
                  <Link
                    href="/pujan-with-purohit"
                    className="rounded-[14px] border border-border bg-card px-[17px] py-[15px] hover:border-cta"
                  >
                    <p className="mb-1 text-lg" aria-hidden>
                      🙏
                    </p>
                    <p className="text-[13.5px] font-bold text-ink">Purohit</p>
                    <p className="mt-[3px] text-xs leading-[1.6] text-sub">
                      A verified purohit for the home pujan.
                    </p>
                    <p className="mt-2 text-xs font-bold text-cta">
                      Book a purohit ›
                    </p>
                  </Link>
                ) : (
                  <div className="rounded-[14px] border border-border bg-bg px-[17px] py-[15px]">
                    <p className="mb-1 text-lg grayscale" aria-hidden>
                      🙏
                    </p>
                    <p className="text-[13.5px] font-bold text-ink">Purohit</p>
                    <p className="mt-[3px] text-xs leading-[1.6] text-sub">
                      Opens soon. This vrat needs no purohit to be valid.
                    </p>
                  </div>
                )}
                <Link
                  href="/tapa-circle"
                  className="rounded-[14px] border border-border bg-card px-[17px] py-[15px] hover:border-cta"
                >
                  <p className="mb-1 text-lg" aria-hidden>
                    💬
                  </p>
                  <p className="text-[13.5px] font-bold text-ink">
                    Tapa Circle
                  </p>
                  <p className="mt-[3px] text-xs leading-[1.6] text-sub">
                    Reminders on WhatsApp, the evening before.
                  </p>
                  <p className="mt-2 text-xs font-bold text-cta">
                    Join the Circle ›
                  </p>
                </Link>
              </div>
              <p className="mt-3 text-[12.5px] leading-[1.7] text-sub italic">
                You do not need any of these. The guide is complete on its own.
              </p>
            </div>
          </main>

          {/* sticky sidebar (desktop) */}
          {/* Bounded so the fixed DesktopStickyBar can never sit on top of it.
              `shrink-0` on the children is load-bearing: as flex items they were
              being compressed below their natural height, and since every card is
              `overflow-hidden` that sliced their content mid-line instead of
              scrolling. Now the column scrolls and each card renders whole. */}
          <aside className="sticky top-[84px] hidden max-h-[calc(100vh-168px)] flex-col gap-[13px] overflow-y-auto overscroll-contain lg:flex [&>*]:shrink-0 [scrollbar-color:#dcd2bf_transparent] [scrollbar-width:thin]">
            <div className="overflow-hidden rounded-[14px] border border-border bg-card">
              <div className="border-b border-border-light px-4 py-3 text-[11px] font-bold tracking-[0.6px] text-sub">
                WHY YOU CAN TRUST THIS
              </div>
              <div className="px-4 py-[14px]">
                {!isBeginner && article.dpb ? (
                  <>
                    <DpbBadge
                      tag={dpbTagOf(article.dpb)}
                      score={article.dpb.confidenceScore}
                      source={article.dpb.sourceClass}
                      className="mb-[9px]"
                    />
                    <p className="text-xs leading-[1.75] text-body">
                      <b className="text-ink">
                        {[article.dpb.sourceName, article.dpb.sourceRef]
                          .filter(Boolean)
                          .join(" · ")}
                      </b>
                      {article.dpb.confidenceNote
                        ? ` — ${article.dpb.confidenceNote}`
                        : ""}
                    </p>
                  </>
                ) : (
                  <p className="text-xs leading-[1.75] text-sub">
                    {isBeginner
                      ? "Written for first-timers — every term explained as it appears."
                      : "Timing and calendar content carries no DPB tag by design."}
                  </p>
                )}
              </div>
              {!isBeginner && (
                <div className="flex flex-col gap-[6px] border-t border-border-light bg-[#FCFAF6] px-4 py-3">
                  {(
                    [
                      ["dharma", "DHARMA", "Named in a text you could open."],
                      ["pratha", "PRATHA", "Custom. Real — not scripture."],
                      ["bhranti", "BHRANTI", "A misconception, corrected."],
                    ] as const
                  ).map(([variant, label, copy]) => (
                    <p
                      key={label}
                      className="flex items-center gap-2 text-[11px] text-sub"
                    >
                      <Pill variant={variant}>{label}</Pill>
                      {copy}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* samagri quick checklist mirror (G28) — titles only */}
            {samagriAll.length ? (
              <div className="overflow-hidden rounded-[14px] border border-border bg-card">
                <div className="flex items-baseline justify-between gap-2 border-b border-border-light px-4 py-3 text-[11px] font-bold tracking-[0.6px] text-sub">
                  SAMAGRI AT A GLANCE
                  <span className="font-mono text-[10.5px] font-normal">
                    {samagriAll.length}
                  </span>
                </div>
                <ul className="px-4 py-[10px]">
                  {samagriGlance.map((item, i) => (
                    <li
                      key={`${item.name}-${i}`}
                      className={`flex items-baseline gap-2 py-[4px] text-[12.5px] ${
                        item.optional ? "text-sub" : "text-body"
                      }`}
                    >
                      <span aria-hidden className="text-[10px] text-gold">
                        ◆
                      </span>
                      {item.name}
                      {item.optional && (
                        <span className="text-[9.5px] font-bold tracking-[0.4px] text-sub">
                          OPTIONAL
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                {samagriAnchor && (
                  <a
                    href={`#${samagriAnchor}`}
                    className="block border-t border-border-light bg-[#FCFAF6] px-4 py-[9px] text-xs font-bold text-cta hover:underline"
                  >
                    {samagriRest > 0
                      ? `+${samagriRest} more — open the full checklist ›`
                      : "Open the full checklist ›"}
                  </a>
                )}
              </div>
            ) : null}

            {/* companion — beginner guide's full ritual guide, ready for the detail */}
            {companionRitualGuide && (
              <Link
                href={articleHref(companionRitualGuide)}
                className="rounded-[13px] border border-dashed border-border bg-bg px-4 py-[14px] hover:border-pratha-bd hover:bg-pratha-bg"
              >
                <span className="mb-2 flex items-center gap-[9px]">
                  <span className="flex size-[26px] shrink-0 items-center justify-center rounded-[7px] border border-border bg-card text-xs">
                    📜
                  </span>
                  <span className="text-[10px] font-bold tracking-[0.6px] text-gold uppercase">
                    Ready for the detail?
                  </span>
                </span>
                <p className="mb-[11px] text-[13px] leading-[1.6] text-sub">
                  The full vidhi — steps, timings and the sourcing behind each
                  one.
                </p>
                <span className="block w-full rounded-[9px] border-[1.5px] border-yellow py-[9px] text-center text-[13px] font-bold text-[#8A6100]">
                  {companionRitualGuide.lang.en.title}
                </span>
              </Link>
            )}
          </aside>
        </div>
      </div>

      {/* mobile bottom CTA */}
      <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-border bg-white/95 px-[14px] pt-[10px] pb-[calc(10px+env(safe-area-inset-bottom))] shadow-[0_-2px_16px_rgba(28,23,18,0.08)] backdrop-blur-[10px] md:hidden">
        <a
          href={pdfHref}
          className="flex flex-col items-center rounded-[11px] bg-cta p-3 leading-[1.25] text-white"
        >
          <span className="text-[12.5px] font-bold">Download ritual card</span>
          <span className="text-[11px] opacity-80">
            Samagri · steps · mantra
          </span>
        </a>
      </div>
    </div>
  );
}
