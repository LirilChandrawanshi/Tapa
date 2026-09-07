import Link from "next/link";
import {
  FooterAccordion,
  type FooterAccordionSection,
} from "@/components/FooterAccordion";
import { CIRCLE_WHATSAPP_NUMBER } from "@/lib/staticExtras";
import { TAXONOMY, getSection } from "@/lib/taxonomy";

/*
 * Footer — six bands, in this order on every page:
 *   1. Brand   2. Search & auth   3. Sitemap (taxonomy)
 *   4. Columns (About · Help · For You · Connect)
 *   5. Corrections strip   6. Legal
 * Phase-gate rule: unopened categories show a date, never a dead link.
 * Bands 3–4 collapse into one-open accordions on mobile (FooterAccordion).
 */

const COLUMN_HEADING =
  "mb-[14px] text-[10px] font-bold tracking-[0.7px] text-eyebrow-dark uppercase";
const COLUMN_LINK =
  "block py-[5.5px] text-[13px] text-sub hover:text-eyebrow-dark";
const SITEMAP_HEADING =
  "mb-[10px] border-b border-white/10 pb-[9px] text-[14.5px] font-bold text-hero-text";

/**
 * TODO(business): placeholder social handles — confirm before Gate 2.
 * No more href="#": every icon points at a real (claimable) profile URL.
 */
const SOCIALS = [
  { name: "Instagram", href: "https://instagram.com/thetapaco" },
  { name: "Facebook", href: "https://facebook.com/thetapaco" },
  { name: "YouTube", href: "https://youtube.com/@thetapaco" },
] as const;

const TRUST_BADGES = [
  { icon: "📜", label: "Scripturally sourced" },
  { icon: "🕊️", label: "Fear-free" },
  { icon: "🙏", label: "Shraddha-first" },
] as const;

function SitemapLinks({
  links,
  allLabel,
  allHref,
}: {
  links: readonly { label: string; href: string; lead?: boolean }[];
  allLabel: string;
  allHref: string;
}) {
  return (
    <>
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`block py-[5px] text-[12.5px] hover:text-eyebrow-dark ${
            link.lead ? "font-semibold text-[#FF9EBE]" : "text-sub"
          }`}
        >
          {link.label}
        </Link>
      ))}
      <Link
        href={allHref}
        className="block pt-2 text-xs font-semibold text-cta"
      >
        {allLabel} ›
      </Link>
    </>
  );
}

function ComingSoonTile({
  title,
  when,
  copy,
}: {
  title: string;
  when: string;
  copy: string;
}) {
  return (
    <div>
      <p className="mb-[10px] border-b border-white/10 pb-[9px] text-[14.5px] font-bold text-[#7A6A55]">
        {title}
      </p>
      <span className="block py-1 text-xs font-semibold text-amber">
        {when}
      </span>
      <span className="block text-[11.5px] leading-[1.6] text-[#5C4E36]">
        {copy}
      </span>
    </div>
  );
}

