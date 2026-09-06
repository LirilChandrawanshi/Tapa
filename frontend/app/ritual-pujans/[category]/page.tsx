import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/Breadcrumb";
import { SectionHeader } from "@/components/SectionHeader";
import { ProductCard } from "@/components/shop/ProductCard";
import { fetchProducts } from "@/lib/shop";
import { getSection } from "@/lib/taxonomy";

export const dynamic = "force-dynamic";

function categoryLink(category: string) {
  return getSection("ritual-pujans").children.find(
    (c) => (c.href.split("/").pop() ?? "") === category,
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const child = categoryLink(category);
  return { title: child ? `${child.label} · Ritual Pujans` : "Ritual Pujans" };
}

export default async function RitualPujansCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const child = categoryLink(category);
  if (!child) notFound();

  const products = await fetchProducts(category);

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Ritual Pujans", href: "/ritual-pujans" },
          { label: child.label },
        ]}
      />
      <div className="mx-auto max-w-[1280px] px-4 py-9 md:px-10">
        <SectionHeader
          eyebrow="Ritual Pujans"
          title={child.label}
          description={child.description}
          count={
            products.length > 0
              ? `${products.length} pujan${products.length === 1 ? "" : "s"}`
              : undefined
          }
        />
        {products.length === 0 ? (
          <div className="mx-auto max-w-[480px] py-12 text-center">
            <h2 className="mb-2 text-lg font-bold text-ink">
              Nothing here yet
            </h2>
            <p className="text-[13.5px] leading-relaxed text-sub">
              This collection opens soon. The guides it will pair with are
              already free on the knowledge layer.
            </p>
            <Link
              href="/ritual-pujans"
              className="mt-4 inline-block text-[13.5px] font-bold text-cta"
            >
              All Ritual Pujans ›
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
