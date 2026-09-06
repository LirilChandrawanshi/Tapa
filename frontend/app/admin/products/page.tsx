"use client";

/**
 * Admin · Products (P2-M4). Ritual Pujan SKUs: table + full edit drawer
 * (money edited in rupees, stored in paise; manifest rows re-number on save),
 * plus the pincode serviceability list underneath.
 */

import { useCallback, useEffect, useState } from "react";
import {
  adminDelete,
  adminGet,
  adminPut,
} from "@/lib/admin";
import { formatPaise } from "@/lib/orders";
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
  Select,
  Table,
  Td,
  TextArea,
} from "@/components/admin/ui";

/* ---------- shapes ---------- */

interface ProductItem {
  n?: number;
  name?: string;
  qty?: number;
  note?: string | null;
}

interface AdminProduct {
  id?: string;
  slug?: string;
  category?: string;
  title?: string;
  titleDevanagari?: string;
  eyebrow?: string;
  season?: string;
  description?: string;
  pricePaise?: number;
  mrpPaise?: number | null;
  taxInclusive?: boolean;
  hueClass?: string;
  imageIds?: string[];
  items?: ProductItem[];
  availability?: string;
  orderByDate?: string | null;
  dispatchFrom?: string | null;
  festivalDate?: string | null;
  stock?: number | null;
  cancellationHours?: number;
  linkedGuideSlugs?: string[];
  linkedObservanceSlug?: string | null;
  significanceHtml?: string;
  howToUseNote?: string;
  [key: string]: unknown;
}

interface Pincode {
  id?: string;
  pincode?: string;
  serviceable?: boolean;
  etaDays?: number;
  codAllowed?: boolean;
  area?: string;
}

const CATEGORIES = [
  "by-festival",
  "by-ritual",
  "griha-life-events",
  "daily-puja-essentials",
];
const AVAILABILITY = ["PREBOOK", "LIVE", "COMING_SOON", "SOLD_OUT"];

const AVAIL_CLS: Record<string, string> = {
  LIVE: "bg-dharma-bg text-dharma-fg border-dharma-bd",
  PREBOOK: "bg-pratha-bg text-pratha-fg border-pratha-bd",
  SOLD_OUT: "bg-bhranti-bg text-[#8a2040] border-bhranti-bd",
  COMING_SOON: "bg-bg text-sub border-border",
};

