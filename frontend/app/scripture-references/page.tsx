import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Pill } from "@/components/Pill";

export const metadata: Metadata = {
  title: "Scripture References — The Texts Behind Every Claim",
  description:
    "The tiered register of source texts this platform cites — Shruti, the Puranic layer, and named nibandha commentary — and the rules we follow when texts disagree.",
};

interface Tier {
  n: string;
  badge: string;
  score: string;
  name: string;
  intro: string;
  texts: { title: string; note: string }[];
  footnote?: string;
}

const TIERS: readonly Tier[] = [
  {
    n: "Tier 1",
    badge: "VEDIC",
    score: "5 / 5",
    name: "Shruti",
    intro:
      "The oldest and most universally accepted layer of the tradition — what was heard, not composed. A claim cites this tier only when the passage itself can be named.",
    texts: [
      {
        title: "Rigveda",
        note: "Hymns and their Brahmana and Aranyaka layers.",
      },
      {
        title: "Yajurveda",
        note: "Including the Taittiriya Samhita — the home of Shri Rudram, cited on the abhisheka guides.",
      },
      { title: "Samaveda", note: "The melodic recension of the hymns." },
      { title: "Atharvaveda", note: "Hymns of the household and healing." },
      {
        title: "The principal Upanishads",
        note: "The Vedantic close of each Veda — Isha, Kena, Katha, Taittiriya and their peers.",
      },
    ],
  },
  {
    n: "Tier 2",
    badge: "PURANIC",
    score: "4 / 5",
    name: "Smriti, Itihasa & Purana",
    intro:
      "The layer most ritual practice actually rests on. These are the texts our seeded guides cite by name today; the register grows as new guides are published.",
    texts: [
      {
        title: "Shiva Purana",
        note: "Rudra Samhita and Parvati Khanda — the Sawan Somwar and Teej vrat kathas.",
      },
      {
        title: "Bhavishya Purana (Uttara Parva)",
        note: "The Bhavishyottara section — Raksha Bandhan's Indra–Shachi raksha katha and several vrat mahatmyas.",
      },
      {
        title: "Brahmanda Purana",
        note: "Ekadashi mahatmyas told as the Krishna–Yudhishthira samvada.",
      },
      {
        title: "Brahmavaivarta Purana",
        note: "Krishna-janma and vrat narratives.",
      },
      {
        title: "Padma Purana",
        note: "Vrat mahatmyas and tithi kathas across the calendar year.",
      },
    ],
    footnote:
      "Editions: where a printed edition matters, we verify against the widely available Gita Press (Gorakhpur) editions, and say so on the article when chapter numbering differs between recensions.",
  },
  {
    n: "Tier 3",
    badge: "SHASTRA",
    score: "3 / 5",
    name: "Nibandha & commentary",
    intro:
      "Named secondary texts — the digests that settle how a vrat is actually timed and observed. Still named, still checkable; scored lower only because they sit further from Shruti.",
    texts: [
      {
        title: "Dharmasindhu",
        note: "Kashinatha Upadhyaya's digest — observance rules, including the sutak rules on the eclipse explainer.",
      },
      {
        title: "Nirnayasindhu",
        note: "Kamalakara Bhatta's digest — tithi determination when a vrat's tithi spans two civil days.",
      },
    ],
  },
] as const;

