import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/staticExtras";
import { TAXONOMY } from "@/lib/taxonomy";

/**
 * Static route sitemap. Article/observance URLs are added once the
 * content library is seeded; the kits section is feature-flagged and
 * deliberately absent until launch.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const entry = (
    path: string,
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"],
    priority: number,
  ): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  });

  const categoryChildren = TAXONOMY.filter(
    (section) => section.key !== "ritual-pujans",
  ).flatMap((section) =>
    section.children.map((child) =>
      entry(
        child.href,
        child.href === "/panchang/today" ? "daily" : "weekly",
        child.href === "/panchang/today" ? 0.9 : 0.7,
      ),
    ),
  );

  return [
    entry("/", "daily", 1),
    entry("/ritual-guides", "weekly", 0.9),
    entry("/panchang", "daily", 0.9),
    entry("/dharmic-concepts", "weekly", 0.8),
    ...categoryChildren,
    entry("/glossary", "weekly", 0.7),
    entry("/search", "monthly", 0.4),
    entry("/about", "monthly", 0.5),
    entry("/editorial-method", "monthly", 0.6),
    entry("/report-correction", "monthly", 0.4),
    entry("/work-with-us", "monthly", 0.4),
    entry("/tapa-circle", "monthly", 0.6),
  ];
}
