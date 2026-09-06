"use client";

/**
 * Article editor — the pragmatic core of the admin panel.
 *
 * Metadata + DPB + EN content + ordered blocks editor, with a raw-JSON
 * escape hatch for anything the form doesn't cover (hi content, meta maps,
 * related slugs…). DPB rules are mirrored client-side as inline warnings;
 * the server remains the enforcer at publish (422 surfaces inline).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type {
  Block,
  BlockType,
  FastingForm,
  Myth,
  SamagriItem,
  VidhiStep,
} from "@/lib/types";
import {
  createAdminArticle,
  dpbWarnings,
  getAdminArticle,
  publicGet,
  publishArticle,
  submitArticleReview,
  unpublishArticle,
  updateAdminArticle,
  type AdminArticle,
  type AdminArticleContent,
  type AdminDpb,
} from "@/lib/admin";
import {
  Btn,
  Check,
  Field,
  Input,
  Loading,
  Msg,
  NumInput,
  PageHead,
  SectionCard,
  Select,
  StatusPill,
  TextArea,
} from "@/components/admin/ui";

const ARTICLE_TYPES = [
  "RITUAL_GUIDE",
  "DHARMIC_CONCEPT",
  "BEGINNER_GUIDE",
  "FESTIVAL_GUIDE",
];
const DPB_TAGS = ["DHARMA", "PRATHA", "BHRANTI", "MIXED"];
const SOURCE_CLASSES = ["VEDIC", "PURANIC", "NIBANDHA", "BHAKTI", "CUSTOM"];
const HUE_CLASSES = [
  "h-teej", "h-krishna", "h-shiva", "h-ganesh", "h-devi", "h-vishnu",
  "h-earth", "h-thread", "h-data", "h-sanskar", "h-gold",
];
const BLOCK_TYPES: BlockType[] = [
  "INTRO", "ORIGIN", "SIGNIFICANCE_QUOTE", "SANKALPA", "SAMAGRI", "VIDHI",
  "MANTRA", "FASTING", "KATHA", "MYTHS", "QA", "PROSE",
];
const SCORES = ["1", "2", "3", "4", "5"];

interface TaxonomyDoc {
  pillars?: {
    key: string;
    labelEn?: string;
    children?: { key: string; labelEn?: string }[];
  }[];
}

const BLANK: AdminArticle = {
  slug: "",
  type: "RITUAL_GUIDE",
  category: "ritual-guides",
  subCategory: "",
  lang: { en: { title: "", blocks: [] } },
  dpb: null,
  isFeatured: false,
};

function emptyBlock(type: BlockType): Block {
  const base: Block = { type };
  switch (type) {
    case "VIDHI":
      return { ...base, steps: [] };
    case "SAMAGRI":
      return { ...base, samagri: [] };
    case "MYTHS":
      return { ...base, myths: [] };
    case "MANTRA":
      return {
        ...base,
        mantra: {
          devanagari: "",
          transliteration: "",
          meaning: "",
          defaultCount: 11,
          presets: [11, 21, 108],
        },
      };
    case "SANKALPA":
      return { ...base, sankalpa: { devanagari: "", transliteration: "", gloss: "" } };
    case "FASTING":
      return {
        ...base,
        fasting: [
          { name: "Nirjala", description: "", recommended: false },
          { name: "Sajal", description: "", recommended: true },
          { name: "Phalahar", description: "", recommended: false },
        ],
      };
    default:
      return { ...base, text: "" };
  }
}

export default function ArticleEditorPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const routeSlug = decodeURIComponent(params.slug);
  const isNew = routeSlug === "new";

  const [article, setArticle] = useState<AdminArticle | null>(
    isNew ? { ...BLANK } : null,
  );
  const [taxonomy, setTaxonomy] = useState<TaxonomyDoc | null>(null);
  const [raw, setRaw] = useState(false);
  const [rawText, setRawText] = useState("");
  const [rawError, setRawError] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState<{
    kind: "error" | "ok" | "warn";
    lines: string[];
  } | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    void publicGet<TaxonomyDoc>("/taxonomy").then((res) => {
      if (res.ok) setTaxonomy(res.data);
    });
    if (!isNew) {
      void getAdminArticle(routeSlug).then((res) => {
        if (res.ok && res.data) setArticle(res.data);
        else setLoadError(res.ok ? "Empty response" : res.message);
      });
    }
  }, [routeSlug, isNew]);

  /* ---------- state helpers ---------- */

  const patch = useCallback((p: Partial<AdminArticle>) => {
    setArticle((a) => (a ? { ...a, ...p } : a));
  }, []);

  const patchEn = useCallback((p: Partial<AdminArticleContent>) => {
    setArticle((a) =>
      a
        ? {
            ...a,
            lang: { ...(a.lang ?? {}), en: { ...(a.lang?.en ?? {}), ...p } },
          }
        : a,
    );
  }, []);

  const patchDpb = useCallback((p: Partial<AdminDpb>) => {
    setArticle((a) => (a ? { ...a, dpb: { ...(a.dpb ?? {}), ...p } } : a));
  }, []);

  const en = article?.lang?.en ?? {};
  const blocks: Block[] = useMemo(() => en.blocks ?? [], [en.blocks]);

  const setBlocks = useCallback(
    (bs: Block[]) => patchEn({ blocks: bs }),
    [patchEn],
  );
  const updateBlock = (i: number, p: Partial<Block>) =>
    setBlocks(blocks.map((b, j) => (j === i ? { ...b, ...p } : b)));
  const moveBlock = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    setBlocks(next);
  };
  const removeBlock = (i: number) =>
    setBlocks(blocks.filter((_, j) => j !== i));

  /* ---------- derived warnings ---------- */

  const articleDpbWarnings = dpbWarnings(article?.dpb, "article");
  const stepWarnings = blocks.flatMap((b, bi) =>
    b.type === "VIDHI" && b.steps
      ? b.steps.flatMap((s) =>
          dpbWarnings(s.dpb as AdminDpb | undefined, `block ${bi + 1} step ${s.number}`),
        )
      : [],
  );
  const teaserLen = (article?.circleTeaser ?? "").length;

  /* ---------- actions ---------- */

  const currentSlug = isNew ? (article?.slug ?? "").trim() : routeSlug;

  async function save(): Promise<boolean> {
    if (!article) return false;
    if (!currentSlug) {
      setNotice({ kind: "error", lines: ["A slug is required."] });
      return false;
    }
    setBusy("save");
    const res = isNew
      ? await createAdminArticle({ ...article, slug: currentSlug })
      : await updateAdminArticle(currentSlug, article);
    setBusy("");
    if (!res.ok) {
      setNotice({ kind: "error", lines: res.message.split("; ") });
      return false;
    }
    if (res.data) setArticle(res.data);
    setNotice({ kind: "ok", lines: ["Saved."] });
    if (isNew) router.replace(`/admin/articles/${currentSlug}`);
    return true;
  }

  async function workflow(
    label: string,
    fn: (slug: string) => ReturnType<typeof publishArticle>,
    saveFirst: boolean,
  ) {
    if (saveFirst && !(await save())) return;
    setBusy(label);
    const res = await fn(currentSlug);
    setBusy("");
    if (!res.ok) {
      setNotice({ kind: "error", lines: res.message.split("; ") });
      return;
    }
    if (res.data) setArticle(res.data);
    setNotice({ kind: "ok", lines: [`${label} done — status is now ${res.data?.status}.`] });
  }

  /* ---------- render ---------- */

  if (loadError) return <Msg kind="error">{loadError}</Msg>;
  if (!article) return <Loading />;

  const pillars = taxonomy?.pillars ?? [];
  const subCats =
    pillars.find((p) => p.key === article.category)?.children ?? [];

  return (
    <div>
      <PageHead
        title={isNew ? "New article" : `Edit · ${routeSlug}`}
        aside={
          <>
            <StatusPill status={article.status ?? "DRAFT"} />
            <Btn
              onClick={() => {
                if (!raw) {
                  setRawText(JSON.stringify(article, null, 2));
                  setRawError("");
                }
                setRaw(!raw);
              }}
            >
              {raw ? "Form editor" : "Raw JSON"}
            </Btn>
          </>
        }
      />

      {notice && (
        <Msg kind={notice.kind}>
          {notice.lines.map((l) => (
            <div key={l}>{l}</div>
          ))}
        </Msg>
      )}

      {raw ? (
        <SectionCard
          title="Raw article JSON"
          aside={
            <Btn
              kind="primary"
              onClick={() => {
                try {
                  setArticle(JSON.parse(rawText) as AdminArticle);
                  setRawError("");
                  setRaw(false);
                } catch (e) {
                  setRawError(e instanceof Error ? e.message : "Invalid JSON");
                }
              }}
            >
              Apply JSON
            </Btn>
          }
        >
          {rawError && <Msg kind="error">{rawError}</Msg>}
          <TextArea value={rawText} onChange={setRawText} rows={30} mono />
          <p className="mt-1 text-[10px] text-sub">
            Power-user escape hatch — edits the whole document, including
            fields the form doesn&apos;t surface (hi content, meta, relatedSlugs).
          </p>
        </SectionCard>
      ) : (
        <>
          {/* ---------- metadata ---------- */}
          <SectionCard title="Metadata">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <Field label="Slug" className="col-span-2">
                <Input
                  value={article.slug ?? ""}
                  onChange={(v) => patch({ slug: v })}
                  disabled={!isNew}
                  placeholder="hartalika-teej-vrat"
                />
              </Field>
              <Field label="Type">
                <Select
                  value={article.type ?? ""}
                  onChange={(v) => patch({ type: v })}
                  options={ARTICLE_TYPES.map((t) => ({ value: t }))}
                />
              </Field>
              <Field label="Hue class">
                <Select
                  value={article.hueClass ?? ""}
                  onChange={(v) => patch({ hueClass: v || undefined })}
                  allowEmpty
                  options={HUE_CLASSES.map((h) => ({ value: h }))}
                />
              </Field>
              <Field label="Category">
                <Select
                  value={article.category ?? ""}
                  onChange={(v) => patch({ category: v, subCategory: "" })}
                  allowEmpty
                  options={pillars.map((p) => ({
                    value: p.key,
                    label: p.labelEn ?? p.key,
                  }))}
                />
              </Field>
              <Field label="Sub-category">
                <Select
                  value={article.subCategory ?? ""}
                  onChange={(v) => patch({ subCategory: v || undefined })}
                  allowEmpty
                  options={subCats.map((c) => ({
                    value: c.key,
                    label: c.labelEn ?? c.key,
                  }))}
                />
              </Field>
              <Field label="Read minutes">
                <NumInput
                  value={article.readMinutes}
                  onChange={(v) => patch({ readMinutes: v })}
                />
              </Field>
              <Field label="Observance date">
                <Input
                  type="date"
                  value={article.observanceDate ?? ""}
                  onChange={(v) => patch({ observanceDate: v || null })}
                />
              </Field>
              <Field label="Linked observance slug" className="col-span-2">
                <Input
                  value={article.linkedObservanceSlug ?? ""}
                  onChange={(v) => patch({ linkedObservanceSlug: v || null })}
                  placeholder="hartalika-teej-2025"
                />
              </Field>
              <Field
                label="Circle teaser"
                className="col-span-2"
                hint={
                  <span className={teaserLen > 100 ? "font-bold text-cta" : ""}>
                    {teaserLen}/100 chars (WhatsApp T2 body)
                  </span>
                }
              >
                <TextArea
                  value={article.circleTeaser ?? ""}
                  onChange={(v) => patch({ circleTeaser: v || null })}
                  rows={2}
                />
              </Field>
              <div className="flex items-end pb-1">
                <Check
                  checked={article.isFeatured ?? false}
                  onChange={(v) => patch({ isFeatured: v })}
                  label="Featured (hero)"
                />
              </div>
              <Field label="Hero order">
                <NumInput
                  value={article.heroOrder}
                  onChange={(v) => patch({ heroOrder: v })}
                />
              </Field>
            </div>
          </SectionCard>

          {/* ---------- DPB ---------- */}
          <SectionCard title="DPB classification (article level)">
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <Field label="Classification">
                <Select
                  value={article.dpb?.classification ?? ""}
                  onChange={(v) =>
                    v === ""
                      ? patch({ dpb: null })
                      : patchDpb({ classification: v })
                  }
                  allowEmpty
                  emptyLabel="— none —"
                  options={DPB_TAGS.map((t) => ({ value: t }))}
                />
              </Field>
              <Field label="Confidence score" hint="DHARMA 3–5 · PRATHA 1–2 · BHRANTI none">
                <Select
                  value={
                    article.dpb?.confidenceScore != null
                      ? String(article.dpb.confidenceScore)
                      : ""
                  }
                  onChange={(v) =>
                    patchDpb({ confidenceScore: v === "" ? null : Number(v) })
                  }
                  allowEmpty
                  emptyLabel="— none —"
                  options={SCORES.map((s) => ({ value: s }))}
                />
              </Field>
              <Field label="Source name">
                <Input
                  value={article.dpb?.sourceName ?? ""}
                  onChange={(v) => patchDpb({ sourceName: v || null })}
                  placeholder="Shiva Purana"
                />
              </Field>
              <Field label="Source ref">
                <Input
                  value={article.dpb?.sourceRef ?? ""}
                  onChange={(v) => patchDpb({ sourceRef: v || null })}
                  placeholder="Rudra Samhita / …"
                />
              </Field>
              <Field label="Source class">
                <Select
                  value={article.dpb?.sourceClass ?? ""}
                  onChange={(v) => patchDpb({ sourceClass: v || null })}
                  allowEmpty
                  options={SOURCE_CLASSES.map((s) => ({ value: s }))}
                />
              </Field>
              <Field label="Pratha scope">
                <Input
                  value={article.dpb?.prathaScope ?? ""}
                  onChange={(v) => patchDpb({ prathaScope: v || null })}
                  placeholder="North India — UP, Bihar"
                />
              </Field>
              <Field label="Confidence note" className="col-span-2">
                <Input
                  value={article.dpb?.confidenceNote ?? ""}
                  onChange={(v) => patchDpb({ confidenceNote: v || null })}
                />
              </Field>
            </div>
            {articleDpbWarnings.length > 0 && (
              <div className="mt-2">
                <Msg kind="warn">
                  {articleDpbWarnings.map((w) => (
                    <div key={w}>{w}</div>
                  ))}
                </Msg>
              </div>
            )}
          </SectionCard>

          {/* ---------- EN content ---------- */}
          <SectionCard title="English content">
            <div className="grid grid-cols-1 gap-2">
              <Field label="Title">
                <Input
                  value={en.title ?? ""}
                  onChange={(v) => patchEn({ title: v })}
                />
              </Field>
              <Field
                label="Hero subtitle"
                hint={`${(en.heroSubtitle ?? "").length}/120 chars`}
              >
                <Input
                  value={en.heroSubtitle ?? ""}
                  onChange={(v) => patchEn({ heroSubtitle: v })}
                />
              </Field>
              <Field label="Deck">
                <TextArea
                  value={en.deck ?? ""}
                  onChange={(v) => patchEn({ deck: v })}
                  rows={2}
                />
              </Field>
              <Field label="Intro HTML">
                <TextArea
                  value={en.introHtml ?? ""}
                  onChange={(v) => patchEn({ introHtml: v })}
                  rows={4}
                  mono
                />
              </Field>
            </div>
          </SectionCard>

          {/* ---------- blocks ---------- */}
          <SectionCard
            title={`Blocks (${blocks.length})`}
            aside={
              <Btn onClick={() => setBlocks([...blocks, emptyBlock("PROSE")])}>
                + Add block
              </Btn>
            }
          >
            {blocks.length === 0 && (
              <p className="py-3 text-center text-[12px] text-sub">
                No blocks yet — add the ordered body sections here.
              </p>
            )}
            <div className="flex flex-col gap-3">
              {blocks.map((block, i) => (
                <BlockEditor
                  key={i}
                  index={i}
                  block={block}
                  total={blocks.length}
                  onChange={(p) => updateBlock(i, p)}
                  onReplace={(b) => setBlocks(blocks.map((x, j) => (j === i ? b : x)))}
                  onMove={(d) => moveBlock(i, d)}
                  onRemove={() => removeBlock(i)}
                />
              ))}
            </div>
            {stepWarnings.length > 0 && (
              <div className="mt-3">
                <Msg kind="warn">
                  {stepWarnings.map((w) => (
                    <div key={w}>{w}</div>
                  ))}
                </Msg>
              </div>
            )}
          </SectionCard>
        </>
      )}

      {/* ---------- actions ---------- */}
      <div className="sticky bottom-0 z-10 -mx-1 flex items-center gap-2 border-t border-border bg-bg px-1 py-2">
        <Btn kind="primary" onClick={() => void save()} disabled={busy !== ""}>
          {busy === "save" ? "Saving…" : isNew ? "Create draft" : "Save"}
        </Btn>
        {!isNew && (
          <>
            <Btn
              onClick={() => void workflow("Submit for review", submitArticleReview, true)}
              disabled={busy !== "" || article.status === "PUBLISHED"}
            >
              Submit for review
            </Btn>
            <Btn
              onClick={() => void workflow("Publish", publishArticle, true)}
              disabled={busy !== "" || article.status === "PUBLISHED"}
              title="Runs the server-side DPB validator; failures show inline"
            >
              {busy === "Publish" ? "Publishing…" : "Publish"}
            </Btn>
            <Btn
              kind="danger"
              onClick={() => void workflow("Unpublish", unpublishArticle, false)}
              disabled={busy !== "" || article.status !== "PUBLISHED"}
            >
              Unpublish
            </Btn>
          </>
        )}
        <span className="ml-auto text-[10px] text-sub">
          Publish enforces DPB rules server-side — warnings above are the same rules.
        </span>
      </div>
    </div>
  );
}

