"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Pill } from "@/components/Pill";
import {
  badgeVariant,
  fetchPopularSearches,
  searchSite,
  submitCorrection,
  type PopularSearch,
  type SearchHit,
  type SearchPayload,
} from "@/lib/staticExtras";

type Status = "idle" | "loading" | "done" | "error";

/**
 * /search — URL-state client search. Results render in the hard order:
 * glossary definition first, then Ritual Guides, then Panchang dates,
 * then Kits (hidden when empty). Knowledge before commerce, always.
 */
export function SearchClient() {
  const router = useRouter();
  const params = useSearchParams();
  const q = params.get("q")?.trim() ?? "";

  const [input, setInput] = useState(q);
  const [status, setStatus] = useState<Status>(q ? "loading" : "idle");
  const [payload, setPayload] = useState<SearchPayload | null>(null);
  const [popular, setPopular] = useState<PopularSearch[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInput(q);
    if (!q) {
      setStatus("idle");
      setPayload(null);
      return;
    }
    let cancelled = false;
    setStatus("loading");
    searchSite(q)
      .then((res) => {
        if (cancelled) return;
        setPayload(res);
        setStatus("done");
        if (res.popular.length > 0) setPopular(res.popular);
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [q]);

  useEffect(() => {
    fetchPopularSearches().then((list) => {
      if (list.length > 0) {
        setPopular((prev) => (prev.length > 0 ? prev : list));
      }
    });
  }, []);

  const runSearch = (term: string) => {
    const next = term.trim();
    if (!next) return;
    router.replace(`/search?q=${encodeURIComponent(next)}`);
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    runSearch(input);
  };

  const hasResults = payload !== null && payload.totalCount > 0;

  return (
    <div>
      {/* search bar band */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-[1280px] px-4 py-4 md:px-10">
          <form
            onSubmit={onSubmit}
            className="flex items-center gap-2 rounded-[13px] border border-border bg-bg px-4 py-[10px] focus-within:border-cta"
          >
            <span aria-hidden className="text-[19px] text-sub">
              ⌕
            </span>
            <input
              ref={inputRef}
              autoFocus
              type="search"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search rituals, festivals, mantras…"
              aria-label="Search rituals, festivals, mantras"
              className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-sub"
            />
            {input && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setInput("");
                  inputRef.current?.focus();
                }}
                className="px-1 text-sm text-sub hover:text-ink"
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              className="shrink-0 rounded-[10px] bg-cta px-[18px] py-[8px] text-[12.5px] font-bold text-white"
            >
              Search
            </button>
          </form>

          {status === "done" && payload && (
            <p className="mt-[10px] text-[13px] text-sub">
              <b className="text-ink">
                {payload.totalCount} result{payload.totalCount === 1 ? "" : "s"}
              </b>{" "}
              for <b className="text-ink">&ldquo;{payload.query}&rdquo;</b>
              {hasResults && (
                <>
                  {payload.glossary.length > 0 &&
                    ` · ${payload.glossary.length} definition${payload.glossary.length === 1 ? "" : "s"}`}
                  {payload.guides.length > 0 &&
                    ` · ${payload.guides.length} guide${payload.guides.length === 1 ? "" : "s"}`}
                  {payload.dates.length > 0 &&
                    ` · ${payload.dates.length} date${payload.dates.length === 1 ? "" : "s"}`}
                  {payload.kits.length > 0 &&
                    ` · ${payload.kits.length} kit${payload.kits.length === 1 ? "" : "s"}`}
                </>
              )}
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-7 md:grid-cols-[1fr_300px] md:px-10">
        <div className="min-w-0">
          {status === "idle" && <IdleState popular={popular} onPick={runSearch} />}
          {status === "loading" && <LoadingSkeleton />}
          {status === "error" && <ErrorState onRetry={() => runSearch(q)} />}
          {status === "done" && payload && hasResults && (
            <ResultGroups payload={payload} />
          )}
          {status === "done" && payload && !hasResults && (
            <EmptyState payload={payload} popular={popular} onPick={runSearch} />
          )}
        </div>

        <aside className="flex flex-col gap-4 md:sticky md:top-4 md:self-start">
          {popular.length > 0 && (
            <div className="rounded-[15px] border border-border bg-card p-[18px]">
              <p className="mb-[10px] text-[10px] font-bold tracking-[0.8px] text-gold uppercase">
                Popular right now
              </p>
              <div className="flex flex-wrap gap-[7px]">
                {popular.map((p) => (
                  <Link
                    key={p.label}
                    href={p.targetUrl || `/search?q=${encodeURIComponent(p.label)}`}
                    className="rounded-full border border-border bg-bg px-3 py-[5px] text-xs font-semibold text-body hover:border-cta hover:text-cta"
                  >
                    {p.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
          <div className="rounded-[15px] bg-ink-deep p-[18px]">
            <p className="mb-2 text-[10px] font-bold tracking-[0.8px] text-eyebrow-dark uppercase">
              How results are ordered
            </p>
            <p className="text-[12.5px] leading-relaxed text-[#C4A882]">
              Knowledge before commerce — definitions, then guides, then dates,
              then kits. A <b className="text-hero-text">definition comes first</b>{" "}
              when the query is a term, in the results as everywhere else.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ───────────────────────────── sub-views ───────────────────────────── */

function IdleState({
  popular,
  onPick,
}: {
  popular: PopularSearch[];
  onPick: (q: string) => void;
}) {
  return (
    <div className="rounded-[15px] border border-border bg-card px-6 py-10 text-center">
      <p aria-hidden className="mb-3 text-3xl text-sub">
        ⌕
      </p>
      <h1 className="mb-2 text-xl font-bold text-ink">
        What would you like to look up?
      </h1>
      <p className="mx-auto mb-5 max-w-[420px] text-[13px] leading-relaxed text-sub">
        Rituals, festivals, mantras, panchang dates and glossary terms — all in
        one place, definitions first.
      </p>
      {popular.length > 0 && (
        <div className="flex flex-wrap justify-center gap-[7px]">
          {popular.map((p) => (
            <button
              key={p.label}
              onClick={() => onPick(p.label)}
              className="rounded-full border border-border bg-bg px-3 py-[5px] text-xs font-semibold text-body hover:border-cta hover:text-cta"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div aria-busy className="flex animate-pulse flex-col gap-3">
      <div className="h-[150px] rounded-[15px] border border-border bg-card" />
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-[86px] rounded-[13px] border border-border bg-card" />
      ))}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-[15px] border border-border bg-card px-6 py-12 text-center">
      <h2 className="mb-2 text-lg font-bold text-ink">
        Search is resting — try again in a moment
      </h2>
      <p className="mx-auto mb-5 max-w-[420px] text-[13px] leading-relaxed text-sub">
        We could not reach the search index just now. Nothing you did caused
        it, and nothing is lost.
      </p>
      <button
        onClick={onRetry}
        className="rounded-[11px] bg-cta px-[22px] py-[10px] text-[12.5px] font-bold text-white"
      >
        Try again
      </button>
    </div>
  );
}

function ResultGroups({ payload }: { payload: SearchPayload }) {
  const [answer, ...moreDefinitions] = payload.glossary;
  return (
    <div className="flex flex-col gap-6">
      {answer && <DefinitionCard hit={answer} />}
      {moreDefinitions.length > 0 && (
        <Group title={`GLOSSARY · ${moreDefinitions.length + 1}`} seeAllHref="/glossary">
          {moreDefinitions.map((hit, i) => (
            <HitRow key={`${hit.title}-${i}`} hit={hit} fallbackType="Glossary" />
          ))}
        </Group>
      )}
      {payload.guides.length > 0 && (
        <Group
          title={`RITUAL GUIDES · ${payload.guides.length}`}
          seeAllHref="/ritual-guides"
        >
          {payload.guides.map((hit, i) => (
            <HitRow key={`${hit.title}-${i}`} hit={hit} fallbackType="Ritual Guides" />
          ))}
        </Group>
      )}
      {payload.dates.length > 0 && (
        <Group title={`PANCHANG · ${payload.dates.length}`} seeAllHref="/panchang">
          {payload.dates.map((hit, i) => (
            <HitRow key={`${hit.title}-${i}`} hit={hit} fallbackType="Panchang" />
          ))}
        </Group>
      )}
      {payload.kits.length > 0 && (
        <Group title={`RITUAL KITS · ${payload.kits.length}`}>
          {payload.kits.map((hit, i) => (
            <HitRow key={`${hit.title}-${i}`} hit={hit} fallbackType="Ritual Kits" />
          ))}
        </Group>
      )}
    </div>
  );
}

/** The glossary answer card — distinct and larger, always first. */
function DefinitionCard({ hit }: { hit: SearchHit }) {
  return (
    <div className="overflow-hidden rounded-[15px] border-[1.5px] border-gold/40 bg-card">
      <div className="border-b border-border-light bg-pratha-bg px-5 py-[9px] text-[10px] font-bold tracking-[0.8px] text-gold uppercase">
        Definition · from the glossary
      </div>
      <div className="px-5 py-5">
        <h2 className="text-[24px] font-bold tracking-[-0.4px] text-ink">
          {hit.title}
        </h2>
        {hit.badge && (
          <div className="mt-1">
            <Pill variant={badgeVariant(hit.badge)}>{hit.badge}</Pill>
          </div>
        )}
        {hit.subtitle && (
          <p className="mt-3 max-w-[560px] text-[14px] leading-[1.8] text-body">
            {hit.subtitle}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3 text-[12.5px] font-bold">
          {hit.href && (
            <Link href={hit.href} className="text-cta">
              Read the full entry ›
            </Link>
          )}
          <Link href="/glossary" className="text-gold">
            Open the glossary ›
          </Link>
        </div>
      </div>
    </div>
  );
}

function Group({
  title,
  seeAllHref,
  children,
}: {
  title: string;
  seeAllHref?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[11px] font-bold tracking-[0.8px] text-gold uppercase">
          {title}
        </h2>
        {seeAllHref && (
          <Link href={seeAllHref} className="text-[12px] font-bold text-cta">
            See all ›
          </Link>
        )}
      </div>
      <div className="overflow-hidden rounded-[15px] border border-border bg-card">
        {children}
      </div>
    </section>
  );
}

function HitRow({ hit, fallbackType }: { hit: SearchHit; fallbackType: string }) {
  const body = (
    <>
      <span
        aria-hidden
        className={`${hit.hueClass ?? "h-data"} block size-[52px] shrink-0 rounded-[10px]`}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-bold tracking-[0.6px] text-gold uppercase">
          {hit.resultType || fallbackType}
        </span>
        <span className="mt-[2px] block text-[15px] leading-tight font-bold text-ink">
          {hit.title}
        </span>
        {hit.subtitle && (
          <span className="mt-[3px] block text-[12.5px] leading-relaxed text-sub">
            {hit.subtitle}
          </span>
        )}
      </span>
      {hit.badge && (
        <Pill variant={badgeVariant(hit.badge)} className="shrink-0 self-center">
          {hit.badge}
        </Pill>
      )}
    </>
  );
  const cls =
    "flex items-start gap-4 border-b-[0.5px] border-border-light px-[18px] py-[14px] last:border-b-0 hover:bg-[#FCFAF6]";
  return hit.href ? (
    <Link href={hit.href} className={cls}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function EmptyState({
  payload,
  popular,
  onPick,
}: {
  payload: SearchPayload;
  popular: PopularSearch[];
  onPick: (q: string) => void;
}) {
  const [request, setRequest] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!request.trim() || sending) return;
    setSending(true);
    // Pragmatic Phase-1 reuse of the corrections inbox as a request capture.
    await submitCorrection({
      pageUrl: "/search",
      lineAsItStands: `Empty search: "${payload.query}"`,
      whatItShouldSay: `Search content request: ${request.trim()}`,
      source: "",
      isPratha: false,
      name: "",
      email: "",
      whatsapp: "",
    });
    setSending(false);
    setSent(true);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-[15px] border border-border bg-card px-6 py-9 text-center">
        <p aria-hidden className="mb-3 text-3xl text-sub">
          ⌕
        </p>
        <h2 className="mb-2 text-xl font-bold text-ink">
          No results for &ldquo;{payload.query}&rdquo;
        </h2>
        <p className="mx-auto mb-5 max-w-[460px] text-[13px] leading-relaxed text-sub">
          Spellings vary a great deal across regions, and ours is only one of
          them. Try a shorter word — or tell us what you were looking for.
          Searches that come up empty are how this library grows.
        </p>

        {payload.didYouMean.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-[11px] font-bold tracking-[0.6px] text-gold uppercase">
              Did you mean
            </p>
            <div className="flex flex-wrap justify-center gap-[7px]">
              {payload.didYouMean.map((s) => (
                <button
                  key={s}
                  onClick={() => onPick(s)}
                  className="rounded-full border border-cta/40 bg-bg px-3 py-[5px] text-xs font-bold text-cta hover:bg-cta hover:text-white"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {popular.length > 0 && (
          <div>
            <p className="mb-2 text-[11px] font-bold tracking-[0.6px] text-gold uppercase">
              Popular right now
            </p>
            <div className="flex flex-wrap justify-center gap-[7px]">
              {popular.map((p) => (
                <button
                  key={p.label}
                  onClick={() => onPick(p.label)}
                  className="rounded-full border border-border bg-bg px-3 py-[5px] text-xs font-semibold text-body hover:border-cta hover:text-cta"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="rounded-[15px] border border-border bg-card px-5 py-5">
        <p className="mb-1 text-[13.5px] font-bold text-ink">
          Tell us what you needed
        </p>
        <p className="mb-3 text-[12.5px] leading-relaxed text-sub">
          An empty search is the clearest signal we get about what is missing.
          Terms people actually look for get written first.
        </p>
        {sent ? (
          <p className="rounded-[10px] border border-dharma-bd bg-dharma-bg px-4 py-3 text-[12.5px] font-semibold text-dharma-fg">
            Noted, with thanks. What people ask for is what we write next.
          </p>
        ) : (
          <form onSubmit={send} className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              placeholder="The word, ritual or date you were looking for"
              aria-label="What were you looking for?"
              maxLength={300}
              className="min-w-0 flex-1 rounded-[10px] border border-border bg-bg px-3 py-[9px] text-[13px] text-ink outline-none placeholder:text-sub focus:border-cta"
            />
            <button
              type="submit"
              disabled={sending || !request.trim()}
              className="shrink-0 rounded-[10px] bg-cta px-[18px] py-[9px] text-[12.5px] font-bold text-white disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send it to us"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
