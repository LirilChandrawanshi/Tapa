import Link from "next/link";

const ROWS = [
  {
    key: "DHARMA",
    accent: "border-[#7BD69B]",
    text: "text-[#7BD69B]",
    copy: "Named in a text you could open yourself.",
  },
  {
    key: "PRATHA",
    accent: "border-amber",
    text: "text-amber",
    copy: "Regional or family custom. Real — not scripture.",
  },
  {
    key: "BHRANTI",
    accent: "border-[#B8A184]",
    text: "text-[#D4B58A]",
    copy: "A misconception. Corrected in every guide it appears in.",
  },
] as const;

/**
 * "How we decide what is true" band — the Dharma / Pratha / Bhranti
 * explainer. Dark bar, editorial copy left, three tag rows right.
 */
export function MethodBand() {
  return (
    <section className="grid items-center gap-6 rounded-[18px] bg-ink-deep px-5 py-6 md:grid-cols-[1.1fr_1fr] md:gap-[34px] md:px-[34px] md:py-[30px]">
      <div>
        <p className="mb-[10px] text-[10px] font-bold tracking-[0.8px] text-eyebrow-dark uppercase">
          How we decide what is true
        </p>
        <h2 className="mb-[11px] text-[19px] leading-[1.3] font-bold tracking-[-0.4px] text-hero-text md:text-[22px]">
          Every badge on this page means something specific
        </h2>
        <p className="mb-4 text-sm leading-[1.82] text-[#C4A882]">
          Dharma, Pratha or Bhranti — with a confidence score you can check.
          If we cannot name the text a reader could open, we do not make the
          claim.
        </p>
        <Link
          href="/editorial-method"
          className="inline-block rounded-[11px] bg-cta px-[22px] py-[11px] text-[12.5px] font-bold text-white"
        >
          Read our editorial method ›
        </Link>
      </div>
      <div className="flex flex-col gap-2">
        {ROWS.map((row) => (
          <div
            key={row.key}
            className={`rounded-[11px] border-l-[3px] bg-white/5 px-[15px] py-[11px] ${row.accent}`}
          >
            <p className={`mb-[2px] text-[11.5px] font-bold ${row.text}`}>
              {row.key}
            </p>
            <p className="text-[11.5px] leading-relaxed text-[#A99070]">
              {row.copy}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
