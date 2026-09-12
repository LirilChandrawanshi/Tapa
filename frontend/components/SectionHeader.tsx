import Link from "next/link";

export function SectionHeader({
  eyebrow,
  title,
  description,
  count,
  viewAllHref,
  viewAllLabel = "View all",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  /** e.g. "18 guides" — rendered muted, before the View all link. */
  count?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}) {
  return (
    <div className="reveal mb-4 flex flex-col items-start justify-between gap-3 border-b border-border pb-3 md:flex-row md:items-end md:gap-5">
      <div>
        {eyebrow && (
          <p className="mb-[6px] text-[10px] font-bold tracking-[0.8px] text-cta uppercase">
            {eyebrow}
          </p>
        )}
        <h2 className="text-xl font-bold tracking-[-0.4px] text-ink md:text-2xl">
          {title}
        </h2>
        {description && (
          <p className="mt-[6px] max-w-[640px] text-[13.5px] leading-relaxed text-sub">
            {description}
          </p>
        )}
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="link-underline shrink-0 text-[12.5px] font-bold whitespace-nowrap text-cta"
        >
          {count && (
            <span className="mr-2 font-medium text-sub">{count}</span>
          )}
          {viewAllLabel} ›
        </Link>
      )}
    </div>
  );
}
