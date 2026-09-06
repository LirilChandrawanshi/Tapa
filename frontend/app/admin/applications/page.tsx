"use client";

/** Work-with-us applications inbox: team / purohit / retailer. */

import { useCallback, useEffect, useState } from "react";
import {
  fmtDateTime,
  listApplications,
  type AdminApplication,
} from "@/lib/admin";
import {
  Empty,
  Loading,
  Msg,
  PageHead,
  Select,
  Table,
  Td,
} from "@/components/admin/ui";

const TYPES = ["team", "purohit", "retailer"];

export default function AdminApplicationsPage() {
  const [type, setType] = useState("");
  const [items, setItems] = useState<AdminApplication[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setItems(null);
    setError("");
    const res = await listApplications(type || undefined);
    if (res.ok) setItems(res.data ?? []);
    else setError(res.message);
  }, [type]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <PageHead
        title="Applications"
        aside={
          <Select
            value={type}
            onChange={setType}
            allowEmpty
            emptyLabel="All types"
            options={TYPES.map((t) => ({ value: t }))}
            className="!w-[130px]"
          />
        }
      />
      {error && <Msg kind="error">{error}</Msg>}
      {!items && !error && <Loading />}
      {items && items.length === 0 && <Empty>No applications yet.</Empty>}
      {items && items.length > 0 && (
        <Table headers={["Type", "Fields", "Status", "Received"]}>
          {items.map((a) => (
            <tr key={a.id} className="hover:bg-bg">
              <Td className="font-bold">{a.type}</Td>
              <Td>
                <dl className="grid grid-cols-[auto_1fr] gap-x-2 text-[11px]">
                  {Object.entries(a.fields ?? {}).map(([k, v]) => (
                    <div key={k} className="contents">
                      <dt className="font-bold text-sub">{k}</dt>
                      <dd className="break-all">{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              </Td>
              <Td className="text-sub">{a.status}</Td>
              <Td className="whitespace-nowrap text-sub">{fmtDateTime(a.createdAt)}</Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
