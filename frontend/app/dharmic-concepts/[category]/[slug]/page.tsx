import type { Metadata } from "next";
import { ArticleRoute } from "@/components/article/ArticleRoute";
import { fetchArticleSafe } from "@/lib/articleExtras";

/**
 * Dharmic-concept article — thin wrapper over the same article renderer.
 * Concepts carry no timing blocks, and the source card labels the claim
 * "CORE CLAIM" (driven by article.type inside ArticleView).
 */
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ category: string; slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const { article } = await fetchArticleSafe(slug);
  if (!article) return { title: "Dharmic Concept" };
  return {
    title: article.lang.en.title,
    description:
      article.lang.en.deck ?? article.lang.en.heroSubtitle ?? undefined,
  };
}

export default async function DharmicConceptArticlePage({ params }: Params) {
  const { slug } = await params;
  return <ArticleRoute slug={slug} sectionKey="dharmic-concepts" />;
}
