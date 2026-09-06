"use client";

/**
 * Glossary CRUD. Definitions cap at 40 words (PRD) — the counter goes red
 * before the server would reject.
 */

import { useCallback, useEffect, useState } from "react";
import {
  deleteGlossaryTerm,
  listAdminGlossary,
  upsertGlossaryTerm,
  wordCount,
  type AdminGlossaryTerm,
} from "@/lib/admin";
import {
  Btn,
  Drawer,
  Empty,
  Field,
  Input,
  Loading,
  Msg,
  PageHead,
  Select,
  Table,
  Td,
  TextArea,
} from "@/components/admin/ui";

const CATEGORIES = ["MATERIAL", "PRACTICE", "TIME_CALENDAR", "TEXT_TERM"];
const LANGUAGES = ["SANSKRIT", "HINDI"];

export default function AdminGlossaryPage() {
  const [items, setItems] = useState<AdminGlossaryTerm[] | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<AdminGlossaryTerm | null>(null);
  const [isNew, setIsNew] = useState(false);

  const load = useCallback(async () => {
    setItems(null);
    setError("");
    const res = await listAdminGlossary();
    if (res.ok) setItems(res.data ?? []);
    else setError(res.message);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(term: AdminGlossaryTerm) {
    const slug = (term.slug ?? "").trim();
    if (!slug) {
      setError("A slug is required.");
      return;
    }
    const res = await upsertGlossaryTerm(slug, term);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setError("");
    setEditing(null);
    void load();
  }

  async function remove(slug: string) {
    if (!confirm(`Delete glossary term "${slug}"? This is immediate.`)) return;
    const res = await deleteGlossaryTerm(slug);
    if (!res.ok) setError(res.message);
    else void load();
  }

  return (
    <div>
      <PageHead
        title="Glossary"
        aside={
          <Btn
            kind="primary"
            onClick={() => {
              setIsNew(true);
              setEditing({ slug: "", term: "", definition: "", category: "PRACTICE" });
            }}
          >
            + New term
          </Btn>
        }
      />

      {error && <Msg kind="error">{error}</Msg>}
      {!items && !error && <Loading />}
      {items && items.length === 0 && <Empty>No glossary terms yet.</Empty>}
      {items && items.length > 0 && (
        <Table headers={["Term", "Slug", "Category", "Definition", "Words", "Lookups", "", ""]}>
          {items.map((t) => {
            const words = wordCount(t.definition);
            return (
              <tr key={t.slug} className="hover:bg-bg">
                <Td className="font-bold">
                  {t.term}
                  {t.devanagari ? <span className="text-sub"> · {t.devanagari}</span> : null}
                </Td>
                <Td className="font-mono text-[11px] text-sub">{t.slug}</Td>
                <Td className="text-sub">{t.category}</Td>
                <Td className="max-w-[340px]">{t.definition}</Td>
                <Td className={words > 40 ? "font-bold text-cta" : "text-sub"}>{words}</Td>
                <Td className="text-sub">{t.lookupCount ?? 0}</Td>
                <Td>
                  <Btn
                    onClick={() => {
                      setIsNew(false);
                      setEditing({ ...t });
                    }}
                  >
                    Edit
                  </Btn>
                </Td>
                <Td>
                  <Btn kind="danger" onClick={() => void remove(t.slug ?? "")}>
                    Delete
                  </Btn>
                </Td>
              </tr>
            );
          })}
        </Table>
      )}

      <Drawer
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={isNew ? "New term" : `Edit · ${editing?.slug}`}
        footer={
          editing && (
            <Btn kind="primary" onClick={() => void save(editing)}>
              Save term
            </Btn>
          )
        }
      >
        {editing && <TermForm t={editing} onChange={setEditing} isNew={isNew} />}
      </Drawer>
    </div>
  );
}

function TermForm({
  t,
  onChange,
  isNew,
}: {
  t: AdminGlossaryTerm;
  onChange: (t: AdminGlossaryTerm) => void;
  isNew: boolean;
}) {
  const patch = (p: Partial<AdminGlossaryTerm>) => onChange({ ...t, ...p });
  const words = wordCount(t.definition);
  return (
    <div className="grid grid-cols-2 gap-2">
      <Field label="Slug">
        <Input value={t.slug ?? ""} onChange={(v) => patch({ slug: v })} disabled={!isNew} />
      </Field>
      <Field label="Term">
        <Input value={t.term ?? ""} onChange={(v) => patch({ term: v })} />
      </Field>
      <Field label="Devanagari">
        <Input value={t.devanagari ?? ""} onChange={(v) => patch({ devanagari: v || undefined })} />
      </Field>
      <Field label="Transliteration">
        <Input value={t.transliteration ?? ""} onChange={(v) => patch({ transliteration: v || undefined })} />
      </Field>
      <Field
        label="Definition"
        className="col-span-2"
        hint={
          <span className={words > 40 ? "font-bold text-cta" : ""}>
            {words}/40 words — the PRD ceiling; the API rejects more.
          </span>
        }
      >
        <TextArea value={t.definition ?? ""} onChange={(v) => patch({ definition: v })} rows={3} />
      </Field>
      <Field label="Category">
        <Select
          value={t.category ?? ""}
          onChange={(v) => patch({ category: v })}
          options={CATEGORIES.map((c) => ({ value: c }))}
        />
      </Field>
      <Field label="Language">
        <Select
          value={t.language ?? ""}
          onChange={(v) => patch({ language: v || undefined })}
          allowEmpty
          options={LANGUAGES.map((l) => ({ value: l }))}
        />
      </Field>
      <Field label="Concept article slug" className="col-span-2">
        <Input
          value={t.conceptArticleSlug ?? ""}
          onChange={(v) => patch({ conceptArticleSlug: v || undefined })}
          placeholder="what-is-panchamrit"
        />
      </Field>
    </div>
  );
}
