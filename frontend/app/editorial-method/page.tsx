import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DpbBadge } from "@/components/DpbBadge";
import { LangSection } from "@/components/article/LangSection";
import { MethodBand } from "@/components/MethodBand";
import { Pill } from "@/components/Pill";
import { methodContent, type MethodCopy } from "./content";

export const metadata: Metadata = {
  title: "Our Editorial Method — How We Decide What Is True",
  description:
    "Every claim on this platform is Dharma, Pratha or Bhranti — with a confidence score you can check. If we cannot name the text you could go and check, it is not Dharma.",
};

const TAG_CARD_BORDER = {
  dharma: "border-dharma-bd",
  pratha: "border-pratha-bd",
  bhranti: "border-bhranti-bd",
} as const;

const TAG_SCORE_TEXT = {
  dharma: "text-dharma-fg",
  pratha: "text-pratha-fg",
  bhranti: "text-bhranti-fg",
} as const;

const CALLOUT_BOX = {
  dharma: "border-dharma-bd bg-dharma-bg",
  pratha: "border-pratha-bd bg-pratha-bg",
} as const;

const CALLOUT_TEXT = {
  dharma: "text-dharma-fg",
  pratha: "text-pratha-fg",
} as const;

function SectionMark({
  n,
  title,
  dv,
}: {
  n: string;
  title: string;
  dv: string;
}) {
  return (
    <div className="mb-4">
      <p className="mb-[6px] text-[10px] font-bold tracking-[1px] text-cta uppercase">
        {n}
      </p>
      <h2
        className={`text-[22px] font-bold tracking-[-0.4px] text-ink md:text-[26px] ${dv}`}
      >
        {title}
      </h2>
    </div>
  );
}

