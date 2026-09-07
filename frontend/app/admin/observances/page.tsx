"use client";

/**
 * Observance calendar management: year list, drawer edit, verify toggle.
 * Saving an observance re-fires the ritual-card regeneration event server-side.
 */

import { useCallback, useEffect, useState } from "react";
import {
  listAdminObservances,
  toggleObservanceVerified,
  upsertObservance,
  type AdminObservance,
} from "@/lib/admin";
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
  Select,
  Table,
  Td,
  TextArea,
} from "@/components/admin/ui";

const TYPES = ["VRAT", "FESTIVAL", "SPECIAL_SEASONAL", "PURNIMA_AMAVASYA", "ECLIPSE"];

export default function AdminObservancesPage() {
  const [year, setYear] = useState<number | null>(new Date().getFullYear());
  const [items, setItems] = useState<AdminObservance[] | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<AdminObservance | null>(null);
  const [isNew, setIsNew] = useState(false);

  const load = useCallback(async () => {
    setItems(null);
    setError("");
    const res = await listAdminObservances(year ?? new Date().getFullYear());
    if (res.ok) setItems(res.data ?? []);
    else setError(res.message);
  }, [year]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(o: AdminObservance) {
    const slug = (o.slug ?? "").trim();
    if (!slug) {
      setError("A slug is required.");
      return;
    }
    const res = await upsertObservance(slug, o);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setEditing(null);
    void load();
  }

  async function toggle(slug: string) {
    const res = await toggleObservanceVerified(slug);
    if (!res.ok) setError(res.message);
    else void load();
  }

  return (
    <div>
      <PageHead
        title="Observances"
        aside={
          <>
            <NumInput value={year} onChange={setYear} className="!w-[90px]" />
            <Btn onClick={() => void load()}>Load</Btn>
            <Btn
              kind="primary"
              onClick={() => {
                setIsNew(true);
                setEditing({ slug: "", type: "VRAT", verified: false });
              }}
            >
              + New observance
            </Btn>
          </>
        }
      />

      {error && <Msg kind="error">{error}</Msg>}
      {!items && !error && <Loading />}
      {items && items.length === 0 && <Empty>No observances in {year}.</Empty>}
      {items && items.length > 0 && (
        <Table headers={["Date", "Slug", "Name", "Type", "Series", "Article", "Verified", "", ""]}>
          {items.map((o) => (
            <tr key={o.slug} className="hover:bg-bg">
              <Td className="whitespace-nowrap font-mono text-[11px]">
                {o.date}
                {o.endDate ? ` → ${o.endDate}` : ""}
              </Td>
              <Td className="font-mono text-[11px]">{o.slug}</Td>
              <Td>
                {o.name}
                {o.nameHi ? <span className="text-sub"> · {o.nameHi}</span> : null}
              </Td>
              <Td className="text-sub">{o.type}</Td>
              <Td className="text-sub">
                {o.series ?? "—"}
                {o.seriesPosition ? ` (${o.seriesPosition})` : ""}
              </Td>
              <Td className="font-mono text-[11px] text-sub">{o.articleSlug ?? "—"}</Td>
              <Td>{o.verified ? "✓" : <span className="text-pratha-fg">unverified</span>}</Td>
              <Td>
                <Btn onClick={() => void toggle(o.slug ?? "")}>
                  {o.verified ? "Unverify" : "Verify"}
                </Btn>
              </Td>
              <Td>
                <Btn
                  onClick={() => {
                    setIsNew(false);
                    setEditing({ ...o });
                  }}
                >
                  Edit
                </Btn>
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <Drawer
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={isNew ? "New observance" : `Edit · ${editing?.slug}`}
        footer={
          editing && (
            <Btn kind="primary" onClick={() => void save(editing)}>
              Save observance
            </Btn>
          )
        }
      >
        {editing && (
          <ObservanceForm o={editing} onChange={setEditing} isNew={isNew} />
        )}
      </Drawer>
    </div>
  );
}

function ObservanceForm({
  o,
  onChange,
  isNew,
}: {
  o: AdminObservance;
  onChange: (o: AdminObservance) => void;
  isNew: boolean;
}) {
  const patch = (p: Partial<AdminObservance>) => onChange({ ...o, ...p });
  const teaserLen = (o.circleTeaser ?? "").length;
  return (
    <div className="grid grid-cols-2 gap-2">
      <Field label="Slug" className="col-span-2">
        <Input
          value={o.slug ?? ""}
          onChange={(v) => patch({ slug: v })}
          disabled={!isNew}
          placeholder="hartalika-teej-2026"
        />
      </Field>
      <Field label="Name">
        <Input value={o.name ?? ""} onChange={(v) => patch({ name: v })} />
      </Field>
      <Field label="Name (Hindi)">
        <Input value={o.nameHi ?? ""} onChange={(v) => patch({ nameHi: v })} />
      </Field>
      <Field label="Type">
        <Select
          value={o.type ?? ""}
          onChange={(v) => patch({ type: v })}
          options={TYPES.map((t) => ({ value: t }))}
        />
      </Field>
      <Field label="Series" hint="ekadashi, pradosh, sawan-somwar…">
        <Input value={o.series ?? ""} onChange={(v) => patch({ series: v || undefined })} />
      </Field>
      <Field label="Series position">
        <Input
          value={o.seriesPosition ?? ""}
          onChange={(v) => patch({ seriesPosition: v || undefined })}
          placeholder="1 of 4"
        />
      </Field>
      <Field label="Date">
        <Input type="date" value={o.date ?? ""} onChange={(v) => patch({ date: v })} />
      </Field>
      <Field label="End date (multi-day)">
        <Input type="date" value={o.endDate ?? ""} onChange={(v) => patch({ endDate: v || undefined })} />
      </Field>
      <Field label="Tithi label" className="col-span-2">
        <Input
          value={o.tithiLabel ?? ""}
          onChange={(v) => patch({ tithiLabel: v || undefined })}
          placeholder="Shravana Krishna Chaturdashi"
        />
      </Field>
      <Field label="Tithi starts at" hint="feeds Circle reminder vars">
        <Input
          type="datetime-local"
          value={(o.tithiStartsAt ?? "").slice(0, 16)}
          onChange={(v) => patch({ tithiStartsAt: v ? `${v}:00` : undefined })}
        />
      </Field>
      <Field label="Tithi ends at">
        <Input
          type="datetime-local"
          value={(o.tithiEndsAt ?? "").slice(0, 16)}
          onChange={(v) => patch({ tithiEndsAt: v ? `${v}:00` : undefined })}
        />
      </Field>
      <Field label="Deity">
        <Input value={o.deity ?? ""} onChange={(v) => patch({ deity: v || undefined })} />
      </Field>
      <Field label="Season block">
        <Input
          value={o.seasonBlock ?? ""}
          onChange={(v) => patch({ seasonBlock: v || undefined })}
          placeholder="Sawan, Pitru Paksha…"
        />
      </Field>
      <Field label="Blurb" className="col-span-2">
        <TextArea value={o.blurb ?? ""} onChange={(v) => patch({ blurb: v || undefined })} rows={2} />
      </Field>
      <Field
        label="Circle teaser"
        className="col-span-2"
        hint={
          <span className={teaserLen > 100 ? "font-bold text-cta" : ""}>
            {teaserLen}/100 chars
          </span>
        }
      >
        <TextArea value={o.circleTeaser ?? ""} onChange={(v) => patch({ circleTeaser: v || undefined })} rows={2} />
      </Field>
      <Field label="Linked article slug" className="col-span-2">
        <Input
          value={o.articleSlug ?? ""}
          onChange={(v) => patch({ articleSlug: v || undefined })}
          placeholder="hartalika-teej-vrat"
        />
      </Field>
      <div className="col-span-2 mt-1 border-t border-border-light pt-2">
        <Check
          checked={o.verified ?? false}
          onChange={(v) => patch({ verified: v })}
          label="Verified"
        />
      </div>
    </div>
  );
}
