"use client";

/** Generic chip row — controlled; parent owns the active key. */
export function FilterChips<K extends string>({
  options,
  active,
  onChange,
  counts,
}: {
  options: readonly { key: K; label: string }[];
  active: K;
  onChange: (key: K) => void;
  /** Optional per-key result counts, shown muted after the label. */
  counts?: Partial<Record<K, number>>;
}) {
  return (
    <div
      role="group"
      aria-label="Filter observances"
      className="flex flex-wrap gap-2"
    >
      {options.map((opt) => {
        const on = opt.key === active;
        const count = counts?.[opt.key];
        return (
          <button
            key={opt.key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(opt.key)}
            className={`rounded-full border px-[13px] py-[6px] text-[12px] font-bold transition-colors ${
              on
                ? "border-data-fg bg-data-fg text-white"
                : "border-border bg-card text-mid hover:border-data-bd hover:bg-data-bg"
            }`}
          >
            {opt.label}
            {typeof count === "number" && (
              <span className={`ml-[6px] font-medium ${on ? "text-white/70" : "text-sub"}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
