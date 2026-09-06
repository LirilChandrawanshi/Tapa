"use client";

/** "Notify me" capture list for pre-launch surfaces (kits, purohit). */

import { useCallback, useEffect, useState } from "react";
import {
  fmtDateTime,
  listNotifyRequests,
  type AdminNotifyRequest,
} from "@/lib/admin";
import {
  Empty,
  Loading,
  Msg,
  PageHead,
  Table,
  Td,
} from "@/components/admin/ui";

export default function AdminNotifyPage() {
  const [items, setItems] = useState<AdminNotifyRequest[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setItems(null);
    setError("");
    const res = await listNotifyRequests();
    if (res.ok) setItems(res.data ?? []);
    else setError(res.message);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <PageHead title={`Notify list${items ? ` (${items.length})` : ""}`} />
      {error && <Msg kind="error">{error}</Msg>}
      {!items && !error && <Loading />}
      {items && items.length === 0 && <Empty>No notify requests yet.</Empty>}
      {items && items.length > 0 && (
        <Table headers={["Context", "Phone", "Article", "Captured"]}>
          {items.map((n) => (
            <tr key={n.id} className="hover:bg-bg">
              <Td className="font-bold">{n.context}</Td>
              <Td className="font-mono text-[11px]">{n.phone}</Td>
              <Td className="font-mono text-[11px] text-sub">{n.articleSlug ?? "—"}</Td>
              <Td className="whitespace-nowrap text-sub">{fmtDateTime(n.createdAt)}</Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
