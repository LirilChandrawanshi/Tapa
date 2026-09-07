import type { ReactNode } from "react";

export type MethodLang = "en" | "hi";

export interface TagCardCopy {
  tag: "dharma" | "pratha" | "bhranti";
  heading: string;
  paras: ReactNode[];
  /** Absent for bhranti — it carries no score. */
  scoreLine?: string;
  exampleLabel: string;
  exampleQuote: string;
  exampleSource: ReactNode;
}

export interface MethodCopy {
  lang: MethodLang;
  breadcrumb: { home: string; self: string };
  hero: {
    eyebrow: string;
    title: string;
    lead: ReactNode;
    note: ReactNode;
  };
  problem: { n: string; title: string; paras: ReactNode[] };
  naming: {
    n: string;
    title: string;
    ruleLabel: string;
    rule: string;
    paras: ReactNode[];
    tableHead: readonly [string, string];
    tableRows: ReadonlyArray<readonly [string, string]>;
  };
  tags: { n: string; title: string; intro: ReactNode; cards: TagCardCopy[] };
  score: {
    n: string;
    title: string;
    intro: ReactNode;
    rows: ReadonlyArray<{
      score: string;
      badge: string;
      title: string;
      detail: string;
    }>;
    callouts: ReadonlyArray<{
      kind: "dharma" | "pratha";
      label: string;
      body: string;
    }>;
  };
  panchang: { n: string; title: string; paras: ReactNode[] };
  process: {
    n: string;
    title: string;
    intro: string;
    stages: ReadonlyArray<{ title: string; body: string; owner: string }>;
    tests: ReadonlyArray<readonly [string, string, string]>;
  };
  never: {
    n: string;
    title: string;
    intro: string;
    items: ReadonlyArray<{ title: string; body: string }>;
  };
  challenge: {
    n: string;
    title: string;
    heading: string;
    p1: string;
    p2: string;
    cta: string;
    steps: ReactNode[];
    closing: ReactNode[];
  };
}

