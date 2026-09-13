import type { Metadata } from "next";
import Link from "next/link";
import { PhaseClosed } from "@/components/PhaseClosed";
import { getFlags } from "@/lib/flags";
import { CategoryHero } from "@/components/CategoryHero";
import { SectionHeader } from "@/components/SectionHeader";
import { WhatsAppNudge } from "@/components/WhatsAppNudge";
import {
  fetchMandaliTypes,
  formatPaise,
  type MandaliType,
} from "@/lib/mandali";
import { CIRCLE_WHATSAPP_NUMBER } from "@/lib/staticExtras";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bhajan Mandali",
  description:
    "Book a group of devotional singers for your home or temple gathering — Sundarkand, Mata Ki Chowki, Shyam Darbaar and more. We confirm availability and the final quote within 24 hours.",
};

const WA_CHAT_URL = `https://wa.me/${CIRCLE_WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Namaste — I'd like to book a bhajan mandali for an occasion that isn't listed on the site.",
)}`;

/** Prototype ordering; anything new lands after, alphabetically. */
const PREFERRED_ORDER = [
  "sundarkand",
  "mata-ki-chowki",
  "shyam-darbaar",
  "ram-darbaar",
  "shiva-stotra-satsang",
  "generic-mix",
];

function sortTypes(items: MandaliType[]): MandaliType[] {
  return [...items].sort((a, b) => {
    const ai = PREFERRED_ORDER.indexOf(a.slug);
    const bi = PREFERRED_ORDER.indexOf(b.slug);
    if (ai !== -1 || bi !== -1) {
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    }
    return a.name.localeCompare(b.name);
  });
}

/** First two inclusions as a one-line preview: "5–7 singers · Harmonium, dholak". */
const inclusionsPreview = (type: MandaliType): string =>
  (type.inclusions ?? []).slice(0, 2).join(" · ");

function MandaliRow({ type }: { type: MandaliType }) {
  return (
    <Link
      href={`/bhajan-mandali/${type.slug}`}
      className="group flex flex-col gap-3 rounded-[14px] border border-border bg-card p-4 transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:gap-4 md:p-5"
    >
      {/* Icon and copy stay one unit; only the CTA drops to its own line
          on a phone, where a nowrap button was squeezing the copy to ~89px. */}
      <div className="flex min-w-0 flex-1 items-center gap-4">
      <div
        aria-hidden
        className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[12px] text-[20px] ${type.hueClass}`}
      >
        <span className="text-hero-text/90">🎶</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-[15.5px] font-bold text-ink group-hover:text-cta">
            {type.name}
          </span>
          <span className="font-devanagari text-[13.5px] text-sub">
            {type.nameHi}
          </span>
          {type.seasonNote && (
            <span className="rounded-[5px] border border-border bg-bg px-[7px] py-[2px] text-[9.5px] font-bold tracking-[0.4px] text-sub">
              {type.seasonNote}
            </span>
          )}
        </p>
        <p className="mt-[3px] line-clamp-2 text-[12.5px] leading-relaxed text-sub">
          {type.description}
        </p>
        <p className="mt-[6px] text-[12.5px] font-semibold text-body">
          From {formatPaise(type.startingPricePaise)}
          {inclusionsPreview(type) && (
            <span className="font-normal text-sub">
              {" "}
              · {inclusionsPreview(type)}
            </span>
          )}
        </p>
      </div>
      </div>
      <span className="shrink-0 self-start rounded-[10px] bg-cta px-4 py-[10px] text-center text-[12.5px] font-bold whitespace-nowrap text-white group-hover:opacity-90 sm:self-auto">
        Check availability ›
      </span>
    </Link>
  );
}

export default async function BhajanMandaliPage() {
  const __flags = await getFlags();
  if (!__flags.mandali_visible) {
    return <PhaseClosed section="mandali" />;
  }
  const catalog = await fetchMandaliTypes();
  const types = sortTypes(catalog.items.filter((t) => t.active !== false));

  return (
    <div>
      <CategoryHero
        variant="dc"
        eyebrow="The Tapa Co. · Bhajan Mandali"
        title="Bhajan Mandali"
        description="Book a group of devotional singers for your home or temple gathering. Tell us the date and venue — we confirm availability and the final quote within 24 hours."
        meta={[
          {
            value: types.length > 0 ? String(types.length) : "—",
            label: "mandali formats",
          },
          { value: "Delhi NCR", label: "service area" },
          { value: "24 hrs", label: "confirmation window" },
        ]}
        side={
          <div>
            <p className="mb-[10px] text-[10px] font-bold tracking-[0.8px] text-eyebrow-dark uppercase">
              How it works
            </p>
            <div className="flex flex-col">
              {[
                "Pick a mandali and send your date",
                "We confirm availability and the final quote within 24 hours",
                "Pay on confirmation — nothing upfront",
              ].map((step, i) => (
                <p
                  key={step}
                  className="flex gap-3 border-b border-white/10 py-[8px] text-[12.5px] text-hero-text last:border-b-0"
                >
                  <span className="font-bold text-eyebrow-dark">{i + 1}</span>
                  <span>{step}</span>
                </p>
              ))}
            </div>
            <p className="mt-3 text-[10.5px] leading-relaxed text-hero-text/50">
              Requests need at least a day&apos;s notice. Every mandali travels
              with its own instruments.
            </p>
          </div>
        }
      />

      <div className="mx-auto max-w-[880px] px-4 py-9 md:px-6">
        <SectionHeader
          eyebrow="Bhajan Mandali"
          title="Mandalis you can request today"
          description="Pick the format that fits your gathering — the starting price anchors the budget, and the exact quote is confirmed with your slot."
        />

        {types.length === 0 ? (
          <div className="mx-auto max-w-[480px] py-12 text-center">
            <h2 className="mb-2 text-xl font-bold text-ink">
              The mandali list is being prepared
            </h2>
            <p className="text-[13.5px] leading-relaxed text-sub">
              We couldn&apos;t load the mandali formats just now. Refresh in a
              moment, or chat with us below and we&apos;ll arrange it directly.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {types.map((type) => (
              <MandaliRow key={type.slug} type={type} />
            ))}
          </div>
        )}

        {/* Occasion not listed — WhatsApp card */}
        <div className="mt-8 overflow-hidden rounded-[16px] bg-ink px-5 py-6 md:px-7">
          <p className="text-[16px] font-bold text-hero-text">
            Your choice not listed?
          </p>
          <p className="mt-1 max-w-[520px] text-[13px] leading-relaxed text-hero-text/65">
            Jagran, kirtan for a chalisa path, a specific bhajan set — our
            mandalis cover far more than this first list. Tell us what you need
            and we&apos;ll arrange it.
          </p>
          <a
            href={WA_CHAT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-[10px] bg-wa px-5 py-[10px] text-[13px] font-bold text-white hover:opacity-90"
          >
            💬 Chat with us on WhatsApp ›
          </a>
        </div>

        <p className="mt-6 text-center text-[12.5px] text-sub">
          Already sent a request?{" "}
          <Link
            href="/bhajan-mandali/track"
            className="font-semibold text-cta hover:underline"
          >
            Track it with your TM- number ›
          </Link>
        </p>

        <WhatsAppNudge copy="Mandali booked or just planning — keep the vidhi close." />
      </div>
    </div>
  );
}
