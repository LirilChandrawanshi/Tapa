"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { LangToggle } from "@/components/LangToggle";
import { UserMenu } from "@/components/auth/UserMenu";
import { MegaDropdown } from "@/components/MegaDropdown";
import { CartBadge } from "@/components/shop/CartBadge";
import type { NavSection, NavSectionKey } from "@/lib/taxonomy";
import type { Flags } from "@/lib/flags";

const HOVER_DELAY_MS = 120;

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex shrink-0 items-center gap-[11px]">
      <Image
        src="/brand/tapa-logo.png"
        alt="तप्"
        width={132}
        height={140}
        priority
        className={compact ? "h-[38px] w-auto" : "h-[38px] w-auto lg:h-[44px]"}
      />
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

function HeartIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20.5s-7.5-4.6-10-9.2C.5 7.8 2.3 4.5 5.8 4.5c2 0 3.6 1.2 4.4 2.7.7 1.2 1.6 1.2 2.3 0 .8-1.5 2.4-2.7 4.4-2.7 3.5 0 5.3 3.3 3.8 6.8-2.5 4.6-10 9.2-10 9.2Z" />
    </svg>
  );
}

/**
 * Sticky top nav — 72px desktop / 70px mobile, z-60.
 * Tabs come from the taxonomy; sections with a gateFlag show a
 * "Launching soon" pill while their flag is off.
 * Dropdowns: hover with a 120ms delay on desktop, tap on touch,
 * ESC closes, only one open at a time.
 */
export function TopNav({
  sections,
  flags,
}: {
  sections: NavSection[];
  flags: Flags;
}) {
  const pathname = usePathname();
  const isActive = useCallback(
    (section: NavSection) =>
      pathname === section.href || pathname?.startsWith(`${section.href}/`),
    [pathname],
  );

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

  const isOpen = (s: NavSection) =>
    !s.gatedBy ||
    (s.gatedBy === "kits_launched" && flags.kits_launched) ||
    (s.gatedBy === "purohit_tab_visible" && flags.purohit_tab_visible) ||
    (s.gatedBy === "mandali_visible" && flags.mandali_visible);

  const openSections = sections.filter(isOpen);
  const gatedSections = sections.filter((s) => !isOpen(s));

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

          {/* shrink-0: the inner <a> is shrink-0, so without it here the wrapper
              collapses under flex pressure and the wordmark overflows into the nav */}
          <div className="shrink-0 mr-auto lg:mr-[30px]">
            <Logo />
          </div>

          <div className="hidden flex-1 lg:flex">
            {openSections.map((section) => {
              const highlighted = openKey
                ? openKey === section.key
                : isActive(section);
              return (
                <div
                  key={section.key}
                  onMouseEnter={() => scheduleOpen(section.key)}
                  className={`flex h-[72px] items-center border-b-[3px] whitespace-nowrap ${
                    highlighted
                      ? "border-cta font-semibold text-cta"
                      : "border-transparent font-medium text-sub"
                  }`}
                >
                  <Link
                    href={section.href}
                    onClick={close}
                    aria-current={isActive(section) ? "page" : undefined}
                    className={`flex h-full items-center gap-[6px] pl-[14px] text-[15px] ${
                      highlighted ? "text-cta" : "hover:text-cta"
                    }`}
                  >
                    {section.label}
                    {section.gatedBy === "kits_launched" && (
                      <span className="rounded-[4px] bg-cta px-[5px] py-[2px] text-[8px] font-bold tracking-[0.5px] text-white">
                        NEW
                      </span>
                    )}
                  </Link>
                  <button
                    type="button"
                    aria-label={`Toggle ${section.label} menu`}
                    aria-expanded={openKey === section.key}
                    onClick={() => toggle(section.key)}
                    className="flex h-full items-center px-[14px]"
                  >
                    <span
                      aria-hidden
                      className={`text-[9px] opacity-60 transition-transform duration-150 ${
                        openKey === section.key ? "rotate-180" : ""
                      }`}
                    >
                      ▾
                    </span>
                  </button>
                </div>
              );
            })}
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
              className="hidden w-[190px] shrink-0 items-center gap-[9px] rounded-[22px] border border-border bg-bg px-4 py-[10px] text-[13.5px] whitespace-nowrap text-sub xl:flex"
            >
              <SearchIcon />
              <span className="truncate">Search rituals, festivals…</span>
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
              href="/account/saved"
              aria-label="Saved rituals"
              className="hidden h-10 w-10 items-center justify-center rounded-[10px] border-[1.5px] border-border bg-bg text-sub hover:text-cta lg:flex"
            >
              <HeartIcon />
            </Link>
            {flags.kits_launched && <CartBadge />}
            <UserMenu
              variant="desktop"
              showCreateAccount={!flags.kits_launched}
            />
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
            {openSections.map((section) => {
              const expanded = drawerSection === section.key;
              return (
                <div key={section.key}>
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-current={isActive(section) ? "page" : undefined}
                    onClick={() =>
                      setDrawerSection(expanded ? null : section.key)
                    }
                    className={`flex w-full items-center justify-between border-b border-border-light px-4 py-[15px] text-base font-bold ${
                      isActive(section) ? "text-cta" : "text-ink"
                    }`}
                  >
                    <span className="flex items-center gap-[7px]">
                      {section.label}
                      {section.gatedBy === "kits_launched" && (
                        <span className="rounded-[4px] bg-cta px-[5px] py-[2px] text-[8px] font-bold tracking-[0.5px] text-white">
                          NEW
                        </span>
                      )}
                    </span>
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
              { label: "Scripture References", href: "/editorial-method" },
              { label: "Our Editorial Method", href: "/editorial-method" },
              { label: "Contact", href: "/about" },
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
            <UserMenu variant="drawer" />
          </div>
          <div className="flex justify-center px-4 pb-[18px]">
            <LangToggle />
          </div>
        </div>
      )}
    </>
  );
}