/* ================= block editor ================= */

function BlockEditor({
  index,
  block,
  total,
  onChange,
  onReplace,
  onMove,
  onRemove,
}: {
  index: number;
  block: Block;
  total: number;
  onChange: (p: Partial<Block>) => void;
  onReplace: (b: Block) => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-[6px] border border-border bg-bg p-2">
      <div className="mb-2 flex items-center gap-2">
        <span className="w-5 text-right font-mono text-[10px] text-sub">
          {index + 1}
        </span>
        <Select
          value={block.type}
          onChange={(v) => onReplace(emptyBlock(v as BlockType))}
          options={BLOCK_TYPES.map((t) => ({ value: t }))}
          className="!w-[170px]"
        />
        <Input
          value={block.title ?? ""}
          onChange={(v) => onChange({ title: v })}
          placeholder="Section title (accordion label)"
          className="flex-1"
        />
        <Btn kind="ghost" onClick={() => onMove(-1)} disabled={index === 0} title="Move up">
          ↑
        </Btn>
        <Btn kind="ghost" onClick={() => onMove(1)} disabled={index === total - 1} title="Move down">
          ↓
        </Btn>
        <Btn kind="danger" onClick={onRemove} title="Remove block">
          ✕
        </Btn>
      </div>
      <BlockBody block={block} onChange={onChange} />
    </div>
  );
}

