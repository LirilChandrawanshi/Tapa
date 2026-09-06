import type { Metadata } from "next";
import { ArticleRoute } from "@/components/article/ArticleRoute";
import { fetchArticleSafe } from "@/lib/articleExtras";

/** SSR — the backend may be down at build time; never fetch at build. */
export const dynamic = "force-dynamic";

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
