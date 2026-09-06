import type { Metadata } from "next";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CorrectionForm } from "@/components/staticpages/CorrectionForm";

export const metadata: Metadata = {
  title: "Report a Correction",
  description:
    "If something on The Tapa Co. does not appear to be right, tell us. Every correction is read by the Ritual Intelligence Team, and every change is recorded on the article with its date.",
};

const WORTH_BRINGING = [
  {
    title: "A source that has been cited incorrectly.",
    body: "A verse, chapter, text or attribution that does not support what has been written.",
  },
  {
    title: "A date or timing that needs correction.",
    body: "Tithi, muhurat, parana window or festival date.",
  },
  {
    title: "A distinction that has been blurred.",
    body: "Scripture presented as Pratha, or Pratha presented as scripture.",
  },
  {
    title: "A claim without a clear source.",
    body: "Something presented as fact where the underlying source should be identified.",
  },
  {
    title: "A name or term that needs care.",
    body: "Including names and terms in English or Devanagari.",
  },
] as const;

const WHEN_PRACTICES_DIFFER = [
  {
    title: "A different family or regional practice is not necessarily an error.",
    body: "Where practices vary, we preserve that distinction and identify them as Pratha where appropriate.",
  },
  {
    title: "Different texts may offer different accounts.",
    body: "We do not flatten those differences. Where relevant, we present the sources and acknowledge the distinction.",
  },
  {
    title: "A correction is not an invitation to add unsupported claims.",
    body: "Our editorial approach remains grounded in identifiable sources and established practice.",
  },
] as const;

const HERO_STEPS = [
  {
    title: "Your submission is read.",
    body: "Every correction reaches our Ritual Intelligence Team.",
  },
  {
    title: "The source is examined.",
    body: "We review the source you share alongside the source already cited.",
  },
  {
    title: "The article is reviewed.",
    body: "Where a correction is warranted, we amend the article. Where the evidence differs, we will explain why.",
  },
  {
    title: "The record is kept.",
    body: "Every correction we make is recorded on the article with its date.",
  },
] as const;

export default function ReportCorrectionPage() {
  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Our Editorial Method", href: "/editorial-method" },
          { label: "Report a Correction" },
        ]}
      />

      {/* hero */}
      <section className="hero-rg py-9 md:py-[48px]">
        <div className="mx-auto grid max-w-[1280px] items-center gap-8 px-4 md:grid-cols-[1.2fr_0.8fr] md:px-10">
          <div>
            <h1 className="mb-[13px] max-w-[560px] text-[28px] leading-[1.15] font-bold tracking-[-0.7px] text-hero-text md:text-[38px]">
              A culture this rich deserves careful stewardship.
            </h1>
            <p className="mb-3 max-w-[540px] text-sm leading-[1.8] text-hero-text/75">
              At The Tapa Co., we believe that what we share about our culture
              should be approached with care, clarity and respect.
            </p>
            <p className="mb-3 max-w-[540px] text-sm leading-[1.8] text-hero-text/75">
              Where a practice is found in scripture, we identify the text.
              Where it belongs to Pratha — a living family or regional custom —
              we say so. And where something has been misunderstood or
              incorrectly attributed, we seek to set the record right.
            </p>
            <p className="max-w-[540px] text-sm leading-[1.8] text-hero-text/75">
              If something on The Tapa Co. does not appear to be right, tell
              us. A thoughtful correction helps us serve our readers, and the
              culture we seek to represent, with greater care.
            </p>
          </div>
          <aside className="rounded-2xl border border-white/[0.14] bg-white/[0.07] px-[22px] py-5">
            <p className="mb-3 text-[10px] font-bold tracking-[0.8px] text-eyebrow-dark uppercase">
              What happens next
            </p>
            <ol className="flex flex-col gap-3">
              {HERO_STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-3">
                  <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-eyebrow-dark">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block text-[12.5px] font-bold text-hero-text">
                      {step.title}
                    </span>
                    <span className="mt-[1px] block text-[11.5px] leading-relaxed text-hero-text/60">
                      {step.body}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </section>

      <div className="mx-auto max-w-[820px] px-4 py-10 md:px-10">
        <p className="mb-4 text-[10px] font-bold tracking-[1px] text-cta uppercase">
          The correction
        </p>
        <CorrectionForm />

        {/* what we review */}
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-[15px] border border-border bg-card p-5">
            <p className="mb-3 text-[10px] font-bold tracking-[0.8px] text-dharma-fg uppercase">
              Worth bringing to us
            </p>
            <div className="flex flex-col gap-3">
              {WORTH_BRINGING.map((item, i) => (
                <div key={item.title} className="flex gap-3">
                  <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-dharma-bg text-[11px] font-bold text-dharma-fg">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block text-[13px] font-bold text-ink">
                      {item.title}
                    </span>
                    <span className="mt-[1px] block text-[12px] leading-relaxed text-sub">
                      {item.body}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[15px] border border-border bg-card p-5">
            <p className="mb-3 text-[10px] font-bold tracking-[0.8px] text-gold uppercase">
              When practices differ
            </p>
            <div className="flex flex-col gap-3">
              {WHEN_PRACTICES_DIFFER.map((item, i) => (
                <div key={item.title} className="flex gap-3">
                  <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-pratha-bg text-[11px] font-bold text-pratha-fg">
                    {i + 1}
                  </span>
                  <span>
                    <span className="block text-[13px] font-bold text-ink">
                      {item.title}
                    </span>
                    <span className="mt-[1px] block text-[12px] leading-relaxed text-sub">
                      {item.body}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* the record */}
        <div className="mt-6 rounded-[18px] bg-ink-deep px-5 py-6 md:px-[30px]">
          <p className="mb-4 text-[10px] font-bold tracking-[0.8px] text-eyebrow-dark uppercase">
            The record
          </p>
          <div className="grid gap-5 md:grid-cols-3">
            {(
              [
                [
                  "Where corrections appear",
                  "On the article itself, dated at the foot of the page. We do not make substantive corrections silently.",
                ],
                [
                  "Who reviews them",
                  "The Ritual Intelligence Team. Editorial and sourcing decisions are made through review of the evidence, not by volume of submissions.",
                ],
                [
                  "When we reach a different conclusion",
                  "We explain our reasoning and identify the source on which our decision rests.",
                ],
              ] as const
            ).map(([k, v]) => (
              <div key={k}>
                <p className="mb-1 text-[13px] font-bold text-hero-text">{k}</p>
                <p className="text-[12px] leading-relaxed text-[#A99070]">{v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
