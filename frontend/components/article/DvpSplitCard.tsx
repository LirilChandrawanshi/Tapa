import Link from "next/link";
import { DpbBadge, type DpbTag } from "@/components/DpbBadge";
import type { Dpb, DvpSplit, IntelligenceCard } from "@/lib/types";

/**
 * "Dharma vs Pratha" — the section the whole editorial method exists for.
 *
 * Two named columns side by side: what the text states, and what practice
 * added. Rendered as a real split rather than prose because the claim is the
 * contrast, and each column carries its own badge and score so neither can be
 * read as standing in for the other.
 *
 * Nothing here implies the right column is lesser. Both are real; only one is
 * scripture, and the difference is stated rather than blurred.
 */

function tagOf(dpb?: Dpb): DpbTag | null {
  const raw = dpb?.classification?.toLowerCase();
  return raw === "dharma" || raw === "pratha" || raw === "bhranti" ? raw : null;
}

export function DvpSplitCard({ dvp }: { dvp: DvpSplit }) {
  const dharma = dvp.dharmaPoints ?? [];
  const pratha = dvp.prathaPoints ?? [];
  if (dharma.length === 0 && pratha.length === 0) return null;

  return (
    <div>
      {dvp.lead && (
        <p className="mb-4 text-[14.5px] leading-relaxed text-body">{dvp.lead}</p>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <Column
          heading={dvp.dharmaHeading ?? "Named in text"}
          points={dharma}
          dpb={dvp.dharmaDpb}
          note="Scored out of five on how directly the text states it"
          tone="dharma"
        />
        <Column
          heading={dvp.prathaHeading ?? "Cultural, not text"}
          points={pratha}
          dpb={dvp.prathaDpb}
          note="Scored out of five on how widely it is attested — real and valid, and not scripture"
          tone="pratha"
        />
      </div>
    </div>
  );
}

function Column({
  heading,
  points,
  dpb,
  note,
  tone,
}: {
  heading: string;
  points: string[];
  dpb?: Dpb;
  note: string;
  tone: "dharma" | "pratha";
}) {
  if (points.length === 0) return null;
  const tag = tagOf(dpb) ?? tone;
  const shell =
    tone === "dharma"
      ? "border-dharma-bd bg-dharma-bg/45"
      : "border-pratha-bd bg-pratha-bg/55";
  return (
    <div className={`flex flex-col rounded-[15px] border p-5 ${shell}`}>
      <p className="mb-3 text-[10px] font-bold tracking-[0.9px] text-ink/70 uppercase">
        {heading}
      </p>
      <ul className="mb-4 space-y-2">
        {points.map((p) => (
          <li key={p} className="flex gap-2 text-[13.5px] leading-relaxed text-body">
            <span aria-hidden className="mt-[7px] size-[5px] shrink-0 rounded-full bg-ink/35" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto border-t border-ink/10 pt-3">
        <DpbBadge
          tag={tag}
          score={tag !== "bhranti" ? (dpb?.confidenceScore ?? undefined) : undefined}
          source={dpb?.sourceClass ?? undefined}
        />
        {dpb?.sourceName && (
          <p className="mt-[6px] text-[11.5px] text-sub">
            {dpb.sourceName}
            {dpb.sourceRef ? ` · ${dpb.sourceRef}` : ""}
          </p>
        )}
        <p className="mt-[6px] text-[11px] leading-relaxed text-sub">{note}</p>
      </div>
    </div>
  );
}

/**
 * The shared intelligence card. Maintained in one place and referenced by
 * every guide that needs it, so correcting it once corrects it everywhere.
 */
export function IntelligenceCardBlock({ card }: { card: IntelligenceCard }) {
  const tag = tagOf(card.dpb);
  return (
    <aside className="rounded-[15px] border border-pratha-bd bg-pratha-bg px-5 py-5">
      {card.label && (
        <p className="mb-1 text-[10px] font-bold tracking-[0.9px] text-pratha-fg uppercase">
          ◗ {card.label}
        </p>
      )}
      {card.headline && (
        <p className="text-[15px] leading-snug font-bold text-pratha-fg">
          {card.headline}
        </p>
      )}
      {card.body && (
        <p className="mt-2 text-[13px] leading-relaxed text-pratha-fg/85">
          {card.body}
        </p>
      )}
      {card.points && card.points.length > 0 && (
        <ul className="mt-3 space-y-[6px]">
          {card.points.map((p) => (
            <li
              key={p}
              className="flex gap-2 text-[12.5px] leading-relaxed text-pratha-fg/85"
            >
              <span aria-hidden className="mt-[7px] size-[4px] shrink-0 rounded-full bg-pratha-fg/50" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {tag && (
          <DpbBadge
            tag={tag}
            score={tag !== "bhranti" ? (card.dpb?.confidenceScore ?? undefined) : undefined}
            source={card.dpb?.sourceClass ?? undefined}
          />
        )}
        {card.readMoreSlug && (
          <Link
            href={`/dharmic-concepts/${card.readMoreSlug}`}
            className="text-[12px] font-bold text-cta hover:underline"
          >
            {card.readMoreLabel ?? "Read more"} ›
          </Link>
        )}
      </div>
    </aside>
  );
}
