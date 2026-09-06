"use client";

import { useState, type FormEvent } from "react";
import { submitCorrection } from "@/lib/staticExtras";

/**
 * "Looked for a word and did not find it?" — small capture at the foot
 * of /glossary. Reuses the corrections inbox (Phase-1 pragmatism).
 */
export function SuggestWord() {
  const [word, setWord] = useState("");
  const [whereSeen, setWhereSeen] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!word.trim() || sending) return;
    setSending(true);
    await submitCorrection({
      pageUrl: "/glossary",
      lineAsItStands: "",
      whatItShouldSay: `Glossary word request: ${word.trim()}`,
      source: whereSeen.trim(),
      isPratha: false,
      name: "",
      email: "",
      whatsapp: "",
    });
    setSending(false);
    setSent(true);
  };

  return (
    <section className="grid gap-6 rounded-[18px] border border-border bg-card px-5 py-6 md:grid-cols-2 md:px-[30px] md:py-[28px]">
      <div>
        <h2 className="mb-2 text-[19px] font-bold tracking-[-0.3px] text-ink">
          Looked for a word and did not find it?
        </h2>
        <p className="mb-4 max-w-[420px] text-[13px] leading-relaxed text-sub">
          Tell us the word and where you saw it. Terms people actually search
          for get written first — that is how this list grows.
        </p>
        <ol className="flex flex-col gap-2 text-[12.5px] leading-relaxed text-body">
          {[
            "Tell us the word, spelled however you heard it.",
            "Tell us where you came across it, if you remember.",
            "We write the entry and link it from every guide that uses it.",
          ].map((step, i) => (
            <li key={step} className="flex gap-[10px]">
              <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-bg text-[11px] font-bold text-gold">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>
      <div className="self-center">
        {sent ? (
          <p className="rounded-[11px] border border-dharma-bd bg-dharma-bg px-4 py-4 text-[13px] font-semibold text-dharma-fg">
            Thank you — the word is with us. If it belongs in the glossary, it
            will appear here and be linked from every guide that uses it.
          </p>
        ) : (
          <form onSubmit={send} className="flex flex-col gap-2">
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              placeholder="The word, spelled however you heard it"
              aria-label="Word to suggest"
              maxLength={120}
              className="rounded-[10px] border border-border bg-bg px-3 py-[10px] text-[13px] text-ink outline-none placeholder:text-sub focus:border-cta"
            />
            <input
              type="text"
              value={whereSeen}
              onChange={(e) => setWhereSeen(e.target.value)}
              placeholder="Where you came across it (optional)"
              aria-label="Where you came across the word"
              maxLength={200}
              className="rounded-[10px] border border-border bg-bg px-3 py-[10px] text-[13px] text-ink outline-none placeholder:text-sub focus:border-cta"
            />
            <button
              type="submit"
              disabled={sending || !word.trim()}
              className="self-start rounded-[11px] bg-cta px-[22px] py-[10px] text-[12.5px] font-bold text-white disabled:opacity-50"
            >
              {sending ? "Sending…" : "Suggest a word ›"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