function BlockBody({
  block,
  onChange,
}: {
  block: Block;
  onChange: (p: Partial<Block>) => void;
}) {
  switch (block.type) {
    case "VIDHI":
      return <VidhiEditor steps={block.steps ?? []} onChange={(steps) => onChange({ steps })} />;
    case "SAMAGRI":
      return <SamagriEditor items={block.samagri ?? []} onChange={(samagri) => onChange({ samagri })} />;
    case "MYTHS":
      return <MythsEditor myths={block.myths ?? []} onChange={(myths) => onChange({ myths })} />;
    case "MANTRA":
      return <MantraEditor block={block} onChange={onChange} />;
    case "SANKALPA":
      return <SankalpaEditor block={block} onChange={onChange} />;
    case "FASTING":
      return <FastingEditor forms={block.fasting ?? []} onChange={(fasting) => onChange({ fasting })} />;
    default:
      return (
        <TextArea
          value={block.text ?? ""}
          onChange={(v) => onChange({ text: v })}
          rows={4}
          placeholder={
            block.type === "SIGNIFICANCE_QUOTE"
              ? "Quote text (attribution via raw JSON meta)"
              : "Rich text / HTML body"
          }
        />
      );
  }
}

function VidhiEditor({
  steps,
  onChange,
}: {
  steps: VidhiStep[];
  onChange: (s: VidhiStep[]) => void;
}) {
  const update = (i: number, p: Partial<VidhiStep>) =>
    onChange(steps.map((s, j) => (j === i ? { ...s, ...p } : s)));
  const renumber = (list: VidhiStep[]) =>
    list.map((s, i) => ({ ...s, number: i + 1 }));
  return (
    <div className="flex flex-col gap-1.5">
      {steps.map((step, i) => {
        const warnings = dpbWarnings(step.dpb as AdminDpb | undefined, `step ${step.number}`);
        return (
          <div key={i} className="rounded-[5px] border border-border-light bg-card p-1.5">
            <div className="flex items-center gap-1.5">
              <span className="w-5 text-right font-mono text-[10px] text-sub">{step.number}</span>
              <Input
                value={step.title}
                onChange={(v) => update(i, { title: v })}
                placeholder="Step title"
                className="!w-[220px]"
              />
              <Select
                value={step.dpb?.classification ?? ""}
                onChange={(v) =>
                  update(i, {
                    dpb: v === "" ? undefined : { ...(step.dpb ?? {}), classification: v } as VidhiStep["dpb"],
                  })
                }
                allowEmpty
                emptyLabel="no tag"
                options={DPB_TAGS.map((t) => ({ value: t }))}
                className="!w-[110px]"
              />
              <Select
                value={step.dpb?.confidenceScore != null ? String(step.dpb.confidenceScore) : ""}
                onChange={(v) =>
                  update(i, {
                    dpb: {
                      ...(step.dpb ?? { classification: "DHARMA" }),
                      confidenceScore: v === "" ? undefined : Number(v),
                    } as VidhiStep["dpb"],
                  })
                }
                allowEmpty
                emptyLabel="score —"
                options={SCORES.map((s) => ({ value: s }))}
                className="!w-[90px]"
              />
              <Btn kind="danger" title="Remove step" onClick={() => onChange(renumber(steps.filter((_, j) => j !== i)))}>
                ✕
              </Btn>
            </div>
            <div className="mt-1 pl-6">
              <TextArea
                value={step.description ?? ""}
                onChange={(v) => update(i, { description: v })}
                rows={2}
                placeholder="Step description"
              />
              {warnings.length > 0 && (
                <p className="mt-0.5 text-[10px] font-bold text-pratha-fg">
                  {warnings.join(" ")}
                </p>
              )}
            </div>
          </div>
        );
      })}
      <div>
        <Btn
          onClick={() =>
            onChange(renumber([...steps, { number: steps.length + 1, title: "" }]))
          }
        >
          + Add step
        </Btn>
      </div>
    </div>
  );
}

