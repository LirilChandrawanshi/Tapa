"use client";

/**
 * Media-asset image with a deity-hue fallback. Plain <img> on purpose:
 * assets come off our own immutable-cached API route, so next/image's
 * remote-loader config and re-optimization add nothing here.
 *
 * Falls back to the article's hue gradient (globals.css `.h-*` classes)
 * when there is no asset id or the fetch errors — never a broken-image glyph.
 */

import { useState } from "react";
import { mediaUrl } from "@/lib/media";

export function SmartImage({
  id,
  alt,
  hueClass,
  className = "",
  aspect = "16 / 9",
}: {
  id?: string | null;
  alt: string;
  hueClass?: string;
  className?: string;
  /** CSS aspect-ratio value, e.g. "16 / 9" or "800 / 418". */
  aspect?: string;
}) {
  const [errored, setErrored] = useState(false);

  if (!id || errored) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`w-full overflow-hidden rounded-xl ${hueClass ?? "h-earth"} ${className}`}
        style={{ aspectRatio: aspect }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={mediaUrl(id)}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setErrored(true)}
      className={`w-full overflow-hidden rounded-xl object-cover ${className}`}
      style={{ aspectRatio: aspect, maxWidth: "100%" }}
    />
  );
}

export default SmartImage;
