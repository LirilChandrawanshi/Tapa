"use client";

import { useRef, type ReactNode } from "react";
import { track } from "@/lib/analytics";

/**
 * A <details> that logs `intelligence_layer_opened` the first time it opens.
 * The summary/body stay server-rendered and arrive as children.
 */
export function TrackedDetails({
  slug,
  className,
  children,
}: {
  slug: string;
  className?: string;
  children: ReactNode;
}) {
  const opened = useRef(false);
  return (
    <details
      className={className}
      onToggle={(e) => {
        if (e.currentTarget.open && !opened.current) {
          opened.current = true;
          track("intelligence_layer_opened", { slug });
        }
      }}
    >
      {children}
    </details>
  );
}
