"use client";

/**
 * Panchang day entry — the manual-first editorial loop. List a date range,
 * edit any day in a drawer (all timing fields + verified flag), or bulk
 * import a JSON array exported from the data-entry sheet.
 */

import { useCallback, useEffect, useState } from "react";
import {
  fmtDateTime,
  importPanchangDays,
  listPanchangDays,
  upsertPanchangDay,
  type AdminPanchangDay,
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
  PageHead,
  SectionCard,
  Table,
  Td,
  TextArea,
} from "@/components/admin/ui";

const iso = (d: Date) => d.toISOString().slice(0, 10);

export default function AdminPanchangPage() {
  const today = new Date();
  const [from, setFrom] = useState(iso(today));
  const [to, setTo] = useState(iso(new Date(today.getTime() + 30 * 86400000)));
  const [city, setCity] = useState("delhi-ncr");
  const [days, setDays] = useState<AdminPanchangDay[] | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<AdminPanchangDay | null>(null);
  const [importText, setImportText] = useState("");
  const [importMsg, setImportMsg] = useState("");

  const load = useCallback(async () => {
    setDays(null);
    setError("");
    const res = await listPanchangDays(from, to, city);
    if (res.ok) setDays(res.data ?? []);
    else setError(res.message);
  }, [from, to, city]);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveDay(day: AdminPanchangDay) {
    if (!day.date) {
      setError("The day needs a date.");
      return;
    }
    const res = await upsertPanchangDay(day.date, city, day);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setEditing(null);
    void load();
  }

  async function runImport() {
    setImportMsg("");
    let parsed: unknown;
    try {
      parsed = JSON.parse(importText);
    } catch {
      setImportMsg("Invalid JSON.");
      return;
    }
    if (!Array.isArray(parsed)) {
      setImportMsg("Expected a JSON array of day objects.");
      return;
    }
    const res = await importPanchangDays(parsed);
    if (res.ok) {
      setImportMsg(`Imported ${res.data?.imported ?? 0} day(s).`);
      setImportText("");
      void load();
    } else {
      setImportMsg(res.message);
    }
  }

  return (
    <div>
      <PageHead
        title="Panchang days"
        aside={
          <Btn
            kind="primary"
            onClick={() => setEditing({ date: from, city, verified: false })}
          >
            + New day
          </Btn>
        }
      />

      <div className="mb-3 flex flex-wrap items-end gap-2">
        <Field label="From">
          <Input type="date" value={from} onChange={setFrom} className="!w-[150px]" />
        </Field>
        <Field label="To">
          <Input type="date" value={to} onChange={setTo} className="!w-[150px]" />
        </Field>
        <Field label="City">
          <Input value={city} onChange={setCity} className="!w-[140px]" />
        </Field>
        <Btn onClick={() => void load()}>Load</Btn>
      </div>

      {error && <Msg kind="error">{error}</Msg>}
      {!days && !error && <Loading />}
      {days && days.length === 0 && <Empty>No days in this range for {city}.</Empty>}
      {days && days.length > 0 && (
        <Table headers={["Date", "Tithi", "Paksha", "Month", "Sunrise", "Rahu Kaal", "Verified", "Updated", ""]}>
          {days.map((d) => (
            <tr key={`${d.date}-${d.city}`} className="hover:bg-bg">
              <Td className="whitespace-nowrap font-mono text-[11px]">{d.date}</Td>
              <Td>
                {d.tithi?.name ?? "—"}
                {d.tithi?.endsAt ? <span className="text-sub"> → {d.tithi.endsAt}</span> : null}
              </Td>
              <Td>{d.paksha ?? "—"}</Td>
              <Td>{d.lunarMonth ?? "—"}</Td>
              <Td className="whitespace-nowrap">{d.sunrise ?? "—"} / {d.sunset ?? "—"}</Td>
              <Td className="whitespace-nowrap">
                {d.rahuKaal ? `${d.rahuKaal.from}–${d.rahuKaal.to}` : "—"}
              </Td>
              <Td>{d.verified ? "✓" : <span className="text-pratha-fg">provisional</span>}</Td>
              <Td className="whitespace-nowrap text-sub">{fmtDateTime(d.updatedAt)}</Td>
              <Td>
                <Btn onClick={() => setEditing({ ...d })}>Edit</Btn>
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <div className="mt-4">
        <SectionCard
          title="Bulk JSON import"
          aside={<Btn kind="primary" onClick={() => void runImport()}>Import</Btn>}
        >
          {importMsg && (
            <Msg kind={importMsg.startsWith("Imported") ? "ok" : "error"}>{importMsg}</Msg>
          )}
          <TextArea
            value={importText}
            onChange={setImportText}
            rows={6}
            mono
            placeholder='[{"date":"2026-09-10","city":"delhi-ncr","tithi":{"name":"Saptami","endsAt":"14:22"},"paksha":"Krishna","sunrise":"06:02", …}]'
          />
        </SectionCard>
      </div>

      <Drawer
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? `Edit day · ${editing?.date}` : "New day"}
        footer={
          editing && (
            <Btn kind="primary" onClick={() => void saveDay(editing)}>
              Save day
            </Btn>
          )
        }
      >
        {editing && <DayForm day={editing} onChange={setEditing} isNew={!editing.id} />}
      </Drawer>
    </div>
  );
}

function DayForm({
  day,
  onChange,
  isNew,
}: {
  day: AdminPanchangDay;
  onChange: (d: AdminPanchangDay) => void;
  isNew: boolean;
}) {
  const patch = (p: Partial<AdminPanchangDay>) => onChange({ ...day, ...p });
  return (
    <div className="grid grid-cols-2 gap-2">
      <Field label="Date">
        <Input
          type="date"
          value={day.date ?? ""}
          onChange={(v) => patch({ date: v })}
          disabled={!isNew}
        />
      </Field>
      <Field label="Source">
        <Input value={day.source ?? ""} onChange={(v) => patch({ source: v })} placeholder="Drik Panchang" />
      </Field>
      <Field label="Tithi name">
        <Input
          value={day.tithi?.name ?? ""}
          onChange={(v) => patch({ tithi: { ...(day.tithi ?? {}), name: v } })}
          placeholder="Saptami"
        />
      </Field>
      <Field label="Tithi ends at">
        <Input
          value={day.tithi?.endsAt ?? ""}
          onChange={(v) => patch({ tithi: { ...(day.tithi ?? {}), endsAt: v } })}
          placeholder="14:22"
        />
      </Field>
      <Field label="Paksha">
        <Input value={day.paksha ?? ""} onChange={(v) => patch({ paksha: v })} placeholder="Shukla | Krishna" />
      </Field>
      <Field label="Lunar month">
        <Input value={day.lunarMonth ?? ""} onChange={(v) => patch({ lunarMonth: v })} placeholder="Shravana" />
      </Field>
      <Field label="Nakshatra name">
        <Input
          value={day.nakshatra?.name ?? ""}
          onChange={(v) => patch({ nakshatra: { ...(day.nakshatra ?? {}), name: v } })}
        />
      </Field>
      <Field label="Nakshatra ends at">
        <Input
          value={day.nakshatra?.endsAt ?? ""}
          onChange={(v) => patch({ nakshatra: { ...(day.nakshatra ?? {}), endsAt: v } })}
        />
      </Field>
      <Field label="Yoga">
        <Input value={day.yoga ?? ""} onChange={(v) => patch({ yoga: v })} />
      </Field>
      <Field label="Karana">
        <Input value={day.karana ?? ""} onChange={(v) => patch({ karana: v })} />
      </Field>
      <Field label="Sunrise">
        <Input value={day.sunrise ?? ""} onChange={(v) => patch({ sunrise: v })} placeholder="05:58" />
      </Field>
      <Field label="Sunset">
        <Input value={day.sunset ?? ""} onChange={(v) => patch({ sunset: v })} placeholder="18:31" />
      </Field>
      <Field label="Moonrise">
        <Input value={day.moonrise ?? ""} onChange={(v) => patch({ moonrise: v })} />
      </Field>
      <Field label="Moonset">
        <Input value={day.moonset ?? ""} onChange={(v) => patch({ moonset: v })} />
      </Field>
      <Field label="Rahu Kaal from">
        <Input
          value={day.rahuKaal?.from ?? ""}
          onChange={(v) => patch({ rahuKaal: { ...(day.rahuKaal ?? {}), from: v } })}
        />
      </Field>
      <Field label="Rahu Kaal to">
        <Input
          value={day.rahuKaal?.to ?? ""}
          onChange={(v) => patch({ rahuKaal: { ...(day.rahuKaal ?? {}), to: v } })}
        />
      </Field>
      <Field label="Abhijit from">
        <Input
          value={day.abhijitMuhurat?.from ?? ""}
          onChange={(v) => patch({ abhijitMuhurat: { ...(day.abhijitMuhurat ?? {}), from: v } })}
        />
      </Field>
      <Field label="Abhijit to">
        <Input
          value={day.abhijitMuhurat?.to ?? ""}
          onChange={(v) => patch({ abhijitMuhurat: { ...(day.abhijitMuhurat ?? {}), to: v } })}
        />
      </Field>
      <div className="col-span-2 mt-1 border-t border-border-light pt-2">
        <Check
          checked={day.verified ?? false}
          onChange={(v) => patch({ verified: v })}
          label="Verified — serves without the provisional flag"
        />
      </div>
    </div>
  );
}
