import Link from "next/link";
import { DpbBadge } from "@/components/DpbBadge";
import { AudioPlayer } from "@/components/media/AudioPlayer";
import { Pill } from "@/components/Pill";
import { WhatsAppNudge } from "@/components/WhatsAppNudge";
import { mediaUrl } from "@/lib/media";
import { getFlags } from "@/lib/flags";
import { ArticleAnalytics } from "./ArticleAnalytics";
import {
  BlockBody,
  ConceptHeading,
  CorrectionsLog,
  IntelligenceLayer,
  TagRow,
  TurnStatement,
} from "./blocks";
import {
  ConceptHeroButtons,
  ConceptHeroShare,
  ConceptMobileBar,
  ConceptSaveCta,
} from "./ConceptActions";
import { LangSection } from "./LangSection";
import { LangSwap } from "./LangSwap";
import {
  anchorId,
  articleHref,
  compositionCounts,
  dpbTagOf,
  fetchCorrectionsSafe,
  fetchObservanceSafe,
  fetchRelatedSafe,
  formatObservanceDate,
  kitLinkedSlugOf,
  subCategoryLabel,
  titleizeSlug,
} from "@/lib/articleExtras";
import type { Article, Block } from "@/lib/types";
import type { NavSectionKey } from "@/lib/taxonomy";

/**
 * Dharmic Concept article template — the "Meanings & Practices" prototype
 * (Tech/HTML/Phase 1 - Knowledge/Cat 3). A concept is an argument, not a
 * procedure: no samagri, no muhurat, no ritual card. The page is built around
 * the claim, the sections that carry it, the corrections, and a sidebar that
 * explains the badge rather than listing what to buy.
 *
 * Ritual guides keep their own template (ArticleView); the two share the block
 * renderers and trust panels in ./blocks.
 */

/** What a source class means, in one line, for the sidebar badge note. */
const SOURCE_CLASS_NOTE: Record<string, string> = {
  VEDIC: "stated in shruti — the Vedas, Brahmanas or Upanishads.",
  PURANIC:
    "clearly stated in a Mahapurana, Dharmashastra, Kalpa Sutra or Agama.",
  NIBANDHA:
    "codified in the nibandha digests — the medieval dharmashastra compendia.",
  BHAKTI: "carried by the bhakti corpus — sant literature and stotra tradition.",
  CUSTOM: "practised custom, held by a region or a family rather than a text.",
};

function ConceptHeroTag({
  tag,
  score,
  source,
}: {
  tag: "dharma" | "pratha" | "bhranti";
  score?: number;
  source?: string;
}) {
  const parts = [tag.toUpperCase()];
  if (tag !== "bhranti" && typeof score === "number") parts.push(`${score}/5`);
  if (source) parts.push(source.toUpperCase());
  return (
    <span className="mb-3 inline-flex items-center gap-[7px] rounded-[20px] border border-[#e6f1e6]/30 bg-[#e6f1e6]/15 px-[13px] py-[5px] text-[10.5px] font-bold text-[#bfe0bf]">
      <span aria-hidden className="text-[9px]">
        ◆
      </span>
      {parts.join(" · ")}
    </span>
  );
}

/** One "RELATED …" list card of the 2×2 related grid. */
function RelatedCard({
  heading,
  rows,
}: {
  heading: string;
  rows: { href: string; name: string; sub?: string }[];
}) {
  if (rows.length === 0) return null;
  return (
    <div className="rounded-[14px] border border-border bg-card px-[18px] py-4">
      <p className="mb-[11px] text-[9.5px] font-bold tracking-[0.6px] text-gold">
        {heading}
      </p>
      {rows.map((row) => (
        <Link
          key={row.href + row.name}
          href={row.href}
          className="flex items-center justify-between gap-[10px] border-b-[0.5px] border-border-light py-[9px] last:border-b-0 hover:text-cta"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-[13.5px] leading-[1.3] font-semibold text-ink">
              {row.name}
            </span>
            {row.sub && (
              <span className="mt-[2px] block text-[11px] text-sub">
                {row.sub}
              </span>
            )}
          </span>
          <span aria-hidden className="shrink-0 text-[15px] text-cta">
            ›
          </span>
        </Link>
      ))}
    </div>
  );
}

