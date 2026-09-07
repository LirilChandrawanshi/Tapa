"use client";

/**
 * Tapa Circle admin (#194/#35 + G58 approval gate).
 *
 * Three duties, in order of weight:
 *  1. "Tomorrow's send" — the G58 approval queue: verified observances in the
 *     next 7 days with the exact T2 preview; NOTHING fans out until a human
 *     presses Approve here (the scheduler checks for the approval row).
 *  2. Compliance visibility — flagged (twice-failed) sends, prominent, with
 *     the provider's reason. Nothing here ever re-sends.
 *  3. Health — member counts by status, send volumes, recent send log,
 *     members table. All WhatsApp numbers arrive MASKED from the server.
 */

import { useCallback, useEffect, useState } from "react";
import { adminGet, adminPost, fmtDateTime } from "@/lib/admin";
import {
  Btn,
  Loading,
  Msg,
  PageHead,
  SectionCard,
  Select,
  Table,
  Td,
} from "@/components/admin/ui";

interface SendRow {
  waNumber?: string; // masked server-side, last 4 only
  templateId?: string;
  occasionSlug?: string;
  status?: string; // SENT | RETRIED | FAILED_FLAGGED
  deliveryStatus?: string; // DELIVERED | FAILED (provider receipt)
  failureReason?: string;
  sentAt?: string;
}

interface CircleDashboard {
  membersByStatus?: Record<string, number>;
  sendsToday?: number;
  sendsWeek?: number;
  recentSends?: SendRow[];
  failedFlagged?: SendRow[];
}

interface MemberRow {
  id?: string;
  waNumber?: string; // masked
  status?: string;
  joinedAt?: string;
  entryPointPage?: string;
  statusNote?: string;
  stoppedAt?: string;
  deleteRequestedAt?: string;
}

interface QueueRow {
  slug?: string;
  name?: string;
  date?: string;
  memberCount?: number;
  vars?: Record<string, string>;
  previewText?: string;
  approved?: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

const MEMBER_STATUSES = ["ACTIVE", "STOPPED", "DELETE_REQUESTED", "BLOCKED"];

function sendStatusCls(status?: string): string {
  if (status === "FAILED_FLAGGED")
    return "bg-bhranti-bg text-[#8a2040] border-bhranti-bd";
  if (status === "RETRIED") return "bg-pratha-bg text-pratha-fg border-pratha-bd";
  return "bg-dharma-bg text-dharma-fg border-dharma-bd";
}

function Pill({ text, cls }: { text: string; cls: string }) {
  return (
    <span
      className={`inline-block rounded-[4px] border px-1.5 py-0.5 text-[10px] font-bold ${cls}`}
    >
      {text}
    </span>
  );
}

export default function AdminCirclePage() {
  const [dash, setDash] = useState<CircleDashboard | null>(null);
  const [queue, setQueue] = useState<QueueRow[] | null>(null);
  const [membersList, setMembersList] = useState<MemberRow[] | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");
  const [busySlug, setBusySlug] = useState("");

  const load = useCallback(async () => {
    setError("");
    const [d, q] = await Promise.all([
      adminGet<CircleDashboard>("/circle/dashboard"),
      adminGet<QueueRow[]>("/circle/queue"),
    ]);
    if (d.ok) setDash(d.data);
    else setError(d.message);
    if (q.ok) setQueue(q.data ?? []);
    else setError((prev) => prev || q.message);
  }, []);

  const loadMembers = useCallback(async (status: string) => {
    const res = await adminGet<MemberRow[]>(
      status ? `/circle/members?status=${status}` : "/circle/members",
    );
    if (res.ok) setMembersList(res.data ?? []);
    else setError(res.message);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadMembers(statusFilter);
  }, [loadMembers, statusFilter]);

  async function approve(row: QueueRow) {
    const slug = row.slug ?? "";
    const confirmed = confirm(
      `Approve the Circle send for "${row.name}" (${row.date})?\n\n` +
        `This unlocks the 6pm-IST fan-out to ${row.memberCount ?? "?"} active members. ` +
        `An approval cannot be withdrawn from here.`,
    );
    if (!confirmed) return;
    setBusySlug(slug);
    const res = await adminPost<QueueRow>(`/circle/queue/${slug}/approve`);
    setBusySlug("");
    if (!res.ok) setError(res.message);
    else void load();
  }

  const counts = dash?.membersByStatus ?? {};
  const flagged = dash?.failedFlagged ?? [];

  return (
    <div>
      <PageHead title="Tapa Circle" />
      {error && <Msg kind="error">{error}</Msg>}
      {!dash && !error && <Loading />}

      {/* health cards */}
      {dash && (
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {MEMBER_STATUSES.map((s) => (
            <div key={s} className="rounded-lg border border-border bg-card p-2.5">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.8px] text-sub">
                {s.replace("_", " ")}
              </p>
              <p className="text-[20px] font-bold text-ink">{counts[s] ?? 0}</p>
            </div>
          ))}
          <div className="rounded-lg border border-border bg-card p-2.5">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.8px] text-sub">
              Sends today
            </p>
            <p className="text-[20px] font-bold text-ink">{dash.sendsToday ?? 0}</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-2.5">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.8px] text-sub">
              Sends · 7 days
            </p>
            <p className="text-[20px] font-bold text-ink">{dash.sendsWeek ?? 0}</p>
          </div>
        </div>
      )}

