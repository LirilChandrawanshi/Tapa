"use client";

/**
 * Correction reports inbox — the RI team's triage queue.
 * new → triaged → fixed | rejected.
 */

import { useCallback, useEffect, useState } from "react";
import {
  fmtDateTime,
  listCorrections,
  setCorrectionStatus,
  type AdminCorrection,
} from "@/lib/admin";
import {
  Btn,
  Empty,
  Loading,
  Msg,
  PageHead,
  Select,
  Table,
  Td,
} from "@/components/admin/ui";

const STATUSES = ["new", "triaged", "fixed", "rejected", "all"];

export default function AdminCorrectionsPage() {
  const [status, setStatus] = useState("new");
  const [items, setItems] = useState<AdminCorrection[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setItems(null);
    setError("");
    const res = await listCorrections(status);
    if (res.ok) setItems(res.data ?? []);
    else setError(res.message);
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function transition(id: string, next: string) {
    const res = await setCorrectionStatus(id, next);
    if (!res.ok) setError(res.message);
    else void load();
  }

  return (
    <div>
      <PageHead
        title="Corrections"
        aside={
          <Select
            value={status}
            onChange={setStatus}
            options={STATUSES.map((s) => ({ value: s }))}
            className="!w-[120px]"
          />
        }
      />
      {error && <Msg kind="error">{error}</Msg>}
      {!items && !error && <Loading />}
      {items && items.length === 0 && <Empty>No {status === "all" ? "" : status} correction reports.</Empty>}
      {items && items.length > 0 && (
        <Table headers={["Page", "As it stands", "Should say", "Source", "Pratha?", "Reporter", "Status", "Received", "Move to"]}>
          {items.map((c) => (
            <tr key={c.id} className="hover:bg-bg">
              <Td className="max-w-[160px] break-all font-mono text-[10px]">{c.pageUrl}</Td>
              <Td className="max-w-[200px]">{c.lineAsItStands}</Td>
              <Td className="max-w-[200px]">{c.whatItShouldSay}</Td>
              <Td className="max-w-[140px] text-sub">{c.source ?? "—"}</Td>
              <Td>{c.isPratha ? "yes" : "no"}</Td>
              <Td className="text-sub">
                {c.name ?? "—"}
                {c.whatsapp ? <div className="font-mono text-[10px]">{c.whatsapp}</div> : null}
                {c.email ? <div className="font-mono text-[10px]">{c.email}</div> : null}
              </Td>
              <Td className="font-bold">{c.status}</Td>
              <Td className="whitespace-nowrap text-sub">{fmtDateTime(c.createdAt)}</Td>
              <Td>
                <div className="flex gap-1">
                  {["triaged", "fixed", "rejected"]
                    .filter((s) => s !== c.status)
                    .map((s) => (
                      <Btn key={s} onClick={() => void transition(c.id ?? "", s)}>
                        {s}
                      </Btn>
                    ))}
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