const en: MethodCopy = {
  lang: "en",
  breadcrumb: { home: "Home", self: "Our Editorial Method" },
  hero: {
    eyebrow: "Our Editorial Method",
    title: "How we decide what is true",
    lead: (
      <>
        Every claim on this platform is placed in one of three categories, and
        most carry a score out of five. The score says{" "}
        <b className="text-hero-text">how close the source sits to Shruti</b> —
        not how important the ritual is, and not how strongly anyone believes
        it.
      </>
    ),
    note: (
      <>
        If you arrived by tapping &ldquo;Read source&rdquo; on an article —
        this is the right place. The specific text for that claim is named on
        the article itself; this page explains the system behind it.
      </>
    ),
  },
  problem: {
    n: "The problem this solves",
    title: "Most ritual advice does not tell you where it came from",
    paras: [
      <>
        Someone tells you a vrat must be kept without water. Someone else says
        a particular day is unlucky. A forwarded message warns you what
        happens if you skip a step. None of it says whether it comes from a
        text, from a region, from a family — or from nowhere at all.
      </>,
      <>
        That is the gap. Not a shortage of information about Hindu ritual, but{" "}
        <b>no way to tell which kind of information you are looking at.</b>
      </>,
    ],
  },
  naming: {
    n: "Section 01",
    title: "The naming rule",
    ruleLabel: "The rule",
    rule: "If we cannot name the text you could go and check, the answer is no. It is not Dharma.",
    paras: [
      <>
        Two things have to be true. We can name the text. And{" "}
        <b>you could go and verify it yourself.</b> Both, not either.
      </>,
      <>
        What this rules out is the most tempting case: a practice everybody
        follows, that every pandit endorses, that has clearly been done for
        centuries — and nobody can say which text it comes from. That is
        Pratha. Not because it is lesser, but because we cannot show our
        working, and showing our working is the whole promise.
      </>,
      <>
        The pressure always runs one way — to round up.{" "}
        <b>
          A correct Pratha costs us nothing. A wrong Dharma costs us the only
          thing we have.
        </b>
      </>,
    ],
    tableHead: ["Instead of", "We write"],
    tableRows: [
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
    ],
  },
  tags: {
    n: "Section 02",
    title: "The three tags",
    intro: (
      <>
        These are not degrees of truth. They are different kinds of authority —
        and knowing which one you are looking at is the entire point. A 2/5
        Pratha is not lesser than a 5/5 Dharma. It is a different kind of
        claim.
      </>
    ),
    cards: [
      {
        tag: "dharma",
        heading: "Traceable to a named text",
        paras: [
          <>
            Not &ldquo;the scriptures say&rdquo; — <b>which</b> scripture, and
            where in it. If we cannot name a source you could go and verify,
            the claim does not get this tag, however widely it is believed.
            Universal authority.
          </>,
        ],
        scoreLine: "Scores 3/5 to 5/5 — never below 3.",
        exampleLabel: "From the Janmashtami guide",
        exampleQuote:
          "“The midnight puja is performed during Nishita Kaal — the birth moment named in the text.”",
        exampleSource: (
          <>
            <b>Bhagavata Purana</b> · Skandha 10, Chapters 1–4 · Puranic · 4/5
          </>
        ),
      },
      {
        tag: "pratha",
        heading: "Regional, community, lineage or family custom",
        paras: [
          <>
            It might be centuries old. It might be the most meaningful part of
            the day for your family. We are not ranking it below Dharma or
            suggesting you drop it. We are only saying:{" "}
            <b>this one is yours, not scripture&rsquo;s.</b> Which matters when
            someone tells you your way is wrong, or that another
            region&rsquo;s practice is the correct one. Neither is true.
          </>,
        ],
        scoreLine: "Scores 1/5 to 2/5 — never above 2.",
        exampleLabel: "From the bilva concept article",
        exampleQuote:
          "“The smooth underside of the leaf faces the Shivalinga.”",
        exampleSource: (
          <>
            Widely observed across Shaiva practice ·{" "}
            <b>no named text mandates this orientation</b>
          </>
        ),
      },
      {
        tag: "bhranti",
        heading: "Fear-based or commercially manufactured",
        paras: [
          <>
            Bhranti carries no score because there is nothing to score. We
            recognise it by shape — a threatened consequence for omission, a
            claim of total invalidation, an exclusivity rule, devotion ranked
            by difficulty or expense, a prescription derived from a birth
            chart, or a manufactured product requirement.
          </>,
          <>
            A claim can be sincere, ancient and widely believed and still be
            Bhranti. <b>Age is not authority.</b> The correction is always
            gentle, and always cites what actually contradicts it.
          </>,
        ],
        exampleLabel: "From the Rudrabhishek guide",
        exampleQuote: "“Only a Brahmin can perform Rudrabhishek.”",
        exampleSource: (
          <>
            No source text restricts performance.{" "}
            <b>Correction badge — no score.</b>
          </>
        ),
      },
    ],
  },
  score: {
    n: "Section 03",
    title: "The score, and the badge beside it",
    intro: (
      <>
        The number describes{" "}
        <b className="text-body">which class of source the claim comes from</b>
        . The badge names that class in a word. Together they tell you how
        close the claim sits to Shruti — the oldest and most universally
        accepted layer of the tradition.
      </>
    ),
    rows: [
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
        title:
          "Stated in a Mahapurana, Itihasa, Dharmashastra, Kalpa Sutra or Agama",
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
    ],
    callouts: [
      {
        kind: "dharma",
        label: "DHARMA · 3 TO 5",
        body: "If a claim would score below 3, it is not Dharma. The tag is wrong, not the score.",
      },
      {
        kind: "pratha",
        label: "PRATHA · 1 TO 2",
        body: "If a Pratha claim seems to deserve a 3, a named text has been found — and it is Dharma.",
      },
    ],
  },
  panchang: {
    n: "Section 04",
    title: "Why Panchang carries no tag and no score",
    paras: [
      <>
        Panchang content — today&rsquo;s tithi, a festival date, sunrise, Rahu
        Kaal timing — carries <b>no classification tag and no score.</b> Not
        because it is less reliable, but because it is a different kind of
        claim.
      </>,
      <>
        A tithi is computed, not interpreted. There is no scriptural authority
        to weigh, because nobody is making a claim about what you should do —
        only about where the Sun and Moon are. The almanac source is named
        directly in a Source Strip, which replaces the credibility card.
      </>,
      <>
        Where a Panchang article does make a claim about practice — that Sutak
        applies only where an eclipse is visible, for instance —{" "}
        <b>that specific claim is tagged and corrected like any other.</b> The
        data is not. The interpretation is.
      </>,
      <>
        Panchang sourcing never counts toward a Dharma or Pratha badge
        anywhere else on the platform. And where publishers disagree on a
        tithi boundary, we say so in the article rather than presenting one
        publisher&rsquo;s answer as the correct one.
      </>,
    ],
  },
  process: {
    n: "Section 05",
    title: "How an article gets made",
    intro: "Six stages. Nothing goes live from a first draft.",
    stages: [
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
    ],
    tests: [
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
    ],
  },
  never: {
    n: "Section 06",
    title: "What we will never do",
    intro:
      "Not preferences. These are the conditions under which this platform is worth having.",
    items: [
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
    ],
  },
  challenge: {
    n: "Section 07",
    title: "Tell us we are wrong",
    heading: "A method nobody can question is not a method",
    p1: "If a citation is wrong, a score sits too high, a regional practice is misrepresented, or something has been tagged Pratha that you can point to in a text — we want to hear it. Especially the last one.",
    p2: "Every challenge gets a reply from a person. Where you are right, the article changes and says that it changed.",
    cta: "Challenge a claim ›",
    steps: [
      <>
        Tell us the <b className="text-hero-text">article and the specific line</b>.
      </>,
      <>
        Tell us what you believe is correct, and{" "}
        <b className="text-hero-text">where it comes from</b> — a text, a
        regional tradition, a family practice.
      </>,
      <>We check it against the source edition, not a digest.</>,
      <>
        You get a reply either way —{" "}
        <b className="text-hero-text">including when we disagree</b>, with our
        reasoning.
      </>,
    ],
    closing: [
      <>
        Nobody owns Dharma. Not a company, not an institution, not a person.
        We are students of this before we are publishers of it, and we read it
        that way — carefully, against the text, and without assuming the
        version we grew up with is the only one.
      </>,
      <>
        What we can promise is the method: name the text or do not make the
        claim, separate what is written from what is done, never use fear, and
        correct in the open. That is the whole of it.
      </>,
    ],
  },
};

