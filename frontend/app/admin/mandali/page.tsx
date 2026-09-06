"use client";

/**
 * Admin · Bhajan Mandali (Phase 5). Two sections: the requests table with
 * status filter and a transitions drawer (Confirm asks the quote in ₹ and
 * converts to paise; the backend state machine still enforces), and the
 * mandali-types catalogue with an edit drawer.
 */

import { useCallback, useEffect, useState } from "react";
import { adminGet, adminPost, adminPut, fmtDateTime } from "@/lib/admin";
import {
  formatPaise,
  guestBucketLabel,
  mandaliStatusMeta,
  venueLabel,
  type MandaliTone,
} from "@/lib/mandali";
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

/* ---------- shapes (full docs — admin sees phone/internals) ---------- */

interface AdminMandaliAddress {
  name?: string;
  phone?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string;
  pincode?: string;
}

interface AdminMandaliRequest {
  id?: string;
  requestNumber?: string;
  phone?: string;
  userId?: string | null;
  mandaliTypeSlug?: string;
  mandaliName?: string;
  date?: string;
  venueType?: string;
  expectedGuests?: string;
  address?: AdminMandaliAddress | null;
  notes?: string | null;
  status?: string;
  quotedPricePaise?: number | null;
  statusNote?: string | null;
  cancelledAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

interface AdminMandaliType {
  id?: string;
  slug?: string;
  name?: string;
  nameHi?: string;
  description?: string;
  inclusions?: string[];
  startingPricePaise?: number;
  seasonNote?: string | null;
  hueClass?: string;
  active?: boolean;
  updatedAt?: string;
  [key: string]: unknown;
}

const STATUSES = [
  "REQUESTED",
  "CONFIRMED",
  "DECLINED",
  "COMPLETED",
  "CANCELLED",
] as const;

/** Mirror of the backend state machine — the server still enforces. */
const NEXT: Record<string, string[]> = {
  REQUESTED: ["CONFIRMED", "DECLINED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
};

const ACTION_LABEL: Record<string, string> = {
  CONFIRMED: "Confirm with quote",
  DECLINED: "Decline",
  COMPLETED: "Mark completed",
  CANCELLED: "Cancel request",
};

const TONE_CLS: Record<MandaliTone, string> = {
  good: "bg-dharma-bg text-dharma-fg border-dharma-bd",
  progress: "bg-pratha-bg text-pratha-fg border-pratha-bd",
  attention: "bg-card text-cta border-cta",
  neutral: "bg-bg text-sub border-border",
};

function MandaliPill({ status }: { status?: string }) {
  const tone = status ? mandaliStatusMeta(status).tone : "neutral";
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-[4px] border px-1.5 py-0.5 text-[10px] font-bold ${TONE_CLS[tone]}`}
    >
      {status ?? "?"}
    </span>
  );
}

export default function AdminMandaliPage() {
  /* requests */
  const [filter, setFilter] = useState<string>("");
  const [requests, setRequests] = useState<AdminMandaliRequest[] | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<AdminMandaliRequest | null>(null);

  /* types */
  const [types, setTypes] = useState<AdminMandaliType[] | null>(null);
  const [typesError, setTypesError] = useState("");
  const [openType, setOpenType] = useState<AdminMandaliType | null>(null);

  const load = useCallback(async () => {
    setRequests(null);
    setError("");
    const qs = filter ? `?status=${filter}` : "";
    const res = await adminGet<AdminMandaliRequest[]>(`/mandali-requests${qs}`);
    if (res.ok) setRequests(res.data ?? []);
    else setError(res.message);
  }, [filter]);

  const loadTypes = useCallback(async () => {
    setTypes(null);
    setTypesError("");
    const res = await adminGet<AdminMandaliType[]>("/mandali-types");
    if (res.ok) setTypes(res.data ?? []);
    else setTypesError(res.message);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    void loadTypes();
  }, [loadTypes]);

  function applyUpdate(updated: AdminMandaliRequest) {
    setRequests((list) =>
      list
        ? list.map((r) =>
            r.requestNumber === updated.requestNumber ? updated : r,
          )
        : list,
    );
    setOpen(updated);
  }

  return (
    <div>
      <PageHead title="Bhajan Mandali" />

      {/* ── requests ── */}
      <div className="mb-3 flex flex-wrap gap-1">
        {[["", "All"] as const, ...STATUSES.map((s) => [s, s] as const)].map(
          ([value, label]) => (
            <button
              key={label}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-[5px] border px-2 py-1 text-[10.5px] font-bold tracking-[0.3px] ${
                filter === value
                  ? "border-cta bg-cta text-white"
                  : "border-border bg-card text-sub hover:text-body"
              }`}
            >
              {label}
            </button>
          ),
        )}
      </div>

      {error && <Msg kind="error">{error}</Msg>}
      {!requests && !error && <Loading />}
      {requests && requests.length === 0 && (
        <Empty>No mandali requests{filter ? ` in ${filter}` : " yet"}.</Empty>
      )}
      {requests && requests.length > 0 && (
        <Table
          headers={[
            "Request #",
            "Created",
            "Mandali",
            "Date",
            "Venue",
            "Guests",
            "Phone",
            "Status",
          ]}
        >
          {requests.map((r) => (
            <tr
              key={r.requestNumber}
              className="cursor-pointer hover:bg-bg"
              onClick={() => setOpen(r)}
            >
              <Td className="font-mono text-[11px] font-bold">
                {r.requestNumber}
              </Td>
              <Td className="whitespace-nowrap text-sub">
                {fmtDateTime(r.createdAt)}
              </Td>
              <Td className="max-w-[200px]">
                {r.mandaliName ?? r.mandaliTypeSlug ?? "—"}
              </Td>
              <Td className="whitespace-nowrap">{r.date ?? "—"}</Td>
              <Td>{r.venueType ? venueLabel(r.venueType) : "—"}</Td>
              <Td className="whitespace-nowrap">
                {r.expectedGuests ? guestBucketLabel(r.expectedGuests) : "—"}
              </Td>
              <Td className="font-mono text-[11px]">{r.phone ?? "—"}</Td>
              <Td>
                <MandaliPill status={r.status} />
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <Drawer
        open={open !== null}
        onClose={() => setOpen(null)}
        title={open?.requestNumber ?? "Request"}
      >
        {open && <RequestDetail request={open} onUpdated={applyUpdate} />}
      </Drawer>

      {/* ── types ── */}
      <div className="mt-6">
        <SectionCard
          title="Mandali types"
          aside={
            <Btn
              onClick={() =>
                setOpenType({
                  slug: "",
                  name: "",
                  inclusions: [],
                  startingPricePaise: 0,
                  active: true,
                })
              }
            >
              + New type
            </Btn>
          }
        >
          {typesError && <Msg kind="error">{typesError}</Msg>}
          {!types && !typesError && <Loading />}
          {types && types.length === 0 && <Empty>No mandali types yet.</Empty>}
          {types && types.length > 0 && (
            <Table headers={["Slug", "Name", "Starting price", "Season", "Active"]}>
              {types.map((t) => (
                <tr
                  key={t.slug}
                  className="cursor-pointer hover:bg-bg"
                  onClick={() => setOpenType(t)}
                >
                  <Td className="font-mono text-[11px]">{t.slug}</Td>
                  <Td>
                    {t.name}
                    {t.nameHi && (
                      <span className="font-devanagari text-sub"> · {t.nameHi}</span>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap font-bold">
                    {formatPaise(t.startingPricePaise ?? 0)}
                  </Td>
                  <Td className="max-w-[180px] text-sub">{t.seasonNote ?? "—"}</Td>
                  <Td>{t.active === false ? "hidden" : "yes"}</Td>
                </tr>
              ))}
            </Table>
          )}
        </SectionCard>
      </div>

      <Drawer
        open={openType !== null}
        onClose={() => setOpenType(null)}
        title={openType?.slug ? `Type · ${openType.slug}` : "New mandali type"}
      >
        {openType && (
          <TypeEditor
            initial={openType}
            onSaved={() => {
              setOpenType(null);
              void loadTypes();
            }}
          />
        )}
      </Drawer>
    </div>
  );
}

/* ---------- request drawer ---------- */

function RequestDetail({
  request,
  onUpdated,
}: {
  request: AdminMandaliRequest;
  onUpdated: (r: AdminMandaliRequest) => void;
}) {
  const [note, setNote] = useState("");
  const [quoteRupees, setQuoteRupees] = useState<number | null>(null);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const allowed = NEXT[request.status ?? ""] ?? [];
  const a = request.address ?? {};

  async function transition(next: string) {
    if (busy) return;
    if (next === "CONFIRMED" && (quoteRupees == null || quoteRupees <= 0)) {
      setError("Confirming needs the final quote in ₹ (positive).");
      return;
    }
    setBusy(next);
    setError("");
    setDone("");
    const res = await adminPost<AdminMandaliRequest>(
      `/mandali-requests/${encodeURIComponent(request.requestNumber ?? "")}/status`,
      {
        status: next,
        quotedPricePaise:
          next === "CONFIRMED" && quoteRupees != null
            ? Math.round(quoteRupees * 100)
            : undefined,
        note: note.trim() || undefined,
      },
    );
    setBusy("");
    if (!res.ok) {
      setError(res.message); // includes the allowed-transitions list on 422
      return;
    }
    setNote("");
    setQuoteRupees(null);
    setDone(`Moved to ${res.data.status}.`);
    onUpdated(res.data);
  }

  return (
    <div className="text-[12px] text-body">
      {error && <Msg kind="error">{error}</Msg>}
      {done && <Msg kind="ok">{done}</Msg>}

      <div className="mb-3 flex items-center gap-2">
        <MandaliPill status={request.status} />
        {request.statusNote && (
          <span className="text-sub">{request.statusNote}</span>
        )}
      </div>

      {/* transitions */}
      <div className="mb-3 rounded-lg border border-border bg-card p-2.5">
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.8px] text-sub">
          Next steps
        </p>
        {allowed.length === 0 ? (
          <p className="text-sub">
            {request.status === "COMPLETED" ||
            request.status === "DECLINED" ||
            request.status === "CANCELLED"
              ? "Terminal state — nothing left to do."
              : "No transitions available."}
          </p>
        ) : (
          <>
            {allowed.includes("CONFIRMED") && (
              <Field
                label="Final quote (₹)"
                hint="Required to confirm — stored in paise, shown to the devotee."
              >
                <NumInput
                  value={quoteRupees}
                  onChange={setQuoteRupees}
                  placeholder="e.g. 5000"
                />
              </Field>
            )}
            <Field
              label="Note (optional)"
              hint="Shown to the devotee as the plain-words status line."
              className="mt-2"
            >
              <Input
                value={note}
                onChange={setNote}
                placeholder="e.g. Confirmed on call — mandali arrives 30 min early"
              />
            </Field>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {allowed.map((next) => (
                <Btn
                  key={next}
                  kind={
                    next === "CANCELLED" || next === "DECLINED"
                      ? "danger"
                      : next === "CONFIRMED" || next === "COMPLETED"
                        ? "primary"
                        : "default"
                  }
                  disabled={busy !== ""}
                  onClick={() => void transition(next)}
                >
                  {busy === next ? "…" : (ACTION_LABEL[next] ?? next)}
                </Btn>
              ))}
            </div>
          </>
        )}
      </div>

      {/* request facts */}
      <dl className="mb-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
        {(
          [
            ["Created", fmtDateTime(request.createdAt)],
            ["Updated", fmtDateTime(request.updatedAt)],
            ["Phone", request.phone ?? "—"],
            ["User", request.userId ?? "guest (unclaimed)"],
            [
              "Mandali",
              request.mandaliName ?? request.mandaliTypeSlug ?? "—",
            ],
            ["Date", request.date ?? "—"],
            ["Venue", request.venueType ? venueLabel(request.venueType) : "—"],
            [
              "Guests",
              request.expectedGuests
                ? guestBucketLabel(request.expectedGuests)
                : "—",
            ],
            [
              "Quoted",
              request.quotedPricePaise == null
                ? "—"
                : formatPaise(request.quotedPricePaise),
            ],
            ["Cancelled at", fmtDateTime(request.cancelledAt ?? undefined)],
          ] as const
        ).map(([label, value]) => (
          <div key={label}>
            <dt className="text-[10px] font-bold uppercase tracking-[0.8px] text-sub">
              {label}
            </dt>
            <dd className="break-all">{value}</dd>
          </div>
        ))}
      </dl>

      {request.notes && (
        <>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.8px] text-sub">
            Devotee notes
          </p>
          <p className="mb-3 rounded-lg border border-border bg-card p-2.5 leading-relaxed">
            {request.notes}
          </p>
        </>
      )}

      {/* address */}
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.8px] text-sub">
        Venue address
      </p>
      <p className="rounded-lg border border-border bg-card p-2.5 leading-relaxed">
        {a.name ?? "—"} · {a.phone ?? "—"}
        <br />
        {a.line1 ?? ""}
        {a.line2 ? `, ${a.line2}` : ""}
        <br />
        {a.city ?? ""}, {a.state ?? ""} — {a.pincode ?? ""}
      </p>
    </div>
  );
}

/* ---------- type editor drawer ---------- */

function TypeEditor({
  initial,
  onSaved,
}: {
  initial: AdminMandaliType;
  onSaved: () => void;
}) {
  const isNew = !initial.slug;
  const [slug, setSlug] = useState(initial.slug ?? "");
  const [name, setName] = useState(initial.name ?? "");
  const [nameHi, setNameHi] = useState(initial.nameHi ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [inclusions, setInclusions] = useState(
    (initial.inclusions ?? []).join("\n"),
  );
  const [priceRupees, setPriceRupees] = useState<number | null>(
    initial.startingPricePaise ? initial.startingPricePaise / 100 : null,
  );
  const [seasonNote, setSeasonNote] = useState(initial.seasonNote ?? "");
  const [hueClass, setHueClass] = useState(initial.hueClass ?? "h-gold");
  const [active, setActive] = useState(initial.active !== false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (busy) return;
    const cleanSlug = slug.trim().toLowerCase();
    if (!cleanSlug || !name.trim()) {
      setError("Slug and name are required.");
      return;
    }
    if (priceRupees == null || priceRupees <= 0) {
      setError("The starting price needs to be a positive ₹ amount.");
      return;
    }
    setBusy(true);
    setError("");
    const res = await adminPut<AdminMandaliType>(
      `/mandali-types/${encodeURIComponent(cleanSlug)}`,
      {
        ...initial,
        slug: cleanSlug,
        name: name.trim(),
        nameHi: nameHi.trim(),
        description: description.trim(),
        inclusions: inclusions
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean),
        startingPricePaise: Math.round(priceRupees * 100),
        seasonNote: seasonNote.trim() || null,
        hueClass: hueClass.trim() || "h-gold",
        active,
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
    <div className="flex flex-col gap-2.5 text-[12px]">
      {error && <Msg kind="error">{error}</Msg>}
      <Field label="Slug" hint="URL key — lowercase, hyphens.">
        <Input
          value={slug}
          onChange={setSlug}
          disabled={!isNew}
          placeholder="e.g. sundarkand"
        />
      </Field>
      <Field label="Name">
        <Input value={name} onChange={setName} placeholder="Sundarkand Path" />
      </Field>
      <Field label="Name (Hindi)">
        <Input value={nameHi} onChange={setNameHi} placeholder="सुन्दरकाण्ड पाठ" />
      </Field>
      <Field label="Description">
        <TextArea value={description} onChange={setDescription} rows={3} />
      </Field>
      <Field label="Inclusions" hint="One per line — shown as the checklist.">
        <TextArea
          value={inclusions}
          onChange={setInclusions}
          rows={4}
          placeholder={"5–7 member singing group\nHarmonium, dholak, tabla"}
        />
      </Field>
      <Field
        label="Starting price (₹)"
        hint="The 'From ₹' anchor — stored in paise."
      >
        <NumInput value={priceRupees} onChange={setPriceRupees} />
      </Field>
      <Field label="Season note" hint='e.g. "Navratri / all-year".'>
        <Input value={seasonNote} onChange={setSeasonNote} />
      </Field>
      <Field label="Hue class" hint="Gradient class from globals.css (h-gold, h-devi…).">
        <Input value={hueClass} onChange={setHueClass} />
      </Field>
      <Check checked={active} onChange={setActive} label="Active (visible on the site)" />
      <div className="mt-1 flex justify-end">
        <Btn kind="primary" disabled={busy} onClick={() => void save()}>
          {busy ? "Saving…" : "Save type"}
        </Btn>
      </div>
    </div>
  );
}
