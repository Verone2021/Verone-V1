import { notFound } from 'next/navigation';

import type { Metadata } from 'next';

import { ArticleBody } from '@/components/journal/ArticleBody';
import { ArticleBreadcrumb } from '@/components/journal/ArticleBreadcrumb';
import { ArticleHero } from '@/components/journal/ArticleHero';
import { ArticleProgressBar } from '@/components/journal/ArticleProgressBar';
import { ArticleProductsSection } from '@/components/journal/ArticleProductsSection';
import { ArticleRelatedSection } from '@/components/journal/ArticleRelatedSection';
import { ArticleShareBar } from '@/components/journal/ArticleShareBar';
import { ArticleViewIncrement } from '@/components/journal/ArticleViewIncrement';
import { JsonLdArticle } from '@/components/seo/JsonLdArticle';
import {
  getArticleBySlug,
  getPublishedArticles,
  getRelatedArticles,
} from '@/lib/article-queries';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return { title: 'Article introuvable' };
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? 'https://veronecollections.fr';
  const ogImage = article.og_image_url ?? article.cover_image_url;

  return {
    title: article.meta_title ?? article.title,
    description: article.meta_description ?? article.excerpt,
    alternates: {
      canonical: article.canonical_url ?? `${siteUrl}/journal/${slug}`,
    },
    openGraph: {
      type: 'article',
      title: article.og_title ?? article.title,
      description: article.og_description ?? article.excerpt,
      ...(ogImage
        ? {
            images: [
              {
                url: ogImage,
                alt: article.og_image_alt ?? article.cover_image_alt,
                width: 1200,
                height: 630,
              },
            ],
          }
        : {}),
      publishedTime: article.published_at ?? undefined,
      authors: [article.author_name],
      section: article.category,
      tags: article.tags,
    },
    twitter: {
      card:
        (article.twitter_card as 'summary' | 'summary_large_image') ??
        'summary_large_image',
      title: article.og_title ?? article.title,
      description: article.og_description ?? article.excerpt,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    robots: {
      index: article.robots_index,
      follow: article.robots_follow,
    },
  };
}

export async function generateStaticParams() {
  const articles = await getPublishedArticles();
  return articles.map(a => ({ slug: a.slug }));
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const relatedArticles = await getRelatedArticles({
    relatedIds: article.related_article_ids,
    currentId: article.id,
    limit: 3,
  });

  return (
    <>
      <JsonLdArticle article={article} />
      <ArticleProgressBar />
      <ArticleViewIncrement slug={slug} />

      <main>
        <ArticleHero article={article} />

        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <ArticleBreadcrumb title={article.title} />
        </div>

        {/* Corps de l'article */}
        <article className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-12">
          <ArticleBody markdown={article.body_markdown} />

          {/* Barre de partage */}
          <div className="mx-auto mt-12 max-w-2xl">
            <ArticleShareBar slug={article.slug} />
          </div>
        </article>

        {/* Produits de l'article */}
        {article.featured_product_ids.length > 0 && (
          <ArticleProductsSection productIds={article.featured_product_ids} />
        )}

        {/* Articles liés */}
        <ArticleRelatedSection articles={relatedArticles} />
      </main>
    </>
  );
}
