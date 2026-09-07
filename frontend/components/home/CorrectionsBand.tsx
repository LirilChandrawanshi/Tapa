import Link from "next/link";
import { SectionHeader } from "@/components/SectionHeader";
import { fetchFeatured } from "@/lib/api";

interface Correction {
  myth: string;
  truth: string;
  from?: string;
}

/**
 * Static fallback corrections — lifted verbatim in spirit from the seeded
 * articles' MYTHS blocks, so a dead backend still shows real editorial
 * content, never lorem.
 */
const FALLBACK: readonly Correction[] = [
  {
    myth: "I broke my fast by mistake — the vrat is ruined and something bad will happen.",
    truth:
      "No. Complete the day with devotion and continue. No text attaches punishment to an honest lapse.",
    from: "Sawan Somwar Vrat",
  },
  {
    myth: "Without green attire and new bangles, the Teej vrat doesn't count.",
    truth:
      "The vrat is the sankalp, the puja and the fast. Green, mehndi and bangles are beautiful regional custom — pratha, not a requirement.",
    from: "Hariyali Teej",
  },
  {
    myth: "Skipping Nag Panchami brings sarp dosh on the family.",
    truth:
      "No text threatens a household for a missed observance. Pujas sold on that fear are commerce, not Dharma.",
    from: "Nag Panchami",
  },
] as const;

/** Pull up to three myth corrections out of the featured articles' MYTHS blocks. */
async function fetchCorrections(): Promise<Correction[]> {
  try {
    const featured = await fetchFeatured();
    const found: Correction[] = [];
    for (const article of featured) {
      for (const block of article.lang.en.blocks) {
        if (block.type !== "MYTHS" || !block.myths) continue;
        for (const myth of block.myths) {
          if (found.length >= 3) return found;
          found.push({
            myth: myth.question,
            truth: myth.answer,
            from: article.lang.en.title,
          });
        }
        break; // one MYTHS block per article is enough
      }
      if (found.length >= 3) break;
    }
    return found;
  } catch {
    return [];
  }
}

/**
 * "Corrections, not warnings" band (#25) — three ✕/✓ myth cards drawn from
 * the featured articles' MYTHS blocks; falls back to three corrections from
 * seeded content when the backend is down or featured articles carry none.
 */
export async function CorrectionsBand() {
  const fetched = await fetchCorrections();
  const corrections =
    fetched.length >= 3 ? fetched : [...fetched, ...FALLBACK].slice(0, 3);

  return (
    <section className="mx-auto max-w-[1280px] px-4 pt-10 md:px-10">
      <SectionHeader
        eyebrow="Corrections, not warnings"
        title="What you may have heard — and what the texts say"
        description="Fear travels faster than scripture. Every guide ends by correcting the misconceptions around its ritual — gently, and citing what actually contradicts them."
        viewAllHref="/editorial-method"
        viewAllLabel="How we correct"
      />
      <div className="grid gap-4 md:grid-cols-3">
        {corrections.map((c) => (
          <div
            key={c.myth}
            className="flex flex-col overflow-hidden rounded-[15px] border border-bhranti-bd bg-card"
          >
            <div className="flex-1 px-[17px] pt-4 pb-3">
              <p className="mb-2 flex gap-2 text-[13px] leading-[1.65] text-sub">
                <span
                  aria-hidden
                  className="mt-[1px] shrink-0 font-bold text-bhranti-fg"
                >
                  ✕
                </span>
                <span className="italic">&ldquo;{c.myth}&rdquo;</span>
              </p>
              <p className="flex gap-2 text-[13px] leading-[1.7] font-medium text-body">
                <span
                  aria-hidden
                  className="mt-[1px] shrink-0 font-bold text-dharma-fg"
                >
                  ✓
                </span>
                <span>{c.truth}</span>
              </p>
            </div>
            {c.from && (
              <div className="border-t border-bhranti-bd bg-bhranti-bg px-[17px] py-[9px] text-[11px] leading-relaxed text-bhranti-fg">
                <b className="font-bold">Corrected in:</b> {c.from}
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="mt-3 text-[12px] text-sub">
        Heard something we should check?{" "}
        <Link
          href="/report-correction"
          className="font-bold text-cta"
        >
          Report a correction ›
        </Link>
      </p>
    </section>
  );
}
