import type { Metadata } from "next";
import Link from "next/link";
import { CategoryHero } from "@/components/CategoryHero";
import { SectionHeader } from "@/components/SectionHeader";
import { WhatsAppNudge } from "@/components/WhatsAppNudge";
import { NotifyMe } from "@/components/home/NotifyMe";
import {
  fetchPujas,
  formatPaise,
  priceHint,
  slotsHint,
  type PujaType,
  type TimeSlot,
} from "@/lib/booking";
import { CIRCLE_WHATSAPP_NUMBER } from "@/lib/staticExtras";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pujan with Purohit",
  description:
    "Book a vetted pandit with samagri included — or just the vidhi, your choice. Verified purohits, transparent pricing, free cancellation until 24 hours before.",
};

/** Locked positioning line — do not reword. */
const POSITIONING =
  "Book a vetted pandit with samagri included — or just the vidhi, your choice.";

const WA_CHAT_URL = `https://wa.me/${CIRCLE_WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "Namaste — I'd like to book a puja that isn't listed on the site.",
)}`;

/** Prototype ordering; anything new lands after, alphabetically. */
const PREFERRED_ORDER = [
  "rudrabhishek",
  "satyanarayan-katha",
  "musical-mandali",
  "navratri-ghatsthapna",
];

function sortPujas(items: PujaType[]): PujaType[] {
  return [...items].sort((a, b) => {
    const ai = PREFERRED_ORDER.indexOf(a.slug);
    const bi = PREFERRED_ORDER.indexOf(b.slug);
    if (ai !== -1 || bi !== -1) {
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    }
    return a.name.localeCompare(b.name);
  });
}

/** "Sankshipt / Vistrit — from ₹7,100" (single variant: "Standard — ₹8,000"). */
function variantHint(puja: PujaType): string {
  if (puja.variants.length === 0) return "";
  const names = puja.variants.map((v) => v.name).join(" / ");
  const price =
    puja.variants.length > 1
      ? priceHint(puja.variants)
      : formatPaise(puja.variants[0].pricePaise);
  return `${names} — ${price}`;
}

function PujaRow({ puja, slots }: { puja: PujaType; slots: TimeSlot[] }) {
  return (
    <Link
      href={`/pujan-with-purohit/${puja.slug}`}
      className="group flex items-center gap-4 rounded-[14px] border border-border bg-card p-4 transition-shadow hover:shadow-md md:p-5"
    >
      <div
        aria-hidden
        className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[12px] text-[20px] ${puja.hueClass}`}
      >
        <span className="text-hero-text/90">🪔</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-[15.5px] font-bold text-ink group-hover:text-cta">
            {puja.name}
          </span>
          <span className="font-devanagari text-[13.5px] text-sub">
            {puja.nameHi}
          </span>
          {puja.annual && (
            <span className="rounded-[5px] border border-amber bg-amber/10 px-[7px] py-[2px] text-[9.5px] font-bold tracking-[0.4px] text-amber">
              ANNUAL
            </span>
          )}
        </p>
        <p className="mt-[3px] line-clamp-2 text-[12.5px] leading-relaxed text-sub">
          {puja.description}
        </p>
        <p className="mt-[6px] text-[12.5px] font-semibold text-body">
          {variantHint(puja)}
          <span className="font-normal text-sub">
            {" "}
            · {slotsHint(puja.allowedSlots, slots)}
          </span>
        </p>
      </div>
      <span className="shrink-0 whitespace-nowrap rounded-[10px] bg-cta px-4 py-[9px] text-[12.5px] font-bold text-white group-hover:opacity-90">
        Book ›
      </span>
    </Link>
  );
}

export default async function PujanWithPurohitPage() {
  const catalog = await fetchPujas();
  const pujas = sortPujas(catalog.items.filter((p) => p.active !== false));

  return (
    <div>
      <CategoryHero
        variant="dc"
        eyebrow="The Tapa Co. · Purohit & Puja"
        title="Pujan with Purohit"
        description={POSITIONING}
        meta={[
          {
            value: pujas.length > 0 ? String(pujas.length) : "—",
            label: "pujas bookable",
          },
          { value: "Delhi NCR", label: "service area" },
          { value: "24 hrs", label: "free cancellation before" },
        ]}
        side={
          <div>
            <p className="mb-[10px] text-[10px] font-bold tracking-[0.8px] text-eyebrow-dark uppercase">
              Time windows
            </p>
            <div className="flex flex-col">
              {catalog.slots.map((slot) => (
                <p
                  key={slot.key}
                  className="flex items-center justify-between gap-3 border-b border-white/10 py-[8px] text-[12.5px] text-hero-text last:border-b-0"
                >
                  <span className="font-semibold">{slot.label}</span>
                  <span className="text-hero-text/60">{slot.window}</span>
                </p>
              ))}
            </div>
            <p className="mt-3 text-[10.5px] leading-relaxed text-hero-text/50">
              Every purohit is verified in person. Bookings need at least a
              day&apos;s notice.
            </p>
          </div>
        }
      />

      <div className="mx-auto max-w-[880px] px-4 py-9 md:px-6">
        <SectionHeader
          eyebrow="Book a purohit"
          title="Pujas you can book today"
          description="Pick the puja, choose the variant, then the purohit and slot that suit your home. The vidhi is always explained — nothing happens over your head."
        />

        {pujas.length === 0 ? (
          <div className="mx-auto max-w-[480px] py-12 text-center">
            <h2 className="mb-2 text-xl font-bold text-ink">
              The puja list is being prepared
            </h2>
            <p className="text-[13.5px] leading-relaxed text-sub">
              We couldn&apos;t load the bookable pujas just now. Refresh in a
              moment, or leave your number below and we&apos;ll message you.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {pujas.map((puja) => (
              <PujaRow key={puja.slug} puja={puja} slots={catalog.slots} />
            ))}
          </div>
        )}

        {/* Puja not listed — WhatsApp first, notify capture second */}
        <div className="mt-8 overflow-hidden rounded-[16px] bg-ink px-5 py-6 md:px-7">
          <p className="text-[16px] font-bold text-hero-text">
            Puja not listed?
          </p>
          <p className="mt-1 max-w-[520px] text-[13px] leading-relaxed text-hero-text/65">
            Grih pravesh, mundan, shraadh, a specific path — our purohits cover
            far more than this first list. Tell us what you need and we&apos;ll
            arrange it.
          </p>
          <a
            href={WA_CHAT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-[10px] bg-wa px-5 py-[10px] text-[13px] font-bold text-white hover:opacity-90"
          >
            💬 Chat with us on WhatsApp ›
          </a>
          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="mb-2 text-[11px] font-bold tracking-[0.6px] text-hero-text/60 uppercase">
              Or get one message when more pujas open
            </p>
            <NotifyMe context="purohit" />
          </div>
        </div>

        <WhatsAppNudge copy="Puja booked or just planning — keep the vidhi close." />
      </div>
    </div>
  );
}
