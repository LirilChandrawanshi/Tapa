import Link from "next/link";
import {
  sectionItems,
  sectionText,
  type HomeSection,
} from "@/lib/homeExtras";

/**
 * The three DPB rows. Only the copy is CMS-editable — the key drives the
 * colour token, and those are locked by the PRD, so the styling is looked up
 * here rather than stored alongside the words.
 */
const TONE: Record<string, { accent: string; text: string }> = {
  DHARMA: { accent: "border-dharma-fg", text: "text-dharma-fg" },
  PRATHA: { accent: "border-pratha-fg", text: "text-pratha-fg" },
  BHRANTI: { accent: "border-bhranti-fg", text: "text-bhranti-fg" },
};

const ROWS = [
  { key: "DHARMA", copy: "Named in a text you could open yourself." },
  { key: "PRATHA", copy: "Regional or family custom. Real — not scripture." },
  {
    key: "BHRANTI",
    copy: "A misconception. Corrected in every guide it appears in.",
  },
] as const;

/**
 * "How we decide what is true" band — the Dharma / Pratha / Bhranti
 * explainer. Light amber bar (mock's `.method`), editorial copy left,
 * three tag rows right. Copy is CMS-editable (`method-band`).
 */
export function MethodBand({ section }: { section?: HomeSection }) {
  const rows = sectionItems(section, ROWS);
  return (
    <section className="grid items-center gap-6 rounded-[18px] border border-pratha-bd bg-pratha-bg px-5 py-6 md:grid-cols-[1.1fr_1fr] md:gap-[34px] md:px-[34px] md:py-[30px]">
      <div>
        <p className="mb-[10px] text-[10px] font-bold tracking-[0.8px] text-pratha-fg uppercase">
          {sectionText(section, "eyebrow", "How we decide what is true")}
        </p>
        <h2 className="mb-[11px] text-[19px] leading-[1.3] font-bold tracking-[-0.4px] text-ink md:text-[22px]">
          {sectionText(
            section,
            "title",
            "Every badge on this page means something specific",
          )}
        </h2>
        <p className="mb-4 text-sm leading-[1.82] text-mid">
          {sectionText(
            section,
            "body",
            "Dharma, Pratha or Bhranti — with a confidence score you can check. If we cannot name the text a reader could open, we do not make the claim.",
          )}
        </p>
        <Link
          href={sectionText(section, "ctaHref", "/editorial-method")}
          className="inline-block rounded-[11px] bg-ink px-[22px] py-[11px] text-[12.5px] font-bold text-white"
        >
          {sectionText(section, "ctaLabel", "Read our editorial method ›")}
        </Link>
      </div>
      <div className="flex flex-col gap-2">
        {rows.map((row) => {
          const tone = TONE[row.key] ?? TONE.DHARMA;
          return (
            <div
              key={row.key}
              className={`rounded-[11px] border-l-[3px] bg-card px-[15px] py-[11px] ${tone.accent}`}
            >
              <p className={`mb-[2px] text-[11.5px] font-bold ${tone.text}`}>
                {row.key}
              </p>
              <p className="text-[11.5px] leading-relaxed text-sub">
                {row.copy}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