function SamagriEditor({
  items,
  onChange,
}: {
  items: SamagriItem[];
  onChange: (s: SamagriItem[]) => void;
}) {
  const update = (i: number, p: Partial<SamagriItem>) =>
    onChange(items.map((s, j) => (j === i ? { ...s, ...p } : s)));
  return (
    <div className="flex flex-col gap-1.5">
      {items.length > 8 && (
        <Msg kind="warn">Samagri checklist holds {items.length} items — the PRD max is 8. Publish will fail.</Msg>
      )}
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <Input
            value={item.name}
            onChange={(v) => update(i, { name: v })}
            placeholder="Item"
            className="!w-[200px]"
          />
          <Input
            value={item.note ?? ""}
            onChange={(v) => update(i, { note: v })}
            placeholder="Note"
            className="flex-1"
          />
          <Check
            checked={item.optional}
            onChange={(v) => update(i, { optional: v })}
            label="optional"
          />
          <Btn kind="danger" title="Remove" onClick={() => onChange(items.filter((_, j) => j !== i))}>
            ✕
          </Btn>
        </div>
      ))}
      <div>
        <Btn onClick={() => onChange([...items, { name: "", optional: false }])}>
          + Add item {items.length >= 8 ? "(over max)" : ""}
        </Btn>
      </div>
    </div>
  );
}

