import Link from "next/link";
import type { ReactNode } from "react";
import { ContentCard } from "@/components/ContentCard";
import { DpbBadge } from "@/components/DpbBadge";
import { LangToggle } from "@/components/LangToggle";
import { Pill } from "@/components/Pill";
import { SectionHeader } from "@/components/SectionHeader";
import { WhatsAppNudge } from "@/components/WhatsAppNudge";
import { LangSwap } from "./LangSwap";
import { MantraChip } from "./MantraChip";
import { SamagriChecklist } from "./SamagriChecklist";
import { SaveShareButtons } from "./SaveShareButtons";
import {
  anchorId,
  articleHref,
  collectTaggedSteps,
  dpbTagOf,
  fetchObservanceSafe,
  fetchRelatedSafe,
  formatObservanceDate,
  hueFromClass,
  subCategoryLabel,
  titleizeSlug,
} from "@/lib/articleExtras";
import type { Article, Block, Dpb } from "@/lib/types";
import type { NavSectionKey } from "@/lib/taxonomy";

/* ── small shared bits ────────────────────────────────────────── */

function DpbPill({ dpb }: { dpb: Dpb }) {
  const tag = dpbTagOf(dpb);
  const showScore = tag !== "bhranti" && typeof dpb.confidenceScore === "number";
  return (
    <Pill variant={tag}>
      {dpb.classification}
      {showScore ? ` · ${dpb.confidenceScore}/5` : ""}
    </Pill>
  );
}

function SectionTitle({ id, title }: { id: string; title: string }) {
  return (
    <h2
      id={id}
      className="mt-8 mb-[9px] flex scroll-mt-[150px] items-center gap-2 text-[19px] leading-[1.3] font-bold text-ink"
    >
      <span aria-hidden className="text-[17px] font-bold text-cta">
        +
      </span>
      {title}
    </h2>
  );
}

function Prose({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/\n{2,}/)
        .filter((p) => p.trim() !== "")
        .map((para, i) => (
          <p key={i} className="mb-[14px] text-[15px] leading-[1.85]">
            {para.trim()}
          </p>
        ))}
    </>
  );
}

/* ── block renderers ──────────────────────────────────────────── */

function SignificanceQuote({ block }: { block: Block }) {
  return (
    <figure className="my-2 overflow-hidden rounded-2xl border border-border bg-card">
      <blockquote className="px-6 pt-6 pb-4">
        <p className="text-[19px] leading-[1.7] font-medium text-ink md:text-[21px]">
          &ldquo;{block.text}&rdquo;
        </p>
      </blockquote>
      {block.meta?.attribution && (
        <figcaption className="border-t border-border-light bg-[#FCFAF6] px-6 py-3 text-xs font-bold tracking-[0.5px] text-gold uppercase">
          — {block.meta.attribution}
        </figcaption>
      )}
    </figure>
  );
}

function SankalpaCard({ block }: { block: Block }) {
  const s = block.sankalpa;
  if (!s) return null;
  return (
    <div className="my-2 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="border-b border-pratha-bd bg-pratha-bg px-5 py-[13px] text-[11px] font-bold tracking-[0.4px] text-pratha-fg uppercase">
        Spoken with water in the right hand, then poured out
      </div>
      <div className="px-5 py-5">
        <p className="font-devanagari mb-[11px] text-[19px] leading-[1.85] text-pratha-fg">
          {s.devanagari}
        </p>
        <p className="mb-[13px] border-b border-border-light pb-[13px] text-[14.5px] leading-[1.8] text-body italic">
          {s.transliteration}
        </p>
        {s.gloss && (
          <p className="text-[14.5px] leading-[1.8]">{s.gloss}</p>
        )}
      </div>
      <p className="border-t border-dharma-bd bg-dharma-bg px-5 py-[13px] text-[13.5px] leading-[1.78]">
        <b className="text-dharma-fg">No Sanskrit required.</b> Say it in
        whatever language you think in — a sankalp said sincerely in Hindi or
        English is a sankalp.
      </p>
    </div>
  );
}

