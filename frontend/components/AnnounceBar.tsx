import Link from "next/link";
import { getFlags } from "@/lib/flags";

const P1_LINKS = [
  { label: "Scripture References", href: "/editorial-method" },
  { label: "Glossary", href: "/glossary" },
  { label: "Our Editorial Method", href: "/editorial-method" },
] as const;

const P2_LINKS = [
  ...P1_LINKS,
  { label: "Track Order", href: "/orders/track" },
] as const;

/**
 * Announcement bar — locked copy, never dismissable, sits above the nav.
 * Two phases: the P1 line until `kits_launched` flips, then the P2
 * pre-booking line with a Track Order utility link. The flag can be
 * passed in; when it isn't (layout renders bare), it is read here from
 * the DB-driven flags endpoint.
 */
export async function AnnounceBar({ kitsLaunched }: { kitsLaunched?: boolean }) {
  const launched = kitsLaunched ?? (await getFlags()).kits_launched;
  const links = launched ? P2_LINKS : P1_LINKS;

  return (
    <div className="flex items-center justify-center bg-ink px-4 py-[7px] md:justify-between md:px-7">
      {launched ? (
        <p className="text-center text-[10px] text-eyebrow-dark">
          <strong className="font-semibold text-cta">
            Ritual Pujans are open
          </strong>{" "}
          — pre-book before the cut-off. Dharma does not demand fear. It
          demands devotion.
        </p>
      ) : (
        <p className="text-center text-[10px] text-eyebrow-dark">
          <strong className="font-semibold text-cta">
            Dharma does not demand fear.
          </strong>{" "}
          It demands devotion.
        </p>
      )}
      <div className="hidden gap-5 md:flex">
        {links.map((link) => (
          <Link
            key={link.label}
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
