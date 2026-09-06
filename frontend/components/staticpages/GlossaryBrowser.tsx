"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { GlossaryTerm } from "@/lib/types";
import {
  GLOSSARY_CATEGORY_LABELS,
  GLOSSARY_FILTERS,
  conceptHref,
  groupTermsByLetter,
  type GlossaryCategoryFilter,
} from "@/lib/staticExtras";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

type LangFilter = "all" | "SANSKRIT" | "HINDI";

/**
 * Client half of /glossary — filter bar (category · language · text),
 * A–Z jump bar and the grouped list. Every entry carries id={slug} so
 * search results can deep-link to /glossary#slug.
 */
export function GlossaryBrowser({ terms }: { terms: GlossaryTerm[] }) {
  const [category, setCategory] = useState<GlossaryCategoryFilter>("all");
  const [lang, setLang] = useState<LangFilter>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return terms.filter(
      (t) =>
        (category === "all" || t.category === category) &&
        (lang === "all" || t.language === lang) &&
        (q === "" ||
          t.term.toLowerCase().includes(q) ||
          t.definition.toLowerCase().includes(q) ||
          (t.devanagari ?? "").includes(q) ||
          (t.transliteration ?? "").toLowerCase().includes(q)),
    );
  }, [terms, category, lang, query]);

  const groups = useMemo(() => groupTermsByLetter(filtered), [filtered]);
  const liveLetters = useMemo(
    () => new Set(groups.map((g) => g.letter)),
    [groups],
  );

  if (terms.length === 0) {
    return (
      <div className="rounded-[15px] border border-border bg-card px-6 py-12 text-center">
        <h2 className="mb-2 text-lg font-bold text-ink">
          The glossary is resting for a moment
        </h2>
        <p className="mx-auto max-w-[420px] text-[13px] leading-relaxed text-sub">
          We could not reach the word list just now. Nothing is lost — refresh
          in a little while and every term will be back.
        </p>
      </div>
    );
  }

  const chipCls = (on: boolean) =>
    `rounded-full border px-3 py-[5px] text-xs font-semibold transition-colors ${
      on
        ? "border-cta bg-cta text-white"
        : "border-border bg-card text-body hover:border-cta hover:text-cta"
    }`;

  return (
    <div>
      {/* filter bar */}
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-[15px] border border-border bg-card px-4 py-3">
        <span className="mr-1 text-[10px] font-bold tracking-[0.8px] text-sub uppercase">
          Filter
        </span>
        {GLOSSARY_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setCategory(f.key)}
            className={chipCls(category === f.key)}
          >
            {f.label}
          </button>
        ))}
        <span aria-hidden className="mx-1 hidden h-[22px] w-px bg-border sm:block" />
        {(
          [
            ["all", "All languages"],
            ["SANSKRIT", "Sanskrit"],
            ["HINDI", "Hindi"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setLang(key)}
            className={chipCls(lang === key)}
          >
            {label}
          </button>
        ))}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a word — tithi, sankalp, akshat…"
          aria-label="Filter glossary terms"
          className="min-w-[180px] flex-1 rounded-[10px] border border-border bg-bg px-3 py-[7px] text-[13px] text-ink outline-none placeholder:text-sub focus:border-cta"
        />
        <span className="ml-auto text-[11.5px] text-sub">
          Showing {filtered.length} of {terms.length}
        </span>
      </div>

      {/* alphabet jump bar */}
      <div className="mb-5 flex flex-wrap gap-[3px] rounded-[13px] border border-border bg-card px-3 py-2">
        {ALPHABET.map((letter) =>
          liveLetters.has(letter) ? (
            <a
              key={letter}
              href={`#letter-${letter}`}
              className="flex size-7 items-center justify-center rounded-[7px] text-[11.5px] font-bold text-cta hover:bg-cta hover:text-white"
            >
              {letter}
            </a>
          ) : (
            <span
              key={letter}
              aria-hidden
              className="flex size-7 items-center justify-center text-[11.5px] font-semibold text-border"
            >
              {letter}
            </span>
          ),
        )}
      </div>

      {/* grouped list */}
      {groups.length === 0 ? (
        <div className="rounded-[15px] border border-border bg-card px-5 py-8 text-center text-[13px] text-sub">
          No term matches that. Try a shorter spelling — or suggest the word
          below and we will write the entry.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) => (
            <section key={group.letter} id={`letter-${group.letter}`}>
              <div className="mb-2 flex items-center gap-3">
                <span className="text-[19px] font-bold text-cta">
                  {group.letter}
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="flex flex-col gap-3">
                {group.terms.map((t) => (
                  <GlossaryEntry key={t.slug} term={t} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function GlossaryEntry({ term }: { term: GlossaryTerm }) {
  return (
    <article
      id={term.slug}
      className="scroll-mt-24 rounded-[15px] border border-border bg-card px-5 py-4"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-[17px] font-bold text-ink">{term.term}</h3>
        <span className="rounded-[5px] border border-border bg-bg px-[8px] py-[2px] text-[9.5px] font-bold tracking-[0.5px] text-sub uppercase">
          {GLOSSARY_CATEGORY_LABELS[term.category]}
        </span>
      </div>
      {term.devanagari && (
        <p className="font-devanagari mt-[2px] text-[17px] text-gold">
          {term.devanagari}
        </p>
      )}
      {(term.transliteration || term.language) && (
        <p className="mt-[2px] text-[11.5px] text-sub">
          {term.transliteration && <i>{term.transliteration}</i>}
          {term.transliteration && term.language && " · "}
          {term.language && (
            <span className="font-semibold tracking-[0.4px] uppercase">
              {term.language}
            </span>
          )}
        </p>
      )}
      <p className="mt-2 max-w-[640px] text-[13px] leading-[1.75] text-body">
        {term.definition}
      </p>
      {term.conceptArticleSlug && (
        <Link
          href={conceptHref(term.conceptArticleSlug)}
          className="mt-2 inline-block text-[12.5px] font-bold text-cta"
        >
          Read the concept →
        </Link>
      )}
    </article>
  );
}
