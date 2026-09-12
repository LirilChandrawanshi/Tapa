"use client";

import { useState } from "react";
import { mediaUrl } from "@/lib/media";

/**
 * PDP visual. Renders the product's uploaded images with a thumbnail strip
 * when there is more than one; falls back to the hue-gradient plate (the
 * Devanagari mark + item count) whenever a kit has no imagery yet, so the
 * fold never collapses and never shows a broken-image glyph.
 */
export function ProductGallery({
  imageIds,
  title,
  titleDevanagari,
  eyebrow,
  hueClass,
  itemCount,
}: {
  imageIds: string[];
  title: string;
  titleDevanagari: string;
  eyebrow: string;
  hueClass: string;
  itemCount: number;
}) {
  const [index, setIndex] = useState(0);
  const [broken, setBroken] = useState<Record<string, boolean>>({});

  const usable = imageIds.filter((id) => !broken[id]);
  const current = usable[Math.min(index, usable.length - 1)];

  if (!current) {
    return (
      <div
        className={`${hueClass} flex min-h-[260px] flex-col justify-between rounded-[18px] p-6 md:min-h-[340px]`}
      >
        <span className="self-end rounded-[5px] border border-white/30 bg-white/20 px-[9px] py-[3px] text-[9.5px] font-bold tracking-[0.4px] text-white">
          {eyebrow}
        </span>
        <div>
          <p className="font-devanagari text-[64px] leading-none text-white/95 md:text-[84px]">
            {titleDevanagari}
          </p>
          <p className="mt-3 text-[11px] font-bold tracking-[1px] text-white/70 uppercase">
            {itemCount} items · weighed and sealed separately
          </p>
        </div>
      </div>
    );
  }

  return (
    // sticky so the imagery holds while the long manifest scrolls past —
    // mock's `.gal{position:sticky;top:132px}`. Static on mobile, per the
    // same mock dropping it to `position:static` at <=900px.
    <div className="md:sticky md:top-[132px]">
      <div className="relative overflow-hidden rounded-[18px] border border-border bg-card">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={current}
          src={mediaUrl(current)}
          alt={`${title} — view ${index + 1} of ${usable.length}`}
          className="w-full object-cover"
          style={{ aspectRatio: "4 / 3" }}
          onError={() => setBroken((b) => ({ ...b, [current]: true }))}
        />
        <span className="absolute top-3 right-3 rounded-[5px] border border-white/30 bg-black/35 px-[9px] py-[3px] text-[9.5px] font-bold tracking-[0.4px] text-white backdrop-blur-sm">
          {eyebrow}
        </span>
      </div>

      {usable.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {usable.map((id, i) => (
            <button
              key={id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`View image ${i + 1}`}
              aria-current={i === index}
              className={`overflow-hidden rounded-[10px] border-2 ${
                i === index ? "border-cta" : "border-border hover:border-cta/60"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(id)}
                alt=""
                className="h-[58px] w-[58px] object-cover"
                onError={() => setBroken((b) => ({ ...b, [id]: true }))}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