/** One card of the "prefer to have it all taken care of?" row. */
function RevenueCard({
  live,
  icon,
  label,
  title,
  copy,
  cta,
  href,
  wa = false,
}: {
  live: boolean;
  icon: string;
  label: string;
  title: string;
  copy: string;
  cta: string;
  href: string;
  wa?: boolean;
}) {
  return (
    <div
      className={`flex h-full flex-col rounded-[15px] border px-5 py-[19px] ${
        live ? "border-border bg-card" : "border-[#ddd4c4] bg-[#efeae0]"
      }`}
    >
      <span
        aria-hidden
        className={`mb-3 flex size-[38px] shrink-0 items-center justify-center rounded-[11px] border text-[17px] ${
          live
            ? "border-pratha-bd bg-pratha-bg"
            : "border-[#d4c9b4] bg-[#e4dccc] opacity-60"
        }`}
      >
        {icon}
      </span>
      <p
        className={`mb-[6px] text-[10.5px] font-bold tracking-[0.6px] ${
          live ? "text-gold" : "text-[#9a8e7a]"
        }`}
      >
        {label}
      </p>
      <p
        className={`mb-[6px] text-base leading-[1.32] font-bold ${
          live ? "text-ink" : "text-[#7a705f]"
        }`}
      >
        {title}
      </p>
      <p
        className={`mb-[15px] flex-1 text-[12.5px] leading-[1.7] ${
          live ? "text-sub" : "text-[#948872]"
        }`}
      >
        {copy}
      </p>
      <Link
        href={href}
        className={`block rounded-[11px] py-3 text-center text-[13px] font-bold ${
          live
            ? wa
              ? "bg-wa text-white"
              : "bg-cta text-white"
            : "border-[1.5px] border-[#c9bfac] text-[#7a705f]"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}

export async function ConceptView({
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

  const companionSlugs = [
    ...(article.relatedSlugs ?? []),
    ...(article.companionSlug ? [article.companionSlug] : []),
  ];

  const [observance, related, corrections, flags] = await Promise.all([
    article.linkedObservanceSlug
      ? fetchObservanceSafe(article.linkedObservanceSlug)
      : Promise.resolve(null),
    companionSlugs.length
      ? fetchRelatedSafe([...new Set(companionSlugs)])
      : Promise.resolve([]),
    fetchCorrectionsSafe(article.slug),
    getFlags(),
  ]);

  const kitSlug = kitLinkedSlugOf(article);
  const counts = compositionCounts(article);
  const tocBlocks = en.blocks.filter(
    (b): b is Block & { title: string } => typeof b.title === "string",
  );
  const firstAnchor = tocBlocks[0]
    ? `#${anchorId(tocBlocks[0].title)}`
    : "#concept-body";

  const coreClaim =
    article.dpb?.confidenceNote ?? en.deck ?? en.heroSubtitle ?? "";

  const relGuides = related.filter(
    (r) => r.article && r.article.type !== "DHARMIC_CONCEPT",
  );
  const relConcepts = related.filter(
    (r) => r.article?.type === "DHARMIC_CONCEPT",
  );
  const unresolved = related.filter((r) => !r.article);
  const companion = article.companionSlug
    ? (related.find((r) => r.slug === article.companionSlug)?.article ?? null)
    : null;

  const badgeNote = article.dpb?.sourceClass
    ? SOURCE_CLASS_NOTE[article.dpb.sourceClass.toUpperCase()]
    : undefined;

  /* JSON-LD: Article + FAQPage (myths) */
  const mythsBlock = en.blocks.find((b) => b.type === "MYTHS");
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

  function renderBlock(block: Block, index: number) {
    const id = block.title ? anchorId(block.title) : `section-${index}`;
    return (
      <section key={`${block.type}-${index}`}>
        {block.title && (
          <ConceptHeading
            id={id}
            title={block.title}
            subtitle={block.meta?.subtitle}
          />
        )}
        <BlockBody
          block={block}
          slug={article.slug}
          title={en.title}
          showStepPills
          conceptStyle
        />
        {block.dpb && <TagRow dpb={block.dpb} />}
        {block.meta?.turn && <TurnStatement text={block.meta.turn} />}
      </section>
    );
  }

  return (
    <div className="pb-24 md:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ArticleAnalytics slug={article.slug} type={article.type} />

      {/* hero — the image carries the page, the copy sits in its dark half */}
      <header className="relative flex min-h-[300px] items-center overflow-hidden md:h-[380px]">
        {article.heroImageId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mediaUrl(article.heroImageId)}
            alt=""
            aria-hidden
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div
            aria-hidden
            className={`absolute inset-0 ${article.hueClass ?? "hero-dc"}`}
          />
        )}
        <div
          aria-hidden
          className="absolute inset-0 [background:radial-gradient(ellipse_58%_55%_at_76%_32%,rgba(150,120,50,0.30)_0%,transparent_62%)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[rgba(12,16,6,0.8)] md:hidden"
        />
        <div
          aria-hidden
          className="absolute inset-0 hidden md:block md:[background:linear-gradient(to_right,rgba(12,16,6,0.94)_0%,rgba(12,16,6,0.7)_42%,rgba(12,16,6,0.16)_74%,rgba(12,16,6,0.02)_100%)]"
        />
        <ConceptHeroShare slug={article.slug} title={en.title} />
        <div className="relative z-[5] mx-auto w-full max-w-[1280px] px-4 py-10 md:px-10">
          <div className="max-w-[660px]">
            <p className="mb-[9px] text-[10px] tracking-[0.9px] text-eyebrow-dark uppercase">
              {sectionLabel}
              {subLabel ? ` · ${subLabel}` : ""}
            </p>
            {article.dpb && (
              <ConceptHeroTag
                tag={dpbTagOf(article.dpb)}
                score={article.dpb.confidenceScore}
                source={article.dpb.sourceClass}
              />
            )}
            <h1 className="mb-[10px] text-[28px] leading-[1.12] font-bold tracking-[-0.8px] text-hero-text md:text-[40px]">
              <LangSwap en={en.title} hi={hi?.title} />
            </h1>
            {(en.heroSubtitle ?? en.deck) && (
              <p className="mb-[21px] text-[15px] leading-[1.6] text-[#c3c8a8] md:text-base">
                <LangSwap
                  en={en.heroSubtitle ?? en.deck ?? ""}
                  hi={hi?.heroSubtitle ?? hi?.deck}
                />
              </p>
            )}
            <ConceptHeroButtons
              slug={article.slug}
              title={en.title}
              readHref={firstAnchor}
              readLabel="Read the concept"
            />
          </div>
        </div>
      </header>

      {/* trust chips + audio */}
      <div id="audio" className="scroll-mt-24 border-b border-border bg-card">
        {/* min-h, not a fixed h-14: the audio player is a two-row stack (caption
            over capsule, ~69px) and a hard 56px row let it spill 6px up into the
            hero, which clipped the top of "Listen to this concept". ArticleView's
            equivalent bar has always been padding-sized — this matches it. */}
        <div className="mx-auto flex max-w-[1280px] flex-col justify-between gap-[10px] px-4 py-[11px] md:min-h-14 md:flex-row md:items-center md:gap-5 md:px-10">
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
                className="flex items-center gap-[6px] text-[12px] font-medium whitespace-nowrap text-mid"
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
            label="Listen to this concept"
            className="shrink-0 md:w-[360px]"
          />
        </div>
      </div>

      {/* jump-to */}
      {tocBlocks.length > 0 && (
        <nav
          aria-label="Jump to section"
          className="sticky top-[70px] z-50 border-b border-pratha-bd bg-pratha-bg lg:top-[72px]"
        >
          <div className="mx-auto flex max-w-[1280px] items-center gap-[9px] overflow-x-auto px-4 py-3 [scrollbar-width:none] md:px-10 [&::-webkit-scrollbar]:hidden">
            <span className="mr-1 text-[10.5px] font-bold tracking-[0.5px] whitespace-nowrap text-gold">
              JUMP TO
            </span>
            {tocBlocks.map((block) => (
              <a
                key={block.title}
                href={`#${anchorId(block.title)}`}
                className="shrink-0 rounded-[10px] border-[1.5px] border-border bg-card px-4 py-2 text-[13px] font-medium whitespace-nowrap text-ink hover:border-cta hover:bg-bhranti-bg"
              >
                {block.title}
              </a>
            ))}
          </div>
        </nav>
      )}

      {/* body */}
      <div className="mx-auto max-w-[1280px] px-4 pt-[30px] md:px-10">
        <div className="grid items-start gap-11 lg:grid-cols-[minmax(0,1fr)_330px]">
          <main id="concept-body" className="max-w-[720px] min-w-0">
            {/* the claim this whole page stands on */}
            {article.dpb && (
              <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-card">
                <div className="flex items-center justify-between gap-3 border-b border-border-light px-5 py-3">
                  <span className="text-[9.5px] font-bold tracking-[0.6px] text-sub">
                    SOURCE OF TRUTH
                  </span>
                  <Link
                    href="/editorial-method"
                    className="text-[11.5px] font-bold text-cta"
                  >
                    Read source ›
                  </Link>
                </div>
                <div className="px-5 py-[17px]">
                  <p className="mb-[6px] text-[9.5px] font-bold tracking-[0.6px] text-gold">
                    CORE CLAIM
                  </p>
                  {coreClaim && (
                    <p className="mb-[13px] text-[16.5px] leading-[1.45] font-bold text-ink">
                      {coreClaim}
                    </p>
                  )}
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
                    {article.dpb.prathaScope && (
                      <Pill>{article.dpb.prathaScope.toUpperCase()}</Pill>
                    )}
                  </div>
                </div>
                <p className="border-t border-border-light px-5 py-3 text-[12.5px] leading-[1.7] text-sub">
                  This concept: <b className="text-ink">1 core claim</b> ·{" "}
                  {counts.scriptural} scriptural element
                  {counts.scriptural === 1 ? "" : "s"} · {counts.regional}{" "}
                  regional custom{counts.regional === 1 ? "" : "s"} ·{" "}
                  {counts.corrections} correction
                  {counts.corrections === 1 ? "" : "s"}
                </p>
              </div>
            )}

            {en.introHtml && (
              <div className="mb-2 text-[15px] leading-[1.9] [&_p]:mb-[15px]">
                <LangSwap en={en.introHtml} hi={hi?.introHtml} html />
              </div>
            )}

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

            <WhatsAppNudge context="article-concept" />

            {article.dpb && (
              <IntelligenceLayer article={article} coreLabel="CORE CLAIM" />
            )}

            {corrections.length > 0 && (
              <CorrectionsLog corrections={corrections} />
            )}

            {/* related — four compact lists, exactly the prototype's 2×2 */}
            {(related.length > 0 || article.linkedObservanceSlug || kitSlug) && (
              <>
                <ConceptHeading id="related" title="Related" />
                <div className="mt-3 grid gap-[14px] sm:grid-cols-2">
                  <RelatedCard
                    heading="RELATED RITUAL GUIDES"
                    rows={[
                      ...relGuides.map((r) => ({
                        href: articleHref(r.article!),
                        name: r.article!.lang.en.title,
                        sub:
                          r.article!.lang.en.heroSubtitle ??
                          formatObservanceDate(r.article!.observanceDate) ??
                          undefined,
                      })),
                      ...unresolved.map((r) => ({
                        href: `${subHref}/${r.slug}`,
                        name: titleizeSlug(r.slug),
                        sub: "Guide — opens in this collection",
                      })),
                    ]}
                  />
                  <RelatedCard
                    heading="RELATED PUJANS"
                    rows={
                      kitSlug
                        ? [
                            {
                              href: `/ritual-pujans/p/${kitSlug}`,
                              name: "Ritual kit for this observance",
                              sub: "Everything on the samagri list, in one box",
                            },
                          ]
                        : []
                    }
                  />
                  <RelatedCard
                    heading="RELATED CONCEPTS"
                    rows={relConcepts.map((r) => ({
                      href: articleHref(r.article!),
                      name: r.article!.lang.en.title,
                      sub: r.article!.lang.en.heroSubtitle ?? undefined,
                    }))}
                  />
                  <RelatedCard
                    heading="RELATED DATES"
                    rows={
                      article.linkedObservanceSlug
                        ? [
                            {
                              href: `/panchang/o/${article.linkedObservanceSlug}`,
                              name:
                                observance?.name ??
                                titleizeSlug(article.linkedObservanceSlug),
                              sub:
                                [
                                  formatObservanceDate(
                                    observance?.date ?? article.observanceDate,
                                  ),
                                  observance?.tithiLabel,
                                ]
                                  .filter(Boolean)
                                  .join(" · ") || "The full day on the panchang",
                            },
                          ]
                        : []
                    }
                  />
                </div>
              </>
            )}

            {/* knowledge before commerce — stated, then offered */}
            <ConceptHeading
              id="taken-care-of"
              title="Prefer to have it all taken care of?"
            />
            <div className="mt-[18px] grid gap-[13px] sm:grid-cols-3">
              <RevenueCard
                live={Boolean(kitSlug) && flags.kits_launched}
                icon="🪔"
                label="RITUAL KIT"
                title={kitSlug ? "The kit for this observance" : "No kit for this one"}
                copy={
                  kitSlug
                    ? "Everything on the samagri list, measured and packed, delivered before the date."
                    : "This is a concept, not a ritual. The linked ritual guide carries the samagri list, free."
                }
                cta={
                  kitSlug && flags.kits_launched
                    ? "Order the kit ›"
                    : "🔔 Tell me when it opens"
                }
                href={
                  kitSlug && flags.kits_launched
                    ? `/ritual-pujans/p/${kitSlug}`
                    : "/tapa-circle"
                }
              />
              <RevenueCard
                live={flags.purohit_tab_visible}
                icon="🙏"
                label="PUROHIT & PUJA"
                title={
                  flags.purohit_tab_visible
                    ? "A purohit for the pujan"
                    : "Booking not open yet"
                }
                copy={
                  flags.purohit_tab_visible
                    ? "A verified purohit for the home pujan, with the samagri handled."
                    : "Purohit booking is not open yet. We will tell you when it is."
                }
                cta={
                  flags.purohit_tab_visible
                    ? "Book a purohit ›"
                    : "🔔 Tell me when it opens"
                }
                href={
                  flags.purohit_tab_visible
                    ? "/pujan-with-purohit"
                    : "/tapa-circle"
                }
              />
              <RevenueCard
                live
                wa
                icon="💬"
                label="THE TAPA CIRCLE"
                title="Never miss a date again"
                copy="Festival and vrat reminders on WhatsApp, with the guide attached and the kit cut-off if there is one. ₹499 a year."
                cta="Join the Tapa Circle ›"
                href="/tapa-circle"
              />
            </div>
            <p className="mt-[13px] mb-12 text-center text-[13px] leading-[1.75] text-sub">
              Nothing here is needed to understand the concept. This article is
              free and complete, and always will be.
            </p>
          </main>

          {/* sidebar */}
          <aside className="sticky top-[150px] hidden flex-col gap-[13px] lg:flex">
            <Link
              href="/tapa-circle"
              className="flex w-full flex-col items-center gap-[3px] rounded-xl bg-wa p-[14px] hover:opacity-90"
            >
              <span aria-hidden className="text-[19px]">
                💬
              </span>
              <span className="text-[13px] font-bold text-white">
                Join the Tapa Circle
              </span>
              <span className="text-center text-[10px] leading-[1.5] text-white/60">
                WhatsApp reminders · ₹499 a year
              </span>
            </Link>

            <ConceptSaveCta
              slug={article.slug}
              title={en.title}
              subtitle="Read it again when the date comes round"
            />

            {article.dpb && (
              <div className="rounded-[13px] border border-pratha-bd bg-pratha-bg px-4 py-[14px]">
                <p className="mb-2 text-[9.5px] font-bold tracking-[0.6px] text-gold">
                  WHAT THE BADGE MEANS
                </p>
                <p className="text-xs leading-[1.75] text-body">
                  <b className="text-pratha-fg">
                    {[
                      article.dpb.sourceClass
                        ? article.dpb.sourceClass.charAt(0).toUpperCase() +
                          article.dpb.sourceClass.slice(1).toLowerCase()
                        : article.dpb.classification,
                      typeof article.dpb.confidenceScore === "number"
                        ? `${article.dpb.confidenceScore}/5`
                        : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </b>
                  {badgeNote ? ` — ${badgeNote}` : ""}
                  {article.dpb.sourceName
                    ? ` Here, ${article.dpb.sourceName}.`
                    : ""}
                </p>
                <Link
                  href="/editorial-method"
                  className="mt-2 block text-[11.5px] font-bold text-cta"
                >
                  How we decide what is true ›
                </Link>
              </div>
            )}

            {companion && (
              <div className="rounded-[13px] border border-dashed border-[#d8ccb6] bg-bg px-4 py-[14px]">
                <div className="mb-2 flex items-center gap-[9px]">
                  <span
                    aria-hidden
                    className="flex size-[26px] shrink-0 items-center justify-center rounded-[7px] border border-border bg-card text-[13px]"
                  >
                    🪔
                  </span>
                  <span className="text-[10px] font-bold tracking-[0.6px] text-gold">
                    WHERE THIS IS PRACTISED
                  </span>
                </div>
                <p className="mb-[11px] text-[12.5px] leading-[1.6] text-sub">
                  The ritual this concept sits behind — the full vidhi, the
                  muhurat and the corrections.
                </p>
                <Link
                  href={articleHref(companion)}
                  className="block rounded-[9px] border-[1.5px] border-yellow py-[9px] text-center text-[12.5px] font-bold text-[#8a6100]"
                >
                  {companion.lang.en.title}
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>

      <ConceptMobileBar slug={article.slug} title={en.title} />
    </div>
  );
}
