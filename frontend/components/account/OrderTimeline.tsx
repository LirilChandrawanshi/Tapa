"use client";

/**
 * 4-step order journey: Pre-booked/Confirmed → Packing → Dispatched → Delivered.
 * Cancelled / refund states render a single quiet strip instead — a refund is
 * not a failure state, so no alarm colors.
 */

import { statusMeta, timelineSteps, type OrderView } from "@/lib/orders";

export function OrderTimeline({ order }: { order: OrderView }) {
  const meta = statusMeta(order.status);

  if (meta.step === null) {
    return (
      <div className="rounded-xl border border-border bg-bg px-4 py-3">
        <p className="text-[13.5px] font-bold text-body">{meta.label}</p>
        {order.statusNote && (
          <p className="mt-[2px] text-[12.5px] text-sub">{order.statusNote}</p>
        )}
      </div>
    );
  }

  const steps = timelineSteps(Boolean(order.festivalDate));
  const current = meta.step;

  return (
    <ol className="flex items-start" aria-label="Order progress">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="relative flex-1 text-center">
            {/* connector to the previous step */}
            {i > 0 && (
              <span
                aria-hidden
                className={`absolute right-1/2 top-[10px] h-[2px] w-full ${
                  i <= current ? "bg-cta" : "bg-border"
                }`}
              />
            )}
            <span
              aria-hidden
              className={`relative z-10 mx-auto flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                done
                  ? "border-cta bg-cta text-white"
                  : active
                    ? "border-cta bg-card text-cta"
                    : "border-border bg-card text-sub"
              }`}
            >
              {done ? "✓" : i + 1}
            </span>
            <span
              className={`mt-1.5 block text-[10.5px] font-bold tracking-[0.3px] ${
                active ? "text-cta" : done ? "text-body" : "text-sub"
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