function MythsEditor({
  myths,
  onChange,
}: {
  myths: Myth[];
  onChange: (m: Myth[]) => void;
}) {
  const update = (i: number, p: Partial<Myth>) =>
    onChange(myths.map((m, j) => (j === i ? { ...m, ...p } : m)));
  return (
    <div className="flex flex-col gap-1.5">
      {myths.map((m, i) => (
        <div key={i} className="rounded-[5px] border border-border-light bg-card p-1.5">
          <div className="flex items-start gap-1.5">
            <div className="flex-1">
              <Input
                value={m.question}
                onChange={(v) => update(i, { question: v })}
                placeholder="Myth / question"
              />
              <div className="mt-1">
                <TextArea
                  value={m.answer}
                  onChange={(v) => update(i, { answer: v })}
                  rows={2}
                  placeholder="Corrected answer"
                />
              </div>
            </div>
            <Btn kind="danger" title="Remove" onClick={() => onChange(myths.filter((_, j) => j !== i))}>
              ✕
            </Btn>
          </div>
        </div>
      ))}
      <div>
        <Btn onClick={() => onChange([...myths, { question: "", answer: "" }])}>
          + Add myth
        </Btn>
      </div>
    </div>
  );
}

function MantraEditor({
  block,
  onChange,
}: {
  block: Block;
  onChange: (p: Partial<Block>) => void;
}) {
  const mantra = block.mantra ?? {
    devanagari: "",
    transliteration: "",
    meaning: "",
    defaultCount: 11,
    presets: [11, 21, 108],
  };
  const patch = (p: Partial<typeof mantra>) =>
    onChange({ mantra: { ...mantra, ...p } });
  return (
    <div className="grid grid-cols-1 gap-1.5 md:grid-cols-2">
      <Field label="Devanagari">
        <TextArea value={mantra.devanagari} onChange={(v) => patch({ devanagari: v })} rows={2} />
      </Field>
      <Field label="Transliteration">
        <TextArea value={mantra.transliteration} onChange={(v) => patch({ transliteration: v })} rows={2} />
      </Field>
      <Field label="Meaning">
        <TextArea value={mantra.meaning ?? ""} onChange={(v) => patch({ meaning: v })} rows={2} />
      </Field>
      <div className="grid grid-cols-2 gap-1.5">
        <Field label="Default count">
          <NumInput
            value={mantra.defaultCount}
            onChange={(v) => patch({ defaultCount: v ?? 11 })}
          />
        </Field>
        <Field label="Presets (comma-sep)">
          <Input
            value={(mantra.presets ?? []).join(",")}
            onChange={(v) =>
              patch({
                presets: v
                  .split(",")
                  .map((s) => Number(s.trim()))
                  .filter((n) => Number.isFinite(n) && n > 0),
              })
            }
            placeholder="11,21,108"
          />
        </Field>
      </div>
    </div>
  );
}

