import Link from "next/link";
import { Pill } from "@/components/Pill";
import { KathaCard } from "./KathaCard";
import { MantraChip } from "./MantraChip";
import { SamagriChecklist } from "./SamagriChecklist";
import { TrackedDetails } from "./TrackedDetails";
import {
  collectTaggedSteps,
  dpbTagOf,
  formatObservanceDate,
  type CorrectionEntry,
} from "@/lib/articleExtras";
import type { Article, Block, Dpb } from "@/lib/types";

/**
 * Article body primitives shared by the ritual-guide template (ArticleView)
 * and the dharmic-concept template (ConceptView). Both render the same block
 * shapes; only the page furniture around them differs.
 */

/* ── small shared bits ────────────────────────────────────────── */

export function DpbPill({ dpb }: { dpb: Dpb }) {
  const tag = dpbTagOf(dpb);
  const showScore = tag !== "bhranti" && typeof dpb.confidenceScore === "number";
  return (
    <Pill variant={tag}>
      {dpb.classification}
      {showScore ? ` · ${dpb.confidenceScore}/5` : ""}
    </Pill>
  );
}

export function SectionTitle({ id, title }: { id: string; title: string }) {
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

export function Prose({ text }: { text: string }) {
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

export function SignificanceQuote({ block }: { block: Block }) {
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

export function SankalpaCard({ block }: { block: Block }) {
  const s = block.sankalpa;
  if (!s) return null;
  return (
    <div className="my-2 overflow-hidden rounded-2xl border border-border bg-card">
      {/* G29 — permission-first label; the water instruction is the sub-note */}
      <div className="border-b border-pratha-bd bg-pratha-bg px-5 py-[13px]">
        <p className="text-[11px] font-bold tracking-[0.4px] text-pratha-fg uppercase">
          Say this — or your own words
        </p>
        <p className="mt-[2px] text-[11.5px] text-pratha-fg/80">
          Spoken with water in the right hand, then poured out
        </p>
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

export function VidhiSteps({
  block,
  showPills,
}: {
  block: Block;
  showPills: boolean;
}) {
  const steps = block.steps ?? [];
  return (
    <div>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const isCurrent = step.highlight ?? isLast;
        return (
          <div key={step.number} className="flex gap-[14px]">
            <div className="flex flex-col items-center">
              <div
                className={`flex size-[30px] shrink-0 items-center justify-center rounded-full text-[12.5px] font-bold text-white ${
                  isCurrent ? "bg-cta" : "bg-amber"
                }`}
              >
                {step.number}
              </div>
              {!isLast && (
                <div className="my-1 min-h-3 w-[2px] flex-1 bg-border" />
              )}
            </div>
            <div className="min-w-0 flex-1 pb-[18px]">
              <p
                className={`text-[14.5px] leading-[1.8] font-bold ${step.highlight ? "text-cta" : "text-ink"}`}
              >
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
              {showPills && step.dpb && (
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

export function FastingCards({ block }: { block: Block }) {
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

export function MythCards({ block }: { block: Block }) {
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

/** #64 — QA block: an accordion of question/answer pairs. */
export function QaAccordion({ block }: { block: Block }) {
  const pairs = block.myths ?? [];
  return (
    <div className="flex flex-col gap-[10px]">
      {pairs.map((qa, i) => (
        <details
          key={i}
          className="group overflow-hidden rounded-[13px] border border-border bg-card"
        >
          <summary className="flex cursor-pointer list-none items-center gap-[11px] px-[17px] py-[13px] hover:bg-[#FCFAF6] [&::-webkit-details-marker]:hidden">
            <span
              aria-hidden
              className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-pratha-bg text-[12px] font-bold text-pratha-fg"
            >
              ?
            </span>
            <span className="flex-1 text-sm leading-[1.6] font-semibold text-ink">
              {qa.question}
            </span>
            <span
              aria-hidden
              className="shrink-0 text-sub transition-transform group-open:rotate-180"
            >
              ⌄
            </span>
          </summary>
          <p className="border-t border-border-light px-[17px] py-[13px] text-sm leading-[1.82]">
            {qa.answer}
          </p>
        </details>
      ))}
    </div>
  );
}

/* ── shared block body ────────────────────────────────────────── */

/**
 * Renders one block's body (everything below its section heading). Both
 * templates call this; `conceptStyle` swaps the two treatments that differ on
 * a Dharmic Concept page — the significance quote becomes the dark reframe
 * panel of the concepts prototype, and vidhi pills stay on.
 */
export function BlockBody({
  block,
  slug,
  title,
  showStepPills,
  conceptStyle = false,
}: {
  block: Block;
  slug: string;
  title: string;
  showStepPills: boolean;
  conceptStyle?: boolean;
}) {
  switch (block.type) {
    case "SIGNIFICANCE_QUOTE":
      return conceptStyle ? (
        <PullPanel
          label={block.meta?.attribution ?? "THE REFRAME"}
          text={block.text ?? ""}
        />
      ) : (
        <SignificanceQuote block={block} />
      );
    case "SANKALPA":
      return <SankalpaCard block={block} />;
    case "SAMAGRI":
      return (
        <SamagriChecklist slug={slug} title={title} items={block.samagri ?? []} />
      );
    case "VIDHI":
      return <VidhiSteps block={block} showPills={showStepPills} />;
    case "MANTRA":
      return block.mantra ? (
        <MantraChip slug={slug} mantra={block.mantra} />
      ) : null;
    case "FASTING":
      return <FastingCards block={block} />;
    case "MYTHS":
      return <MythCards block={block} />;
    case "QA":
      return <QaAccordion block={block} />;
    case "KATHA":
      // the vrat katha card — a story panel, never plain prose (PRD §5.3)
      return block.text ? (
        <KathaCard
          text={block.text}
          beats={block.beats}
          source={block.meta?.source}
          audioId={block.meta?.audioId}
        />
      ) : null;
    default:
      return block.text ? <Prose text={block.text} /> : null;
  }
}

/* ── concept-page primitives (Dharmic Concepts prototype) ─────── */

/** Section heading with the pink "+" and an optional italic sub-line. */
export function ConceptHeading({
  id,
  title,
  subtitle,
}: {
  id: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <>
      <h2
        id={id}
        className="mt-[34px] mb-1 flex scroll-mt-[150px] items-baseline gap-2 text-[19px] leading-[1.3] font-bold text-ink"
      >
        <span aria-hidden className="text-base font-bold text-cta">
          +
        </span>
        {title}
      </h2>
      {subtitle && (
        <p className="mt-0 mb-[15px] ml-[22px] text-[13px] leading-[1.65] text-sub italic">
          {subtitle}
        </p>
      )}
    </>
  );
}

/** The per-section classification row: tag · source class · named source. */
export function TagRow({ dpb }: { dpb: Dpb }) {
  const source = [dpb.sourceName, dpb.sourceRef].filter(Boolean).join(" · ");
  return (
    <div className="mt-1 mb-[18px] flex flex-wrap items-center gap-[7px]">
      <DpbPill dpb={dpb} />
      {dpb.sourceClass && <Pill variant={dpbTagOf(dpb)}>{dpb.sourceClass.toUpperCase()}</Pill>}
      {source && <Pill>{source}</Pill>}
      {dpb.prathaScope && <Pill>{dpb.prathaScope.toUpperCase()}</Pill>}
    </div>
  );
}

/** The pink-ruled turn statement — the line the whole section pivots on. */
export function TurnStatement({ text }: { text: string }) {
  return (
    <p className="my-6 border-l-[3px] border-cta pl-4 text-[19px] leading-[1.55] font-bold text-cta">
      {text}
    </p>
  );
}

/** Dark reframe panel — a quote given the weight of a full-width panel. */
export function PullPanel({ label, text }: { label: string; text: string }) {
  const paras = text.split(/\n{2,}/).filter((p) => p.trim() !== "");
  return (
    <div className="my-[26px] rounded-[15px] bg-ink-deep px-[30px] py-[26px]">
      <p className="mb-3 text-[9.5px] font-bold tracking-[0.7px] text-eyebrow-dark uppercase">
        {label}
      </p>
      {paras.map((para, i) => (
        <p
          key={i}
          className={`mb-[13px] text-[15.5px] leading-[1.88] last:mb-0 ${
            i === paras.length - 1 && paras.length > 1
              ? "text-[#e8c89a]"
              : "text-hero-text"
          }`}
        >
          {para.trim()}
        </p>
      ))}
    </div>
  );
}

/* ── trust panels shared by both templates ────────────────────── */

/** Collapsed table of every classified claim on the page (#58/#134). */
export function IntelligenceLayer({
  article,
  coreLabel,
}: {
  article: Article;
  coreLabel: string;
}) {
  const taggedSteps = collectTaggedSteps(article);
  const taggedSections = article.lang.en.blocks
    .map((block, i) => ({ block, i }))
    .filter((row): row is { block: Block & { dpb: Dpb }; i: number } =>
      Boolean(row.block.dpb),
    );

  return (
    <TrackedDetails
      slug={article.slug}
      className="group mt-8 overflow-hidden rounded-r-[14px] border border-border border-l-[3px] border-l-amber bg-card"
    >
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
              <th className="px-5 py-[9px] text-right font-bold">SCORE</th>
            </tr>
          </thead>
          <tbody>
            {article.dpb && (
              <tr className="border-t border-border-light">
                <td className="px-5 py-[10px] font-semibold text-ink">
                  {coreLabel === "CORE CLAIM" ? "Core claim" : "Core practice"}{" "}
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
            {taggedSections.map(({ block, i }) => (
              <tr key={`section-${i}`} className="border-t border-border-light">
                <td className="px-5 py-[10px] text-ink">
                  {block.title ?? `Section ${i + 1}`}
                </td>
                <td className="px-3 py-[10px]">
                  <DpbPill dpb={block.dpb} />
                </td>
                <td className="px-3 py-[10px] text-sub">
                  {[block.dpb.sourceName, block.dpb.sourceRef]
                    .filter(Boolean)
                    .join(" · ") ||
                    block.dpb.prathaScope ||
                    "—"}
                </td>
                <td className="px-5 py-[10px] text-right text-sub">
                  {typeof block.dpb.confidenceScore === "number"
                    ? `${block.dpb.confidenceScore}/5`
                    : "—"}
                </td>
              </tr>
            ))}
            {taggedSteps.map(({ step, dpb }) => (
              <tr key={step.number} className="border-t border-border-light">
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
    </TrackedDetails>
  );
}

/** Dated corrections log (#71/#134) — only rendered when something was fixed. */
export function CorrectionsLog({
  corrections,
}: {
  corrections: CorrectionEntry[];
}) {
  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="border-b border-border-light px-5 py-3 text-[11px] font-bold tracking-[0.6px] text-sub">
        CORRECTIONS — DATED
      </div>
      <ul>
        {corrections.map((c, i) => (
          <li
            key={i}
            className="border-b border-border-light px-5 py-3 text-[13px] leading-[1.75] last:border-b-0"
          >
            {c.date && (
              <b className="mr-2 text-ink">{formatObservanceDate(c.date)}</b>
            )}
            <span className="text-body">{c.note}</span>
          </li>
        ))}
      </ul>
      <p className="border-t border-border-light bg-[#FCFAF6] px-5 py-3 text-[12px] text-sub">
        Spotted something off?{" "}
        <Link href="/report-correction" className="font-bold text-cta">
          Report a correction ›
        </Link>
      </p>
    </div>
  );
}