export function Footer({
  kitsLaunched = false,
  purohitVisible = false,
  mandaliVisible = false,
}: {
  kitsLaunched?: boolean;
  /** DB flag `purohit_tab_visible` — turns the coming-soon tile into a live link. */
  purohitVisible?: boolean;
  /** DB flag `mandali_visible` — turns the Bhajan Mandali tile into a live link. */
  mandaliVisible?: boolean;
}) {
  const rk = getSection("ritual-pujans");
  const sitemapSections = TAXONOMY.filter(
    (s) => s.gatedBy !== "kits_launched" || kitsLaunched,
  );

  const sitemapAccordion: FooterAccordionSection[] = sitemapSections.map(
    (section) => ({
      id: section.key,
      title: section.label,
      titleClass: SITEMAP_HEADING,
      content: (
        <SitemapLinks
          links={section.children}
          allLabel={
            section.key === "ritual-pujans"
              ? "Shop all kits"
              : `All ${section.label}`
          }
          allHref={section.href}
        />
      ),
    }),
  );

  const columnsAccordion: FooterAccordionSection[] = [
    {
      id: "about",
      title: "About",
      titleClass: COLUMN_HEADING,
      content: (
        <>
          <Link href="/about" className={COLUMN_LINK}>
            Why <span className="font-devanagari">तप्</span>
          </Link>
          <Link href="/editorial-method" className={COLUMN_LINK}>
            Our Editorial Method
          </Link>
          <Link href="/scripture-references" className={COLUMN_LINK}>
            Scripture References
          </Link>
          <Link href="/glossary" className={COLUMN_LINK}>
            Glossary
          </Link>
          <Link href="/tapa-circle" className={COLUMN_LINK}>
            The Tapa Circle
          </Link>
          <Link href="/work-with-us" className={COLUMN_LINK}>
            Join the Purohit Network
          </Link>
          <Link href="/work-with-us" className={COLUMN_LINK}>
            For Retailers
          </Link>
          <Link href="/work-with-us" className={COLUMN_LINK}>
            Bulk &amp; Corporate Orders
          </Link>
        </>
      ),
    },
    {
      id: "help",
      title: "Help",
      titleClass: COLUMN_HEADING,
      content: (
        <>
          <Link href="/orders/track" className={COLUMN_LINK}>
            Track Your Order
          </Link>
          <Link href="/policies/shipping" className={COLUMN_LINK}>
            Shipping &amp; Delivery
          </Link>
          <Link href="/policies/refund" className={COLUMN_LINK}>
            Returns &amp; Refunds
          </Link>
          <Link href="/policies/cancellation" className={COLUMN_LINK}>
            Cancellations
          </Link>
          <Link href="/policies/shipping#payment" className={COLUMN_LINK}>
            Payment &amp; COD
          </Link>
          <Link href="/editorial-method" className={COLUMN_LINK}>
            FAQs
          </Link>
          <Link href="/about" className={COLUMN_LINK}>
            Contact Support
          </Link>
        </>
      ),
    },
    {
      id: "for-you",
      title: "For You",
      titleClass: COLUMN_HEADING,
      content: (
        <>
          <Link href="/account" className={COLUMN_LINK}>
            My Account
          </Link>
          <Link href="/account" className={COLUMN_LINK}>
            Saved Rituals
          </Link>
          <Link href="/account" className={COLUMN_LINK}>
            My Reminders
          </Link>
          <Link href="/account" className={COLUMN_LINK}>
            Notification Preferences
          </Link>
          <span className={`${COLUMN_LINK} cursor-default`}>
            English / <span className="font-devanagari">हिंदी</span>
          </span>
        </>
      ),
    },
    {
      id: "connect",
      title: "Connect",
      titleClass: COLUMN_HEADING,
      content: (
        <>
          <p className="mt-[2px] mb-[10px] text-[9.5px] font-bold tracking-[0.5px] text-[#7A6A55]">
            GET IN TOUCH
          </p>
          <a
            href={`https://wa.me/${CIRCLE_WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-[11px] py-2"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border border-white/10 bg-wa/20 text-[15px]">
              💬
            </span>
            <span>
              <span className="block text-[13px] leading-[1.35] font-medium text-hero-text">
                Chat on WhatsApp
              </span>
              <span className="mt-[1px] block text-[11px] leading-normal text-[#7A6A55]">
                Support · Mon–Sat, 10am–7pm IST
              </span>
            </span>
          </a>
          <a
            href="mailto:help@thetapaco.com"
            className="flex items-center gap-[11px] py-2"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border border-white/10 bg-white/[0.06] text-[15px]">
              ✉
            </span>
            <span>
              <span className="block text-[13px] leading-[1.35] font-medium text-hero-text">
                Email us
              </span>
              <span className="mt-[1px] block text-[11px] leading-normal text-[#7A6A55]">
                help@thetapaco.com
              </span>
            </span>
          </a>
          <Link href="/work-with-us" className="flex items-center gap-[11px] py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] border border-white/10 bg-white/[0.06] text-[15px]">
              ✍
            </span>
            <span>
              <span className="block text-[13px] leading-[1.35] font-medium text-hero-text">
                Contact form
              </span>
              <span className="mt-[1px] block text-[11px] leading-normal text-[#7A6A55]">
                Partnerships, press
              </span>
            </span>
          </Link>
          <p className="mt-[22px] mb-[10px] text-[9.5px] font-bold tracking-[0.5px] text-[#7A6A55]">
            FOLLOW
          </p>
          <div className="flex gap-[9px]">
            {SOCIALS.map((social) => (
              <a
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
                className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-white/10 bg-white/[0.06] text-[11px] font-bold text-[#C4A882]"
              >
                {social.name[0]}
              </a>
            ))}
          </div>
        </>
      ),
    },
  ];

  return (
    <footer className="bg-ink">
      {/* ── Band 1: Brand ── */}
      <div className="relative overflow-hidden border-b border-white/[0.07] px-5 pt-[46px] pb-[34px] text-center">
        <div
          aria-hidden
          className="absolute inset-0 [background:radial-gradient(ellipse_55%_75%_at_50%_95%,rgba(253,6,109,0.07)_0%,transparent_65%)]"
        />
        <div className="relative">
          <div className="mb-[15px] flex items-center justify-center gap-[14px]">
            <span className="h-px w-[54px] bg-[rgba(227,181,103,0.25)]" />
            <span aria-hidden className="text-[19px] text-cta">
              ✽
            </span>
            <span className="h-px w-[54px] bg-[rgba(227,181,103,0.25)]" />
          </div>
          <p className="mb-[9px] text-[22px] font-bold tracking-[-0.4px] text-hero-text md:text-[27px]">
            Not fear. <em className="text-cta not-italic">Only devotion.</em>
          </p>
          <p className="mx-auto mb-5 max-w-[520px] text-[13.5px] leading-[1.72] text-sub">
            Every ritual explained from a named source — so you know what comes
            from scripture, what comes from your family, and what is simply a
            rumour.
          </p>
          <Link
            href="/"
            className="inline-block rounded-[22px] bg-cta px-[27px] py-3 text-[13.5px] font-bold text-white"
          >
            ▶ Start today&rsquo;s vrat
          </Link>
          <p className="mt-3">
            <Link
              href="/editorial-method"
              className="text-[12px] font-semibold text-sub underline underline-offset-[3px] hover:text-eyebrow-dark"
            >
              Read our editorial method ›
            </Link>
          </p>
          <p className="font-devanagari mt-4 text-[13px] tracking-[0.4px] text-[#C4A882]">
            हर अनुष्ठान, सही विधि से
          </p>
        </div>
      </div>

      {/* ── Band 2: Search & auth ── */}
      <div className="border-b border-white/[0.07] bg-white/[0.028]">
        <div className="mx-auto flex max-w-[1280px] flex-col items-stretch gap-3 px-5 py-[18px] md:flex-row md:items-center md:gap-5 md:px-10">
          <Link
            href="/search"
            className="flex flex-1 items-center gap-[10px] rounded-3xl border border-white/[0.13] bg-white/[0.07] px-[18px] py-3 md:max-w-[440px]"
          >
            <span className="flex-1 text-[13.5px] text-[#7A6A55]">
              Search rituals, festivals, concepts…
            </span>
            <span className="rounded-2xl bg-cta px-[15px] py-[7px] text-xs font-bold text-white">
              Search
            </span>
          </Link>
          <div className="flex items-center gap-[10px] md:ml-auto">
            <span className="mr-1 hidden text-xs text-[#7A6A55] lg:block">
              {kitsLaunched
                ? "Save rituals, track orders and manage reminders"
                : "Save rituals and manage reminders"}
            </span>
            <Link
              href="/sign-in"
              className="flex-1 rounded-[20px] border-[1.5px] border-white/[0.22] px-5 py-[10px] text-center text-[13px] font-semibold whitespace-nowrap text-hero-text md:flex-none"
            >
              Sign in
            </Link>
            <Link
              href="/sign-in"
              className="flex-1 rounded-[20px] bg-cta px-[22px] py-[11px] text-center text-[13px] font-bold whitespace-nowrap text-white md:flex-none"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>

      {/* ── Band 3: Sitemap ── */}
      <div className="mx-auto max-w-[1280px] px-5 md:px-10">
        <div className="border-b border-white/[0.07] pt-[30px] pb-8">
          <p className="mb-2 text-[10px] font-bold tracking-[0.7px] text-eyebrow-dark md:mb-5">
            BROWSE BY CATEGORY
          </p>
          <FooterAccordion
            sections={sitemapAccordion}
            gridClass="md:grid md:grid-cols-4 md:gap-[30px]"
          />
          {/* Phase-locked cells: a date, not a SOON pill, never a dead link */}
          <div className="mt-[26px] grid gap-[22px] border-t border-dashed border-white/[0.09] pt-6 md:grid-cols-4 md:gap-[30px]">
            {!kitsLaunched && (
              <ComingSoonTile
                title={rk.label}
                when="Pre-booking opens 15 September 2026"
                copy="Samagri kits for every ritual guide, delivered before the date. Full amount at pre-booking; cancellable within 48 hours."
              />
            )}
            {purohitVisible ? (
              <div>
                <p className="mb-[10px] border-b border-white/10 pb-[9px] text-[14.5px] font-bold text-hero-text">
                  Purohit &amp; Puja
                </p>
                <Link
                  href="/pujan-with-purohit"
                  className="block py-1 text-xs font-semibold text-cta"
                >
                  Book a Purohit ›
                </Link>
                <span className="block text-[11.5px] leading-[1.6] text-sub">
                  Book a verified purohit for your home.
                </span>
              </div>
            ) : (
              <ComingSoonTile
                title="Purohit & Puja"
                when="Opening November 2026"
                copy="Book a verified purohit for your home."
              />
            )}
            {mandaliVisible ? (
              <div>
                <p className="mb-[10px] border-b border-white/10 pb-[9px] text-[14.5px] font-bold text-hero-text">
                  Bhajan Mandali
                </p>
                <Link
                  href="/bhajan-mandali"
                  className="block py-1 text-xs font-semibold text-cta"
                >
                  Book a Mandali ›
                </Link>
                <span className="block text-[11.5px] leading-[1.6] text-sub">
                  Sundarkand · Mata Ki Chowki · Shyam Darbaar · Jagran.
                </span>
              </div>
            ) : (
              <ComingSoonTile
                title="Bhajan Mandali"
                when="Coming soon"
                copy="Sundarkand · Mata Ki Chowki · Shyam Darbaar · Jagran."
              />
            )}
          </div>
        </div>
      </div>

      {/* ── Band 4: Columns ── */}
      <div className="mx-auto max-w-[1280px] px-5 md:px-10">
        <div className="border-b border-white/[0.07] pt-[18px] pb-9 md:pt-[34px]">
          <FooterAccordion
            sections={columnsAccordion}
            gridClass="md:grid md:grid-cols-[1.05fr_1fr_1fr_1.15fr] md:gap-9"
          />
        </div>
      </div>

      {/* ── Band 5: Corrections strip ── */}
      <div className="mx-auto max-w-[1280px] px-5 md:px-10">
        <div className="border-b border-white/[0.07] pt-[22px] pb-6">
          <p className="mb-[7px] text-[14.5px] font-bold text-hero-text">
            Every article carries a named source.
          </p>
          <p className="mb-[10px] max-w-[760px] text-[12.5px] leading-[1.75] text-[#7A6A55]">
            Where a practice comes from scripture, we cite the text. Where it
            comes from custom, we say so. Where it is a misconception, we
            correct it. Find an error and we will fix it, and record the
            correction.
          </p>
          <Link
            href="/report-correction"
            className="text-[12.5px] font-bold text-cta"
          >
            Report a correction ›
          </Link>
        </div>
      </div>

      {/* ── Band 6: Legal ── */}
      <div className="mx-auto max-w-[1280px] px-5 md:px-10">
        <div className="pt-6 pb-[30px]">
          {/* Trust badges — the three editorial promises, above the policy links */}
          <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2">
            {TRUST_BADGES.map((badge) => (
              <span
                key={badge.label}
                className="flex items-center gap-[7px] text-xs font-semibold text-[#C4A882]"
              >
                <span aria-hidden className="text-[13px]">
                  {badge.icon}
                </span>
                {badge.label}
              </span>
            ))}
          </div>
          <div className="mb-4 flex flex-wrap gap-x-5 gap-y-[9px] border-y border-white/[0.06] py-4">
            {[
              { label: "Terms of Use", href: "/policies/terms" },
              { label: "Privacy Policy", href: "/policies/privacy" },
              { label: "Cancellation", href: "/policies/cancellation" },
              { label: "Refunds", href: "/policies/refund" },
              { label: "Shipping & Delivery", href: "/policies/shipping" },
              { label: "Grievance Redressal", href: "/policies/grievance-redressal" },
              { label: "Sitemap", href: "/sitemap.xml" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-[#7A6A55] hover:text-eyebrow-dark"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <p className="mb-[7px] text-[9.5px] font-bold tracking-[0.5px] text-[#7A6A55]">
            GRIEVANCE OFFICER
          </p>
          <p className="text-xs leading-[1.85] text-sub">
            [Name pending appointment] · grievance@thetapaco.com — response
            within 48 hours, per Consumer Protection (E-Commerce) Rules, 2020.
          </p>
          <p className="mt-3 text-[11.5px] leading-[1.8] text-[#5C4E36]">
            Tale Scale Networks Private Limited · Gurgaon, Haryana
          </p>
          {/* Required before Gate 2 — business fills both registrations */}
          <p className="mt-1 text-[11.5px] leading-[1.8] text-[#5C4E36]">
            CIN [pending incorporation number] · GSTIN [pending registration]
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] pt-4">
            <div className="flex flex-col gap-[6px]">
              <div className="flex items-center gap-[10px]">
                <span className="font-devanagari text-[22px] font-bold text-hero-text/85">
                  तप्
                </span>
                <span className="text-xs text-sub">
                  © 2026{" "}
                  <b className="font-semibold text-hero-text">
                    Tale Scale Networks Private Limited
                  </b>
                  . All rights reserved.
                </span>
              </div>
              <p className="text-[11.5px] leading-[1.7] text-[#5C4E36]">
                <span className="font-devanagari">तप्</span> · The Tapa Co. ·
                the tapa company — © 2026 Komal Gupta. All rights reserved.
              </p>
            </div>
            <span className="text-[11.5px] text-[#5C4E36]">
              Made in Gurgaon
            </span>
          </div>
        </div>
      </div>

    </footer>
  );
}
