export type DpbTag = "dharma" | "pratha" | "bhranti";

const TAG_CLASSES: Record<DpbTag, string> = {
  dharma: "bg-dharma-bg text-dharma-fg border-dharma-bd",
  pratha: "bg-pratha-bg text-pratha-fg border-pratha-bd",
  bhranti: "bg-bhranti-bg text-bhranti-fg border-bhranti-bd",
};

/**
 * DPB classification badge, e.g. "◆ DHARMA · 4/5 · PURANIC".
 * BHRANTI carries no score by design (PRD rule) — pass no score for it.
 */
export function DpbBadge({
  tag,
  score,
  source,
  className = "",
}: {
  tag: DpbTag;
  /** Confidence score out of 5. DHARMA 3–5, PRATHA ≤ 2, never for BHRANTI. */
  score?: number;
  /** Named source class, e.g. "PURANIC", "VEDIC". */
  source?: string;
  className?: string;
}) {
  const parts = [tag.toUpperCase()];
  if (tag !== "bhranti" && typeof score === "number") parts.push(`${score}/5`);
  if (source) parts.push(source.toUpperCase());

  return (
    <span
      className={`inline-flex items-center gap-[6px] rounded-[5px] border px-[9px] py-[3px] text-[10px] font-bold tracking-[0.5px] ${TAG_CLASSES[tag]} ${className}`}
    >
      <span aria-hidden className="text-[8px]">
        ◆
      </span>
      {parts.join(" · ")}
    </span>
  );
}
