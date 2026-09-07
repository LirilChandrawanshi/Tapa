import type { Metadata } from "next";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CircleJoin } from "@/components/staticpages/CircleJoin";

export const metadata: Metadata = {
  title: "The Tapa Circle — Your Digital Companion to the Hindu Calendar",
  description:
    "One considered reminder before every vrat and festival, on WhatsApp — the occasion, its complete tithi, and the ritual guide when available. Complimentary, leave any time with STOP.",
};

const WHAT_IT_BRINGS = [
  {
    title: "The occasions that mark the year.",
    body: "One considered reminder before each vrat and festival on the Delhi-NCR calendar — sent the evening before, never a flood.",
  },
  {
    title: "The tithi in its entirety.",
    body: "Its beginning and its end, because an observance belongs to a window of time, not merely a date.",
  },
  {
    title: "The guidance to accompany it.",
    body: "A link to the ritual guide whenever one has been prepared for the occasion. Where one is not yet available, the Circle simply marks the day and its tithi.",
  },
] as const;

const KEPT_SIMPLE = [
  {
    title: "Considered, not constant.",
    body: "The Circle writes when there is an occasion to mark — never simply to fill your phone.",
  },
  {
    title: "Clear, not crowded.",
    body: "Each message carries the essential details of the occasion in one place.",
  },
  {
    title: "Consistent, for everyone.",
    body: "Every member receives the same carefully prepared calendar information.",
  },
  {
    title: "Respectful of your choice.",
    body: "The Circle remains yours for as long as it serves you. Reply STOP whenever you wish to leave.",
  },
] as const;

const DETAILS = [
  [
    "Complimentary",
    "The Tapa Circle is offered complimentary, with no subscription or paid tier.",
  ],
  ["Channel", "WhatsApp, using the number you provide."],
  [
    "Frequency",
    "One reminder before each vrat and festival on the calendar — one per occasion, no more.",
  ],
  [
    "For every member",
    "The same thoughtfully prepared information, with nothing to configure.",
  ],
  [
    "Timings",
    "Calculated according to the Delhi-NCR panchang followed by The Tapa Co.",
  ],
  [
    "First reminder",
    "11 October 2026. Join before then to receive the Circle from its beginning.",
  ],
  ["Leaving the Circle", "Reply STOP whenever you wish. It ends with that message."],
  ["Your number", "Used for The Tapa Circle alone. Never sold or shared."],
] as const;

