import type { ReactNode } from "react";

export type PillVariant = "dharma" | "pratha" | "bhranti" | "data" | "default";

const VARIANT_CLASSES: Record<PillVariant, string> = {
  dharma: "bg-dharma-bg text-dharma-fg border-dharma-bd",
  pratha: "bg-pratha-bg text-pratha-fg border-pratha-bd",
  bhranti: "bg-bhranti-bg text-bhranti-fg border-bhranti-bd",
  data: "bg-data-bg text-data-fg border-data-bd",
  default: "bg-bg text-sub border-border",
};

export function Pill({
  variant = "default",
  children,
  className = "",
}: {
  variant?: PillVariant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-[5px] border px-[9px] py-[3px] text-[10px] font-bold tracking-[0.4px] ${VARIANT_CLASSES[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
