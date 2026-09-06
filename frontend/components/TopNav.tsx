"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { LangToggle } from "@/components/LangToggle";
import { MegaDropdown } from "@/components/MegaDropdown";
import type { NavSectionKey } from "@/lib/taxonomy";
import { TAXONOMY } from "@/lib/taxonomy";

const HOVER_DELAY_MS = 120;

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-[11px]">
      <span
        className={`font-devanagari leading-none font-bold text-ink ${
          compact ? "text-[30px]" : "text-[30px] lg:text-[34px]"
        }`}
      >
        तप्
      </span>
      <span className="max-w-[76px] text-[10px] leading-[1.25] font-semibold tracking-[0.3px] text-cta">
        the tapa company
      </span>
    </Link>
  );
}

function SearchIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

/**
 * Sticky top nav — 72px desktop / 70px mobile, z-60.
 * Tabs come from the taxonomy; the gated Ritual Pujans tab shows a
 * "Launching soon" pill while `kits_launched` is off.
 * Dropdowns: hover with a 120ms delay on desktop, tap on touch,
 * ESC closes, only one open at a time.
 */
export function TopNav({ kitsLaunched }: { kitsLaunched: boolean }) {
  const [openKey, setOpenKey] = useState<NavSectionKey | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSection, setDrawerSection] = useState<NavSectionKey | null>(
    "ritual-guides",
  );
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (hoverTimer.current) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = null;
    }
  }, []);

  const close = useCallback(() => {
    clearTimer();
    setOpenKey(null);
  }, [clearTimer]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        close();
        setDrawerOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  useEffect(() => () => clearTimer(), [clearTimer]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  function scheduleOpen(key: NavSectionKey) {
    clearTimer();
    hoverTimer.current = setTimeout(() => setOpenKey(key), HOVER_DELAY_MS);
  }

  function toggle(key: NavSectionKey) {
    clearTimer();
    setOpenKey((current) => (current === key ? null : key));
  }

  const sections = TAXONOMY.filter(
    (s) => s.gatedBy !== "kits_launched" || kitsLaunched,
  );
  const gatedSections = TAXONOMY.filter(
    (s) => s.gatedBy === "kits_launched" && !kitsLaunched,
  );

  return (
    <>
      <nav
        className="sticky top-0 z-[60] border-b border-border bg-card shadow-[0_1px_12px_rgba(28,23,18,0.06)]"
        onMouseLeave={close}
      >
        {/* nav (sticky) is the containing block, so the dropdown spans full width */}
        <div className="mx-auto flex h-[70px] max-w-[1280px] items-center gap-[10px] px-3 lg:h-[72px] lg:gap-0 lg:px-10">
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            className="flex w-9 flex-col gap-[4.5px] px-[7px] lg:hidden"
          >
            <span className="h-[2px] rounded-full bg-ink" />
            <span className="h-[2px] w-[68%] rounded-full bg-ink" />
            <span className="h-[2px] rounded-full bg-ink" />
          </button>

          <div className="mr-auto lg:mr-[30px]">
            <Logo />
          </div>

          <div className="hidden flex-1 lg:flex">
            {sections.map((section) => (
              <button
                key={section.key}
                type="button"
                aria-expanded={openKey === section.key}
                onMouseEnter={() => scheduleOpen(section.key)}
                onClick={() => toggle(section.key)}
                className={`flex h-[72px] items-center gap-[6px] border-b-[3px] px-[14px] text-[15px] whitespace-nowrap ${
                  openKey === section.key
                    ? "border-cta font-semibold text-cta"
                    : "border-transparent font-medium text-sub hover:text-cta"
                }`}
              >
                {section.label}
                <span
                  aria-hidden
                  className={`text-[9px] opacity-60 transition-transform duration-150 ${
                    openKey === section.key ? "rotate-180" : ""
                  }`}
                >
                  ▾
                </span>
              </button>
            ))}
            {gatedSections.map((section) => (
              <span
                key={section.key}
                className="flex h-[72px] cursor-default items-center gap-[6px] px-[14px] text-[15px] font-medium whitespace-nowrap text-sub/60"
                title="Launching soon"
              >
                {section.label}
                <span className="rounded-[4px] border border-pratha-bd bg-pratha-bg px-[6px] py-[2px] text-[8.5px] font-bold tracking-[0.4px] text-pratha-fg">
                  LAUNCHING SOON
                </span>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-[9px] lg:ml-auto">
            <Link
              href="/search"
              className="hidden w-[190px] items-center gap-[9px] rounded-[22px] border border-border bg-bg px-4 py-[10px] text-[13.5px] text-sub xl:flex"
            >
              <SearchIcon />
              <span>Search rituals, festivals…</span>
            </Link>
            <Link
              href="/search"
              aria-label="Search"
              className="flex h-10 w-10 items-center justify-center rounded-[10px] border-[1.5px] border-border bg-bg text-sub xl:hidden"
            >
              <SearchIcon />
            </Link>
            <LangToggle className="hidden lg:flex" />
            <Link
              href="/sign-in"
              className="hidden rounded-[10px] bg-cta px-5 py-[11px] text-[13.5px] font-bold whitespace-nowrap text-white lg:block"
            >
              Sign in
            </Link>
          </div>

          {openKey && (
            <MegaDropdown sectionKey={openKey} onNavigate={close} />
          )}
        </div>
      </nav>

      {/* ── Mobile drawer ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[80] overflow-y-auto bg-card lg:hidden">
          <div className="flex h-[70px] items-center gap-[10px] border-b border-border px-3">
            <Logo compact />
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setDrawerOpen(false)}
              className="ml-auto flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border-[1.5px] border-border bg-bg text-[17px]"
            >
              ✕
            </button>
          </div>

          <Link
            href="/search"
            onClick={() => setDrawerOpen(false)}
            className="mx-4 my-[14px] flex items-center gap-[10px] rounded-xl border-[1.5px] border-border bg-bg px-[15px] py-3 text-sm text-sub"
          >
            <SearchIcon />
            <span>Search rituals, festivals…</span>
          </Link>

          <div className="border-t border-border-light">
            {sections.map((section) => {
              const expanded = drawerSection === section.key;
              return (
                <div key={section.key}>
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() =>
                      setDrawerSection(expanded ? null : section.key)
                    }
                    className="flex w-full items-center justify-between border-b border-border-light px-4 py-[15px] text-base font-bold text-ink"
                  >
                    {section.label}
                    <span aria-hidden className="text-xs text-sub">
                      {expanded ? "▴" : "▾"}
                    </span>
                  </button>
                  {expanded && (
                    <div className="border-b border-border-light bg-bg px-4 pt-1 pb-3">
                      {section.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setDrawerOpen(false)}
                          className={`block border-b-[0.5px] border-border py-[10px] text-[14.5px] last:border-b-0 ${
                            child.lead
                              ? "font-bold text-cta"
                              : "text-body"
                          }`}
                        >
                          {child.label}
                        </Link>
                      ))}
                      <Link
                        href={section.href}
                        onClick={() => setDrawerOpen(false)}
                        className="block py-[10px] text-[14.5px] font-bold text-cta"
                      >
                        All {section.label} ›
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
            {gatedSections.map((section) => (
              <div
                key={section.key}
                className="flex items-center justify-between border-b border-border-light px-4 py-[15px] text-base font-bold text-sub/60"
              >
                {section.label}
                <span className="rounded-[4px] border border-pratha-bd bg-pratha-bg px-[6px] py-[2px] text-[8.5px] font-bold tracking-[0.4px] text-pratha-fg">
                  LAUNCHING SOON
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-[2px] border-b border-border-light px-4 py-[14px]">
            {[
              { label: "Glossary", href: "/glossary" },
              { label: "Scripture References", href: "/scripture-references" },
              { label: "Our Editorial Method", href: "/editorial-method" },
              { label: "Contact", href: "/contact" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setDrawerOpen(false)}
                className="py-[9px] text-sm text-sub"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="p-4">
            <Link
              href="/sign-in"
              onClick={() => setDrawerOpen(false)}
              className="mb-[9px] block w-full rounded-xl bg-cta py-[14px] text-center text-[14.5px] font-bold text-white"
            >
              Sign in
            </Link>
          </div>
          <div className="flex justify-center px-4 pb-[18px]">
            <LangToggle />
          </div>
        </div>
      )}
    </>
  );
}
