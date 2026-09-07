"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import type { SamagriItem } from "@/lib/types";

/**
 * Samagri checklist — native checkboxes persisted in sessionStorage per
 * article slug, with a Download-PDF + WhatsApp-share footer row.
 */
export function SamagriChecklist({
  slug,
  title,
  items,
}: {
  slug: string;
  title: string;
  items: SamagriItem[];
}) {
  const storageKey = `tapa-samagri-${slug}`;
  const [checked, setChecked] = useState<boolean[]>(() =>
    items.map(() => false),
  );

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      const saved: unknown = JSON.parse(raw);
      if (Array.isArray(saved)) {
        setChecked(items.map((_, i) => saved[i] === true));
      }
    } catch {
      /* corrupt storage — start fresh */
    }
  }, [storageKey, items]);

  function toggle(index: number) {
    setChecked((prev) => {
      const next = prev.map((v, i) => (i === index ? !v : v));
      if (next[index]) {
        track("samagri_item_checked", { slug, item: items[index]?.name });
      }
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        /* private mode — checklist still works for the session in memory */
      }
      return next;
    });
  }

  function waShareHref() {
    const lines = [
      `${title} — samagri checklist`,
      ...items.map((it) => `• ${it.name}${it.optional ? " (optional)" : ""}`),
      typeof window !== "undefined" ? window.location.href : "",
    ];
    return `https://wa.me/?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  const done = checked.filter(Boolean).length;

  return (
    <div className="overflow-hidden rounded-[15px] border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border-light px-[18px] py-3">
        <span className="text-[12.5px] font-bold text-ink">Checklist</span>
        <span className="text-[11.5px] text-sub">
          {done} / {items.length}
        </span>
      </div>
      {items.map((item, i) => (
        <label
          key={`${item.name}-${i}`}
          className={`flex cursor-pointer items-baseline gap-[14px] border-b-[0.5px] border-border-light px-[18px] py-3 last:border-b-0 hover:bg-[#FCFAF6] ${
            item.optional ? "opacity-70" : ""
          }`}
        >
          <input
            type="checkbox"
            checked={checked[i] ?? false}
            onChange={() => toggle(i)}
            className="relative top-[2px] size-4 shrink-0 accent-cta"
          />
          <span
            className={`flex-[0_0_44%] text-[13.5px] font-semibold text-ink ${
              checked[i] ? "line-through opacity-60" : ""
            }`}
          >
            {item.name}
            {item.optional && (
              <span className="ml-2 align-middle text-[10px] font-bold tracking-[0.4px] text-sub">
                OPTIONAL
              </span>
            )}
          </span>
          <span className="flex-1 text-[12.5px] leading-relaxed text-sub">
            {item.note || "—"}
          </span>
        </label>
      ))}
      <div className="flex gap-2 border-t border-border px-[14px] py-[9px]">
        <a
          href={`/api/v1/cards/${slug}.pdf`}
          onClick={() => track("samagri_downloaded", { slug })}
          className="flex-1 rounded-lg border-[1.5px] border-border bg-card py-[9px] text-center text-[11.5px] font-semibold text-ink hover:border-cta"
        >
          ↓ Download PDF
        </a>
        <a
          href={waShareHref()}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track("samagri_whatsapp_shared", { slug })}
          className="flex-1 rounded-lg bg-wa py-[9px] text-center text-[11.5px] font-semibold text-white"
        >
          Send to WhatsApp
        </a>
      </div>
    </div>
  );
}
