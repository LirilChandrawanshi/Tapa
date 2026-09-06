"use client";

/**
 * Spartan primitives for the internal admin panel. Compact and dense on
 * purpose — Tapa tokens, none of the consumer-site polish.
 */

import type { ReactNode } from "react";

export function Btn({
  children,
  onClick,
  kind = "default",
  disabled = false,
  title,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  kind?: "default" | "primary" | "danger" | "ghost";
  disabled?: boolean;
  title?: string;
  type?: "button" | "submit";
}) {
  const kinds: Record<string, string> = {
    default:
      "border border-border bg-card text-body hover:bg-bg",
    primary: "border border-cta bg-cta text-white hover:opacity-90",
    danger:
      "border border-bhranti-bd bg-bhranti-bg text-[#8a2040] hover:opacity-80",
    ghost: "border border-transparent text-sub hover:text-body",
  };
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-[5px] px-2.5 py-1 text-[11px] font-bold tracking-[0.3px] disabled:cursor-not-allowed disabled:opacity-40 ${kinds[kind]}`}
    >
      {children}
    </button>
  );
}

const inputCls =
  "w-full rounded-[5px] border border-border bg-card px-2 py-1 text-[12px] text-body outline-none focus:border-gold";

export function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled = false,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      disabled={disabled}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputCls} disabled:bg-bg disabled:text-sub ${className}`}
    />
  );
}

export function NumInput({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <input
      type="number"
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) =>
        onChange(e.target.value === "" ? null : Number(e.target.value))
      }
      className={`${inputCls} ${className}`}
    />
  );
}

export function TextArea({
  value,
  onChange,
  rows = 3,
  placeholder,
  mono = false,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputCls} ${mono ? "font-mono text-[11px]" : ""} ${className}`}
    />
  );
}

export function Select({
  value,
  onChange,
  options,
  allowEmpty = false,
  emptyLabel = "—",
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label?: string }[];
  allowEmpty?: boolean;
  emptyLabel?: string;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputCls} ${className}`}
    >
      {allowEmpty && <option value="">{emptyLabel}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label ?? o.value}
        </option>
      ))}
    </select>
  );
}

export function Check({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-body">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-[#fd066d]"
      />
      {label}
    </label>
  );
}

export function Field({
  label,
  children,
  hint,
  className = "",
}: {
  label: string;
  children: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-[0.8px] text-sub">
        {label}
      </span>
      {children}
      {hint && <span className="mt-0.5 block text-[10px] text-sub">{hint}</span>}
    </label>
  );
}

export function SectionCard({
  title,
  children,
  aside,
}: {
  title: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="mb-4 rounded-lg border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between border-b border-border-light pb-1.5">
        <h2 className="text-[11px] font-bold uppercase tracking-[1px] text-gold">
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Msg({
  kind,
  children,
}: {
  kind: "error" | "ok" | "warn";
  children: ReactNode;
}) {
  const cls =
    kind === "error"
      ? "border-bhranti-bd bg-bhranti-bg text-[#8a2040]"
      : kind === "warn"
        ? "border-pratha-bd bg-pratha-bg text-pratha-fg"
        : "border-dharma-bd bg-dharma-bg text-dharma-fg";
  return (
    <div className={`mb-2 rounded-[5px] border px-2.5 py-1.5 text-[12px] ${cls}`}>
      {children}
    </div>
  );
}

export function StatusPill({ status }: { status?: string }) {
  const cls =
    status === "PUBLISHED"
      ? "bg-dharma-bg text-dharma-fg border-dharma-bd"
      : status === "REVIEW"
        ? "bg-pratha-bg text-pratha-fg border-pratha-bd"
        : "bg-bg text-sub border-border";
  return (
    <span
      className={`inline-block rounded-[4px] border px-1.5 py-0.5 text-[10px] font-bold ${cls}`}
    >
      {status ?? "?"}
    </span>
  );
}

export function Table({
  headers,
  children,
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="border-b border-border bg-bg text-left">
            {headers.map((h) => (
              <th
                key={h}
                className="whitespace-nowrap px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.8px] text-sub"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export const Td = ({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) => <td className={`border-b border-border-light px-2.5 py-1.5 align-top ${className}`}>{children}</td>;

/** Right-hand slide-over used for all inline editing. */
export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        aria-label="Close"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />
      <div className="relative flex h-full w-full max-w-[520px] flex-col border-l border-border bg-bg shadow-xl">
        <div className="flex items-center justify-between border-b border-border bg-card px-3 py-2">
          <h3 className="text-[12px] font-bold uppercase tracking-[1px] text-gold">
            {title}
          </h3>
          <Btn kind="ghost" onClick={onClose}>
            ✕ Close
          </Btn>
        </div>
        <div className="flex-1 overflow-y-auto p-3">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-border bg-card px-3 py-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function PageHead({
  title,
  aside,
}: {
  title: string;
  aside?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h1 className="text-[15px] font-bold text-ink">{title}</h1>
      <div className="flex items-center gap-2">{aside}</div>
    </div>
  );
}

export function Loading() {
  return <p className="py-8 text-center text-[12px] text-sub">Loading…</p>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-8 text-center text-[12px] text-sub">{children}</p>;
}