      {/* G58 approval queue — "Tomorrow's send" */}
      {queue && (
        <SectionCard title="Tomorrow's send — approval queue (next 7 days)">
          {queue.length === 0 && (
            <p className="text-[12px] text-sub">
              No verified observances in the next 7 days. Verify dates in
              Observances first; they appear here for approval.
            </p>
          )}
          {queue.map((row) => (
            <div
              key={row.slug}
              className={`mb-2 rounded-[7px] border p-2.5 last:mb-0 ${
                row.approved
                  ? "border-dharma-bd bg-dharma-bg/40"
                  : "border-pratha-bd bg-pratha-bg/40"
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[13px] font-bold text-ink">
                    {row.name}
                  </span>
                  <span className="ml-2 text-[11px] text-sub">
                    {row.date} · reaches {row.memberCount} active member
                    {row.memberCount === 1 ? "" : "s"} at 6pm IST the evening
                    before
                  </span>
                </div>
                {row.approved ? (
                  <span className="text-[11px] font-bold text-dharma-fg">
                    ✓ Approved by {row.approvedBy}
                    {row.approvedAt ? ` · ${fmtDateTime(row.approvedAt)}` : ""}
                  </span>
                ) : (
                  <Btn
                    kind="primary"
                    disabled={busySlug === row.slug}
                    onClick={() => void approve(row)}
                  >
                    {busySlug === row.slug ? "Approving…" : "Approve send"}
                  </Btn>
                )}
              </div>
              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-[5px] border border-border bg-bg p-2 font-sans text-[11.5px] leading-relaxed text-body">
                {row.previewText}
              </pre>
            </div>
          ))}
          <p className="mt-2 text-[10px] leading-4 text-sub">
            G58 gate: the scheduler sends ONLY occasions that are verified AND
            approved here. Policy intends approver ≠ verifier (two-person rule)
            — honour it even though a single admin can technically do both.
          </p>
        </SectionCard>
      )}

      {/* flagged sends — prominent */}
      {dash && (
        <SectionCard
          title={`Flagged sends — failed twice, never retried (${flagged.length})`}
        >
          {flagged.length === 0 ? (
            <p className="text-[12px] text-sub">
              Nothing flagged. A send lands here after its single +60s retry
              also fails; it is never retried again.
            </p>
          ) : (
            <Table headers={["Number", "Template", "Occasion", "Reason", "At"]}>
              {flagged.map((s, i) => (
                <tr key={i} className="bg-bhranti-bg/30">
                  <Td className="font-mono">{s.waNumber}</Td>
                  <Td>{s.templateId}</Td>
                  <Td>{s.occasionSlug}</Td>
                  <Td className="text-[#8a2040]">
                    {s.failureReason ?? "provider error (no detail recorded)"}
                  </Td>
                  <Td>{fmtDateTime(s.sentAt)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </SectionCard>
      )}

      {/* recent sends */}
      {dash && (
        <SectionCard title="Recent sends (last 50)">
          {(dash.recentSends ?? []).length === 0 ? (
            <p className="text-[12px] text-sub">No sends yet.</p>
          ) : (
            <Table
              headers={[
                "Number",
                "Template",
                "Occasion",
                "Status",
                "Delivery",
                "Time",
              ]}
            >
              {(dash.recentSends ?? []).map((s, i) => (
                <tr key={i}>
                  <Td className="font-mono">{s.waNumber}</Td>
                  <Td>{s.templateId}</Td>
                  <Td>{s.occasionSlug}</Td>
                  <Td>
                    <Pill text={s.status ?? "?"} cls={sendStatusCls(s.status)} />
                  </Td>
                  <Td>
                    {s.deliveryStatus ? (
                      <Pill
                        text={s.deliveryStatus}
                        cls={
                          s.deliveryStatus === "FAILED"
                            ? "bg-bhranti-bg text-[#8a2040] border-bhranti-bd"
                            : "bg-dharma-bg text-dharma-fg border-dharma-bd"
                        }
                      />
                    ) : (
                      <span className="text-sub">—</span>
                    )}
                  </Td>
                  <Td>{fmtDateTime(s.sentAt)}</Td>
                </tr>
              ))}
            </Table>
          )}
        </SectionCard>
      )}

      {/* members */}
      <SectionCard
        title={`Members${membersList ? ` (${membersList.length})` : ""}`}
        aside={
          <div className="w-[180px]">
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              allowEmpty
              emptyLabel="All statuses"
              options={MEMBER_STATUSES.map((s) => ({ value: s }))}
            />
          </div>
        }
      >
        {!membersList ? (
          <Loading />
        ) : membersList.length === 0 ? (
          <p className="text-[12px] text-sub">No members for this filter.</p>
        ) : (
          <Table
            headers={["Number", "Status", "Joined", "Entry point", "Note"]}
          >
            {membersList.map((m) => (
              <tr key={m.id}>
                <Td className="font-mono">{m.waNumber}</Td>
                <Td>
                  <Pill
                    text={m.status ?? "?"}
                    cls={
                      m.status === "ACTIVE"
                        ? "bg-dharma-bg text-dharma-fg border-dharma-bd"
                        : m.status === "BLOCKED" || m.status === "DELETE_REQUESTED"
                          ? "bg-bhranti-bg text-[#8a2040] border-bhranti-bd"
                          : "bg-bg text-sub border-border"
                    }
                  />
                </Td>
                <Td>{fmtDateTime(m.joinedAt)}</Td>
                <Td>{m.entryPointPage ?? "—"}</Td>
                <Td>{m.statusNote ?? "—"}</Td>
              </tr>
            ))}
          </Table>
        )}
        <p className="mt-2 text-[10px] leading-4 text-sub">
          Numbers are masked to their last 4 digits server-side; the full number
          never leaves the backend through this API. STOPPED and BLOCKED
          numbers are retained solely so they are never contacted again;
          DELETE_REQUESTED records purge fully 7 days after the request.
        </p>
      </SectionCard>
    </div>
  );
}
