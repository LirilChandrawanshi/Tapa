"use client";

import Link from "next/link";
import type { NavSectionKey } from "@/lib/taxonomy";
import { getSection } from "@/lib/taxonomy";

/*
 * Mega-dropdown content per the Aug-30 header spec:
 *   - Fixed 4-column grid.
 *   - Column 1 is the newcomer entry.
 *   - Columns 2–3 are taxonomy and content links.
 *   - Column 4 is always a feature card, never more links.
 *   - Footer row: one line of editorial context left, one link right. Never a CTA.
 */

interface DdLink {
  label: string;
  href: string;
  description?: string;
  lead?: boolean;
  accent?: boolean;
  dot?: string;
  when?: string;
  pill?: "live" | "soon";
}

interface DdColumn {
  heading: string;
  liveNow?: { label: string; value: string };
  links: DdLink[];
}

interface DdFeature {
  tone: "dark" | "amber" | "data";
  eyebrow: string;
  title: string;
  copy: string;
  cta: string;
}

interface DdConfig {
  columns: [DdColumn, DdColumn, DdColumn];
  feature: DdFeature;
  footNote: string;
  footLink: { label: string; href: string };
}

const rg = getSection("ritual-guides");
const pa = getSection("panchang");
const dc = getSection("dharmic-concepts");
const rk = getSection("ritual-pujans");

