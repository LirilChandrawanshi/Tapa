import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";

export const metadata: Metadata = {
  title: "About The Tapa Co.",
  description:
    "We are a knowledge company that happens to sell ritual kits. In that order, always. Why तप्, our editorial method, our values and the Tapa Circle.",
};

const VALUES = [
  {
    title: "Dharma before business.",
    body: "Revenue can never come at the cost of truth.",
  },
  {
    title: "Fear will never be our marketing strategy.",
    body: "We will never manipulate people with guilt, superstition, or anxiety. Devotion should arise from love and understanding, not fear.",
  },
  {
    title: "Knowledge comes before products.",
    body: "Understanding is our first offering. Commerce is only ever a consequence of it.",
  },
  {
    title: "Authenticity over convenience.",
    body: "When faced with a choice, we choose what is faithful over what is fashionable.",
  },
  {
    title: "We serve seekers, not customers.",
    body: "Every interaction should leave people feeling more informed, more confident, and more connected to their faith.",
  },
  {
    title: "Humility is non-negotiable.",
    body: "No individual, no institution, and no company owns Dharma. We are students before we are builders.",
  },
  {
    title: "Trust is sacred.",
    body: "It takes years to build and moments to lose. We will protect it fiercely.",
  },
] as const;

function SectionHead({ n, title }: { n: string; title: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-[13px] font-bold text-cta">
        {n}
      </span>
      <h2 className="text-[22px] font-bold tracking-[-0.4px] text-ink md:text-[26px]">
        {title}
      </h2>
      <span aria-hidden className="h-px flex-1 bg-border" />
    </div>
  );
}

