import type { Metadata } from "next";
import { CategoryLanding } from "@/components/listing/CategoryLanding";

export const revalidate = 900; // ISR — purged via the `articles` tag on publish

export const metadata: Metadata = {
  title: "Ritual Guides",
  description:
    "Step-by-step ritual guides sourced from named scripture — sankalp, samagri, vidhi and mantra, with Dharma and Pratha clearly separated.",
};

export default function RitualGuidesPage() {
  return (
    <CategoryLanding
      sectionKey="ritual-guides"
      variant="rg"
      eyebrow="The Tapa Co. · Knowledge"
      description="Every guide names its source, separates scripture from custom, and never uses fear to make you act. Sankalp, samagri, vidhi and mantra — complete, and calm."
    />
  );
}