function SankalpaEditor({
  block,
  onChange,
}: {
  block: Block;
  onChange: (p: Partial<Block>) => void;
}) {
  const s = block.sankalpa ?? { devanagari: "", transliteration: "", gloss: "" };
  const patch = (p: Partial<typeof s>) => onChange({ sankalpa: { ...s, ...p } });
  return (
    <div className="grid grid-cols-1 gap-1.5 md:grid-cols-3">
      <Field label="Devanagari">
        <TextArea value={s.devanagari} onChange={(v) => patch({ devanagari: v })} rows={2} />
      </Field>
      <Field label="Transliteration">
        <TextArea value={s.transliteration} onChange={(v) => patch({ transliteration: v })} rows={2} />
      </Field>
      <Field label="Gloss">
        <TextArea value={s.gloss ?? ""} onChange={(v) => patch({ gloss: v })} rows={2} />
      </Field>
    </div>
  );
}

function FastingEditor({
  forms,
  onChange,
}: {
  forms: FastingForm[];
  onChange: (f: FastingForm[]) => void;
}) {
  const update = (i: number, p: Partial<FastingForm>) =>
    onChange(forms.map((f, j) => (j === i ? { ...f, ...p } : f)));
  return (
    <div className="flex flex-col gap-1.5">
      {forms.map((f, i) => (
        <div key={i} className="flex items-start gap-1.5">
          <Input
            value={f.name}
            onChange={(v) => update(i, { name: v })}
            placeholder="Nirjala"
            className="!w-[140px]"
          />
          <TextArea
            value={f.description}
            onChange={(v) => update(i, { description: v })}
            rows={1}
            placeholder="What this form involves"
            className="flex-1"
          />
          <label className="mt-1 flex items-center gap-1 whitespace-nowrap text-[11px] text-body">
            <input
              type="radio"
              name="fasting-recommended"
              checked={f.recommended}
              onChange={() =>
                onChange(forms.map((x, j) => ({ ...x, recommended: j === i })))
              }
              className="accent-[#fd066d]"
            />
            recommended
          </label>
          <Btn kind="danger" title="Remove" onClick={() => onChange(forms.filter((_, j) => j !== i))}>
            ✕
          </Btn>
        </div>
      ))}
      <div>
        <Btn onClick={() => onChange([...forms, { name: "", description: "", recommended: false }])}>
          + Add form
        </Btn>
      </div>
    </div>
  );
}
