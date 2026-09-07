"use client";

import Link from "next/link";

const ASSURANCES = [
  "Saved rituals are safe",
  "Reminders still scheduled",
  "Your cart is intact",
  "No payment was taken — if you were placing an order, check Order history before retrying",
  "Nothing you were doing has been lost",
] as const;

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="hero-500 relative flex min-h-[640px] items-center overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 [background:radial-gradient(ellipse_60%_80%_at_78%_40%,rgba(255,255,255,0.05)_0%,transparent_62%)]"
      />
      <div className="relative z-[2] mx-auto grid w-full max-w-[1280px] items-center gap-7 px-4 py-9 md:grid-cols-[1.2fr_0.8fr] md:gap-12 md:px-10 md:py-14">
        <div>
          <div className="mb-5 inline-flex items-baseline gap-3 rounded-[14px] border border-white/20 bg-white/[0.08] px-5 pt-[11px] pb-3">
            <span className="text-[31px] leading-none font-bold tracking-[-1.5px] text-yellow md:text-[38px]">
              500
            </span>
            <span className="text-[11px] leading-normal font-bold tracking-[1px] text-hero-text/70">
              ERROR
              <b className="block text-[12.5px] text-white">
                Something went wrong
              </b>
            </span>
          </div>
          <h1 className="mb-4 text-[29px] leading-[1.1] font-bold tracking-[-1px] text-hero-text md:text-[42px]">
            Our lamp went out.
            <br />
            <em className="text-yellow not-italic">We are relighting it.</em>
          </h1>
          <p className="mb-[14px] max-w-[520px] text-[15px] leading-[1.8] text-hero-text/70 md:text-[17px]">
            This one is ours, not yours. Nothing you did caused it and nothing
            you were doing has been lost. Give it a moment and try again.
          </p>
          <p className="mb-[26px] max-w-[480px] border-l-2 border-[rgba(227,181,103,0.35)] pl-4 text-[13px] leading-[1.75] text-hero-text/45 italic">
            &ldquo;If the akhand jyoti goes out, the whole thing is
            wasted.&rdquo; We correct that on every Navratri guide. It applies
            here too — relight it and continue.
          </p>
          <div className="flex flex-wrap gap-[11px]">
            <button
              type="button"
              onClick={reset}
              className="rounded-[11px] bg-white px-6 py-[14px] text-[14.5px] font-bold text-ink"
            >
              Try again
            </button>
            <Link
              href="/"
              className="rounded-[11px] border-[1.5px] border-white/30 bg-white/[0.12] px-[22px] py-[14px] text-[14.5px] font-semibold text-hero-text"
            >
              Go to the homepage
            </Link>
          </div>
        </div>
        <div className="rounded-2xl border border-white/[0.15] bg-white/[0.07] px-[22px] py-5">
          <p className="mb-[13px] text-[9.5px] font-bold tracking-[0.7px] text-eyebrow-dark">
            IF YOU WERE MID-SOMETHING
          </p>
          {ASSURANCES.map((line) => (
            <p
              key={line}
              className="flex items-center justify-between gap-3 border-b-[0.5px] border-white/[0.09] py-[10px] text-sm text-hero-text/85 last:border-b-0"
            >
              <span>{line}</span>
              <span aria-hidden className="text-[15px] text-eyebrow-dark">
                ✓
              </span>
            </p>
          ))}
          <p className="mt-3 border-t border-white/[0.09] pt-3 text-xs leading-[1.7] text-hero-text/50">
            If it keeps happening, message us on WhatsApp and we will look into
            it right away.
          </p>
        </div>
      </div>
    </section>
  );
}
