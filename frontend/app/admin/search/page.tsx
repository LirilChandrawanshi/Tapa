"use client";

/**
 * Search operations: zero-result queries (editorial backlog signal, grouped
 * client-side) and the curated popular-search chips (full-list replace).
 */

import { useCallback, useEffect, useState } from "react";
import {
  fmtDateTime,
  getPopularSearches,
  getZeroResults,
  replacePopularSearches,
  type AdminPopularSearch,
  type ZeroResultQuery,
} from "@/lib/admin";
import {
  Btn,
  Check,
  Empty,
  Input,
  Loading,
  Msg,
  PageHead,
  SectionCard,
  Table,
  Td,
} from "@/components/admin/ui";

interface GroupedQuery {
  query: string;
  count: number;
  lastSeen: string;
}

export default function AdminSearchPage() {
  const [zero, setZero] = useState<GroupedQuery[] | null>(null);
  const [zeroError, setZeroError] = useState("");
  const [popular, setPopular] = useState<AdminPopularSearch[] | null>(null);
  const [popMsg, setPopMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    const [zr, ps] = await Promise.all([getZeroResults(50), getPopularSearches()]);
    if (zr.ok) setZero(group(zr.data ?? []));
    else setZeroError(zr.message);
    if (ps.ok) setPopular(ps.data ?? []);
    else setPopMsg({ kind: "error", text: ps.message });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function group(rows: ZeroResultQuery[]): GroupedQuery[] {
    const map = new Map<string, GroupedQuery>();
    for (const row of rows) {
      const key = row.normalizedQuery ?? row.query ?? "";
      if (!key) continue;
      const existing = map.get(key);
      const at = row.at ?? "";
      if (existing) {
        existing.count += 1;
        if (at > existing.lastSeen) existing.lastSeen = at;
      } else {
        map.set(key, { query: row.query ?? key, count: 1, lastSeen: at });
      }
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }

  const patchPopular = (i: number, p: Partial<AdminPopularSearch>) =>
    setPopular((list) => (list ? list.map((x, j) => (j === i ? { ...x, ...p } : x)) : list));

  const movePopular = (i: number, dir: -1 | 1) =>
    setPopular((list) => {
      if (!list) return list;
      const j = i + dir;
      if (j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  async function savePopular() {
    if (!popular) return;
    setPopMsg(null);
    const body = popular.map((p, i) => ({ ...p, order: i + 1 }));
    const res = await replacePopularSearches(body);
    if (res.ok) {
      setPopular(res.data ?? body);
      setPopMsg({ kind: "ok", text: "Popular searches replaced." });
    } else {
      setPopMsg({ kind: "error", text: res.message });
    }
  }

  return (
    <div>
      <PageHead title="Search" aside={<Btn onClick={() => void load()}>Refresh</Btn>} />

      <SectionCard title="Zero-result queries (last 50 logged)">
        {zeroError && <Msg kind="error">{zeroError}</Msg>}
        {!zero && !zeroError && <Loading />}
        {zero && zero.length === 0 && <Empty>No zero-result queries — nothing slipping through.</Empty>}
        {zero && zero.length > 0 && (
          <Table headers={["Query", "Occurrences", "Last seen"]}>
            {zero.map((q) => (
              <tr key={q.query} className="hover:bg-bg">
                <Td className="font-bold">{q.query}</Td>
                <Td>{q.count}</Td>
                <Td className="whitespace-nowrap text-sub">{fmtDateTime(q.lastSeen)}</Td>
              </tr>
            ))}
          </Table>
        )}
      </SectionCard>

      <SectionCard
        title="Popular searches (curated chips)"
        aside={
          <div className="flex gap-2">
            <Btn
              onClick={() =>
                setPopular([...(popular ?? []), { label: "", targetUrl: "", active: true }])
              }
            >
              + Add
            </Btn>
            <Btn kind="primary" onClick={() => void savePopular()}>
              Save list
            </Btn>
          </div>
        }
      >
        {popMsg && <Msg kind={popMsg.kind}>{popMsg.text}</Msg>}
        {!popular && <Loading />}
        {popular && popular.length === 0 && <Empty>No curated chips yet.</Empty>}
        {popular && (
          <div className="flex flex-col gap-1.5">
            {popular.map((p, i) => (
              <div key={p.id ?? `new-${i}`} className="flex items-center gap-1.5">
                <span className="w-5 text-right font-mono text-[10px] text-sub">{i + 1}</span>
                <Input
                  value={p.label ?? ""}
                  onChange={(v) => patchPopular(i, { label: v })}
                  placeholder="Label"
                  className="!w-[200px]"
                />
                <Input
                  value={p.targetUrl ?? ""}
                  onChange={(v) => patchPopular(i, { targetUrl: v })}
                  placeholder="/ritual-guides/…"
                  className="flex-1"
                />
                <Check
                  checked={p.active ?? true}
                  onChange={(v) => patchPopular(i, { active: v })}
                  label="active"
                />
                <Btn kind="ghost" onClick={() => movePopular(i, -1)} disabled={i === 0}>
                  ↑
                </Btn>
                <Btn kind="ghost" onClick={() => movePopular(i, 1)} disabled={i === popular.length - 1}>
                  ↓
                </Btn>
                <Btn
                  kind="danger"
                  onClick={() => setPopular(popular.filter((_, j) => j !== i))}
                >
                  ✕
                </Btn>
              </div>
            ))}
            <p className="mt-1 text-[10px] text-sub">
              Order here is display order. &quot;Save list&quot; replaces the whole set.
            </p>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
