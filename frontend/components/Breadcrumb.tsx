import { type ReactNode } from "react";

export interface Crumb {
  label: string;
  href?: string;
}

/**
 * The crumb trail itself was dropped site-wide — the top nav already says where
 * you are, and the extra bar pushed every page's first fold down. `items` is
 * still accepted (call sites keep passing it, and the same trail is emitted as
 * BreadcrumbList JSON-LD for search engines) but nothing is rendered for it.
 *
 * The bar survives only as a home for `actions` — the PLP spec's language
 * toggle / Save / Share controls on detail templates. With no actions there is
 * nothing to draw, so the component renders nothing at all.
 */
export function Breadcrumb({
  items: _items,
  actions,
}: {
  items: readonly Crumb[];
  actions?: ReactNode;
}) {
  if (!actions) return null;

  return (
    <div className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-end gap-x-4 gap-y-2 px-4 py-[10px] md:px-10">
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      </div>
    </div>
  );
}