function VidhiSteps({ block }: { block: Block }) {
  const steps = block.steps ?? [];
  return (
    <div>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <div key={step.number} className="flex gap-[14px]">
            <div className="flex flex-col items-center">
              <div
                className={`flex size-[30px] shrink-0 items-center justify-center rounded-full text-[12.5px] font-bold text-white ${
                  isLast ? "bg-cta" : "bg-amber"
                }`}
              >
                {step.number}
              </div>
              {!isLast && (
                <div className="my-1 min-h-3 w-[2px] flex-1 bg-border" />
              )}
            </div>
            <div className="min-w-0 flex-1 pb-[18px]">
              <p className="text-[14.5px] leading-[1.8] font-bold text-ink">
                {step.title}
              </p>
              {step.description && (
                <p className="text-[14.5px] leading-[1.8]">
                  {step.description}
                </p>
              )}
              {step.note && (
                <p className="mt-1 text-[12.5px] text-sub italic">
                  {step.note}
                </p>
              )}
              {step.mantraChip && (
                <span className="mt-2 inline-flex items-center gap-2 rounded-[9px] bg-ink-deep px-3 py-[6px]">
                  <span className="text-[9.5px] font-bold tracking-[0.5px] text-eyebrow-dark">
                    MANTRA
                  </span>
                  <span className="font-devanagari text-[14px] text-amber">
                    {step.mantraChip}
                  </span>
                </span>
              )}
              {step.dpb && (
                <div className="mt-2 flex flex-wrap gap-[7px]">
                  <DpbPill dpb={step.dpb} />
                  {step.dpb.sourceName && (
                    <Pill>{step.dpb.sourceName.toUpperCase()}</Pill>
                  )}
                  {step.dpb.prathaScope && (
                    <Pill>{step.dpb.prathaScope.toUpperCase()}</Pill>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FastingCards({ block }: { block: Block }) {
  const forms = block.fasting ?? [];
  return (
    <div>
      <div className="mb-[13px] grid gap-3 md:grid-cols-3">
        {forms.map((form) => (
          <div
            key={form.name}
            className={`rounded-[13px] border bg-card px-[17px] py-[15px] ${
              form.recommended ? "border-dharma-bd" : "border-border"
            }`}
          >
            <div className="mb-[5px] flex items-center justify-between gap-2">
              <p className="text-[13.5px] font-bold text-ink">{form.name}</p>
              {form.recommended && <Pill variant="dharma">RECOMMENDED</Pill>}
            </div>
            <p className="text-[12.5px] leading-[1.7] text-sub">
              {form.description}
            </p>
          </div>
        ))}
      </div>
      {block.text && (
        <p className="rounded-xl border border-dharma-bd bg-dharma-bg px-4 py-[13px] text-[13.5px] leading-[1.78]">
          <b className="text-dharma-fg">Fear-free note.</b> {block.text}
        </p>
      )}
    </div>
  );
}

function MythCards({ block }: { block: Block }) {
  return (
    <div className="flex flex-col gap-[14px]">
      {(block.myths ?? []).map((myth, i) => (
        <div key={i}>
          <div className="flex items-start justify-between gap-[10px] rounded-t-[13px] border border-b-0 border-bhranti-bd bg-bhranti-bg px-[17px] py-[13px]">
            <p className="text-sm leading-[1.6] font-semibold text-[#8C1130]">
              &ldquo;{myth.question}&rdquo;
            </p>
            <span className="shrink-0 rounded-[5px] bg-bhranti-fg px-[9px] py-[3px] text-[11px] font-bold tracking-[0.5px] whitespace-nowrap text-white">
              CORRECTION
            </span>
          </div>
          <p className="rounded-b-[13px] border border-dharma-bd bg-dharma-bg px-[17px] py-[13px] text-sm leading-[1.82]">
            {myth.answer}
          </p>
        </div>
      ))}
    </div>
  );
}

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

  const observance = article.linkedObservanceSlug
    ? await fetchObservanceSafe(article.linkedObservanceSlug)
    : null;
  const related = article.relatedSlugs?.length
    ? await fetchRelatedSafe(article.relatedSlugs)
    : [];

  const datelineParts = [
    formatObservanceDate(article.observanceDate),
    observance?.tithiLabel,
    "Delhi-NCR",
  ].filter(Boolean);

  const tocBlocks = en.blocks.filter(
    (b): b is Block & { title: string } => typeof b.title === "string",
  );
  const taggedSteps = collectTaggedSteps(article);
  const mythsBlock = en.blocks.find((b) => b.type === "MYTHS");
  const vidhiBlock = en.blocks.find((b) => b.type === "VIDHI");
  const pdfHref = `/api/v1/cards/${article.slug}.pdf`;

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
        body = <VidhiSteps block={block} />;
        break;
      case "MANTRA":
        body = block.mantra ? (
          <MantraChip slug={article.slug} mantra={block.mantra} />
        ) : null;
        break;
      case "FASTING":
        body = <FastingCards block={block} />;
        break;
      case "MYTHS":
        body = <MythCards block={block} />;
        break;
      case "KATHA":
        // the vrat katha card — a story panel, never plain prose (PRD §5.3)
        body = block.text ? (
          <div className="overflow-hidden rounded-[15px] border border-border bg-card">
            <div className="border-b border-border-light bg-pratha-bg px-5 py-3">
              <p className="text-[10px] font-bold tracking-[0.8px] text-pratha-fg uppercase">
                Vrat Katha — the sacred story
              </p>
            </div>
            <div className="px-5 py-4">
              <Prose text={block.text} />
              {block.meta?.source && (
                <p className="mt-3 text-[11.5px] font-semibold text-sub">
                  Source: {block.meta.source}
                </p>
              )}
            </div>
          </div>
        ) : null;
        break;
      default:
        body = block.text ? <Prose text={block.text} /> : null;
    }
    return (
      <section key={`${block.type}-${index}`}>
        {block.title && <SectionTitle id={id} title={block.title} />}
        {body}
        {block.type === "MYTHS" && (
          <WhatsAppNudge copy="Never miss this vrat again." />
        )}
      </section>
    );
  }

  return (
    <div className="pb-20 md:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* breadcrumb + lang + save/share */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-4 py-[7px] md:px-10">
          <nav
            aria-label="Breadcrumb"
            className="min-w-0 overflow-hidden text-[13px] text-ellipsis whitespace-nowrap text-sub"
          >
            <Link href="/" className="hover:text-cta">
              Home
            </Link>
            {" › "}
            <Link href={sectionHref} className="hover:text-cta">
              {sectionLabel}
            </Link>
            {subLabel && (
              <>
                {" › "}
                <Link href={subHref} className="hover:text-cta">
                  {subLabel}
                </Link>
              </>
            )}
            {" › "}
            <b className="font-medium text-body">{en.title}</b>
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <LangToggle />
            <span className="hidden gap-2 sm:flex">
              <SaveShareButtons slug={article.slug} title={en.title} />
            </span>
          </div>
        </div>
      </div>

      {/* hero */}
      <header
        className={`${article.hueClass ?? "h-devi"} relative overflow-hidden`}
      >
        <div
          aria-hidden
          className="absolute inset-0 [background:radial-gradient(ellipse_58%_60%_at_78%_30%,rgba(255,255,255,0.08)_0%,transparent_62%)]"
        />
        <div className="relative mx-auto max-w-[1280px] px-4 py-9 md:px-10 md:py-[52px]">
          <div className="max-w-[680px]">
            <p className="mb-[9px] text-[11px] tracking-[0.9px] text-eyebrow-dark uppercase">
              {sectionLabel}
              {subLabel ? ` · ${subLabel}` : ""}
            </p>
            {article.dpb && (
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

      {/* trust chips + audio bar */}
      <div id="audio" className="scroll-mt-24 border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1280px] flex-col justify-between gap-[10px] px-4 py-[11px] md:h-[56px] md:flex-row md:items-center md:gap-5 md:px-10 md:py-0">
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
          <div className="flex shrink-0 items-center gap-[11px] rounded-[10px] bg-ink-deep px-[14px] py-[9px]">
            <button
              type="button"
              disabled={!en.audioGuideMediaId}
              aria-label="Play audio guide"
              className={`flex size-6 items-center justify-center rounded-full text-[11px] text-white ${
                en.audioGuideMediaId
                  ? "bg-cta"
                  : "cursor-not-allowed bg-white/15"
              }`}
            >
              ▶
            </button>
            <div>
              <p className="text-[11.5px] leading-tight font-semibold text-white">
                Listen to this guide
              </p>
              <p className="text-[11px] leading-tight text-[#7A6A55]">
                {en.audioGuideMediaId ? "EN/हिं" : "Audio coming soon · EN/हिं"}
              </p>
            </div>
          </div>
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
      <div className="mx-auto max-w-[1280px] px-4 pt-7 md:px-10">
        <div className="grid items-start gap-11 lg:grid-cols-[minmax(0,1fr)_330px]">
          <main className="max-w-[740px] min-w-0">
            {/* source-of-truth card */}
            {article.dpb && (
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
              </div>
            )}

            {/* intro */}
            {en.introHtml && (
              <div className="mb-2 text-[15px] leading-[1.85] [&_p]:mb-[14px]">
                <LangSwap en={en.introHtml} hi={hi?.introHtml} html />
              </div>
            )}

            {/* ordered blocks */}
            {en.blocks.map((block, i) => renderBlock(block, i))}
            {hiHasBlocks && (
              <p className="mt-4 text-xs text-sub italic">
                हिंदी संस्करण उपलब्ध है — भाषा बदलने के लिए ऊपर हिं चुनें।
              </p>
            )}

            {/* Tapa intelligence layer */}
            <details className="group mt-8 overflow-hidden rounded-r-[14px] border border-border border-l-[3px] border-l-amber bg-card">
              <summary className="cursor-pointer list-none px-5 py-4 [&::-webkit-details-marker]:hidden">
                <span className="mb-1 block text-[11px] font-bold tracking-[0.6px] text-gold">
                  ◗ TAPA INTELLIGENCE LAYER
                </span>
                <span className="block text-[15.5px] font-bold text-ink">
                  Every claim on this page, classified and scored
                </span>
                <span className="mt-1 block text-[12.5px] text-sub group-open:hidden">
                  Expand the full Dharma / Pratha / Bhranti table ›
                </span>
              </summary>
              <div className="overflow-x-auto border-t border-border-light">
                <table className="w-full min-w-[560px] text-left text-[12.5px]">
                  <thead>
                    <tr className="bg-bg text-[11px] tracking-[0.5px] text-sub">
                      <th className="px-5 py-[9px] font-bold">ELEMENT</th>
                      <th className="px-3 py-[9px] font-bold">TAG</th>
                      <th className="px-3 py-[9px] font-bold">SOURCE</th>
                      <th className="px-5 py-[9px] text-right font-bold">
                        SCORE
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {article.dpb && (
                      <tr className="border-t border-border-light">
                        <td className="px-5 py-[10px] font-semibold text-ink">
                          {coreLabel === "CORE CLAIM"
                            ? "Core claim"
                            : "Core practice"}{" "}
                          (this guide)
                        </td>
                        <td className="px-3 py-[10px]">
                          <DpbPill dpb={article.dpb} />
                        </td>
                        <td className="px-3 py-[10px] text-sub">
                          {[article.dpb.sourceName, article.dpb.sourceRef]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </td>
                        <td className="px-5 py-[10px] text-right text-sub">
                          {typeof article.dpb.confidenceScore === "number"
                            ? `${article.dpb.confidenceScore}/5`
                            : "—"}
                        </td>
                      </tr>
                    )}
                    {taggedSteps.map(({ step, dpb }) => (
                      <tr
                        key={step.number}
                        className="border-t border-border-light"
                      >
                        <td className="px-5 py-[10px] text-ink">
                          Step {step.number} — {step.title}
                        </td>
                        <td className="px-3 py-[10px]">
                          <DpbPill dpb={dpb} />
                        </td>
                        <td className="px-3 py-[10px] text-sub">
                          {dpb.sourceName ?? dpb.prathaScope ?? "—"}
                        </td>
                        <td className="px-5 py-[10px] text-right text-sub">
                          {typeof dpb.confidenceScore === "number"
                            ? `${dpb.confidenceScore}/5`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>

            {/* related guides */}
            {related.length > 0 && (
              <div className="mt-10 mb-12">
                <SectionHeader
                  eyebrow="Keep reading"
                  title="Related guides"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  {related.map(({ slug, article: rel }) =>
                    rel ? (
                      <ContentCard
                        key={slug}
                        hue={hueFromClass(rel.hueClass)}
                        href={articleHref(rel)}
                        title={rel.lang.en.title}
                        meta={formatObservanceDate(rel.observanceDate)}
                        summary={
                          rel.lang.en.deck ?? rel.lang.en.heroSubtitle ?? ""
                        }
                        pills={
                          rel.dpb ? (
                            <DpbBadge
                              tag={dpbTagOf(rel.dpb)}
                              score={rel.dpb.confidenceScore}
                              source={rel.dpb.sourceClass}
                            />
                          ) : undefined
                        }
                        readTime={
                          rel.readMinutes ? `${rel.readMinutes} min` : undefined
                        }
                      />
                    ) : (
                      <ContentCard
                        key={slug}
                        hue="gold"
                        href={`${subHref}/${slug}`}
                        title={titleizeSlug(slug)}
                        summary="Guide — opens in this collection."
                      />
                    ),
                  )}
                </div>
              </div>
            )}
          </main>

          {/* sticky sidebar (desktop) */}
          <aside className="sticky top-[84px] hidden flex-col gap-[13px] lg:flex">
            <div className="overflow-hidden rounded-[14px] border border-border bg-card">
              <div className="border-b border-border-light px-4 py-3 text-[11px] font-bold tracking-[0.6px] text-sub">
                WHY YOU CAN TRUST THIS
              </div>
              <div className="px-4 py-[14px]">
                {article.dpb ? (
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
                    Timing and calendar content carries no DPB tag by design.
                  </p>
                )}
              </div>
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
            </div>

            <a
              href={pdfHref}
              className="flex w-full flex-col items-center gap-[3px] rounded-xl bg-ink-deep p-[14px] hover:opacity-90"
            >
              <span aria-hidden className="text-lg text-white">
                ↓
              </span>
              <span className="text-[13px] font-bold text-white">
                Download the ritual card
              </span>
              <span className="text-center text-[11px] leading-[1.5] text-white/60">
                One page — samagri, steps, mantra
              </span>
            </a>

            <div className="rounded-[13px] border border-pratha-bd bg-pratha-bg px-4 py-[14px]">
              <p className="mb-2 text-[11px] font-bold tracking-[0.6px] text-gold">
                NEED A PUROHIT?
              </p>
              <p className="text-xs leading-[1.75] text-body">
                <b className="text-pratha-fg">Coming soon.</b> Verified
                purohits for home pujans — booking opens after the knowledge
                layer is complete. This vrat needs no purohit to be valid.
              </p>
            </div>
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
