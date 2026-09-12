"use client";

import { track } from "@/lib/analytics";

export interface JumpTarget {
  /** The `id` on the section this chip scrolls to, without the hash. */
  id: string;
  label: string;
}

/**
 * "JUMP TO …" chip row from the spec's detail templates. Anchor links, so it
 * works with JS off; the click only adds the analytics event.
 */
export function JumpChips({
  targets,
  surface,
}: {
  targets: readonly JumpTarget[];
  /** Page identity for the analytics event, e.g. "eclipses". */
  surface: string;
}) {
  if (targets.length === 0) return null;
  return (
    <div className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-[1280px] items-center gap-2 overflow-x-auto px-4 py-[9px] md:px-10">
        <span className="shrink-0 text-[9.5px] font-bold tracking-[0.8px] text-sub uppercase">
          Jump to
        </span>
        {targets.map((t) => (
          <a
            key={t.id}
            href={`#${t.id}`}
            onClick={() => track("panchang_jump_chip", { surface, to: t.id })}
            className="shrink-0 rounded-full border border-border bg-bg px-[13px] py-[5px] text-[11.5px] font-bold whitespace-nowrap text-mid transition-colors hover:border-data-bd hover:bg-data-bg hover:text-data-fg"
          >
            {t.label}
          </a>
        ))}
      </div>
    </div>
  );
}
