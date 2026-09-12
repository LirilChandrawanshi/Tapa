import Link from "next/link";
import type { ReactNode } from "react";
import { MythStrip } from "@/components/MythStrip";

export type DeityHue =
  | "teej"
  | "krishna"
  | "shiva"
  | "ganesh"
  | "devi"
  | "vishnu"
  | "earth"
  | "thread"
  | "data"
  | "sanskar"
  | "gold";

export function ContentCard({
  hue,
  href = "#",
  topLeft,
  topRight,
  title,
  meta,
  summary,
  pills,
  readTime,
  myth,
}: {
  hue: DeityHue;
  href?: string;
  /** Slot at the top-left of the hue header — usually a CountdownPill. */
  topLeft?: ReactNode;
  /** Small uppercase tag at the top-right of the hue header, e.g. "LIVE". */
  topRight?: string;
  title: string;
  /** Gold meta line under the title, e.g. "13 September". */
  meta?: string;
  summary: string;
  /** Pills row — Pill / DpbBadge elements. */
  pills?: ReactNode;
  /** e.g. "9 min" — right-aligned in the footer row. */
  readTime?: string;
  /** Bhranti this card corrects — renders a MythStrip at the foot. */
  myth?: string;
}) {
  return (
    <Link
      href={href}
      className="group hover-lift reveal flex flex-col overflow-hidden rounded-[15px] border border-border bg-card hover:border-cta"
    >
      <div
        className={`h-${hue} flex h-[100px] items-start justify-between p-[13px]`}
      >
        <span>{topLeft}</span>
        {topRight && (
          <span className="rounded-[5px] border border-white/30 bg-white/20 px-[9px] py-[3px] text-[9.5px] font-bold tracking-[0.4px] text-white">
            {topRight}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-[17px] pt-[15px] pb-[17px]">
        <h3 className="mb-[5px] text-[16.5px] leading-snug font-bold text-ink">
          {title}
        </h3>
        {meta && (
          <p className="mb-[9px] text-[11.5px] font-semibold text-gold">
            {meta}
          </p>
        )}
        <p className="mb-[13px] flex-1 text-[12.5px] leading-relaxed text-sub">
          {summary}
        </p>
        <div className="flex flex-wrap items-center gap-[7px]">
          {pills}
          {readTime && (
            <span className="ml-auto text-[11px] text-sub">{readTime}</span>
          )}
        </div>
      </div>
      {myth && <MythStrip myth={myth} />}
    </Link>
  );
}
