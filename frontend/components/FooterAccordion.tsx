"use client";

import { useState, type ReactNode } from "react";

export interface FooterAccordionSection {
  id: string;
  /** Plain heading text — the mobile toggle row renders it itself. */
  title: string;
  /** Desktop heading classes (mobile uses its own toggle-row styling). */
  titleClass: string;
  content: ReactNode;
}

/**
 * Mobile collapse for the footer's sitemap and column bands (#16/G65):
 * below md each section becomes an accordion row — at most one open at a
 * time — while md+ renders the untouched desktop grid. The content nodes
 * are server-rendered and passed in, so links stay crawlable either way.
 */
export function FooterAccordion({
  sections,
  gridClass,
}: {
  sections: FooterAccordionSection[];
  gridClass: string;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className={gridClass}>
      {sections.map((section) => {
        const open = openId === section.id;
        return (
          <div
            key={section.id}
            className="border-b border-white/[0.07] last:border-b-0 md:border-b-0"
          >
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : section.id)}
              className="flex w-full items-center justify-between gap-3 py-[13px] text-left text-[13.5px] font-bold text-hero-text md:hidden"
            >
              {section.title}
              <span
                aria-hidden
                className="text-[15px] leading-none text-[#7A6A55]"
              >
                {open ? "−" : "+"}
              </span>
            </button>
            <p className={`hidden md:block ${section.titleClass}`}>
              {section.title}
            </p>
            <div className={`${open ? "block pb-4" : "hidden"} md:block md:pb-0`}>
              {section.content}
            </div>
          </div>
        );
      })}
    </div>
  );
}