function MethodBody({ c }: { c: MethodCopy }) {
  // Devanagari display face for headings in the Hindi rendering only.
  const dv = c.lang === "hi" ? "font-devanagari" : "";

  return (
    <div>
      <Breadcrumb
        items={[
          { label: c.breadcrumb.home, href: "/" },
          { label: c.breadcrumb.self },
        ]}
      />

      {/* hero */}
      <section className="hero-dc relative overflow-hidden py-9 md:py-[52px]">
        <div className="mx-auto max-w-[820px] px-4 md:px-10">
          <p className="mb-[11px] text-[10px] tracking-[1px] text-eyebrow-dark uppercase">
            {c.hero.eyebrow}
          </p>
          <h1
            className={`mb-[13px] text-[30px] leading-[1.12] font-bold tracking-[-0.8px] text-hero-text md:text-[42px] ${dv}`}
          >
            {c.hero.title}
          </h1>
          <p className="mb-4 max-w-[620px] text-sm leading-[1.8] text-hero-text/75 md:text-[15.5px]">
            {c.hero.lead}
          </p>
          <p className="max-w-[620px] border-t border-white/15 pt-4 text-[12.5px] leading-relaxed text-hero-text/55">
            {c.hero.note}
          </p>
        </div>
      </section>

      <div className="mx-auto flex max-w-[820px] flex-col gap-12 px-4 py-10 md:px-10">
        {/* the problem */}
        <section>
          <SectionMark n={c.problem.n} title={c.problem.title} dv={dv} />
          {c.problem.paras.map((p, i) => (
            <p
              key={i}
              className={`text-[14px] leading-[1.85] text-body ${
                i < c.problem.paras.length - 1 ? "mb-3" : ""
              }`}
            >
              {p}
            </p>
          ))}
        </section>

        {/* 01 · naming rule */}
        <section id="naming-rule">
          <SectionMark n={c.naming.n} title={c.naming.title} dv={dv} />
          <div className="rounded-[18px] border-l-[3px] border-cta bg-card px-5 py-6 md:px-[28px]">
            <p className="mb-2 text-[10px] font-bold tracking-[0.8px] text-cta uppercase">
              {c.naming.ruleLabel}
            </p>
            <p
              className={`mb-4 text-[19px] leading-[1.45] font-bold tracking-[-0.3px] text-ink md:text-[22px] ${dv}`}
            >
              {c.naming.rule}
            </p>
            {c.naming.paras.map((p, i) => (
              <p
                key={i}
                className={`text-[13px] leading-[1.8] text-body ${
                  i < c.naming.paras.length - 1 ? "mb-3" : ""
                }`}
              >
                {p}
              </p>
            ))}
          </div>

          <div className="mt-4 overflow-hidden rounded-[15px] border border-border bg-card">
            <div className="grid grid-cols-2 border-b border-border bg-bg px-5 py-[9px] text-[10px] font-bold tracking-[0.8px] text-sub uppercase">
              <span>{c.naming.tableHead[0]}</span>
              <span>{c.naming.tableHead[1]}</span>
            </div>
            {c.naming.tableRows.map(([from, to]) => (
              <div
                key={from}
                className="grid grid-cols-2 gap-4 border-b-[0.5px] border-border-light px-5 py-3 text-[12.5px] leading-relaxed last:border-b-0"
              >
                <span className="text-sub line-through decoration-border">
                  {from}
                </span>
                <span className="font-semibold text-body">{to}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 02 · the three tags */}
        <section id="three-tags">
          <SectionMark n={c.tags.n} title={c.tags.title} dv={dv} />
          <p className="mb-5 max-w-[640px] text-[13.5px] leading-[1.8] text-sub">
            {c.tags.intro}
          </p>
          <MethodBand />

          <div className="mt-5 flex flex-col gap-4">
            {c.tags.cards.map((card) => (
              <div
                key={card.tag}
                className={`rounded-[15px] border bg-card p-5 ${TAG_CARD_BORDER[card.tag]}`}
              >
                <div className="mb-2 flex flex-wrap items-center gap-3">
                  <DpbBadge tag={card.tag} />
                  <h3 className={`text-[15.5px] font-bold text-ink ${dv}`}>
                    {card.heading}
                  </h3>
                </div>
                {card.paras.map((p, i) => (
                  <p
                    key={i}
                    className={`text-[13px] leading-[1.8] text-body ${
                      !card.scoreLine && i === card.paras.length - 1
                        ? "mb-3"
                        : "mb-2"
                    }`}
                  >
                    {p}
                  </p>
                ))}
                {card.scoreLine && (
                  <p
                    className={`mb-3 text-[11.5px] font-bold ${TAG_SCORE_TEXT[card.tag]}`}
                  >
                    {card.scoreLine}
                  </p>
                )}
                <div className="rounded-[11px] bg-bg px-4 py-3">
                  <p className="mb-1 text-[9.5px] font-bold tracking-[0.6px] text-sub uppercase">
                    {card.exampleLabel}
                  </p>
                  <p className="mb-1 text-[12.5px] leading-relaxed text-body italic">
                    {card.exampleQuote}
                  </p>
                  <p className="text-[11.5px] text-sub">{card.exampleSource}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 03 · the score scale */}
        <section id="score">
          <SectionMark n={c.score.n} title={c.score.title} dv={dv} />
          <p className="mb-5 max-w-[640px] text-[13.5px] leading-[1.8] text-sub">
            {c.score.intro}
          </p>
          <div className="overflow-hidden rounded-[15px] border border-border bg-card">
            {c.score.rows.map((row) => (
              <div
                key={row.badge}
                className="flex flex-col gap-2 border-b-[0.5px] border-border-light px-5 py-4 last:border-b-0 sm:flex-row sm:items-start sm:gap-5"
              >
                <span className="w-[64px] shrink-0 text-[19px] font-bold text-ink">
                  {row.score}
                </span>
                <Pill className="shrink-0 sm:mt-[3px]">{row.badge}</Pill>
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-bold text-ink">
                    {row.title}
                  </span>
                  <span className="mt-[2px] block text-[12.5px] leading-relaxed text-sub">
                    {row.detail}
                  </span>
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {c.score.callouts.map((box) => (
              <div
                key={box.label}
                className={`rounded-[13px] border px-4 py-3 ${CALLOUT_BOX[box.kind]}`}
              >
                <p
                  className={`mb-1 text-[10.5px] font-bold tracking-[0.5px] ${CALLOUT_TEXT[box.kind]}`}
                >
                  {box.label}
                </p>
                <p className="text-[12.5px] leading-relaxed text-body">
                  {box.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 04 · panchang exemption */}
        <section id="panchang">
          <SectionMark n={c.panchang.n} title={c.panchang.title} dv={dv} />
          {c.panchang.paras.map((p, i) => (
            <p
              key={i}
              className={`text-[14px] leading-[1.85] text-body ${
                i < c.panchang.paras.length - 1 ? "mb-3" : ""
              }`}
            >
              {p}
            </p>
          ))}
        </section>

        {/* 05 · how an article is made */}
        <section id="process">
          <SectionMark n={c.process.n} title={c.process.title} dv={dv} />
          <p className="mb-5 text-[13.5px] leading-[1.8] text-sub">
            {c.process.intro}
          </p>
          <div className="flex flex-col gap-3">
            {c.process.stages.map((stage, i) => (
              <div
                key={stage.title}
                className="flex gap-4 rounded-[13px] border border-border bg-card px-5 py-4"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink-deep text-[13px] font-bold text-eyebrow-dark">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-ink">{stage.title}</p>
                  <p className="mt-[2px] text-[12.5px] leading-relaxed text-sub">
                    {stage.body}
                  </p>
                  <p className="mt-[6px] text-[9.5px] font-bold tracking-[0.7px] text-gold uppercase">
                    {stage.owner}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {c.process.tests.map(([name, q, verdict]) => (
              <div
                key={name}
                className="rounded-[13px] border border-border bg-card px-4 py-4"
              >
                <p className="mb-2 text-[10px] font-bold tracking-[0.7px] text-cta uppercase">
                  {name}
                </p>
                <p className="mb-2 text-[12.5px] leading-relaxed text-body">
                  {q}
                </p>
                <p className="text-[11.5px] font-bold text-ink">{verdict}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 06 · what we will never do */}
        <section id="never">
          <SectionMark n={c.never.n} title={c.never.title} dv={dv} />
          <p className="mb-5 max-w-[640px] text-[13.5px] leading-[1.8] text-sub">
            {c.never.intro}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {c.never.items.map((item) => (
              <div
                key={item.title}
                className="rounded-[13px] border border-border border-l-[3px] border-l-cta bg-card px-4 py-4"
              >
                <p className="mb-1 text-[13.5px] font-bold text-ink">
                  {item.title}
                </p>
                <p className="text-[12.5px] leading-relaxed text-sub">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 07 · challenge a claim */}
        <section id="challenge">
          <SectionMark n={c.challenge.n} title={c.challenge.title} dv={dv} />
          <div className="grid gap-6 rounded-[18px] bg-ink-deep px-5 py-6 md:grid-cols-[1.1fr_1fr] md:px-[30px] md:py-[28px]">
            <div>
              <h3 className={`mb-2 text-[18px] font-bold text-hero-text ${dv}`}>
                {c.challenge.heading}
              </h3>
              <p className="mb-3 text-[13px] leading-[1.8] text-[#C4A882]">
                {c.challenge.p1}
              </p>
              <p className="mb-4 text-[13px] leading-[1.8] text-[#C4A882]">
                {c.challenge.p2}
              </p>
              <Link
                href="/report-correction"
                className="inline-block rounded-[11px] bg-cta px-[22px] py-[11px] text-[12.5px] font-bold text-white"
              >
                {c.challenge.cta}
              </Link>
            </div>
            <ol className="flex flex-col gap-[10px] self-center">
              {c.challenge.steps.map((step, i) => (
                <li
                  key={i}
                  className="flex gap-3 text-[12.5px] leading-relaxed text-[#A99070]"
                >
                  <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-eyebrow-dark">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-6 border-l-[3px] border-gold pl-5">
            {c.challenge.closing.map((p, i) => (
              <p
                key={i}
                className={`text-[13.5px] leading-[1.85] text-body italic ${
                  i < c.challenge.closing.length - 1 ? "mb-3" : ""
                }`}
              >
                {p}
              </p>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function EditorialMethodPage() {
  return (
    <>
      <LangSection lang="en">
        <MethodBody c={methodContent.en} />
      </LangSection>
      <LangSection lang="hi">
        <MethodBody c={methodContent.hi} />
      </LangSection>
    </>
  );
}
