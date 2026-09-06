"use client";

/**
 * Admin · Purohits (P4-M2). Two sections on one page:
 *   1. The purohit roster — table + edit drawer, new-purohit flow, delete.
 *   2. The bookable puja types — list + edit drawer (variants with rupee
 *      inputs, allowed slots, kit default, active toggle).
 *
 * Loose types on purpose — the backend owns validation, the editor
 * round-trips documents (same contract as the rest of the admin).
 */

import { useCallback, useEffect, useState } from "react";
import { adminDelete, adminGet, adminPut } from "@/lib/admin";
import { FALLBACK_SLOTS, formatPaise } from "@/lib/booking";
import {
  Btn,
  Check,
  Drawer,
  Empty,
  Field,
  Input,
  Loading,
  Msg,
  NumInput,
  PageHead,
  SectionCard,
  Table,
  Td,
  TextArea,
} from "@/components/admin/ui";

/* ---------- shapes ---------- */

interface AdminPurohit {
  id?: string;
  slug?: string;
  name?: string;
  phone?: string;
  rating?: number | null;
  pujaCount?: number | null;
  languages?: string[];
  pujaTypeSlugs?: string[];
  cities?: string[];
  unavailableDates?: string[];
  unavailableSlots?: string[];
  verified?: boolean;
  active?: boolean;
  lineageNote?: string;
  [key: string]: unknown;
}

interface AdminPujaVariant {
  key?: string;
  name?: string;
  duration?: string;
  scope?: string;
  pricePaise?: number | null;
}

interface AdminPuja {
  id?: string;
  slug?: string;
  name?: string;
  nameHi?: string;
  description?: string;
  vidhiOverview?: string;
  vidhiPreviewSteps?: string[];
  hueClass?: string;
  variants?: AdminPujaVariant[];
  allowedSlots?: string[];
  kitIncludedDefault?: boolean;
  kitNote?: string;
  annual?: boolean;
  seasonNote?: string | null;
  linkedGuideSlug?: string | null;
  active?: boolean;
  [key: string]: unknown;
}

/** The admin list endpoints may answer with a bare array or {items}. */
function toList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const items = (data as { items?: unknown }).items;
    if (Array.isArray(items)) return items as T[];
  }
  return [];
}

const csv = (list?: string[]): string => (list ?? []).join(", ");
const fromCsv = (s: string): string[] =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

function OnOffPill({ on, yes, no }: { on?: boolean; yes: string; no: string }) {
  return (
    <span
      className={`inline-block rounded-[4px] border px-1.5 py-0.5 text-[10px] font-bold ${
        on
          ? "border-dharma-bd bg-dharma-bg text-dharma-fg"
          : "border-border bg-bg text-sub"
      }`}
    >
      {on ? yes : no}
    </span>
  );
}

/* ================================ page ================================ */

