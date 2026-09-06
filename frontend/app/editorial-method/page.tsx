import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DpbBadge } from "@/components/DpbBadge";
import { MethodBand } from "@/components/MethodBand";
import { Pill } from "@/components/Pill";

export const metadata: Metadata = {
  title: "Our Editorial Method — How We Decide What Is True",
  description:
    "Every claim on this platform is Dharma, Pratha or Bhranti — with a confidence score you can check. If we cannot name the text you could go and check, it is not Dharma.",
};

const SCORE_ROWS = [
  {
    score: "5 / 5",
    badge: "VEDIC",
    title: "Directly in Shruti",
    detail:
      "Veda, Brahmana, Aranyaka or a principal Upanishad. Example — the Abhisheka ritual, Krishna Yajurveda, Shri Rudram.",
  },
  {
    score: "4 / 5",
    badge: "PURANIC",
    title: "Stated in a Mahapurana, Itihasa, Dharmashastra, Kalpa Sutra or Agama",
    detail:
      "The layer most ritual practice actually rests on. Example — the Sawan Somwar vrat.",
  },
  {
    score: "3 / 5",
    badge: "SHASTRA",
    title: "In a named nibandha, bhashya or bhakti-period composition",
    detail:
      "Named secondary texts — still named. Example — vrat tithi determination per Nirnaya Sindhu; the Ramcharitmanas and the stotras.",
  },
  {
    score: "2 / 5",
    badge: "REGIONAL",
    title: "Regional, community, sampradaya or panchang convention",
    detail: "Where most Pratha sits. Example — Sinjara, the Kanwar Yatra.",
  },
  {
    score: "1 / 5",
    badge: "ORAL",
    title: "Family, oral or folk practice",
    detail:
      "Passed down rather than written down. We say so plainly rather than dressing it up.",
  },
  {
    score: "—",
    badge: "CORRECTION",
    title: "Bhranti — no score",
    detail:
      "Nothing to score. A correction badge appears instead, on the myth card.",
  },
] as const;

const NEVER = [
  {
    title: "Use fear to sell anything",
    body: "No remedies for misfortune, no warnings about what happens if you skip a step, no dosha framed as a problem we can solve for a fee.",
  },
  {
    title: "Publish astrology or personal prescription",
    body: "No horoscopes, no rashifal, no kundli matching. We never derive a ritual from a birth chart, rashi or planetary period. Calendar mechanics, yes. Personal prescription, never.",
  },
  {
    title: "Let commerce change what we print",
    body: "Selling a kit for a ritual does not alter a word of the guide for it. The guide says a kit is unnecessary, because it is.",
  },
  {
    title: "Present custom as scripture",
    body: "If we cannot name the text, we say Pratha. Even when the practice is universal. Even when it would read better as Dharma.",
  },
  {
    title: "Restrict practice by who you are",
    body: "Where a source text places no restriction on who may perform a ritual, neither do we — and we correct claims that do.",
  },
  {
    title: "Put a guide behind a paywall",
    body: "Every ritual guide, every samagri list, every correction is free to read and will stay that way.",
  },
] as const;

const STAGES = [
  {
    title: "Editorial draft",
    body: "Built from the named text, not from what is commonly said about the ritual. Every claim is logged against its source before any prose is written.",
    owner: "WRITER",
  },
  {
    title: "Source verification",
    body: "Each citation checked against the original text — not against a digest that quotes it. Claims that do not survive are downgraded or dropped.",
    owner: "EDITOR",
  },
  {
    title: "Practitioner review",
    body: "Including an iconographic accuracy check on every deity image — attributes, hands, vahana, posture, consorts.",
    owner: "EXTERNAL REVIEWER",
  },
  {
    title: "Fear-language audit",
    body: "Every line read once more for one question: does this create, imply or reinforce fear? Lines that fail are rewritten, even when factually correct.",
    owner: "EDITOR",
  },
  {
    title: "Regional variance check",
    body: "Whether the regional detail is accurately scoped — and whether we have quietly presented one region's custom as universal.",
    owner: "REGIONAL REVIEWER",
  },
  {
    title: "Approval — and revisable after",
    body: "Going live is not the end of the process. Corrections are made openly, and the article notes when a claim has been revised.",
    owner: "RI EDITOR",
  },
] as const;