const CONFIG: Record<NavSectionKey, DdConfig> = {
  "ritual-guides": {
    columns: [
      {
        heading: "START HERE",
        links: [
          {
            label: "Beginner's Guides",
            href: rg.children[0].href,
            description: "No tags, no citations, no Sanskrit to look up",
            lead: true,
          },
          { label: "Sawan Somwar Vrat", href: "/ritual-guides/festive-pujans/sawan-somwar-vrat" },
          { label: "Aja Ekadashi", href: "/ritual-guides/all-year-pujans/aja-ekadashi" },
          { label: "Hariyali Teej", href: "/ritual-guides/festive-pujans/hariyali-teej" },
        ],
      },
      {
        heading: "BY OCCASION",
        links: [
          {
            label: "Festive Pujans",
            href: rg.children[1].href,
            description: "Fixed to a tithi",
          },
          {
            label: "All-Year Pujans",
            href: rg.children[2].href,
            description: "Recurring observances",
          },
          {
            label: "Sanskar & Life Events",
            href: rg.children[3].href,
            description: "Birth to the last rites",
          },
          { label: "All Ritual Guides ›", href: rg.href, accent: true },
        ],
      },
      {
        heading: "COMING UP",
        links: [
          {
            label: "Hartalika Teej",
            href: "/ritual-guides/festive-pujans/hartalika-teej",
            description: "14 September",
            dot: "#3E8B4A",
          },
          {
            label: "Ganesh Chaturthi",
            href: "/panchang/o/ganesh-chaturthi-2026",
            description: "15 September",
            dot: "#B5651D",
          },
          {
            label: "Sharad Navratri",
            href: "/panchang/o/sharad-navratri-2026",
            description: "12 October",
            dot: "#A83358",
          },
        ],
      },
    ],
    feature: {
      tone: "dark",
      eyebrow: "HOW WE DECIDE WHAT IS TRUE",
      title: "Every claim tagged and scored",
      copy: "Dharma, Pratha or Bhranti — with a confidence score you can check against a named text.",
      cta: "Our editorial method ›",
    },
    footNote: "7 guides live · more landing weekly",
    footLink: { label: "Browse all ›", href: rg.href },
  },

  panchang: {
    columns: [
      {
        heading: "RIGHT NOW",
        liveNow: {
          label: "TODAY · DELHI-NCR",
          value: "Tithi, nakshatra, Rahu Kaal — live",
        },
        links: [
          {
            label: "Today's Panchang",
            href: pa.children[0].href,
            description: "Tithi, nakshatra, sunrise, Rahu Kaal",
          },
          { label: "Change city ›", href: "/panchang/today#city", accent: true },
        ],
      },
      {
        heading: "CALENDARS",
        links: [
          {
            label: "Vrat Calendar",
            href: pa.children[1].href,
            description: "Every Ekadashi, Teej and Purnima",
          },
          {
            label: "Festival Calendar",
            href: pa.children[2].href,
            description: "Month by month",
          },
          {
            label: "Eclipses",
            href: pa.children[4].href,
            description: "Visibility decides everything",
          },
        ],
      },
      {
        heading: "UNDERSTAND IT",
        links: [
          {
            label: "Tithi & Paksha",
            href: pa.children[3].href,
            description: "How the lunar day works",
          },
          { label: "Grahan & Sutak, explained", href: "/dharmic-concepts/meanings-practices/eclipse-explainer" },
          { label: "The Glossary", href: "/glossary" },
        ],
      },
    ],
    feature: {
      tone: "data",
      eyebrow: "FREE DOWNLOAD",
      title: "The full 2026 calendar",
      copy: "Every tithi, vrat and festival date, computed for your city. One PDF.",
      cta: "Download ›",
    },
    footNote: "Computed for New Delhi · Purnimanta · verified manually",
    footLink: { label: "All Panchang ›", href: pa.href },
  },

  "dharmic-concepts": {
    columns: [
      {
        heading: "START HERE",
        links: [
          {
            label: "Grahan & Sutak — what actually applies",
            href: "/dharmic-concepts/meanings-practices/eclipse-explainer",
            description: "The rule that decides everything: visibility",
            lead: true,
          },
          {
            label: "Sutak, in forty words",
            href: "/glossary#sutak",
            description: "It applies only where the eclipse is visible",
          },
        ],
      },
      {
        heading: "BY TYPE",
        links: [
          {
            label: "Materials",
            href: dc.children[0].href,
            description: "Objects and what they mean",
          },
          {
            label: "Meanings & Practices",
            href: dc.children[1].href,
            description: "Acts and ideas behind the ritual",
          },
          { label: "Daily Puja", href: dc.children[2].href },
          { label: "Mantras", href: dc.children[4].href },
          { label: "All Concepts ›", href: dc.href, accent: true },
        ],
      },
      {
        heading: "IN THE SERIES",
        links: [
          { label: "Bilva", href: "/glossary#bilva", pill: "live" },
          { label: "Kalash", href: "/glossary#kalash", pill: "live" },
          { label: "Panchamrit", href: "/glossary#panchamrit", pill: "live" },
        ],
      },
    ],
    feature: {
      tone: "amber",
      eyebrow: "LOOK UP ANY TERM",
      title: "The Glossary",
      copy: "Every term defined once, in plain language, with the Devanagari and how to say it.",
      cta: "Open the glossary ›",
    },
    footNote: "Paragraph only. No tables. Every concept sourced to a named text.",
    footLink: { label: "Our editorial method ›", href: "/editorial-method" },
  },

  "ritual-pujans": {
    columns: [
      {
        heading: "SHOP BY",
        links: [
          {
            label: "By Festival",
            href: rk.children[0].href,
            description: "Dated kits, with a cut-off",
            lead: true,
          },
          {
            label: "By Ritual",
            href: rk.children[1].href,
            description: "All-year kits",
          },
          {
            label: "Griha & Life Events",
            href: rk.children[2].href,
            description: "Home and sanskar occasions",
          },
          {
            label: "Daily Puja Essentials",
            href: rk.children[3].href,
            description: "Restocked, not ritual-specific",
          },
        ],
      },
      {
        heading: "OPEN FOR PRE-BOOKING",
        links: [
          {
            label: "Shakti Ritual Kit",
            href: "/ritual-pujans/p/shakti-navratri-kit",
            description: "₹1,751 · Navratri",
            when: "ORDER BY 1 OCT",
          },
          {
            label: "Shubh Ekadash Diyas",
            href: "/ritual-pujans/p/shubh-ekadash-diyas",
            description: "₹751 · in stock",
          },
          {
            label: "Sundarkand Path Kit",
            href: "/ritual-pujans/p/sundarkand-path-kit",
            description: "₹951 · opens soon",
          },
        ],
      },
      {
        heading: "BEFORE YOU BUY",
        links: [
          { label: "You do not need a kit", href: "/about" },
          { label: "Delivery and cut-offs", href: "/policies/shipping" },
          { label: "Cancellations and refunds", href: "/policies/cancellation" },
        ],
      },
    ],
    feature: {
      tone: "amber",
      eyebrow: "WORTH SAYING PLAINLY",
      title: "You do not need a kit",
      copy: "Every samagri list is free and complete. A kit saves you a morning in the market. It does not make the puja more valid.",
      cta: "Read a guide instead ›",
    },
    footNote: "Dated kits are prepaid, no COD · free cancellation until dispatch",
    footLink: { label: "All kits ›", href: rk.href },
  },
};

const FEATURE_TONES: Record<DdFeature["tone"], string> = {
  dark: "bg-ink-deep",
  amber: "border border-pratha-bd bg-pratha-bg",
  data: "border border-data-bd bg-data-bg",
};