export default function AdminPurohitsPage() {
  const [purohits, setPurohits] = useState<AdminPurohit[] | null>(null);
  const [pujas, setPujas] = useState<AdminPuja[] | null>(null);
  const [error, setError] = useState("");
  const [openPurohit, setOpenPurohit] = useState<AdminPurohit | null>(null);
  const [openPuja, setOpenPuja] = useState<AdminPuja | null>(null);

  const load = useCallback(async () => {
    setError("");
    const [pRes, tRes] = await Promise.all([
      adminGet<unknown>("/purohits"),
      adminGet<unknown>("/pujas"),
    ]);
    if (pRes.ok) setPurohits(toList<AdminPurohit>(pRes.data));
    else setError(pRes.message);
    if (tRes.ok) setPujas(toList<AdminPuja>(tRes.data));
    else if (pRes.ok) setError(tRes.message);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <PageHead
        title="Purohits"
        aside={
          <Btn
            kind="primary"
            onClick={() =>
              setOpenPurohit({
                slug: "",
                name: "",
                phone: "",
                rating: null,
                pujaCount: 0,
                languages: [],
                pujaTypeSlugs: [],
                cities: ["Delhi NCR"],
                unavailableDates: [],
                unavailableSlots: [],
                verified: false,
                active: true,
                lineageNote: "",
              })
            }
          >
            + New purohit
          </Btn>
        }
      />

      {error && <Msg kind="error">{error}</Msg>}
      {!purohits && !error && <Loading />}
      {purohits && purohits.length === 0 && <Empty>No purohits yet.</Empty>}
      {purohits && purohits.length > 0 && (
        <Table
          headers={[
            "Name",
            "Rating",
            "Pujas",
            "Languages",
            "Cities",
            "Verified",
            "Active",
          ]}
        >
          {purohits.map((p) => (
            <tr
              key={p.slug}
              className="cursor-pointer hover:bg-bg"
              onClick={() => setOpenPurohit(p)}
            >
              <Td className="font-bold">
                {p.name ?? p.slug}
                <span className="block font-mono text-[10px] font-normal text-sub">
                  {p.slug}
                </span>
              </Td>
              <Td>{p.rating != null ? `★ ${p.rating}` : "—"}</Td>
              <Td>{p.pujaCount ?? 0}</Td>
              <Td className="max-w-[160px]">{csv(p.languages) || "—"}</Td>
              <Td className="max-w-[140px]">{csv(p.cities) || "—"}</Td>
              <Td>
                <OnOffPill on={p.verified} yes="VERIFIED" no="PENDING" />
              </Td>
              <Td>
                <OnOffPill on={p.active} yes="ACTIVE" no="OFF" />
              </Td>
            </tr>
          ))}
        </Table>
      )}

      {/* ---------- puja types ---------- */}
      <div className="mt-6">
        <SectionCard title="Puja types">
          {!pujas && <Loading />}
          {pujas && pujas.length === 0 && <Empty>No puja types yet.</Empty>}
          {pujas && pujas.length > 0 && (
            <Table
              headers={["Puja", "Variants", "Slots", "Kit default", "Active"]}
            >
              {pujas.map((t) => (
                <tr
                  key={t.slug}
                  className="cursor-pointer hover:bg-bg"
                  onClick={() => setOpenPuja(t)}
                >
                  <Td className="font-bold">
                    {t.name ?? t.slug}
                    <span className="block font-mono text-[10px] font-normal text-sub">
                      {t.slug}
                    </span>
                  </Td>
                  <Td className="max-w-[240px]">
                    {(t.variants ?? [])
                      .map(
                        (v) =>
                          `${v.name ?? v.key} ${formatPaise(v.pricePaise ?? 0)}`,
                      )
                      .join(" · ") || "—"}
                  </Td>
                  <Td className="max-w-[160px]">{csv(t.allowedSlots) || "—"}</Td>
                  <Td>
                    <OnOffPill
                      on={t.kitIncludedDefault}
                      yes="INCLUDED"
                      no="OPTIONAL"
                    />
                  </Td>
                  <Td>
                    <OnOffPill on={t.active} yes="ACTIVE" no="OFF" />
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </SectionCard>
      </div>

      <Drawer
        open={openPurohit !== null}
        onClose={() => setOpenPurohit(null)}
        title={openPurohit?.name || "New purohit"}
      >
        {openPurohit && (
          <PurohitEditor
            initial={openPurohit}
            pujas={pujas ?? []}
            onSaved={() => {
              setOpenPurohit(null);
              void load();
            }}
            onDeleted={() => {
              setOpenPurohit(null);
              void load();
            }}
          />
        )}
      </Drawer>

      <Drawer
        open={openPuja !== null}
        onClose={() => setOpenPuja(null)}
        title={openPuja?.name || "Puja type"}
      >
        {openPuja && (
          <PujaEditor
            initial={openPuja}
            onSaved={() => {
              setOpenPuja(null);
              void load();
            }}
          />
        )}
      </Drawer>
    </div>
  );
}

/* ============================ purohit drawer ============================ */

function PurohitEditor({
  initial,
  pujas,
  onSaved,
  onDeleted,
}: {
  initial: AdminPurohit;
  pujas: AdminPuja[];
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const isNew = !initial.slug;
  const [doc, setDoc] = useState<AdminPurohit>({ ...initial });
  const [languages, setLanguages] = useState(csv(initial.languages));
  const [cities, setCities] = useState(csv(initial.cities));
  const [dates, setDates] = useState(csv(initial.unavailableDates));
  const [busy, setBusy] = useState(false);
  const [armDelete, setArmDelete] = useState(false);
  const [error, setError] = useState("");

  const set = (patch: Partial<AdminPurohit>) =>
    setDoc((d) => ({ ...d, ...patch }));

  const toggleIn = (key: "pujaTypeSlugs" | "unavailableSlots", value: string) =>
    setDoc((d) => {
      const list = d[key] ?? [];
      return {
        ...d,
        [key]: list.includes(value)
          ? list.filter((x) => x !== value)
          : [...list, value],
      };
    });

  async function save() {
    const slug = (doc.slug ?? "").trim();
    if (!slug) {
      setError("A slug is required (e.g. pt-suresh-sharma).");
      return;
    }
    setBusy(true);
    setError("");
    const res = await adminPut<AdminPurohit>(
      `/purohits/${encodeURIComponent(slug)}`,
      {
        ...doc,
        slug,
        languages: fromCsv(languages),
        cities: fromCsv(cities),
        unavailableDates: fromCsv(dates),
      },
    );
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    onSaved();
  }

  async function remove() {
    if (!armDelete) {
      setArmDelete(true);
      return;
    }
    setBusy(true);
    setError("");
    const res = await adminDelete<unknown>(
      `/purohits/${encodeURIComponent(doc.slug ?? "")}`,
    );
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      setArmDelete(false);
      return;
    }
    onDeleted();
  }

  return (
    <div>
      {error && <Msg kind="error">{error}</Msg>}

      <div className="grid grid-cols-2 gap-2">
        <Field label="Slug" hint={isNew ? "kebab-case, permanent" : undefined}>
          <Input
            value={doc.slug ?? ""}
            onChange={(v) => set({ slug: v })}
            disabled={!isNew}
            placeholder="pt-suresh-sharma"
          />
        </Field>
        <Field label="Name">
          <Input
            value={doc.name ?? ""}
            onChange={(v) => set({ name: v })}
            placeholder="Pt. Suresh Sharma"
          />
        </Field>
        <Field label="Phone">
          <Input
            value={doc.phone ?? ""}
            onChange={(v) => set({ phone: v })}
            placeholder="+919999999999"
          />
        </Field>
        <Field label="Rating">
          <NumInput
            value={doc.rating}
            onChange={(v) => set({ rating: v })}
            placeholder="4.8"
          />
        </Field>
        <Field label="Puja count">
          <NumInput
            value={doc.pujaCount}
            onChange={(v) => set({ pujaCount: v })}
            placeholder="0"
          />
        </Field>
        <Field label="Languages" hint="comma-separated">
          <Input
            value={languages}
            onChange={setLanguages}
            placeholder="Hindi, Sanskrit"
          />
        </Field>
        <Field label="Cities" hint="comma-separated" className="col-span-2">
          <Input value={cities} onChange={setCities} placeholder="Delhi NCR" />
        </Field>
        <Field label="Lineage note" className="col-span-2">
          <Input
            value={doc.lineageNote ?? ""}
            onChange={(v) => set({ lineageNote: v })}
            placeholder="Kashi-trained · 3rd generation"
          />
        </Field>
      </div>

      <div className="mt-3">
        <Field
          label="Puja types"
          hint="which pujas this purohit performs"
        >
          <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-[5px] border border-border bg-card p-2">
            {pujas.length === 0 && (
              <span className="text-[11px] text-sub">No puja types loaded.</span>
            )}
            {pujas.map((t) => (
              <Check
                key={t.slug}
                checked={(doc.pujaTypeSlugs ?? []).includes(t.slug ?? "")}
                onChange={() => toggleIn("pujaTypeSlugs", t.slug ?? "")}
                label={t.name ?? t.slug ?? "?"}
              />
            ))}
          </div>
        </Field>
      </div>

      <div className="mt-3">
        <Field
          label="Unavailable dates"
          hint="comma-separated YYYY-MM-DD — days off, leave"
        >
          <TextArea
            value={dates}
            onChange={setDates}
            rows={2}
            placeholder="2026-09-15, 2026-09-16"
            mono
          />
        </Field>
      </div>

      <div className="mt-3">
        <Field
          label="Unavailable slots"
          hint="standing windows this purohit never takes"
        >
          <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-[5px] border border-border bg-card p-2">
            {FALLBACK_SLOTS.map((s) => (
              <Check
                key={s.key}
                checked={(doc.unavailableSlots ?? []).includes(s.key)}
                onChange={() => toggleIn("unavailableSlots", s.key)}
                label={`${s.label} (${s.window})`}
              />
            ))}
          </div>
        </Field>
      </div>

      <div className="mt-3 flex gap-4">
        <Check
          checked={doc.verified ?? false}
          onChange={(v) => set({ verified: v })}
          label="Verified in person"
        />
        <Check
          checked={doc.active ?? false}
          onChange={(v) => set({ active: v })}
          label="Active (bookable)"
        />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-border-light pt-3">
        {!isNew ? (
          <Btn kind="danger" disabled={busy} onClick={() => void remove()}>
            {armDelete ? "Really delete? Click again" : "Delete purohit"}
          </Btn>
        ) : (
          <span />
        )}
        <Btn kind="primary" disabled={busy} onClick={() => void save()}>
          {busy ? "Saving…" : "Save purohit"}
        </Btn>
      </div>
    </div>
  );
}

/* ============================= puja drawer ============================= */

const SLOT_OPTIONS = FALLBACK_SLOTS;

function PujaEditor({
  initial,
  onSaved,
}: {
  initial: AdminPuja;
  onSaved: () => void;
}) {
  const [doc, setDoc] = useState<AdminPuja>({
    ...initial,
    variants: (initial.variants ?? []).map((v) => ({ ...v })),
  });
  const [steps, setSteps] = useState(
    (initial.vidhiPreviewSteps ?? []).join("\n"),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (patch: Partial<AdminPuja>) => setDoc((d) => ({ ...d, ...patch }));

  const setVariant = (i: number, patch: Partial<AdminPujaVariant>) =>
    setDoc((d) => ({
      ...d,
      variants: (d.variants ?? []).map((v, j) =>
        j === i ? { ...v, ...patch } : v,
      ),
    }));

  const toggleSlot = (key: string) =>
    setDoc((d) => {
      const list = d.allowedSlots ?? [];
      return {
        ...d,
        allowedSlots: list.includes(key)
          ? list.filter((x) => x !== key)
          : [...list, key],
      };
    });

  async function save() {
    setBusy(true);
    setError("");
    const res = await adminPut<AdminPuja>(
      `/pujas/${encodeURIComponent(doc.slug ?? "")}`,
      {
        ...doc,
        vidhiPreviewSteps: steps
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      },
    );
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    onSaved();
  }

  return (
    <div>
      {error && <Msg kind="error">{error}</Msg>}

      <div className="grid grid-cols-2 gap-2">
        <Field label="Name">
          <Input value={doc.name ?? ""} onChange={(v) => set({ name: v })} />
        </Field>
        <Field label="Name (हिं)">
          <Input value={doc.nameHi ?? ""} onChange={(v) => set({ nameHi: v })} />
        </Field>
        <Field label="Hue class">
          <Input
            value={doc.hueClass ?? ""}
            onChange={(v) => set({ hueClass: v })}
            placeholder="h-shiva"
          />
        </Field>
        <Field label="Linked guide slug">
          <Input
            value={doc.linkedGuideSlug ?? ""}
            onChange={(v) => set({ linkedGuideSlug: v || null })}
          />
        </Field>
      </div>

      <div className="mt-2 space-y-2">
        <Field label="Description">
          <TextArea
            value={doc.description ?? ""}
            onChange={(v) => set({ description: v })}
            rows={2}
          />
        </Field>
        <Field label="Vidhi overview">
          <TextArea
            value={doc.vidhiOverview ?? ""}
            onChange={(v) => set({ vidhiOverview: v })}
            rows={3}
          />
        </Field>
        <Field label="Vidhi preview steps" hint="one step per line">
          <TextArea value={steps} onChange={setSteps} rows={4} />
        </Field>
        <Field label="Kit note">
          <TextArea
            value={doc.kitNote ?? ""}
            onChange={(v) => set({ kitNote: v })}
            rows={2}
          />
        </Field>
        <Field label="Season note" hint="shown for annual pujas">
          <Input
            value={doc.seasonNote ?? ""}
            onChange={(v) => set({ seasonNote: v || null })}
          />
        </Field>
      </div>

      {/* variants */}
      <div className="mt-3">
        <Field label="Variants" hint="prices in rupees; stored as paise">
          <div className="space-y-1.5 rounded-[5px] border border-border bg-card p-2">
            {(doc.variants ?? []).map((v, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_1fr_1fr_1fr_84px_24px] items-center gap-1.5"
              >
                <Input
                  value={v.key ?? ""}
                  onChange={(x) => setVariant(i, { key: x })}
                  placeholder="key"
                />
                <Input
                  value={v.name ?? ""}
                  onChange={(x) => setVariant(i, { name: x })}
                  placeholder="Name"
                />
                <Input
                  value={v.duration ?? ""}
                  onChange={(x) => setVariant(i, { duration: x })}
                  placeholder="45 min"
                />
                <Input
                  value={v.scope ?? ""}
                  onChange={(x) => setVariant(i, { scope: x })}
                  placeholder="core vidhi"
                />
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-sub">₹</span>
                  <NumInput
                    value={
                      v.pricePaise == null ? null : Math.round(v.pricePaise) / 100
                    }
                    onChange={(x) =>
                      setVariant(i, {
                        pricePaise: x == null ? null : Math.round(x * 100),
                      })
                    }
                    placeholder="7100"
                  />
                </div>
                <button
                  type="button"
                  title="Remove variant"
                  onClick={() =>
                    setDoc((d) => ({
                      ...d,
                      variants: (d.variants ?? []).filter((_, j) => j !== i),
                    }))
                  }
                  className="text-[12px] text-sub hover:text-body"
                >
                  ✕
                </button>
              </div>
            ))}
            <Btn
              onClick={() =>
                setDoc((d) => ({
                  ...d,
                  variants: [
                    ...(d.variants ?? []),
                    { key: "", name: "", duration: "", scope: "", pricePaise: 0 },
                  ],
                }))
              }
            >
              + Add variant
            </Btn>
          </div>
        </Field>
      </div>

      <div className="mt-3">
        <Field label="Allowed slots">
          <div className="flex flex-wrap gap-x-4 gap-y-1 rounded-[5px] border border-border bg-card p-2">
            {SLOT_OPTIONS.map((s) => (
              <Check
                key={s.key}
                checked={(doc.allowedSlots ?? []).includes(s.key)}
                onChange={() => toggleSlot(s.key)}
                label={`${s.label} (${s.window})`}
              />
            ))}
          </div>
        </Field>
      </div>

      <div className="mt-3 flex flex-wrap gap-4">
        <Check
          checked={doc.kitIncludedDefault ?? false}
          onChange={(v) => set({ kitIncludedDefault: v })}
          label="Kit included by default"
        />
        <Check
          checked={doc.annual ?? false}
          onChange={(v) => set({ annual: v })}
          label="Annual puja"
        />
        <Check
          checked={doc.active ?? false}
          onChange={(v) => set({ active: v })}
          label="Active (bookable)"
        />
      </div>

      <div className="mt-4 flex justify-end border-t border-border-light pt-3">
        <Btn kind="primary" disabled={busy} onClick={() => void save()}>
          {busy ? "Saving…" : "Save puja type"}
        </Btn>
      </div>
    </div>
  );
}