function SectionMark({ n, title }: { n: string; title: string }) {
  return (
    <div className="mb-4">
      <p className="mb-[6px] text-[10px] font-bold tracking-[1px] text-cta uppercase">
        {n}
      </p>
      <h2 className="text-[22px] font-bold tracking-[-0.4px] text-ink md:text-[26px]">
        {title}
      </h2>
    </div>
  );
}

export default function EditorialMethodPage() {
  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Our Editorial Method" },
        ]}
      />

      {/* hero */}
      <section className="hero-dc relative overflow-hidden py-9 md:py-[52px]">
        <div className="mx-auto max-w-[820px] px-4 md:px-10">
          <p className="mb-[11px] text-[10px] tracking-[1px] text-eyebrow-dark uppercase">
            Our Editorial Method
          </p>
          <h1 className="mb-[13px] text-[30px] leading-[1.12] font-bold tracking-[-0.8px] text-hero-text md:text-[42px]">
            How we decide what is true
          </h1>
          <p className="mb-4 max-w-[620px] text-sm leading-[1.8] text-hero-text/75 md:text-[15.5px]">
            Every claim on this platform is placed in one of three categories,
            and most carry a score out of five. The score says{" "}
            <b className="text-hero-text">how close the source sits to Shruti</b>{" "}
            — not how important the ritual is, and not how strongly anyone
            believes it.
          </p>
          <p className="max-w-[620px] border-t border-white/15 pt-4 text-[12.5px] leading-relaxed text-hero-text/55">
            If you arrived by tapping &ldquo;Read source&rdquo; on an article —
            this is the right place. The specific text for that claim is named
            on the article itself; this page explains the system behind it.
          </p>
        </div>
      </section>

      <div className="mx-auto flex max-w-[820px] flex-col gap-12 px-4 py-10 md:px-10">
        {/* the problem */}
        <section>
          <SectionMark n="The problem this solves" title="Most ritual advice does not tell you where it came from" />
          <p className="mb-3 text-[14px] leading-[1.85] text-body">
            Someone tells you a vrat must be kept without water. Someone else
            says a particular day is unlucky. A forwarded message warns you
            what happens if you skip a step. None of it says whether it comes
            from a text, from a region, from a family — or from nowhere at all.
          </p>
          <p className="text-[14px] leading-[1.85] text-body">
            That is the gap. Not a shortage of information about Hindu ritual,
            but <b>no way to tell which kind of information you are looking at.</b>
          </p>
        </section>

        {/* 01 · naming rule */}
        <section id="naming-rule">
          <SectionMark n="Section 01" title="The naming rule" />
          <div className="rounded-[18px] border-l-[3px] border-cta bg-card px-5 py-6 md:px-[28px]">
            <p className="mb-2 text-[10px] font-bold tracking-[0.8px] text-cta uppercase">
              The rule
            </p>
            <p className="mb-4 text-[19px] leading-[1.45] font-bold tracking-[-0.3px] text-ink md:text-[22px]">
              If we cannot name the text you could go and check, the answer is
              no. It is not Dharma.
            </p>
            <p className="mb-3 text-[13px] leading-[1.8] text-body">
              Two things have to be true. We can name the text. And{" "}
              <b>you could go and verify it yourself.</b> Both, not either.
            </p>
            <p className="mb-3 text-[13px] leading-[1.8] text-body">
              What this rules out is the most tempting case: a practice
              everybody follows, that every pandit endorses, that has clearly
              been done for centuries — and nobody can say which text it comes
              from. That is Pratha. Not because it is lesser, but because we
              cannot show our working, and showing our working is the whole
              promise.
            </p>
            <p className="text-[13px] leading-[1.8] text-body">
              The pressure always runs one way — to round up.{" "}
              <b>
                A correct Pratha costs us nothing. A wrong Dharma costs us the
                only thing we have.
              </b>
            </p>
          </div>

          <div className="mt-4 overflow-hidden rounded-[15px] border border-border bg-card">
            <div className="grid grid-cols-2 border-b border-border bg-bg px-5 py-[9px] text-[10px] font-bold tracking-[0.8px] text-sub uppercase">
              <span>Instead of</span>
              <span>We write</span>
            </div>
            {(
              [
                ["“The Vedas say…”", "Shri Rudram, Taittiriya Samhita 4.5"],
                ["“Scripture prescribes…”", "Shiva Purana, Rudra Samhita"],
                [
                  "“It is traditionally held that…”",
                  "This is a regional tradition in Rajasthan and UP. It is valid but not universally binding.",
                ],
                [
                  "“Pandits agree that…”",
                  "Either the text gets named, or it is tagged Pratha.",
                ],
              ] as const
            ).map(([from, to]) => (
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
          <SectionMark n="Section 02" title="The three tags" />
          <p className="mb-5 max-w-[640px] text-[13.5px] leading-[1.8] text-sub">
            These are not degrees of truth. They are different kinds of
            authority — and knowing which one you are looking at is the entire
            point. A 2/5 Pratha is not lesser than a 5/5 Dharma. It is a
            different kind of claim.
          </p>
          <MethodBand />

          <div className="mt-5 flex flex-col gap-4">
            <div className="rounded-[15px] border border-dharma-bd bg-card p-5">
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <DpbBadge tag="dharma" />
                <h3 className="text-[15.5px] font-bold text-ink">
                  Traceable to a named text
                </h3>
              </div>
              <p className="mb-2 text-[13px] leading-[1.8] text-body">
                Not &ldquo;the scriptures say&rdquo; — <b>which</b> scripture,
                and where in it. If we cannot name a source you could go and
                verify, the claim does not get this tag, however widely it is
                believed. Universal authority.
              </p>
              <p className="mb-3 text-[11.5px] font-bold text-dharma-fg">
                Scores 3/5 to 5/5 — never below 3.
              </p>
              <div className="rounded-[11px] bg-bg px-4 py-3">
                <p className="mb-1 text-[9.5px] font-bold tracking-[0.6px] text-sub uppercase">
                  From the Janmashtami guide
                </p>
                <p className="mb-1 text-[12.5px] leading-relaxed text-body italic">
                  &ldquo;The midnight puja is performed during Nishita Kaal —
                  the birth moment named in the text.&rdquo;
                </p>
                <p className="text-[11.5px] text-sub">
                  <b>Bhagavata Purana</b> · Skandha 10, Chapters 1–4 · Puranic ·
                  4/5
                </p>
              </div>
            </div>

            <div className="rounded-[15px] border border-pratha-bd bg-card p-5">
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <DpbBadge tag="pratha" />
                <h3 className="text-[15.5px] font-bold text-ink">
                  Regional, community, lineage or family custom
                </h3>
              </div>
              <p className="mb-2 text-[13px] leading-[1.8] text-body">
                It might be centuries old. It might be the most meaningful part
                of the day for your family. We are not ranking it below Dharma
                or suggesting you drop it. We are only saying:{" "}
                <b>this one is yours, not scripture&rsquo;s.</b> Which matters
                when someone tells you your way is wrong, or that another
                region&rsquo;s practice is the correct one. Neither is true.
              </p>
              <p className="mb-3 text-[11.5px] font-bold text-pratha-fg">
                Scores 1/5 to 2/5 — never above 2.
              </p>
              <div className="rounded-[11px] bg-bg px-4 py-3">
                <p className="mb-1 text-[9.5px] font-bold tracking-[0.6px] text-sub uppercase">
                  From the bilva concept article
                </p>
                <p className="mb-1 text-[12.5px] leading-relaxed text-body italic">
                  &ldquo;The smooth underside of the leaf faces the
                  Shivalinga.&rdquo;
                </p>
                <p className="text-[11.5px] text-sub">
                  Widely observed across Shaiva practice ·{" "}
                  <b>no named text mandates this orientation</b>
                </p>
              </div>
            </div>

            <div className="rounded-[15px] border border-bhranti-bd bg-card p-5">
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <DpbBadge tag="bhranti" />
                <h3 className="text-[15.5px] font-bold text-ink">
                  Fear-based or commercially manufactured
                </h3>
              </div>
              <p className="mb-2 text-[13px] leading-[1.8] text-body">
                Bhranti carries no score because there is nothing to score. We
                recognise it by shape — a threatened consequence for omission, a
                claim of total invalidation, an exclusivity rule, devotion
                ranked by difficulty or expense, a prescription derived from a
                birth chart, or a manufactured product requirement.
              </p>
              <p className="mb-3 text-[13px] leading-[1.8] text-body">
                A claim can be sincere, ancient and widely believed and still
                be Bhranti. <b>Age is not authority.</b> The correction is
                always gentle, and always cites what actually contradicts it.
              </p>
              <div className="rounded-[11px] bg-bg px-4 py-3">
                <p className="mb-1 text-[9.5px] font-bold tracking-[0.6px] text-sub uppercase">
                  From the Rudrabhishek guide
                </p>
                <p className="mb-1 text-[12.5px] leading-relaxed text-body italic">
                  &ldquo;Only a Brahmin can perform Rudrabhishek.&rdquo;
                </p>
                <p className="text-[11.5px] text-sub">
                  No source text restricts performance.{" "}
                  <b>Correction badge — no score.</b>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 03 · the score scale */}
        <section id="score">
          <SectionMark n="Section 03" title="The score, and the badge beside it" />
          <p className="mb-5 max-w-[640px] text-[13.5px] leading-[1.8] text-sub">
            The number describes <b className="text-body">which class of source
            the claim comes from</b>. The badge names that class in a word.
            Together they tell you how close the claim sits to Shruti — the
            oldest and most universally accepted layer of the tradition.
          </p>
          <div className="overflow-hidden rounded-[15px] border border-border bg-card">
            {SCORE_ROWS.map((row) => (
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
            <div className="rounded-[13px] border border-dharma-bd bg-dharma-bg px-4 py-3">
              <p className="mb-1 text-[10.5px] font-bold tracking-[0.5px] text-dharma-fg">
                DHARMA · 3 TO 5
              </p>
              <p className="text-[12.5px] leading-relaxed text-body">
                If a claim would score below 3, it is not Dharma. The tag is
                wrong, not the score.
              </p>
            </div>
            <div className="rounded-[13px] border border-pratha-bd bg-pratha-bg px-4 py-3">
              <p className="mb-1 text-[10.5px] font-bold tracking-[0.5px] text-pratha-fg">
                PRATHA · 1 TO 2
              </p>
              <p className="text-[12.5px] leading-relaxed text-body">
                If a Pratha claim seems to deserve a 3, a named text has been
                found — and it is Dharma.
              </p>
            </div>
          </div>
        </section>

        {/* 04 · panchang exemption */}
        <section id="panchang">
          <SectionMark n="Section 04" title="Why Panchang carries no tag and no score" />
          <p className="mb-3 text-[14px] leading-[1.85] text-body">
            Panchang content — today&rsquo;s tithi, a festival date, sunrise,
            Rahu Kaal timing — carries{" "}
            <b>no classification tag and no score.</b> Not because it is less
            reliable, but because it is a different kind of claim.
          </p>
          <p className="mb-3 text-[14px] leading-[1.85] text-body">
            A tithi is computed, not interpreted. There is no scriptural
            authority to weigh, because nobody is making a claim about what you
            should do — only about where the Sun and Moon are. The almanac
            source is named directly in a Source Strip, which replaces the
            credibility card.
          </p>
          <p className="mb-3 text-[14px] leading-[1.85] text-body">
            Where a Panchang article does make a claim about practice — that
            Sutak applies only where an eclipse is visible, for instance —{" "}
            <b>that specific claim is tagged and corrected like any other.</b>{" "}
            The data is not. The interpretation is.
          </p>
          <p className="text-[14px] leading-[1.85] text-body">
            Panchang sourcing never counts toward a Dharma or Pratha badge
            anywhere else on the platform. And where publishers disagree on a
            tithi boundary, we say so in the article rather than presenting one
            publisher&rsquo;s answer as the correct one.
          </p>
        </section>

        {/* 05 · how an article is made */}
        <section id="process">
          <SectionMark n="Section 05" title="How an article gets made" />
          <p className="mb-5 text-[13.5px] leading-[1.8] text-sub">
            Six stages. Nothing goes live from a first draft.
          </p>
          <div className="flex flex-col gap-3">
            {STAGES.map((stage, i) => (
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
            {(
              [
                [
                  "Test 1 · Fear",
                  "Does this line create, imply, or reinforce fear about ritual practice?",
                  "If yes → rewrite. Always.",
                ],
                [
                  "Test 2 · Clarity",
                  "If someone doing this for the first time read this, would they know exactly what to do?",
                  "If no → rewrite.",
                ],
                [
                  "Test 3 · Source",
                  "If challenged, can we point to a specific text, chapter, or section for this claim?",
                  "If no → do not make the claim.",
                ],
              ] as const
            ).map(([name, q, verdict]) => (
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
          <SectionMark n="Section 06" title="What we will never do" />
          <p className="mb-5 max-w-[640px] text-[13.5px] leading-[1.8] text-sub">
            Not preferences. These are the conditions under which this platform
            is worth having.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {NEVER.map((item) => (
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
          <SectionMark n="Section 07" title="Tell us we are wrong" />
          <div className="grid gap-6 rounded-[18px] bg-ink-deep px-5 py-6 md:grid-cols-[1.1fr_1fr] md:px-[30px] md:py-[28px]">
            <div>
              <h3 className="mb-2 text-[18px] font-bold text-hero-text">
                A method nobody can question is not a method
              </h3>
              <p className="mb-3 text-[13px] leading-[1.8] text-[#C4A882]">
                If a citation is wrong, a score sits too high, a regional
                practice is misrepresented, or something has been tagged Pratha
                that you can point to in a text — we want to hear it.
                Especially the last one.
              </p>
              <p className="mb-4 text-[13px] leading-[1.8] text-[#C4A882]">
                Every challenge gets a reply from a person. Where you are
                right, the article changes and says that it changed.
              </p>
              <Link
                href="/report-correction"
                className="inline-block rounded-[11px] bg-cta px-[22px] py-[11px] text-[12.5px] font-bold text-white"
              >
                Challenge a claim ›
              </Link>
            </div>
            <ol className="flex flex-col gap-[10px] self-center">
              {[
                <>Tell us the <b className="text-hero-text">article and the specific line</b>.</>,
                <>Tell us what you believe is correct, and <b className="text-hero-text">where it comes from</b> — a text, a regional tradition, a family practice.</>,
                <>We check it against the source edition, not a digest.</>,
                <>You get a reply either way — <b className="text-hero-text">including when we disagree</b>, with our reasoning.</>,
              ].map((step, i) => (
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
            <p className="mb-3 text-[13.5px] leading-[1.85] text-body italic">
              Nobody owns Dharma. Not a company, not an institution, not a
              person. We are students of this before we are publishers of it,
              and we read it that way — carefully, against the text, and
              without assuming the version we grew up with is the only one.
            </p>
            <p className="text-[13.5px] leading-[1.85] text-body italic">
              What we can promise is the method: name the text or do not make
              the claim, separate what is written from what is done, never use
              fear, and correct in the open. That is the whole of it.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
