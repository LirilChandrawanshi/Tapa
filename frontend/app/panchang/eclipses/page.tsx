import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/Breadcrumb";
import { CategoryHero } from "@/components/CategoryHero";
import { TimingDataTag } from "@/components/panchang/DataMeta";

export const metadata: Metadata = {
  title: "Eclipses & Sutak Kaal — Why Visibility Decides Everything | Tapa",
  description:
    "How solar and lunar eclipses work in the panchang, when Sutak Kaal begins, and why an eclipse you cannot see from your city changes nothing.",
};

export default function EclipsesPage() {
  return (
    <main className="pb-16">
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Panchang", href: "/panchang" },
          { label: "Eclipses" },
        ]}
      />

      <CategoryHero
        variant="pa"
        eyebrow="Panchang · Explainer"
        title="Eclipses & Sutak: visibility decides everything"
        description="Grahan timings are pure astronomy — but what you observe depends entirely on whether the eclipse is visible from your city. That one rule resolves most confusion."
        meta={[
          { value: "Surya", label: "solar grahan" },
          { value: "Chandra", label: "lunar grahan" },
          { value: "Sutak", label: "the period before" },
        ]}
        side={
          <div>
            <p className="mb-2 text-[10px] font-bold tracking-[1px] text-eyebrow-dark uppercase">
              The one-line version
            </p>
            <p className="text-[13px] leading-relaxed text-hero-text/80">
              If an eclipse is not visible from your city, tradition holds
              that no Sutak applies there — however dramatic the headlines. An
              eclipse over the Pacific changes nothing in Delhi.
            </p>
          </div>
        }
      />

      <div className="mx-auto max-w-[760px] px-4 pt-8 md:px-10">
        <TimingDataTag className="mb-6" />

        <article className="space-y-5 text-[15px] leading-[1.85] text-body">
          <p>
            <b>What an eclipse is, in panchang terms.</b> A solar eclipse
            (Surya Grahan) can only occur on Amavasya, when the Moon stands
            between the Earth and the Sun; a lunar eclipse (Chandra Grahan)
            only on Purnima, when the Earth stands between the two. The
            panchang treats a grahan as a precisely bounded window — first
            contact to last contact — computed astronomically. There is no
            ambiguity in the timing itself; every almanac agrees to the
            minute.
          </p>
          <p>
            <b>Sutak Kaal is the period before.</b> Tradition marks an
            inauspicious span leading into the eclipse: reckoned as four
            prahars (about twelve hours) before a solar eclipse and three
            prahars (about nine hours) before a lunar one. During Sutak,
            custom holds that temples close their doors, new undertakings and
            cooked food are set aside, and routine puja pauses until the
            eclipse ends and spaces are cleansed. How strictly households
            observe this varies widely by region and family practice.
          </p>
          <p>
            <b>Visibility is the deciding rule.</b> Sutak applies only where
            the eclipse itself can be seen. A penumbral lunar eclipse that is
            imperceptible to the eye, or an eclipse that occurs below your
            horizon, carries no Sutak in the traditional reckoning — which is
            why one grahan fills the news yet your local temple keeps normal
            hours, and the next one quietly reorders the whole day. Before
            changing any plan, the only two questions that matter are: is it
            visible from my city, and between which times.
          </p>
        </article>

        <div className="mt-8 rounded-[13px] border border-data-bd bg-data-bg px-5 py-4">
          <p className="text-[12.5px] leading-relaxed text-data-fg">
            <b>Detailed guides land soon</b> — each 2026 grahan with its
            city-wise visibility and Sutak window will get its own timing
            page. Until then, the{" "}
            <Link href="/panchang/festival-calendar" className="font-bold underline">
              festival calendar
            </Link>{" "}
            carries every confirmed date of the year.
          </p>
        </div>
      </div>
    </main>
  );
}
