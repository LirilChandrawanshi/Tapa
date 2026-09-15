import { PanchangLoadingBody } from "@/components/panchang/PanchangLoadingBody";
import { PanchangSubnav } from "@/components/panchang/PanchangSubnav";

/**
 * Pending UI for an observance detail page.
 *
 * Without this file the fallback for `/panchang/o/[slug]` was `/panchang`'s
 * own `loading.tsx` — a Suspense boundary covers every nested route that has
 * no closer one — so opening a festival flashed the panchang landing hero
 * ("The calendar that follows the Moon") for as long as the fetches took, and
 * only then swapped to the observance. This is the same band in the same
 * place, with the copy left as placeholders: nothing to read and unread, and
 * no reflow when the real hero lands.
 *
 * The subnav gets no `active` tab — festival vs vrat isn't known until the
 * observance loads, and lighting the wrong one is worse than lighting none.
 */
export default function Loading() {
  const bar = "animate-pulse rounded-lg bg-white/10";
  return (
    <div>
      <section className="hero-pa relative overflow-hidden pt-12 pb-8 md:pt-14 md:pb-11">
        <div className="relative mx-auto grid max-w-[1280px] items-center gap-6 px-4 md:px-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-10">
          <div>
            <div className={`mb-[10px] h-[10px] w-[140px] ${bar}`} />
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <div className={`h-[26px] w-[210px] ${bar}`} />
              <div className={`h-[26px] w-[88px] ${bar}`} />
              <div className={`h-[26px] w-[74px] ${bar}`} />
            </div>
            <div
              className={`h-[34px] w-[min(100%,420px)] md:h-[44px] ${bar}`}
            />
            <div className={`mt-4 h-[18px] w-[min(100%,340px)] ${bar}`} />
            <div className={`mt-2 h-[14px] w-[min(100%,280px)] ${bar}`} />
            <div className={`mt-5 h-[38px] w-[220px] ${bar}`} />
          </div>
        </div>
      </section>

      <PanchangSubnav />
      <PanchangLoadingBody />
    </div>
  );
}