export default function ScriptureReferencesPage() {
  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Scripture References" },
        ]}
      />

      {/* hero */}
      <section className="hero-dc relative overflow-hidden py-9 md:py-[52px]">
        <div className="mx-auto max-w-[820px] px-4 md:px-10">
          <p className="mb-[11px] text-[10px] tracking-[1px] text-eyebrow-dark uppercase">
            Scripture References
          </p>
          <h1 className="mb-[13px] text-[30px] leading-[1.12] font-bold tracking-[-0.8px] text-hero-text md:text-[42px]">
            The texts behind every claim
          </h1>
          <p className="mb-4 max-w-[620px] text-sm leading-[1.8] text-hero-text/75 md:text-[15.5px]">
            Every Dharma claim on this platform names its text. This page is
            the register of those texts, arranged in the three tiers our
            confidence score is built on —{" "}
            <b className="text-hero-text">
              the score says how close the source sits to Shruti
            </b>
            , nothing more.
          </p>
          <p className="max-w-[620px] border-t border-white/15 pt-4 text-[12.5px] leading-relaxed text-hero-text/55">
            The specific chapter for any claim is cited on the article itself.
            How the tiers become tags and scores is explained in{" "}
            <Link
              href="/editorial-method"
              className="font-semibold text-eyebrow-dark underline underline-offset-2"
            >
              our editorial method
            </Link>
            .
          </p>
        </div>
      </section>

      <div className="mx-auto flex max-w-[820px] flex-col gap-10 px-4 py-10 md:px-10">
        {TIERS.map((tier) => (
          <section key={tier.badge}>
            <div className="mb-4">
              <p className="mb-[6px] text-[10px] font-bold tracking-[1px] text-cta uppercase">
                {tier.n}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-[22px] font-bold tracking-[-0.4px] text-ink md:text-[26px]">
                  {tier.name}
                </h2>
                <Pill>{tier.badge}</Pill>
                <span className="text-[13px] font-bold text-sub">
                  scores up to {tier.score}
                </span>
              </div>
            </div>
            <p className="mb-4 max-w-[640px] text-[13.5px] leading-[1.8] text-sub">
              {tier.intro}
            </p>
            <div className="overflow-hidden rounded-[15px] border border-border bg-card">
              {tier.texts.map((text) => (
                <div
                  key={text.title}
                  className="border-b-[0.5px] border-border-light px-5 py-4 last:border-b-0"
                >
                  <p className="text-[13.5px] font-bold text-ink">
                    {text.title}
                  </p>
                  <p className="mt-[2px] text-[12.5px] leading-relaxed text-sub">
                    {text.note}
                  </p>
                </div>
              ))}
            </div>
            {tier.footnote && (
              <p className="mt-3 text-[12px] leading-relaxed text-sub italic">
                {tier.footnote}
              </p>
            )}
          </section>
        ))}

        {/* when texts disagree */}
        <section>
          <div className="mb-4">
            <p className="mb-[6px] text-[10px] font-bold tracking-[1px] text-cta uppercase">
              When texts disagree
            </p>
            <h2 className="text-[22px] font-bold tracking-[-0.4px] text-ink md:text-[26px]">
              Conflict rules
            </h2>
          </div>
          <div className="rounded-[18px] border-l-[3px] border-cta bg-card px-5 py-6 md:px-[28px]">
            <p className="mb-3 text-[13px] leading-[1.8] text-body">
              Texts disagree — on a tithi boundary, on a step of the vidhi, on
              who a vrat is for. When they do, we follow three rules. First,{" "}
              <b>a higher tier outweighs a lower one</b>: where a nibandha
              digest and a Purana differ, the Purana's reading leads and the
              digest's is noted. Second, where texts of the{" "}
              <b>same tier</b> disagree, we say so in the article rather than
              silently presenting one recension as the only one — the
              disagreement is part of the answer. Third,{" "}
              <b>no conflict is resolved by custom</b>: however widespread a
              practice, it cannot promote a claim into a tier its text does not
              support. That practice is recorded as Pratha, on its own terms.
            </p>
            <p className="text-[13px] leading-[1.8] text-body">
              Panchang data — tithi, nakshatra, timings — sits outside this
              register entirely: it is computed, not interpreted, and carries
              no tag or score. Where panchang publishers disagree on a
              boundary, the article says so.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <Link
              href="/editorial-method"
              className="inline-block rounded-[11px] bg-cta px-[22px] py-[11px] text-[12.5px] font-bold text-white"
            >
              Read our editorial method ›
            </Link>
            <Link
              href="/report-correction"
              className="text-[12.5px] font-bold text-cta"
            >
              Challenge a citation ›
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
