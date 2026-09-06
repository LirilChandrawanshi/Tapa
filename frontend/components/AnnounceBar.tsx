import Link from "next/link";

const UTILITY_LINKS = [
  { label: "Scripture References", href: "/editorial-method" },
  { label: "Glossary", href: "/glossary" },
  { label: "Our Editorial Method", href: "/editorial-method" },
] as const;

/**
 * Announcement bar — locked copy, never dismissable, sits above the nav.
 */
export function AnnounceBar() {
  return (
    <div className="flex items-center justify-center bg-ink px-4 py-[7px] md:justify-between md:px-7">
      <p className="text-center text-[10px] text-eyebrow-dark">
        <strong className="font-semibold text-cta">
          Dharma does not demand fear.
        </strong>{" "}
        It demands devotion.
      </p>
      <div className="hidden gap-5 md:flex">
        {UTILITY_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-[10px] text-sub hover:text-eyebrow-dark"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
