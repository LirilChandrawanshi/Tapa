import type { ReactNode } from "react";

/**
 * Two-column `main` + `aside` shell used by all three panchang detail
 * templates (vrat date, festival day-by-day, eclipse explainer).
 *
 * The sidebar stacks under the main column below `lg` and sticks to the
 * viewport above it — the spec's CTAs and at-a-glance table are meant to
 * stay reachable through a long page.
 */
export function PanchangShell({
  children,
  sidebar,
}: {
  children: ReactNode;
  sidebar?: ReactNode;
}) {
  if (!sidebar) {
    return (
      <div className="mx-auto max-w-[1280px] px-4 md:px-10">{children}</div>
    );
  }
  return (
    <div className="mx-auto grid max-w-[1280px] gap-8 px-4 md:px-10 lg:grid-cols-[minmax(0,1fr)_302px] lg:gap-10">
      <div className="min-w-0">{children}</div>
      <aside className="lg:sticky lg:top-[124px] lg:self-start">
        <div className="flex flex-col gap-3">{sidebar}</div>
      </aside>
    </div>
  );
}