export default function AboutPage() {
  return (
    <div>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "About" }]} />

      {/* hero — text and gradient in place of the montage film */}
      <section className="hero-rg py-10 md:py-[56px]">
        <div className="mx-auto max-w-[820px] px-4 md:px-10">
          <p className="mb-[11px] text-[10px] tracking-[1px] text-eyebrow-dark uppercase">
            About
          </p>
          <h1 className="mb-4 text-[30px] leading-[1.12] font-bold tracking-[-0.8px] text-hero-text md:text-[42px]">
            About The Tapa Co.
          </h1>
          <p className="mb-4 text-[17px] leading-[1.6] font-bold text-eyebrow-dark md:text-[19px]">
            We are a knowledge company that happens to sell ritual kits. In
            that order, always.
          </p>
          <p className="mb-3 max-w-[620px] text-sm leading-[1.85] text-hero-text/75 md:text-[15px]">
            Rituals are not hard to find. Guidance you can trust is. Someone
            who wants to keep a vrat properly, or set up a puja in a new home,
            or perform shraddh for a parent, is usually piecing it together at
            eleven at night from search results, reels and forwarded messages.
            Some of that is wisdom. Most of it is noise. Almost none of it
            tells you which is which.
          </p>
          <p className="mb-5 max-w-[620px] text-sm leading-[1.85] text-hero-text/75 md:text-[15px]">
            So we tell you what scripture actually says, what is regional or
            family custom, and what is only fear wearing tradition&rsquo;s
            clothes. All three deserve respect. They are not the same thing,
            and nobody should have to guess.
          </p>
          <p className="border-l-[3px] border-cta pl-4 text-[15.5px] font-bold text-hero-text italic">
            Dharma does not demand fear. It demands devotion.
          </p>
        </div>
      </section>

      <div className="mx-auto flex max-w-[820px] flex-col gap-14 px-4 py-12 md:px-10">
        {/* 01 · why तप् */}
        <section>
          <SectionHead
            n="01"
            title={
              <>
                Why <span className="font-devanagari text-gold">तप्</span>
              </>
            }
          />
          <div className="rounded-[18px] border border-border bg-card px-5 py-6 md:px-[28px]">
            <p className="mb-3 text-[14px] leading-[1.85] text-body">
              <span className="font-devanagari text-[19px] text-gold">तप्</span>{" "}
              — a Sanskrit root meaning austerity, discipline, the inner heat
              of devoted practice. Not suffering. Not obligation. The chosen
              effort of someone who has decided to show up properly.
            </p>
            <p className="text-[14px] leading-[1.85] text-body">
              The company exists for one reason. The people who could once
              answer the <em>why</em> behind the <em>what</em> are no longer in
              the next room. When knowledge fragments, faith does not disappear
              — it becomes fragile. Every generation deserves access to its own
              roots, on its own terms.
            </p>
          </div>

          <details className="group mt-4 rounded-[18px] border border-border bg-card">
            <summary className="flex cursor-pointer items-center justify-between gap-3 px-5 py-4 text-[14px] font-bold text-ink md:px-[28px]">
              Why I started this — a letter from our founder
              <span
                aria-hidden
                className="text-[11px] text-sub transition-transform group-open:rotate-180"
              >
                ▼
              </span>
            </summary>
            <div className="border-t border-border-light px-5 py-6 md:px-[28px]">
              <div className="mb-5 flex items-center gap-3">
                <span
                  aria-hidden
                  className="h-devi flex size-11 items-center justify-center rounded-full text-[15px] font-bold text-white"
                >
                  KG
                </span>
                <div>
                  <p className="text-[14px] font-bold text-ink">Komal Gupta</p>
                  <p className="text-[11.5px] text-sub">
                    Founder, The Tapa Co.
                  </p>
                </div>
              </div>
              <h3 className="mb-3 text-[18px] font-bold text-ink">
                Why Tapa Exists
              </h3>
              <div className="flex flex-col gap-3 text-[13.5px] leading-[1.85] text-body">
                <p>
                  I did not start The Tapa Co. to sell puja kits or ritual
                  subscriptions. I started it because I grew up inside
                  something I didn&rsquo;t fully appreciate until I left it.
                </p>
                <p>
                  My earliest memories are of devotion that needed no
                  explanation, held by people who could have explained it in
                  any terms they chose. Mine was a highly educated family.
                  Degrees, arguments at the dining table, books in more than
                  one language. And within all of that, my parents at their
                  morning puja before anything else in the day — reciting the
                  shrutis and the smritis themselves, not as inherited habit
                  but as something they had thought about and decided to keep.
                </p>
                <p>
                  Nobody in my house practised because they did not know
                  better. They practised because they had examined it and found
                  it worth practising. Doordarshan played Ramayan and
                  Mahabharat on weekends and the whole family sat together —
                  asking questions, getting answers, and being allowed to ask
                  the next one. The answer always came from someone in the
                  room.
                </p>
                <p>
                  Today, that gold mine is harder to find. Families have
                  scattered across cities and continents. The explaining has
                  moved to Google, to Instagram reels, to forwarded WhatsApp
                  messages from someone&rsquo;s cousin&rsquo;s neighbour. Some
                  of it is wisdom. A lot of it is noise. And almost none of it
                  tells you which is which.
                </p>
                <p>
                  People who genuinely wish to perform a vrat, a griha ritual,
                  or a festival puja are left untangling conflicting advice,
                  fear-based messaging, and endless opinions — alone, on a
                  phone screen, often right before the ritual itself. What
                  should bring peace instead brings anxiety. What should be
                  devotion starts to feel like guesswork.
                </p>
                <p>
                  And when knowledge fragments, faith doesn&rsquo;t disappear.
                  It just becomes fragile. I believe Hindu Dharma deserves
                  better than that. Not fear. Not superstition. Not commerce
                  without conscience.
                </p>
                <p>
                  The Tapa Co. exists to restore clarity, authenticity, and
                  trust to ritual practice — to help people understand not just
                  what to do, but why it matters. To separate Dharma from
                  custom, wisdom from hearsay, and devotion from performance.
                  Our ambition is larger than products. We are building trusted
                  infrastructure for Hindu ritual life — the kind that helps a
                  person practise with confidence and conviction, whether or
                  not there&rsquo;s someone in the next room to ask.
                </p>
              </div>
              <div className="mt-5 border-t border-border-light pt-4">
                <p className="text-[14px] font-bold text-ink">Komal Gupta</p>
                <p className="text-[11.5px] text-sub">Founder, The Tapa Co.</p>
                <p className="mt-1 text-[11.5px] text-gold italic">
                  Rooted in Dharma. Guided by Authenticity.
                </p>
              </div>
            </div>
          </details>
        </section>

        {/* 02 · mission & values */}
        <section>
          <SectionHead n="02" title="What must never change" />
          <p className="mb-5 max-w-[640px] text-[13.5px] leading-[1.8] text-sub">
            As The Tapa Co. grows, products will evolve, categories will
            expand, technology will change. But these principles are not
            features. They are the foundation, and they stay fixed.
          </p>
          <div className="overflow-hidden rounded-[18px] border border-border bg-card">
            {VALUES.map((v, i) => (
              <div
                key={v.title}
                className="flex gap-4 border-b-[0.5px] border-border-light px-5 py-4 last:border-b-0 md:px-[28px]"
              >
                <span className="text-[13px] font-bold text-cta">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-[14px] font-bold text-ink">{v.title}</p>
                  <p className="mt-[2px] text-[12.5px] leading-relaxed text-sub">
                    {v.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 03 · editorial method, condensed */}
        <section>
          <SectionHead n="03" title="Our Editorial Method" />
          <p className="mb-4 text-[15px] font-bold text-ink">
            Every claim we publish is sorted into one of three categories
            before it is written.
          </p>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[13px] border border-dharma-bd bg-dharma-bg px-4 py-4">
              <p className="text-[14px] font-bold text-dharma-fg">Dharma</p>
              <p className="mb-2 text-[9.5px] font-bold tracking-[0.7px] text-dharma-fg/70 uppercase">
                Scriptures
              </p>
              <p className="text-[12px] leading-relaxed text-body">
                A scriptural mandate. Stated in a named text you could go and
                check yourself. Not &ldquo;the scriptures say.&rdquo; A named
                text.
              </p>
            </div>
            <div className="rounded-[13px] border border-pratha-bd bg-pratha-bg px-4 py-4">
              <p className="text-[14px] font-bold text-pratha-fg">Pratha</p>
              <p className="mb-2 text-[9.5px] font-bold tracking-[0.7px] text-pratha-fg/70 uppercase">
                Customs
              </p>
              <p className="text-[12px] leading-relaxed text-body">
                Regional, community or family custom. Widely practised,
                genuinely meaningful, not scripturally mandated. It is not
                lesser for that.
              </p>
            </div>
            <div className="rounded-[13px] border border-bhranti-bd bg-bhranti-bg px-4 py-4">
              <p className="text-[14px] font-bold text-bhranti-fg">Bhranti</p>
              <p className="mb-2 text-[9.5px] font-bold tracking-[0.7px] text-bhranti-fg/70 uppercase">
                Corrections
              </p>
              <p className="text-[12px] leading-relaxed text-body">
                A misconception that needs correcting. Usually fear-based,
                usually forwarded, usually presented as compulsory. Corrected
                calmly, never mocked.
              </p>
            </div>
          </div>
          <div className="mb-4 rounded-[13px] border-l-[3px] border-cta bg-card px-5 py-4">
            <p className="text-[13.5px] leading-[1.8] text-body">
              One rule holds the whole system up:{" "}
              <b>
                if we cannot name a text you could go and check, it is not
                Dharma — however universal the practice feels.
              </b>{" "}
              <span className="text-sub">Consensus is not a citation.</span>
            </p>
          </div>
          <div className="mb-4 overflow-hidden rounded-[15px] border border-border bg-card">
            <div className="grid grid-cols-[1fr_72px] border-b border-border bg-bg px-5 py-[9px] text-[10px] font-bold tracking-[0.8px] text-sub uppercase">
              <span>Source</span>
              <span className="text-right">Score</span>
            </div>
            {(
              [
                ["Shruti — Vedas, Upanishads", "5 / 5"],
                ["Mahapurana, Itihasa, Dharmashastra, Kalpa, Agama", "4 / 5"],
                ["Nibandha, bhashya, commentarial literature", "3 / 5"],
                [
                  "Bhakti-period compositions — Ramcharitmanas, the stotras",
                  "3 / 5",
                ],
                ["Regional, oral and family custom", "1–2 / 5"],
              ] as const
            ).map(([source, score]) => (
              <div
                key={source}
                className="grid grid-cols-[1fr_72px] border-b-[0.5px] border-border-light px-5 py-3 text-[12.5px] last:border-b-0"
              >
                <span className="text-body">{source}</span>
                <span className="text-right font-bold text-gold">{score}</span>
              </div>
            ))}
          </div>
          <p className="mb-4 text-[12.5px] leading-[1.8] text-sub">
            That last placement is a description, not a demotion. A stotra
            recited in millions of homes every morning loses nothing by being
            correctly identified as a composed work rather than a revealed one.
          </p>
          <Link
            href="/editorial-method"
            className="inline-block rounded-[11px] bg-cta px-[22px] py-[11px] text-[12.5px] font-bold text-white"
          >
            Read the full method ›
          </Link>
        </section>

        {/* 04 · glossary */}
        <section>
          <SectionHead n="04" title="Glossary" />
          <div className="rounded-[18px] border border-border bg-card px-5 py-6 md:px-[28px]">
            <p className="mb-3 text-[15px] font-bold text-ink">
              Sankalp. Upavasa. Abhishek. Shodashopachara. Tithi and paksha.
            </p>
            <p className="mb-3 text-[13.5px] leading-[1.8] text-body">
              Every Sanskrit term we use in a guide is defined here in ordinary
              language, with the Devanagari, a simple transliteration, and
              where the word comes from.
            </p>
            <p className="mb-4 text-[13.5px] leading-[1.8] text-body">
              If you have ever nodded along at a term rather than asking what
              it meant, this page is for you.
            </p>
            <Link
              href="/glossary"
              className="inline-block rounded-[11px] border border-cta px-[22px] py-[10px] text-[12.5px] font-bold text-cta"
            >
              Open the glossary ›
            </Link>
          </div>
        </section>

        {/* 05 · the tapa circle */}
        <section>
          <SectionHead
            n="05"
            title={
              <>
                The Tapa Circle{" "}
                <span className="ml-1 align-middle rounded-full border border-wa/40 bg-wa/10 px-3 py-[3px] text-[10px] font-bold tracking-[0.5px] text-wa">
                  ● COMPLIMENTARY
                </span>
              </>
            }
          />
          <div className="rounded-[18px] border border-border bg-card px-5 py-6 md:px-[28px]">
            <p className="mb-3 text-[15px] font-bold text-ink">
              The panchang and the guide, on WhatsApp, on the day you need
              them.
            </p>
            <p className="mb-3 text-[13.5px] leading-[1.8] text-body">
              Most people do not want another app. They want to know that
              Ekadashi is on Thursday, and to have the right guide open when
              they sit down to do it.
            </p>
            <p className="mb-4 text-[13.5px] leading-[1.8] text-body">
              The Circle sends one considered reminder before each vrat and
              festival — the occasion, its complete tithi, and the relevant
              ritual guide when one exists. On WhatsApp, where you already are.
              No forwards. No predictions. No messages about what happens if
              you miss something, because nothing happens if you miss
              something. Complimentary, and leave whenever you wish by
              replying STOP.
            </p>
            <Link
              href="/tapa-circle"
              className="inline-block rounded-[11px] bg-wa px-[22px] py-[11px] text-[12.5px] font-bold text-white"
            >
              Join the Circle ›
            </Link>
          </div>
        </section>

        {/* 06 · work with us */}
        <section>
          <SectionHead n="06" title="Work with us" />
          <div className="grid gap-3 md:grid-cols-3">
            {(
              [
                [
                  "Join the Team",
                  "We are small, in Delhi-NCR, and building something that has to be right before it is big. Editorial, operations, design and engineering.",
                  "Apply ›",
                ],
                [
                  "Purohit Network",
                  "For purohits and acharyas across Delhi-NCR who want to perform pujas in full, explain what they are doing, and be paid properly for it.",
                  "Apply ›",
                ],
                [
                  "For Retailers",
                  "For temple shops, samagri retailers, RWAs and institutions who want to stock Tapa kits. Wholesale terms and the current catalogue on request.",
                  "Enquire ›",
                ],
              ] as const
            ).map(([title, body, cta]) => (
              <div
                key={title}
                className="flex flex-col rounded-[15px] border border-border bg-card px-5 py-5"
              >
                <p className="mb-2 text-[15px] font-bold text-ink">{title}</p>
                <p className="mb-4 flex-1 text-[12.5px] leading-relaxed text-sub">
                  {body}
                </p>
                <Link
                  href="/work-with-us"
                  className="self-start rounded-[10px] border border-cta px-4 py-[8px] text-[12px] font-bold text-cta"
                >
                  {cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* close */}
        <section className="rounded-[18px] bg-ink-deep px-5 py-8 text-center md:px-[40px] md:py-10">
          <p className="mb-3 text-[10px] font-bold tracking-[1px] text-eyebrow-dark uppercase">
            The one sentence
          </p>
          <p className="mb-3 text-[12.5px] text-[#A99070]">
            Everything on this site follows from one sentence:
          </p>
          <p className="mx-auto max-w-[560px] text-[17px] leading-[1.7] font-bold text-hero-text md:text-[19px]">
            Tapa exists so that every Hindu who wants to practise their faith
            correctly can do so{" "}
            <span className="text-eyebrow-dark">
              with confidence, without fear,
            </span>{" "}
            and without being exploited by the systems that were supposed to
            help them.
          </p>
          <p aria-hidden className="mt-5 text-lg text-cta">
            ✽
          </p>
        </section>
      </div>
    </div>
  );
}
