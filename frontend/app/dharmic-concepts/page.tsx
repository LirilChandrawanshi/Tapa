import type { Metadata } from "next";
import { CategoryLanding } from "@/components/listing/CategoryLanding";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dharmic Concepts",
  description:
    "The objects, acts and ideas behind the ritual — each explained from a named text, with scripture and custom clearly separated.",
};

export default function DharmicConceptsPage() {
  return (
    <CategoryLanding
      sectionKey="dharmic-concepts"
      variant="dc"
      eyebrow="The Tapa Co. · Knowledge"
      description="What the bilva leaf means. Why the kalash is dressed. Where the word puja comes from. The ideas behind the ritual, each traced to a text you could open yourself."
    />
  );
}
