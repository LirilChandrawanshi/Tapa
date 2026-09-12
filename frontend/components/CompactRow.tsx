import Link from "next/link";

/**
 * Simple list row — used inside a `CompactRowList` style container:
 * wrap rows in `<div className="overflow-hidden rounded-[15px] border border-border bg-card">`.
 */
export function CompactRow({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 border-b-[0.5px] border-border-light px-5 py-[15px] transition-colors duration-150 last:border-b-0 hover:bg-[#FCFAF6]"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[15.5px] leading-tight font-semibold text-ink">
          {title}
        </span>
        {subtitle && (
          <span className="mt-[3px] block text-[12.5px] leading-relaxed text-sub">
            {subtitle}
          </span>
        )}
      </span>
      <span aria-hidden className="shrink-0 text-base text-cta">
        ›
      </span>
    </Link>
  );
}
