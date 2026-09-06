import type { Metadata } from "next";
import { ArticleRoute } from "@/components/article/ArticleRoute";
import { fetchArticleSafe } from "@/lib/articleExtras";

/**
 * ISR — rendered on demand, cached for an hour, and purged instantly via
 * the `article:{slug}` / `articles` tags when the backend publishes.
 */
export const revalidate = 3600;

/**
 * No build-time enumeration: the backend may be down while `next build`
 * runs, so every slug renders on first request and is then cached.
 */
export function generateStaticParams(): { category: string; slug: string }[] {
  return [];
}

type Params = { params: Promise<{ category: string; slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const { article } = await fetchArticleSafe(slug);
  if (!article) return { title: "Ritual Guide" };
  return {
    title: article.lang.en.title,
    description:
      article.lang.en.deck ?? article.lang.en.heroSubtitle ?? undefined,
  };
}

export default async function RitualGuideArticlePage({ params }: Params) {
  const { slug } = await params;
  return <ArticleRoute slug={slug} sectionKey="ritual-guides" />;
}
