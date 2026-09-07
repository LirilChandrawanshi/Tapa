import Link from "next/link";

const LINKS = [
  { key: "today", href: "/panchang", label: "Today" },
  { key: "vrat", href: "/panchang/vrat-calendar", label: "Vrat Calendar" },
  {
    key: "festival",
    href: "/panchang/festival-calendar",
    label: "Festival Calendar",
  },
  { key: "eclipses", href: "/panchang/eclipses", label: "Eclipses" },
] as const;

export type PanchangSubnavKey = (typeof LINKS)[number]["key"];

/**
 * Thin sticky section nav rendered under the hero on every /panchang/* page
 * (G31). Sits below the sticky TopNav (70px mobile / 72px desktop).
 */
export function PanchangSubnav({ active }: { active?: PanchangSubnavKey }) {
  return (
    <nav
      aria-label="Panchang sections"
      className="sticky top-[70px] z-40 border-b border-border bg-card/95 backdrop-blur lg:top-[72px]"
    >
      <div className="mx-auto flex max-w-[1280px] items-center gap-1 overflow-x-auto px-4 md:px-10">
        {LINKS.map((l) => {
          const on = l.key === active;
          return (
            <Link
              key={l.key}
              href={l.href}
              aria-current={on ? "page" : undefined}
              className={`-mb-px shrink-0 border-b-2 px-3 py-[9px] text-[12px] font-bold whitespace-nowrap transition-colors ${
                on
                  ? "border-cta text-cta"
                  : "border-transparent text-mid hover:border-border hover:text-ink"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