const hi: MethodCopy = {
  lang: "hi",
  breadcrumb: { home: "होम", self: "हमारी संपादकीय पद्धति" },
  hero: {
    eyebrow: "हमारी संपादकीय पद्धति",
    title: "हम कैसे तय करते हैं कि सत्य क्या है",
    lead: (
      <>
        इस मंच पर हर दावा तीन में से किसी एक श्रेणी में रखा जाता है — DHARMA
        (धर्म), PRATHA (प्रथा) या BHRANTI (भ्रांति) — और अधिकांश के साथ पाँच
        में से एक अंक होता है। यह अंक बताता है कि{" "}
        <b className="text-hero-text">स्रोत श्रुति के कितने निकट है</b> — यह
        नहीं कि अनुष्ठान कितना महत्वपूर्ण है, और न ही यह कि कोई उस पर कितनी
        दृढ़ता से विश्वास करता है।
      </>
    ),
    note: (
      <>
        अगर आप किसी लेख पर &ldquo;स्रोत देखें&rdquo; दबाकर यहाँ पहुँचे हैं —
        तो आप सही जगह पर हैं। उस दावे का विशिष्ट ग्रंथ लेख पर ही नामित है; यह
        पृष्ठ उसके पीछे की व्यवस्था समझाता है।
      </>
    ),
  },
  problem: {
    n: "यह किस समस्या का समाधान है",
    title: "अधिकांश अनुष्ठान-सलाह यह नहीं बताती कि वह आई कहाँ से है",
    paras: [
      <>
        कोई कहता है कि व्रत निर्जल रखना होगा। कोई और कहता है कि अमुक दिन अशुभ
        है। एक फ़ॉरवर्ड किया हुआ संदेश चेतावनी देता है कि कोई चरण छूट जाए तो
        क्या होगा। इनमें से कोई नहीं बताता कि यह बात किसी ग्रंथ से आई है, किसी
        क्षेत्र से, किसी परिवार से — या कहीं से भी नहीं।
      </>,
      <>
        यही असली कमी है। हिंदू अनुष्ठानों के बारे में जानकारी की कमी नहीं है,
        बल्कि{" "}
        <b>
          यह जानने का कोई तरीक़ा नहीं कि आप किस तरह की जानकारी देख रहे हैं।
        </b>
      </>,
    ],
  },
  naming: {
    n: "खंड 01",
    title: "नामकरण का नियम",
    ruleLabel: "नियम",
    rule: "अगर हम उस ग्रंथ का नाम नहीं बता सकते जिसे आप जाकर देख सकें, तो उत्तर है नहीं। वह धर्म नहीं है।",
    paras: [
      <>
        दो बातें एक साथ सच होनी चाहिए। हम ग्रंथ का नाम बता सकें। और{" "}
        <b>आप स्वयं जाकर उसे जाँच सकें।</b> दोनों — इनमें से कोई एक नहीं।
      </>,
      <>
        यह नियम सबसे लुभावने मामले को बाहर कर देता है: वह प्रथा जिसे सब मानते
        हैं, जिसे हर पंडित सही कहता है, जो स्पष्ट रूप से सदियों से चली आ रही है
        — और कोई नहीं बता सकता कि वह किस ग्रंथ से आई है। वह प्रथा है। इसलिए
        नहीं कि वह कमतर है, बल्कि इसलिए कि हम अपना आधार नहीं दिखा सकते — और
        आधार दिखाना ही हमारा पूरा वचन है।
      </>,
      <>
        दबाव हमेशा एक ही दिशा में रहता है — दर्जा ऊपर चढ़ाने का।{" "}
        <b>
          एक सही प्रथा से हमारा कुछ नहीं जाता। एक ग़लत धर्म हमसे वह एकमात्र
          चीज़ छीन लेता है जो हमारे पास है।
        </b>
      </>,
    ],
    tableHead: ["इसके बजाय", "हम लिखते हैं"],
    tableRows: [
      ["“वेद कहते हैं…”", "श्री रुद्रम्, तैत्तिरीय संहिता 4.5"],
      ["“शास्त्रों का विधान है…”", "शिव पुराण, रुद्र संहिता"],
      [
        "“परंपरा से माना जाता है…”",
        "यह राजस्थान और उत्तर प्रदेश की क्षेत्रीय परंपरा है। यह मान्य है, पर सर्वत्र बाध्यकारी नहीं।",
      ],
      [
        "“पंडितों की सहमति है…”",
        "या तो ग्रंथ का नाम लिखा जाता है, या दावे पर प्रथा का टैग लगता है।",
      ],
    ],
  },
  tags: {
    n: "खंड 02",
    title: "तीन टैग",
    intro: (
      <>
        ये सत्य की मात्राएँ नहीं हैं। ये प्रामाणिकता के अलग-अलग प्रकार हैं —
        और यह जानना कि आप किसे देख रहे हैं, यही पूरी बात है। 2/5 वाली प्रथा
        5/5 वाले धर्म से कमतर नहीं है। वह एक अलग ही तरह का दावा है।
      </>
    ),
    cards: [
      {
        tag: "dharma",
        heading: "जिसे एक नामित ग्रंथ तक खोजा जा सके",
        paras: [
          <>
            &ldquo;शास्त्र कहते हैं&rdquo; नहीं — <b>कौन-सा</b> शास्त्र, और
            उसमें कहाँ। अगर हम ऐसा स्रोत नहीं बता सकते जिसे आप जाकर स्वयं जाँच
            सकें, तो दावे को यह टैग नहीं मिलता — चाहे उसे कितने ही लोग क्यों न
            मानते हों। सार्वभौमिक प्रामाणिकता।
          </>,
        ],
        scoreLine: "अंक 3/5 से 5/5 — कभी 3 से नीचे नहीं।",
        exampleLabel: "जन्माष्टमी गाइड से",
        exampleQuote:
          "“मध्यरात्रि की पूजा निशीथ काल में की जाती है — वही जन्म-क्षण जो ग्रंथ में नामित है।”",
        exampleSource: (
          <>
            <b>भागवत पुराण</b> · स्कंध 10, अध्याय 1–4 · पौराणिक · 4/5
          </>
        ),
      },
      {
        tag: "pratha",
        heading: "क्षेत्रीय, सामुदायिक, परंपरा या पारिवारिक रिवाज",
        paras: [
          <>
            वह सदियों पुरानी हो सकती है। वह आपके परिवार के लिए दिन का सबसे
            अर्थपूर्ण हिस्सा हो सकती है। हम उसे धर्म से नीचे नहीं रख रहे, न ही
            उसे छोड़ने की सलाह दे रहे हैं। हम बस इतना कह रहे हैं:{" "}
            <b>यह आपकी है, शास्त्र की नहीं।</b> और यह बात तब मायने रखती है जब
            कोई कहे कि आपका तरीक़ा ग़लत है, या किसी दूसरे क्षेत्र की पद्धति ही
            सही है। दोनों बातें ग़लत हैं।
          </>,
        ],
        scoreLine: "अंक 1/5 से 2/5 — कभी 2 से ऊपर नहीं।",
        exampleLabel: "बिल्वपत्र लेख से",
        exampleQuote: "“पत्ते की चिकनी सतह शिवलिंग की ओर रहती है।”",
        exampleSource: (
          <>
            शैव परंपरा में व्यापक रूप से प्रचलित ·{" "}
            <b>कोई नामित ग्रंथ इस दिशा का विधान नहीं करता</b>
          </>
        ),
      },
      {
        tag: "bhranti",
        heading: "भय पर टिकी या व्यावसायिक रूप से गढ़ी हुई",
        paras: [
          <>
            भ्रांति का कोई अंक नहीं होता, क्योंकि अंक देने योग्य कुछ है ही
            नहीं। हम उसे उसकी बनावट से पहचानते हैं — कोई चरण छूटने पर धमकाया
            गया परिणाम, पूरी पूजा निष्फल हो जाने का दावा, बहिष्कार का कोई
            नियम, कठिनाई या ख़र्च से मापी गई भक्ति, जन्म-कुंडली से निकाला गया
            विधान, या किसी उत्पाद की गढ़ी हुई अनिवार्यता।
          </>,
          <>
            कोई दावा सच्चे मन से किया हुआ, प्राचीन और व्यापक रूप से माना हुआ
            होकर भी भ्रांति हो सकता है। <b>पुरानापन प्रामाणिकता नहीं है।</b>{" "}
            हमारा संशोधन हमेशा सौम्य होता है, और हमेशा वही उद्धृत करता है जो
            वास्तव में उस दावे का खंडन करता है।
          </>,
        ],
        exampleLabel: "रुद्राभिषेक गाइड से",
        exampleQuote: "“रुद्राभिषेक केवल ब्राह्मण ही कर सकता है।”",
        exampleSource: (
          <>
            कोई स्रोत-ग्रंथ ऐसा प्रतिबंध नहीं लगाता।{" "}
            <b>संशोधन बैज — कोई अंक नहीं।</b>
          </>
        ),
      },
    ],
  },
  score: {
    n: "खंड 03",
    title: "अंक, और उसके साथ का बैज",
    intro: (
      <>
        यह संख्या बताती है कि{" "}
        <b className="text-body">दावा किस श्रेणी के स्रोत से आया है</b>। बैज
        उसी श्रेणी को एक शब्द में नाम देता है। दोनों मिलकर बताते हैं कि दावा
        श्रुति के कितने निकट है — परंपरा की सबसे प्राचीन और सर्वाधिक सर्वमान्य
        परत।
      </>
    ),
    rows: [
      {
        score: "5 / 5",
        badge: "VEDIC",
        title: "सीधे श्रुति में",
        detail:
          "वेद, ब्राह्मण, आरण्यक या कोई प्रमुख उपनिषद। उदाहरण — अभिषेक विधि, कृष्ण यजुर्वेद, श्री रुद्रम्।",
      },
      {
        score: "4 / 5",
        badge: "PURANIC",
        title:
          "किसी महापुराण, इतिहास, धर्मशास्त्र, कल्पसूत्र या आगम में कथित",
        detail:
          "वह परत जिस पर अधिकांश अनुष्ठान वास्तव में टिके हैं। उदाहरण — सावन सोमवार व्रत।",
      },
      {
        score: "3 / 5",
        badge: "SHASTRA",
        title: "किसी नामित निबंध, भाष्य या भक्ति-काल की रचना में",
        detail:
          "नामित द्वितीयक ग्रंथ — पर नामित तो हैं। उदाहरण — निर्णय सिंधु के अनुसार व्रत-तिथि का निर्धारण; रामचरितमानस और स्तोत्र।",
      },
      {
        score: "2 / 5",
        badge: "REGIONAL",
        title: "क्षेत्रीय, सामुदायिक, संप्रदाय या पंचांग की परिपाटी",
        detail:
          "जहाँ अधिकांश प्रथा बैठती है। उदाहरण — सिंजारा, काँवड़ यात्रा।",
      },
      {
        score: "1 / 5",
        badge: "ORAL",
        title: "पारिवारिक, मौखिक या लोक-प्रचलन",
        detail:
          "लिखकर नहीं, पीढ़ी-दर-पीढ़ी सौंपकर आई। हम इसे सजाकर पेश करने के बजाय साफ़-साफ़ यही कह देते हैं।",
      },
      {
        score: "—",
        badge: "CORRECTION",
        title: "भ्रांति — कोई अंक नहीं",
        detail:
          "अंक देने योग्य कुछ नहीं। उसकी जगह मिथक-कार्ड पर संशोधन बैज दिखता है।",
      },
    ],
    callouts: [
      {
        kind: "dharma",
        label: "DHARMA · 3 से 5",
        body: "अगर किसी दावे का अंक 3 से नीचे बनता है, तो वह धर्म है ही नहीं। ग़लती अंक में नहीं, टैग में है।",
      },
      {
        kind: "pratha",
        label: "PRATHA · 1 से 2",
        body: "अगर किसी प्रथा-दावे को 3 मिलना चाहिए, तो इसका अर्थ है कि नामित ग्रंथ मिल गया है — और वह धर्म है।",
      },
    ],
  },
  panchang: {
    n: "खंड 04",
    title: "पंचांग पर कोई टैग या अंक क्यों नहीं",
    paras: [
      <>
        पंचांग सामग्री — आज की तिथि, किसी पर्व की तारीख़, सूर्योदय, राहु काल
        का समय — पर <b>कोई वर्गीकरण टैग और कोई अंक नहीं होता।</b> इसलिए नहीं
        कि वह कम भरोसेमंद है, बल्कि इसलिए कि वह एक अलग ही तरह का दावा है।
      </>,
      <>
        तिथि की गणना होती है, व्याख्या नहीं। यहाँ तौलने के लिए कोई शास्त्रीय
        प्रामाणिकता है ही नहीं, क्योंकि कोई यह दावा नहीं कर रहा कि आपको क्या
        करना चाहिए — केवल यह कि सूर्य और चंद्रमा कहाँ हैं। पंचांग का स्रोत
        सीधे एक सोर्स स्ट्रिप में नामित होता है, जो विश्वसनीयता-कार्ड की जगह
        लेती है।
      </>,
      <>
        जहाँ कोई पंचांग लेख आचरण के बारे में कोई दावा करता है — मसलन यह कि
        सूतक केवल वहीं लागू होता है जहाँ ग्रहण दिखाई देता है —{" "}
        <b>
          वह विशिष्ट दावा किसी भी अन्य दावे की तरह टैग और संशोधित होता है।
        </b>{" "}
        आँकड़ा नहीं। व्याख्या होती है।
      </>,
      <>
        पंचांग का स्रोत मंच पर कहीं भी धर्म या प्रथा बैज की गिनती में नहीं
        आता। और जहाँ प्रकाशक तिथि की सीमा पर असहमत हों, वहाँ हम लेख में यही
        लिख देते हैं — किसी एक प्रकाशक के उत्तर को ही सही ठहराने के बजाय।
      </>,
    ],
  },
  process: {
    n: "खंड 05",
    title: "एक लेख कैसे बनता है",
    intro: "छह चरण। पहला मसौदा कभी सीधे प्रकाशित नहीं होता।",
    stages: [
      {
        title: "संपादकीय मसौदा",
        body: "नामित ग्रंथ से बनाया जाता है, अनुष्ठान के बारे में आम तौर पर कही जाने वाली बातों से नहीं। कोई भी गद्य लिखने से पहले हर दावा उसके स्रोत के सामने दर्ज किया जाता है।",
        owner: "लेखक",
      },
      {
        title: "स्रोत-सत्यापन",
        body: "हर उद्धरण मूल ग्रंथ से जाँचा जाता है — उसे उद्धृत करने वाले किसी सार-संग्रह से नहीं। जो दावे इस जाँच में नहीं टिकते, उनका अंक घटा दिया जाता है या वे हटा दिए जाते हैं।",
        owner: "संपादक",
      },
      {
        title: "अभ्यासी की समीक्षा",
        body: "जिसमें हर देव-चित्र की मूर्ति-शास्त्रीय शुद्धता की जाँच शामिल है — आयुध, हस्त, वाहन, मुद्रा, सहचर।",
        owner: "बाह्य समीक्षक",
      },
      {
        title: "भय-भाषा की जाँच",
        body: "हर पंक्ति एक बार फिर एक ही प्रश्न के साथ पढ़ी जाती है: क्या यह भय पैदा करती है, उसका संकेत देती है या उसे पुष्ट करती है? जो पंक्तियाँ खरी नहीं उतरतीं, वे फिर से लिखी जाती हैं — तथ्य की दृष्टि से सही होने पर भी।",
        owner: "संपादक",
      },
      {
        title: "क्षेत्रीय भिन्नता की जाँच",
        body: "क्या क्षेत्रीय ब्योरे का दायरा ठीक-ठीक बताया गया है — और कहीं हमने चुपचाप किसी एक क्षेत्र के रिवाज को सार्वभौमिक तो नहीं बना दिया।",
        owner: "क्षेत्रीय समीक्षक",
      },
      {
        title: "स्वीकृति — और उसके बाद भी संशोधनीय",
        body: "प्रकाशित हो जाना प्रक्रिया का अंत नहीं है। संशोधन खुले में किए जाते हैं, और जब कोई दावा बदला जाता है तो लेख उसे दर्ज करता है।",
        owner: "RI संपादक",
      },
    ],
    tests: [
      [
        "परीक्षा 1 · भय",
        "क्या यह पंक्ति अनुष्ठान को लेकर भय पैदा करती है, उसका संकेत देती है या उसे पुष्ट करती है?",
        "अगर हाँ → फिर से लिखो। हमेशा।",
      ],
      [
        "परीक्षा 2 · स्पष्टता",
        "अगर इसे पहली बार करने वाला कोई व्यक्ति यह पढ़े, तो क्या उसे ठीक-ठीक पता चलेगा कि करना क्या है?",
        "अगर नहीं → फिर से लिखो।",
      ],
      [
        "परीक्षा 3 · स्रोत",
        "चुनौती मिलने पर, क्या हम इस दावे के लिए किसी विशिष्ट ग्रंथ, अध्याय या खंड की ओर संकेत कर सकते हैं?",
        "अगर नहीं → दावा मत करो।",
      ],
    ],
  },
  never: {
    n: "खंड 06",
    title: "जो हम कभी नहीं करेंगे",
    intro:
      "ये पसंद-नापसंद की बातें नहीं हैं। ये वे शर्तें हैं जिनके पूरा होने पर ही इस मंच का होना सार्थक है।",
    items: [
      {
        title: "भय दिखाकर कुछ भी बेचना",
        body: "दुर्भाग्य के उपाय नहीं, कोई चरण छूटने पर क्या होगा इसकी चेतावनियाँ नहीं, और कोई दोष ऐसी समस्या की तरह पेश नहीं जिसे हम शुल्क लेकर सुलझा दें।",
      },
      {
        title: "ज्योतिष या व्यक्तिगत विधान प्रकाशित करना",
        body: "न जन्मपत्री, न राशिफल, न कुंडली-मिलान। हम कभी किसी जन्म-कुंडली, राशि या ग्रह-दशा से कोई अनुष्ठान नहीं निकालते। पंचांग की गणना — हाँ। व्यक्तिगत विधान — कभी नहीं।",
      },
      {
        title: "व्यापार को छपे शब्द बदलने देना",
        body: "किसी अनुष्ठान की किट बेचने से उसकी गाइड का एक शब्द भी नहीं बदलता। गाइड कहती है कि किट अनावश्यक है — क्योंकि वह सचमुच अनावश्यक है।",
      },
      {
        title: "रिवाज को शास्त्र बनाकर पेश करना",
        body: "अगर हम ग्रंथ का नाम नहीं बता सकते, तो हम प्रथा कहते हैं। तब भी जब वह चलन सर्वव्यापी हो। तब भी जब उसे धर्म लिखना पढ़ने में बेहतर लगता।",
      },
      {
        title: "आप कौन हैं, इस आधार पर आचरण सीमित करना",
        body: "जहाँ स्रोत-ग्रंथ इस पर कोई प्रतिबंध नहीं लगाता कि अनुष्ठान कौन कर सकता है, वहाँ हम भी नहीं लगाते — और प्रतिबंध लगाने वाले दावों का संशोधन करते हैं।",
      },
      {
        title: "किसी गाइड को पेवॉल के पीछे रखना",
        body: "हर अनुष्ठान गाइड, हर सामग्री-सूची, हर संशोधन पढ़ने के लिए निःशुल्क है और सदा रहेगा।",
      },
    ],
  },
  challenge: {
    n: "खंड 07",
    title: "हमें बताइए कि हम ग़लत हैं",
    heading: "जिस पद्धति पर कोई प्रश्न न उठा सके, वह पद्धति है ही नहीं",
    p1: "अगर कोई उद्धरण ग़लत है, कोई अंक ज़रूरत से ऊँचा बैठा है, किसी क्षेत्रीय परंपरा को ग़लत ढंग से पेश किया गया है, या किसी दावे पर प्रथा का टैग लगा है जिसे आप किसी ग्रंथ में दिखा सकते हैं — हम सुनना चाहते हैं। ख़ासकर आख़िरी वाला।",
    p2: "हर चुनौती का उत्तर एक व्यक्ति देता है। जहाँ आप सही हैं, वहाँ लेख बदलता है और यह भी लिखता है कि वह बदला।",
    cta: "किसी दावे को चुनौती दें ›",
    steps: [
      <>
        हमें <b className="text-hero-text">लेख और वह विशिष्ट पंक्ति</b> बताइए।
      </>,
      <>
        बताइए कि आपके अनुसार सही क्या है, और{" "}
        <b className="text-hero-text">वह आता कहाँ से है</b> — कोई ग्रंथ, कोई
        क्षेत्रीय परंपरा, कोई पारिवारिक रिवाज।
      </>,
      <>हम उसे मूल स्रोत-संस्करण से जाँचते हैं, किसी सार-संग्रह से नहीं।</>,
      <>
        आपको दोनों स्थितियों में उत्तर मिलता है —{" "}
        <b className="text-hero-text">तब भी जब हम असहमत हों</b>, अपने तर्क के
        साथ।
      </>,
    ],
    closing: [
      <>
        धर्म किसी का नहीं है। न किसी कंपनी का, न किसी संस्था का, न किसी
        व्यक्ति का। हम इसके प्रकाशक होने से पहले इसके विद्यार्थी हैं, और इसे
        उसी भाव से पढ़ते हैं — सावधानी से, ग्रंथ के सामने रखकर, और यह माने
        बिना कि जिस रूप में हम बड़े हुए वही एकमात्र रूप है।
      </>,
      <>
        हम जिसका वचन दे सकते हैं, वह है पद्धति: ग्रंथ का नाम बताओ या दावा मत
        करो, जो लिखा है उसे जो किया जाता है उससे अलग रखो, भय का प्रयोग कभी मत
        करो, और संशोधन खुले में करो। बस इतना ही।
      </>,
    ],
  },
};

export const methodContent: { en: MethodCopy; hi: MethodCopy } = { en, hi };
