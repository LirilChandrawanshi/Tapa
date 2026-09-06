"use client";

/**
 * Puja detail body (P4-M2) — variant selector, vidhi preview, samagri row
 * and the continue CTA. Client island because the variant choice must ride
 * into the booking wizard's query string.
 */

import Link from "next/link";
import { useState } from "react";
import {
  formatPaise,
  slotsHint,
  type PujaType,
  type TimeSlot,
} from "@/lib/booking";

export function PujaDetail({
  puja,
  slots,
}: {
  puja: PujaType;
  slots: TimeSlot[];
}) {
  const [variantKey, setVariantKey] = useState(
    puja.variants[0]?.key ?? "standard",
  );
  const [samagriOpen, setSamagriOpen] = useState(false);

  const variant =
    puja.variants.find((v) => v.key === variantKey) ?? puja.variants[0];

  return (
    <div className="mx-auto max-w-[720px] px-4 py-7 md:px-6">
      {/* season banner for annual pujas */}
      {puja.annual && puja.seasonNote && (
        <div className="mb-5 flex items-start gap-3 rounded-[12px] border border-amber/50 bg-amber/10 px-4 py-3">
          <span aria-hidden className="text-[16px]">
            🗓️
          </span>
          <p className="text-[13px] leading-relaxed text-body">
            <b>Annual puja.</b> {puja.seasonNote}
          </p>
        </div>
      )}

      {/* variant selector */}
      <section aria-label="Choose your variant">
        <h2 className="mb-3 text-[15px] font-bold text-ink">
          Choose your variant
        </h2>
        <div
          role="radiogroup"
          aria-label="Puja variant"
          className="grid gap-3 sm:grid-cols-2"
        >
          {puja.variants.map((v) => {
            const on = v.key === variantKey;
            return (
              <button
                key={v.key}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setVariantKey(v.key)}
                className={`rounded-[13px] border-2 bg-card p-4 text-left transition-colors ${
                  on ? "border-cta" : "border-border hover:border-sub"
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-[14.5px] font-bold text-ink">
                    {v.name}
                  </span>
                  <span
                    aria-hidden
                    className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border-2 ${
                      on ? "border-cta" : "border-border"
                    }`}
                  >
                    {on && (
                      <span className="h-[9px] w-[9px] rounded-full bg-cta" />
                    )}
                  </span>
                </span>
                <span className="mt-1 block text-[12px] text-sub">
                  {v.duration} · {v.scope}
                </span>
                <span
                  className={`mt-2 block text-[16px] font-bold ${on ? "text-cta" : "text-ink"}`}
                >
                  {formatPaise(v.pricePaise)}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[12px] text-sub">
          Bookable {slotsHint(puja.allowedSlots, slots).toLowerCase()} ·
          inclusive of all charges — no dakshina pressure at the door.
        </p>
      </section>

      {/* vidhi preview */}
      <section className="mt-7" aria-label="Vidhi overview">
        <h2 className="mb-2 text-[15px] font-bold text-ink">Vidhi overview</h2>
        <p className="mb-4 text-[13.5px] leading-relaxed text-body">
          {puja.vidhiOverview}
        </p>
        <ol className="space-y-[10px]">
          {puja.vidhiPreviewSteps.map((step, i) => (
            <li
              key={step}
              className="flex items-start gap-3 text-[13px] leading-relaxed text-body"
            >
              <span className="mt-[1px] flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber/25 text-[10.5px] font-bold text-gold">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      {/* samagri row — expandable, with the (fixed) include-kit toggle */}
      <section className="mt-7 rounded-[13px] border border-border bg-card">
        <button
          type="button"
          aria-expanded={samagriOpen}
          onClick={() => setSamagriOpen((v) => !v)}
          className="flex w-full items-center gap-3 px-4 py-[13px] text-left"
        >
          <span aria-hidden>🌿</span>
          <span className="flex-1 text-[13.5px] font-bold text-ink">
            {puja.kitIncludedDefault
              ? "Samagri included"
              : "Samagri — bring your own"}
          </span>
          <span
            aria-hidden
            className={`text-[11px] text-sub transition-transform ${samagriOpen ? "rotate-180" : ""}`}
          >
            ▼
          </span>
        </button>
        {samagriOpen && (
          <div className="border-t border-border-light px-4 py-3">
            <p className="text-[13px] leading-relaxed text-body">
              {puja.kitNote}
            </p>
            <label className="mt-3 flex cursor-not-allowed items-center gap-2 text-[12.5px] text-body opacity-80">
              <input
                type="checkbox"
                checked={puja.kitIncludedDefault}
                disabled
                readOnly
                className="accent-[#fd066d]"
              />
              Include samagri kit
            </label>
            <p className="mt-1.5 text-[11.5px] text-sub">
              Price unchanged in Phase 4 — the kit is part of the seva.
            </p>
          </div>
        )}
      </section>

      {/* free-guide cross-link */}
      {puja.linkedGuideSlug && (
        <p className="mt-4 text-[13px] text-body">
          Want to understand the vidhi first?{" "}
          <Link
            href={`/ritual-guides/all/${puja.linkedGuideSlug}`}
            className="font-bold text-cta hover:underline"
          >
            Read the free guide ›
          </Link>{" "}
          <span className="text-sub">
            You never need a booking to know the ritual.
          </span>
        </p>
      )}

      {/* continue CTA */}
      <div className="mt-7 border-t border-border pt-5">
        <Link
          href={`/pujan-with-purohit/${puja.slug}/book?variant=${encodeURIComponent(variant?.key ?? "")}`}
          className="block w-full rounded-[11px] bg-cta px-6 py-[13px] text-center text-[14.5px] font-bold text-white hover:opacity-90"
        >
          Continue — select purohit ›
        </Link>
        {variant && (
          <p className="mt-2 text-center text-[12px] text-sub">
            {puja.name} · {variant.name} · {formatPaise(variant.pricePaise)} —
            you pay only after choosing the purohit and slot.
          </p>
        )}
      </div>
    </div>
  );
}
