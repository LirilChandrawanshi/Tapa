import Link from "next/link";
import { Fragment, type ReactNode } from "react";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumb({
  items,
  actions,
}: {
  items: readonly Crumb[];
  /**
   * Right-aligned controls in the crumb bar — the PLP spec puts the language
   * toggle, Save and Share here on every detail template.
   */
  actions?: ReactNode;
}) {
  return (
    <nav aria-label="Breadcrumb" className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-[10px] md:px-10">
      <ol className="flex flex-wrap items-center gap-2 text-[13px] text-sub">
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
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      )}
      </div>
    </nav>
  );
}
