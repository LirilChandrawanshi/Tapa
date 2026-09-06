import type { Metadata } from "next";
import Link from "next/link";
import { CategoryHero } from "@/components/CategoryHero";
import { SectionHeader } from "@/components/SectionHeader";
import { ProductCard } from "@/components/shop/ProductCard";
import { PhaseClosed } from "@/components/PhaseClosed";
import { getFlags } from "@/lib/flags";
import { fetchProducts } from "@/lib/shop";
import { getSection } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ritual Pujans",
  description:
    "Ritually verified samagri kits — sourced, weighed and sealed, with the free guide and printed ritual card. You do not need a kit to pray.",
};

const ANTI_UPSELL =
  "You do not need a kit to pray — every guide is free. These are for when you want the sourcing done.";

export default async function RitualPujansPage() {
  const __flags = await getFlags();
  if (!__flags.kits_launched) {
    return <PhaseClosed section="kits" />;
  }
  const section = getSection("ritual-pujans");
  const [flags, products] = await Promise.all([getFlags(), fetchProducts()]);

  const shelves = section.children
    .map((child) => {
      const category = child.href.split("/").pop() ?? "";
      return {
        child,
        items: products.filter((p) => p.category === category),
      };
    })
    .filter((s) => s.items.length > 0);

  return (
    <div>
      <CategoryHero
        variant="rk"
        eyebrow="The Tapa Co. · Ritual Pujans"
        title="Ritual Pujans"
        description={ANTI_UPSELL}
        meta={[
          {
            value: products.length > 0 ? String(products.length) : "first",
            label: products.length > 0 ? "pujans this season" : "season soon",
          },
          {
            value: flags.kits_launched ? "Open" : "Soon",
            label: "pre-booking",
          },
          { value: "0", label: "cash on delivery" },
        ]}
        side={
          <div>
            <p className="mb-[10px] text-[10px] font-bold tracking-[0.8px] text-eyebrow-dark uppercase">
              Browse by collection
            </p>
            <div className="flex flex-col">
              {section.children.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  className="flex items-center justify-between gap-3 border-b border-white/10 py-[9px] text-[13px] font-semibold text-hero-text last:border-b-0 hover:text-eyebrow-dark"
                >
                  {child.label}
                  <span aria-hidden className="text-cta">
                    ›
                  </span>
                </Link>
              ))}
            </div>
          </div>
        }
      />

      <div className="mx-auto max-w-[1280px] px-4 py-9 md:px-10">
        {shelves.length === 0 ? (
          <div className="mx-auto max-w-[480px] py-12 text-center">
            <h2 className="mb-2 text-xl font-bold text-ink">
              The pujans are being stocked
            </h2>
            <p className="text-[13.5px] leading-relaxed text-sub">
              Nothing to buy yet — and nothing you need to. Every ritual guide
              on the knowledge layer stays free, kit or no kit.
            </p>
            <Link
              href="/ritual-guides"
              className="mt-4 inline-block text-[13.5px] font-bold text-cta"
            >
              Read the free guides ›
            </Link>
          </div>
        ) : (
          shelves.map(({ child, items }) => (
            <section key={child.href} className="mb-11 last:mb-0">
              <SectionHeader
                title={child.label}
                description={child.description}
                count={`${items.length} pujan${items.length === 1 ? "" : "s"}`}
                viewAllHref={child.href}
              />
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((p) => (
                  <ProductCard key={p.slug} product={p} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}
