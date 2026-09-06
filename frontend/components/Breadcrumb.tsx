import Link from "next/link";
import { Fragment } from "react";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: readonly Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="border-b border-border bg-card">
      <ol className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-2 px-4 py-[10px] text-[13px] text-sub md:px-10">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <Fragment key={`${item.label}-${i}`}>
              {i > 0 && <li aria-hidden>›</li>}
              <li>
                {item.href && !isLast ? (
                  <Link href={item.href} className="hover:text-cta">
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className={isLast ? "font-medium text-body" : undefined}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
