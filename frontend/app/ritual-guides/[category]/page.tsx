import type { Metadata } from "next";
import { SubCategoryListing } from "@/components/listing/SubCategoryListing";
import { subCategoryLabel } from "@/lib/articleExtras";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category } = await params;
  return { title: `${subCategoryLabel("ritual-guides", category)} · Ritual Guides` };
}

export default async function RitualGuidesCategoryPage({ params }: Params) {
  const { category } = await params;
  return (
    <SubCategoryListing sectionKey="ritual-guides" subCategory={category} />
  );
}
