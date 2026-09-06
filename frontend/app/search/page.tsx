import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { SearchClient } from "@/components/staticpages/SearchClient";

export const metadata: Metadata = {
  title: "Search",
  description:
    "Search rituals, festivals, mantras, panchang dates and glossary terms — definitions first, knowledge before commerce.",
};

export default function SearchPage() {
  return (
    <div>
      <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Search" }]} />
      <Suspense
        fallback={
          <div className="mx-auto max-w-[1280px] px-4 py-10 md:px-10">
            <div className="h-[52px] animate-pulse rounded-[13px] border border-border bg-card" />
          </div>
        }
      >
        <SearchClient />
      </Suspense>
    </div>
  );
}
