"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  fmtDateTime,
  listAdminArticles,
  type AdminArticle,
} from "@/lib/admin";
import {
  Empty,
  Loading,
  Msg,
  PageHead,
  Select,
  StatusPill,
  Table,
  Td,
} from "@/components/admin/ui";

const STATUSES = ["DRAFT", "REVIEW", "PUBLISHED"];

export default function AdminArticlesPage() {
  const [items, setItems] = useState<AdminArticle[] | null>(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async (s: string) => {
    setItems(null);
    setError("");
    const res = await listAdminArticles(s || undefined);
    if (res.ok) setItems(res.data?.items ?? []);
    else setError(res.message);
  }, []);

  useEffect(() => {
    void load(status);
  }, [status, load]);

  return (
    <div>
      <PageHead
        title="Articles"
        aside={
          <>
            <Select
              value={status}
              onChange={setStatus}
              allowEmpty
              emptyLabel="All statuses"
              options={STATUSES.map((s) => ({ value: s }))}
              className="!w-[140px]"
            />
            <Link
              href="/admin/articles/new"
              className="rounded-[5px] bg-cta px-2.5 py-1 text-[11px] font-bold text-white"
            >
              + New article
            </Link>
          </>
        }
      />
      {error && <Msg kind="error">{error}</Msg>}
      {!items && !error && <Loading />}
      {items && items.length === 0 && <Empty>No articles yet.</Empty>}
      {items && items.length > 0 && (
        <Table headers={["Slug", "Title", "Status", "Category", "Updated"]}>
          {items.map((a) => (
            <tr key={a.slug} className="hover:bg-bg">
              <Td>
                <Link
                  href={`/admin/articles/${a.slug}`}
                  className="font-mono text-[11px] font-bold text-cta hover:underline"
                >
                  {a.slug}
                </Link>
              </Td>
              <Td>{a.lang?.en?.title ?? <span className="text-sub">—</span>}</Td>
              <Td>
                <StatusPill status={a.status} />
              </Td>
              <Td className="whitespace-nowrap text-sub">
                {a.category}
                {a.subCategory ? ` / ${a.subCategory}` : ""}
              </Td>
              <Td className="whitespace-nowrap text-sub">
                {fmtDateTime(a.updatedAt)}
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}