export default async function TapaCirclePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  // Entry-point capture (#22): nudges link here with ?from=<their page path>;
  // only site-relative paths are accepted before being passed to the join POST.
  const { from } = await searchParams;
  const entryFrom =
    from && from.startsWith("/") && !from.startsWith("//") ? from : undefined;

  return (
    <div>
      <Breadcrumb
        items={[{ label: "Home", href: "/" }, { label: "The Tapa Circle" }]}
      />

      {/* hero */}
      <section className="relative overflow-hidden bg-ink-deep py-9 md:py-[52px]">
        <div
          aria-hidden
          className="absolute inset-0 [background:radial-gradient(ellipse_60%_80%_at_80%_30%,rgba(31,157,82,0.18)_0%,transparent_62%)]"
        />
        <div className="relative mx-auto grid max-w-[1280px] items-center gap-8 px-4 md:grid-cols-[1.2fr_0.8fr] md:px-10">
          <div>
            <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-wa/50 bg-wa/15 px-3 py-[5px] text-[10.5px] font-bold tracking-[1px] text-[#7BD69B]">
              ● COMPLIMENTARY
            </p>
            <p className="mb-[11px] text-[10px] tracking-[1px] text-eyebrow-dark uppercase">
              The Tapa Circle · on WhatsApp
            </p>
            <h1 className="mb-4 text-[29px] leading-[1.12] font-bold tracking-[-0.8px] text-hero-text md:text-[40px]">
              Your Digital Companion to the Hindu Calendar.
            </h1>
            <p className="mb-3 max-w-[520px] text-sm leading-[1.8] text-hero-text/75 md:text-[15px]">
              The sacred calendar carries the rhythm of our observances —
              vrats, festivals and tithis, each with its own time and
              significance. The Tapa Circle keeps you close to that rhythm.
            </p>
            <p className="max-w-[520px] text-sm leading-[1.8] text-hero-text/75 md:text-[15px]">
              Before every vrat and festival on the Delhi-NCR calendar, receive
              a considered reminder with the occasion, its complete tithi and
              the relevant ritual guide, when available.
            </p>
            <div className="mt-5 flex flex-wrap gap-6">
              <span className="text-xs text-hero-text/55">
                <b className="block text-sm font-bold text-eyebrow-dark">
                  Complimentary
                </b>
                Offered by The Tapa Co.
              </span>
              <span className="text-xs text-hero-text/55">
                <b className="block text-sm font-bold text-eyebrow-dark">
                  WhatsApp
                </b>
                Delivered with simplicity
              </span>
              <span className="text-xs text-hero-text/55">
                <b className="block text-sm font-bold text-eyebrow-dark">
                  One message
                </b>
                Per occasion, no more
              </span>
            </div>
          </div>
          <CircleJoin from={entryFrom} />
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-10">
        {/* value prop */}
        <section className="mb-10 max-w-[640px]">
          <h2 className="mb-3 text-[22px] font-bold tracking-[-0.4px] text-ink">
            The calendar, thoughtfully kept.
          </h2>
          <p className="mb-2 text-[14px] leading-[1.85] text-body">
            There is a quiet assurance in knowing what day is approaching. The
            Circle brings the Hindu calendar into your everyday rhythm —
            marking the occasions ahead, preserving the complete tithi, and
            offering the relevant ritual guidance when available.
          </p>
          <p className="text-[14px] leading-[1.85] text-body">
            No interpretation. No noise. Just the right information, at the
            right time.
          </p>
        </section>

        {/* what it brings + kept simple */}
        <section className="mb-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-[18px] border border-border bg-card px-5 py-6 md:px-[26px]">
            <p className="mb-4 text-[10px] font-bold tracking-[0.8px] text-wa uppercase">
              What it brings
            </p>
            <ul className="flex flex-col gap-4">
              {WHAT_IT_BRINGS.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span aria-hidden className="mt-[6px] size-[7px] shrink-0 rounded-full bg-wa" />
                  <span>
                    <span className="block text-[13.5px] font-bold text-ink">
                      {item.title}
                    </span>
                    <span className="mt-[2px] block text-[12.5px] leading-relaxed text-sub">
                      {item.body}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[18px] border border-border bg-card px-5 py-6 md:px-[26px]">
            <p className="mb-4 text-[10px] font-bold tracking-[0.8px] text-gold uppercase">
              The Circle, kept simple
            </p>
            <ul className="flex flex-col gap-4">
              {KEPT_SIMPLE.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span aria-hidden className="mt-[6px] size-[7px] shrink-0 rounded-full bg-gold" />
                  <span>
                    <span className="block text-[13.5px] font-bold text-ink">
                      {item.title}
                    </span>
                    <span className="mt-[2px] block text-[12.5px] leading-relaxed text-sub">
                      {item.body}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* the details */}
        <section className="mb-10">
          <p className="mb-4 text-[10px] font-bold tracking-[1px] text-cta uppercase">
            The details
          </p>
          <dl className="overflow-hidden rounded-[18px] border border-border bg-card">
            {DETAILS.map(([k, v]) => (
              <div
                key={k}
                className="grid gap-1 border-b-[0.5px] border-border-light px-5 py-[14px] last:border-b-0 sm:grid-cols-[200px_1fr] sm:gap-5 md:px-[26px]"
              >
                <dt className="text-[13px] font-bold text-ink">{k}</dt>
                <dd className="text-[13px] leading-relaxed text-sub">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* close */}
        <section className="rounded-[18px] bg-ink-deep px-5 py-9 text-center md:px-10">
          <p aria-hidden className="mb-3 text-lg text-cta">
            ✽
          </p>
          <h2 className="mb-3 text-[19px] font-bold tracking-[0.5px] text-hero-text md:text-[22px]">
            THE DAYS THAT MATTER, REMEMBERED.
          </h2>
          <p className="mx-auto mb-2 max-w-[480px] text-[13px] leading-[1.8] text-[#C4A882]">
            The Hindu calendar is more than a sequence of dates. It is a rhythm
            of observance — of vrat, utsav, prayer and pause. The Tapa Circle
            exists to help you remain in step with it.
          </p>
          <p className="mb-5 text-[14px] font-bold text-eyebrow-dark italic">
            Your Digital Companion to the Hindu Calendar.
          </p>
          <p className="text-[11.5px] text-hero-text/50">
            Complimentary, by The Tapa Co. — the join box is at the top of this
            page.
          </p>
        </section>
      </div>
    </div>
  );
}
