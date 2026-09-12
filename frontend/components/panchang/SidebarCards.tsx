import Link from "next/link";
import type { ReactNode } from "react";

/**
 * The spec's `.sbcta` / `.sbd` / `.sb-int` sidebar blocks, shared by all
 * three panchang detail templates.
 */

type CtaTone = "pink" | "dark" | "wa" | "data";

const TONE: Record<CtaTone, string> = {
  pink: "bg-cta text-white border-cta",
  dark: "bg-ink text-white border-ink",
  wa: "bg-wa text-white border-wa",
  data: "bg-data-fg text-white border-data-fg",
};

/**
 * Full-width sidebar call to action: icon, title, sub-line. Renders as a
 * link when `href` is given and as a plain block otherwise (so a disabled
 * "opens later" state needs no fake anchor).
 */
export function SidebarCta({
  icon,
  title,
  note,
  href,
  tone = "data",
}: {
  icon: ReactNode;
  title: string;
  note?: string;
  href?: string;
  tone?: CtaTone;
}) {
  const body = (
    <>
      <span aria-hidden className="mb-[6px] block text-[19px] leading-none">
        {icon}
      </span>
      <span className="block text-[13.5px] leading-snug font-bold">
        {title}
      </span>
      {note && (
        <span className="mt-[3px] block text-[11px] leading-snug opacity-80">
          {note}
        </span>
      )}
    </>
  );
  const cls = `block rounded-[13px] border px-[17px] py-[15px] text-left ${TONE[tone]}`;
  if (!href) return <div className={`${cls} opacity-60`}>{body}</div>;
  return (
    <Link href={href} className={`${cls} transition-opacity hover:opacity-90`}>
      {body}
    </Link>
  );
}

export interface GlanceRow {
  key: string;
  value: ReactNode;
}

/** "AT A GLANCE" key/value table. */
export function AtAGlance({
  heading = "At a glance",
  rows,
}: {
  heading?: string;
  rows: readonly GlanceRow[];
}) {
  if (rows.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-[13px] border border-border bg-card">
      <p className="border-b border-border bg-bg px-[17px] py-[9px] text-[9.5px] font-bold tracking-[0.9px] text-sub uppercase">
        {heading}
      </p>
      <dl className="divide-y divide-border-light">
        {rows.map((r) => (
          <div
            key={r.key}
            className="flex items-baseline justify-between gap-3 px-[17px] py-[9px]"
          >
            <dt className="text-[11.5px] text-sub">{r.key}</dt>
            <dd className="text-right text-[12px] font-bold text-ink">
              {r.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * "◗ INTELLIGENCE LAYER" card — the spec's device for pointing at the rule
 * that generalises beyond this one date.
 */
export function IntelligenceCard({
  children,
  href,
  cta,
}: {
  children: ReactNode;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="rounded-[13px] border border-pratha-bd bg-pratha-bg px-[17px] py-4">
      <p className="mb-[6px] text-[9.5px] font-bold tracking-[0.9px] text-pratha-fg uppercase">
        ◗ Intelligence layer
      </p>
      <p className="text-[12px] leading-relaxed text-pratha-fg">{children}</p>
      {href && cta && (
        <Link
          href={href}
          className="mt-2 inline-block text-[11.5px] font-bold text-cta"
        >
          {cta}
        </Link>
      )}
    </div>
  );
}