function FeatureCard({ feature }: { feature: DdFeature }) {
  const dark = feature.tone === "dark";
  return (
    <div
      className={`flex flex-col rounded-[13px] px-5 py-[18px] ${FEATURE_TONES[feature.tone]}`}
    >
      <p
        className={`mb-[9px] text-[9.5px] font-bold tracking-[0.6px] ${
          dark
            ? "text-eyebrow-dark"
            : feature.tone === "amber"
              ? "text-pratha-fg"
              : "text-data-fg"
        }`}
      >
        {feature.eyebrow}
      </p>
      <p
        className={`mb-[7px] text-base leading-[1.32] font-bold ${
          dark ? "text-white" : "text-ink"
        }`}
      >
        {feature.title}
      </p>
      <p
        className={`mb-[13px] flex-1 text-[12.5px] leading-[1.7] ${
          dark ? "text-[#A99070]" : "text-sub"
        }`}
      >
        {feature.copy}
      </p>
      <button
        type="button"
        className={`w-full rounded-[10px] py-[11px] text-[13px] font-bold text-white ${
          feature.tone === "data" ? "bg-data-fg" : "bg-cta"
        }`}
      >
        {feature.cta}
      </button>
    </div>
  );
}

function DdLinkItem({ link, onNavigate }: { link: DdLink; onNavigate: () => void }) {
  const base = (
    <>
      <b
        className={`block font-semibold ${link.accent ? "text-cta" : ""}`}
      >
        {link.dot && (
          <span
            aria-hidden
            className="mr-[7px] inline-block h-[6px] w-[6px] rounded-full align-[1px]"
            style={{ backgroundColor: link.dot }}
          />
        )}
        {link.label}
        {link.pill && (
          <span
            className={`ml-[7px] rounded-[4px] border px-[7px] py-[2px] text-[9px] font-bold tracking-[0.4px] ${
              link.pill === "live"
                ? "border-dharma-bd bg-dharma-bg text-dharma-fg"
                : "border-bhranti-bd bg-bhranti-bg text-bhranti-fg"
            }`}
          >
            {link.pill.toUpperCase()}
          </span>
        )}
      </b>
      {link.description && (
        <small className="mt-[1px] block text-[11.5px] leading-normal text-sub">
          {link.description}
          {link.when && (
            <span className="ml-[6px] text-[11px] font-bold text-amber">
              {link.when}
            </span>
          )}
        </small>
      )}
    </>
  );

  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      className={
        link.lead
          ? "mb-2 block rounded-[11px] border border-[#F7C0D6] bg-[#FFF0F5] px-[14px] py-3 text-sm text-body [&>b]:text-cta"
          : "block py-[7px] text-sm text-body hover:text-cta"
      }
    >
      {base}
    </Link>
  );
}

export function MegaDropdown({
  sectionKey,
  onNavigate,
}: {
  sectionKey: NavSectionKey;
  onNavigate: () => void;
}) {
  const config = CONFIG[sectionKey];
  return (
    <div className="absolute inset-x-0 top-full z-[120] hidden border-y border-border bg-card shadow-[0_14px_34px_rgba(28,23,18,0.13)] lg:block">
      <div className="mx-auto grid max-w-[1280px] grid-cols-[1.05fr_1fr_1fr_1.15fr] gap-[30px] px-10 pt-[26px] pb-[22px]">
        {config.columns.map((col) => (
          <div key={col.heading}>
            <p className="mb-3 border-b border-border-light pb-2 text-[9.5px] font-bold tracking-[0.7px] text-gold">
              {col.heading}
            </p>
            {col.liveNow && (
              <div className="mb-[10px] flex items-start gap-[9px] rounded-[11px] border border-data-bd bg-data-bg px-[14px] py-3">
                <span
                  aria-hidden
                  className="mt-[5px] h-[7px] w-[7px] shrink-0 rounded-full bg-[#3FBF6A] shadow-[0_0_0_3px_rgba(63,191,106,0.2)]"
                />
                <span>
                  <span className="block text-[9.5px] font-bold tracking-[0.5px] text-data-fg">
                    {col.liveNow.label}
                  </span>
                  <span className="mt-[2px] block text-[13.5px] font-bold text-data-fg">
                    {col.liveNow.value}
                  </span>
                </span>
              </div>
            )}
            {col.links.map((link) => (
              <DdLinkItem key={link.href + link.label} link={link} onNavigate={onNavigate} />
            ))}
          </div>
        ))}
        <FeatureCard feature={config.feature} />
      </div>
      <div className="border-t border-border-light bg-[#FCFAF6]">
        <div className="mx-auto flex max-w-[1280px] flex-wrap justify-between gap-4 px-10 py-3 text-[12.5px] text-sub">
          <span>{config.footNote}</span>
          <Link
            href={config.footLink.href}
            onClick={onNavigate}
            className="font-bold text-cta"
          >
            {config.footLink.label}
          </Link>
        </div>
      </div>
    </div>
  );
}
