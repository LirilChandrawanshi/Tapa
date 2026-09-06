import type { Metadata } from "next";
import { Breadcrumb } from "@/components/Breadcrumb";
import { WorkWithUsForms } from "@/components/staticpages/WorkWithUsForms";

export const metadata: Metadata = {
  title: "Work with us",
  description:
    "Join the Tapa team, apply to the Purohit Network, or stock Tapa kits as a retailer. Small team, Delhi-NCR, building something that has to be right before it is big.",
};

export default function WorkWithUsPage() {
  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "About", href: "/about" },
          { label: "Work with us" },
        ]}
      />

      <section className="hero-rk py-9 md:py-[46px]">
        <div className="mx-auto max-w-[1280px] px-4 md:px-10">
          <p className="mb-[11px] text-[10px] tracking-[1px] text-eyebrow-dark uppercase">
            The Tapa Co. · Careers &amp; partners
          </p>
          <h1 className="mb-[13px] text-[29px] leading-[1.12] font-bold tracking-[-0.8px] text-hero-text md:text-[38px]">
            Work with us
          </h1>
          <p className="max-w-[560px] text-sm leading-[1.8] text-hero-text/70 md:text-[15px]">
            We are small, in Delhi-NCR, and building something that has to be
            right before it is big. Three ways in — the team, the purohit
            network, and the retail shelf.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1280px] px-4 py-9 md:px-10">
        <WorkWithUsForms />
      </div>
    </div>
  );
}
