import Link from "next/link";
import type { Flags } from "@/lib/flags";

/**
 * "Prefer to have it all taken care of?" — the spec's three-card commerce
 * band: a ritual kit, a purohit booking and the Tapa Circle.
 *
 * Knowledge before commerce is a PRD non-negotiable, so this band only ever
 * sits at the foot of a page, after every timing answer has been given, and
 * closes with the line that the page itself is free and complete.
 *
 * The kit and purohit cards are gated on `kits_launched` /
 * `purohit_tab_visible`. With a flag off the card stays visible but reads as
 * "not open yet" and points at the pre-launch capture page — it never shows
 * a price or a buyable CTA.
 */

export interface KitOffer {
  name: string;
  blurb: string;
  /** Rupee amount, integer. Rendered only when kits are launched. */
  price?: number;
  href: string;
}

export function RevenueBand({
  flags,
  kit,
  purohitNote = "Purohit booking opens later this year. We will tell you when it does.",
  circleBlurb = "Festival and vrat reminders on WhatsApp, with the guide attached. ₹499 a year.",
  from,
}: {
  flags: Flags;
  /** Omit when no kit exists for this date — the card says so plainly. */
  kit?: KitOffer;
  purohitNote?: string;
  circleBlurb?: string;
  /** Path recorded as the Circle join entry point. */
  from?: string;
}) {
  const kitsLive = flags.kits_launched && Boolean(kit);
  const circleHref = from
    ? `/tapa-circle?from=${encodeURIComponent(from)}`
    : "/tapa-circle";

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-3">
        {/* Ritual kit */}
        <Card
          icon="🪔"
          label="Ritual kit"
          title={kitsLive ? kit!.name : kit ? "Pre-booking not open yet" : "No kit for this one"}
          body={
            kitsLive
              ? kit!.blurb
              : kit
                ? kit.blurb
                : "A date is not a ritual. Kits open alongside the ritual guides."
          }
          cta={
            kitsLive
              ? {
                  label: `Pre-book${kit!.price ? ` — ₹${kit!.price.toLocaleString("en-IN")}` : ""}`,
                  href: kit!.href,
                  tone: "pink",
                }
              : { label: "🔔 Notify me", href: "/ritual-pujans", tone: "quiet" }
          }
          featured={kitsLive}
        />

        {/* Purohit */}
        <Card
          icon="🙏"
          label="Purohit & puja"
          title={
            flags.purohit_tab_visible
              ? "Book a purohit for this date"
              : "Booking not open yet"
          }
          body={
            flags.purohit_tab_visible
              ? "A vetted purohit who performs the full vidhi and explains it as they go — samagri included."
              : purohitNote
          }
          cta={
            flags.purohit_tab_visible
              ? { label: "See purohits ›", href: "/pujan-with-purohit", tone: "pink" }
              : { label: "🔔 Notify me", href: "/pujan-with-purohit", tone: "quiet" }
          }
        />

        {/* Tapa Circle — always live */}
        <Card
          icon="💬"
          label="The Tapa Circle"
          title="Never miss a date again"
          body={circleBlurb}
          cta={{ label: "Join the Tapa Circle ›", href: circleHref, tone: "wa" }}
        />
      </div>
      <p className="mt-3 text-[11.5px] text-sub italic">
        Nothing here changes what the almanac says. This page is free and
        complete, and always will be.
      </p>
    </div>
  );
}

function Card({
  icon,
  label,
  title,
  body,
  cta,
  featured = false,
}: {
  icon: string;
  label: string;
  title: string;
  body: string;
  cta: { label: string; href: string; tone: "pink" | "wa" | "quiet" };
  featured?: boolean;
}) {
  const tone =
    cta.tone === "pink"
      ? "bg-cta text-white"
      : cta.tone === "wa"
        ? "bg-wa text-white"
        : "border border-border bg-bg text-mid";
  return (
    <div
      className={`flex flex-col rounded-[15px] border bg-card p-5 ${
        featured ? "border-cta" : "border-border"
      }`}
    >
      <span
        aria-hidden
        className="mb-2 flex size-9 items-center justify-center rounded-[10px] border border-border bg-bg text-[17px]"
      >
        {icon}
      </span>
      <p className="text-[9.5px] font-bold tracking-[0.9px] text-sub uppercase">
        {label}
      </p>
      <p className="mt-[3px] text-[14.5px] leading-snug font-bold text-ink">
        {title}
      </p>
      <p className="mt-[6px] mb-4 text-[12.5px] leading-relaxed text-sub">
        {body}
      </p>
      <Link
        href={cta.href}
        className={`mt-auto rounded-[9px] px-[14px] py-[8px] text-center text-[12.5px] font-bold ${tone}`}
      >
        {cta.label}
      </Link>
    </div>
  );
}
