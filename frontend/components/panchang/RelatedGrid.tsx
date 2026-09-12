import Link from "next/link";

/**
 * The spec's four-column "Related" grid — ritual guides, concepts, other
 * dates and downloads. A column with no items is dropped rather than
 * rendered empty, so a page with only two kinds of links still looks whole.
 */

export interface RelatedItem {
  label: string;
  note?: string;
  href: string;
}

export interface RelatedColumn {
  heading: string;
  items: readonly RelatedItem[];
}

export function RelatedGrid({
  columns,
}: {
  columns: readonly RelatedColumn[];
}) {
  const live = columns.filter((c) => c.items.length > 0);
  if (live.length === 0) return null;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {live.map((col) => (
        <div
          key={col.heading}
          className="overflow-hidden rounded-[15px] border border-border bg-card"
        >
          <p className="border-b border-border bg-bg px-[17px] py-[9px] text-[9.5px] font-bold tracking-[0.9px] text-sub uppercase">
            {col.heading}
          </p>
          <div className="divide-y divide-border-light">
            {col.items.map((item) => (
              <Link
                key={`${col.heading}-${item.href}-${item.label}`}
                href={item.href}
                className="group flex items-center justify-between gap-2 px-[17px] py-[11px] transition-colors hover:bg-bg"
              >
                <span className="min-w-0">
                  <span className="block text-[12.5px] leading-snug font-bold text-ink group-hover:text-cta">
                    {item.label}
                  </span>
                  {item.note && (
                    <span className="mt-[2px] block text-[11px] text-sub">
                      {item.note}
                    </span>
                  )}
                </span>
                <span aria-hidden className="shrink-0 text-[13px] text-sub">
                  ›
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