function AvailabilityPill({ value }: { value?: string }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-[4px] border px-1.5 py-0.5 text-[10px] font-bold ${AVAIL_CLS[value ?? ""] ?? "bg-bg text-sub border-border"}`}
    >
      {value ?? "?"}
    </span>
  );
}

const NEW_PRODUCT: AdminProduct = {
  slug: "",
  category: "by-festival",
  title: "",
  availability: "COMING_SOON",
  pricePaise: 0,
  taxInclusive: true,
  cancellationHours: 48,
  items: [],
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setProducts(null);
    setError("");
    const res = await adminGet<AdminProduct[]>("/products");
    if (res.ok) setProducts(res.data ?? []);
    else setError(res.message);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(p: AdminProduct) {
    const slug = (p.slug ?? "").trim();
    if (!slug) {
      setSaveError("A slug is required.");
      return;
    }
    if (!p.pricePaise || p.pricePaise <= 0) {
      setSaveError("Price must be above ₹0.");
      return;
    }
    setSaving(true);
    setSaveError("");
    // Manifest numbering follows row order — re-stamp before saving.
    const body: AdminProduct = {
      ...p,
      slug,
      items: (p.items ?? []).map((item, i) => ({ ...item, n: i + 1 })),
    };
    const res = await adminPut<AdminProduct>(`/products/${slug}`, body);
    setSaving(false);
    if (!res.ok) {
      setSaveError(res.message);
      return;
    }
    setEditing(null);
    void load();
  }

  async function remove(slug: string) {
    if (!confirm(`Delete product "${slug}"? This is immediate.`)) return;
    const res = await adminDelete<{ deleted: boolean }>(`/products/${slug}`);
    if (!res.ok) setError(res.message);
    else void load();
  }

  return (
    <div>
      <PageHead
        title="Products"
        aside={
          <Btn
            kind="primary"
            onClick={() => {
              setIsNew(true);
              setSaveError("");
              setEditing({ ...NEW_PRODUCT, items: [] });
            }}
          >
            + New product
          </Btn>
        }
      />

      {error && <Msg kind="error">{error}</Msg>}
      {!products && !error && <Loading />}
      {products && products.length === 0 && (
        <Empty>No products yet — add the first kit.</Empty>
      )}
      {products && products.length > 0 && (
        <Table
          headers={[
            "Slug",
            "Title",
            "Availability",
            "Price",
            "Order by",
            "Festival",
            "Stock",
            "",
            "",
          ]}
        >
          {products.map((p) => (
            <tr key={p.slug} className="hover:bg-bg">
              <Td className="font-mono text-[11px] text-sub">{p.slug}</Td>
              <Td className="font-bold">
                {p.title}
                {p.titleDevanagari ? (
                  <span className="font-devanagari font-normal text-sub">
                    {" "}
                    · {p.titleDevanagari}
                  </span>
                ) : null}
              </Td>
              <Td>
                <AvailabilityPill value={p.availability} />
              </Td>
              <Td className="whitespace-nowrap font-bold">
                {formatPaise(p.pricePaise ?? 0)}
                {p.mrpPaise != null && p.mrpPaise > (p.pricePaise ?? 0) && (
                  <span className="ml-1 font-normal text-sub line-through">
                    {formatPaise(p.mrpPaise)}
                  </span>
                )}
              </Td>
              <Td className="whitespace-nowrap text-sub">
                {p.orderByDate ?? "—"}
              </Td>
              <Td className="whitespace-nowrap text-sub">
                {p.festivalDate ?? "—"}
              </Td>
              <Td className="text-sub">{p.stock ?? "∞"}</Td>
              <Td>
                <Btn
                  onClick={() => {
                    setIsNew(false);
                    setSaveError("");
                    setEditing({
                      ...p,
                      items: (p.items ?? []).map((i) => ({ ...i })),
                    });
                  }}
                >
                  Edit
                </Btn>
              </Td>
              <Td>
                <Btn kind="danger" onClick={() => void remove(p.slug ?? "")}>
                  Delete
                </Btn>
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <div className="mt-5">
        <PincodeSection />
      </div>

      <Drawer
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={isNew ? "New product" : `Edit · ${editing?.slug}`}
        footer={
          editing && (
            <Btn
              kind="primary"
              disabled={saving}
              onClick={() => void save(editing)}
            >
              {saving ? "Saving…" : "Save product"}
            </Btn>
          )
        }
      >
        {editing && (
          <>
            {saveError && <Msg kind="error">{saveError}</Msg>}
            <ProductForm p={editing} onChange={setEditing} isNew={isNew} />
          </>
        )}
      </Drawer>
    </div>
  );
}

/* ---------- product form ---------- */

/** Rupee-facing input over a paise field. */
function RupeeInput({
  paise,
  onChange,
  allowNull = false,
}: {
  paise: number | null | undefined;
  onChange: (paise: number | null) => void;
  allowNull?: boolean;
}) {
  return (
    <NumInput
      value={paise == null ? (allowNull ? null : 0) : paise / 100}
      onChange={(v) => onChange(v == null ? (allowNull ? null : 0) : Math.round(v * 100))}
      placeholder="₹"
    />
  );
}

function ProductForm({
  p,
  onChange,
  isNew,
}: {
  p: AdminProduct;
  onChange: (p: AdminProduct) => void;
  isNew: boolean;
}) {
  const patch = (u: Partial<AdminProduct>) => onChange({ ...p, ...u });
  const items = p.items ?? [];

  const patchItem = (i: number, u: Partial<ProductItem>) =>
    patch({ items: items.map((item, j) => (j === i ? { ...item, ...u } : item)) });
  const moveItem = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    patch({ items: next });
  };

  return (
    <div className="grid grid-cols-2 gap-2">
      <Field label="Slug" hint={isNew ? "URL identity — cannot change later." : undefined}>
        <Input
          value={p.slug ?? ""}
          onChange={(v) => patch({ slug: v })}
          disabled={!isNew}
          placeholder="navratri-shakti-kit"
        />
      </Field>
      <Field label="Category">
        <Select
          value={p.category ?? ""}
          onChange={(v) => patch({ category: v })}
          options={CATEGORIES.map((c) => ({ value: c }))}
        />
      </Field>
      <Field label="Title">
        <Input
          value={p.title ?? ""}
          onChange={(v) => patch({ title: v })}
          placeholder="Shakti Ritual Kit"
        />
      </Field>
      <Field label="Title (Devanagari)">
        <Input
          value={p.titleDevanagari ?? ""}
          onChange={(v) => patch({ titleDevanagari: v || undefined })}
          placeholder="शक्ति"
        />
      </Field>
      <Field label="Eyebrow">
        <Input
          value={p.eyebrow ?? ""}
          onChange={(v) => patch({ eyebrow: v || undefined })}
          placeholder="NAVRATRI PUJAN · SEASON 1"
        />
      </Field>
      <Field label="Season">
        <Input
          value={p.season ?? ""}
          onChange={(v) => patch({ season: v || undefined })}
        />
      </Field>
      <Field label="Description" className="col-span-2">
        <TextArea
          value={p.description ?? ""}
          onChange={(v) => patch({ description: v || undefined })}
          rows={2}
        />
      </Field>

      <Field label="Price (₹)" hint="Stored as integer paise.">
        <RupeeInput
          paise={p.pricePaise}
          onChange={(v) => patch({ pricePaise: v ?? 0 })}
        />
      </Field>
      <Field label="MRP (₹)" hint="Struck through when above price.">
        <RupeeInput
          paise={p.mrpPaise}
          onChange={(v) => patch({ mrpPaise: v })}
          allowNull
        />
      </Field>

      <Field label="Availability">
        <Select
          value={p.availability ?? "COMING_SOON"}
          onChange={(v) => patch({ availability: v })}
          options={AVAILABILITY.map((a) => ({ value: a }))}
        />
      </Field>
      <div className="flex items-end pb-1">
        <Check
          checked={p.taxInclusive ?? true}
          onChange={(v) => patch({ taxInclusive: v })}
          label="Price is tax-inclusive"
        />
      </div>

      <Field label="Order-by date" hint="Last order day for pre-book kits.">
        <Input
          type="date"
          value={p.orderByDate ?? ""}
          onChange={(v) => patch({ orderByDate: v || null })}
        />
      </Field>
      <Field label="Dispatch from">
        <Input
          type="date"
          value={p.dispatchFrom ?? ""}
          onChange={(v) => patch({ dispatchFrom: v || null })}
        />
      </Field>
      <Field label="Festival date" hint="Dated kits deliver 3 days before it.">
        <Input
          type="date"
          value={p.festivalDate ?? ""}
          onChange={(v) => patch({ festivalDate: v || null })}
        />
      </Field>
      <Field label="Stock" hint="Blank = untracked.">
        <NumInput
          value={p.stock ?? null}
          onChange={(v) => patch({ stock: v })}
        />
      </Field>
      <Field label="Cancellation hours" hint="48 pre-book · 24 live.">
        <NumInput
          value={p.cancellationHours ?? 48}
          onChange={(v) => patch({ cancellationHours: v ?? 48 })}
        />
      </Field>
      <Field label="Hue class">
        <Input
          value={p.hueClass ?? ""}
          onChange={(v) => patch({ hueClass: v || undefined })}
          placeholder="hue-rose"
        />
      </Field>

      {/* manifest editor */}
      <div className="col-span-2 rounded-lg border border-border bg-card p-2.5">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[0.8px] text-sub">
            What&apos;s in this kit ({items.length})
          </span>
          <Btn
            onClick={() =>
              patch({ items: [...items, { name: "", qty: 1, note: "" }] })
            }
          >
            + Row
          </Btn>
        </div>
        {items.length === 0 && (
          <p className="py-2 text-center text-[11px] text-sub">
            No items yet — the kit page shows an empty manifest.
          </p>
        )}
        {items.map((item, i) => (
          <div key={i} className="mb-1.5 flex items-start gap-1.5">
            <span className="mt-1.5 w-4 shrink-0 text-right text-[10px] font-bold text-sub">
              {i + 1}
            </span>
            <div className="flex-1">
              <Input
                value={item.name ?? ""}
                onChange={(v) => patchItem(i, { name: v })}
                placeholder="Kalash (copper)"
              />
            </div>
            <div className="w-14 shrink-0">
              <NumInput
                value={item.qty ?? 1}
                onChange={(v) => patchItem(i, { qty: v ?? 1 })}
              />
            </div>
            <div className="w-28 shrink-0">
              <Input
                value={item.note ?? ""}
                onChange={(v) => patchItem(i, { note: v || undefined })}
                placeholder="note"
              />
            </div>
            <div className="flex shrink-0 gap-0.5">
              <Btn kind="ghost" title="Move up" disabled={i === 0} onClick={() => moveItem(i, -1)}>
                ↑
              </Btn>
              <Btn
                kind="ghost"
                title="Move down"
                disabled={i === items.length - 1}
                onClick={() => moveItem(i, 1)}
              >
                ↓
              </Btn>
              <Btn
                kind="ghost"
                title="Remove row"
                onClick={() => patch({ items: items.filter((_, j) => j !== i) })}
              >
                ✕
              </Btn>
            </div>
          </div>
        ))}
      </div>

      <Field label="Linked guide slugs" className="col-span-2" hint="Comma-separated.">
        <Input
          value={(p.linkedGuideSlugs ?? []).join(", ")}
          onChange={(v) =>
            patch({
              linkedGuideSlugs: v
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder="navratri-ghatasthapana, durga-ashtami-pujan"
        />
      </Field>
      <Field label="Linked observance slug">
        <Input
          value={p.linkedObservanceSlug ?? ""}
          onChange={(v) => patch({ linkedObservanceSlug: v || null })}
        />
      </Field>
      <Field label="Image IDs" hint="Comma-separated media ids.">
        <Input
          value={(p.imageIds ?? []).join(", ")}
          onChange={(v) =>
            patch({
              imageIds: v
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        />
      </Field>
      <Field
        label="Significance (HTML)"
        className="col-span-2"
        hint="Why this kit / what it is not — anti-upsell honesty block."
      >
        <TextArea
          value={p.significanceHtml ?? ""}
          onChange={(v) => patch({ significanceHtml: v || undefined })}
          rows={4}
          mono
        />
      </Field>
      <Field label="How-to-use note" className="col-span-2">
        <TextArea
          value={p.howToUseNote ?? ""}
          onChange={(v) => patch({ howToUseNote: v || undefined })}
          rows={2}
        />
      </Field>
    </div>
  );
}

/* ---------- pincodes ---------- */

function PincodeSection() {
  const [list, setList] = useState<Pincode[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newArea, setNewArea] = useState("");
  const [newEta, setNewEta] = useState<number | null>(3);

  const load = useCallback(async () => {
    const res = await adminGet<Pincode[]>("/pincodes");
    if (res.ok)
      setList(
        (res.data ?? []).sort((a, b) =>
          (a.pincode ?? "").localeCompare(b.pincode ?? ""),
        ),
      );
    else setError(res.message);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function upsert(pin: Pincode): Promise<boolean> {
    const code = (pin.pincode ?? "").trim();
    if (!/^\d{6}$/.test(code)) {
      setError("Pincode must be 6 digits.");
      return false;
    }
    setBusy(code);
    setError("");
    const res = await adminPut<Pincode>(`/pincodes/${code}`, pin);
    setBusy("");
    if (!res.ok) {
      setError(res.message);
      return false;
    }
    void load();
    return true;
  }

  return (
    <SectionCard
      title="Pincode serviceability"
      aside={
        <span className="text-[10px] text-sub">
          Checkout refuses unserviceable pincodes.
        </span>
      }
    >
      {error && <Msg kind="error">{error}</Msg>}

      {/* add */}
      <div className="mb-2.5 flex flex-wrap items-end gap-2">
        <div className="w-24">
          <Field label="Pincode">
            <Input value={newPin} onChange={setNewPin} placeholder="110001" />
          </Field>
        </div>
        <div className="w-44">
          <Field label="Area">
            <Input
              value={newArea}
              onChange={setNewArea}
              placeholder="Connaught Place"
            />
          </Field>
        </div>
        <div className="w-16">
          <Field label="ETA days">
            <NumInput value={newEta} onChange={setNewEta} />
          </Field>
        </div>
        <Btn
          kind="primary"
          disabled={busy !== ""}
          onClick={() => {
            void upsert({
              pincode: newPin,
              area: newArea.trim() || undefined,
              etaDays: newEta ?? 3,
              serviceable: true,
            }).then((ok) => {
              if (!ok) return;
              setNewPin("");
              setNewArea("");
              setNewEta(3);
            });
          }}
        >
          + Add serviceable
        </Btn>
      </div>

      {!list && !error && <Loading />}
      {list && list.length === 0 && <Empty>No pincodes configured.</Empty>}
      {list && list.length > 0 && (
        <Table headers={["Pincode", "Area", "ETA", "Serviceable", ""]}>
          {list.map((pin) => (
            <tr key={pin.pincode} className="hover:bg-bg">
              <Td className="font-mono text-[11px] font-bold">{pin.pincode}</Td>
              <Td>{pin.area ?? "—"}</Td>
              <Td className="text-sub">
                {pin.etaDays ?? 3} day{(pin.etaDays ?? 3) === 1 ? "" : "s"}
              </Td>
              <Td>
                <span
                  className={`inline-block rounded-[4px] border px-1.5 py-0.5 text-[10px] font-bold ${
                    pin.serviceable
                      ? "border-dharma-bd bg-dharma-bg text-dharma-fg"
                      : "border-border bg-bg text-sub"
                  }`}
                >
                  {pin.serviceable ? "YES" : "NO"}
                </span>
              </Td>
              <Td>
                <Btn
                  disabled={busy === pin.pincode}
                  onClick={() =>
                    void upsert({ ...pin, serviceable: !pin.serviceable })
                  }
                >
                  {pin.serviceable ? "Switch off" : "Switch on"}
                </Btn>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </SectionCard>
  );
}
