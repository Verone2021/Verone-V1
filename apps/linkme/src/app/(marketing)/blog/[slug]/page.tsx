/**
 * Page /blog/[slug] - Article individuel
 *
 * SSG via generateStaticParams. Frontmatter + contenu Markdown rendus
 * en HTML statique au build. JSON-LD Article injecté.
 *
 * @module BlogArticlePage
 * @since 2026-05-15 - LM-SEO-NAV-BLOG-001
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ChevronRight } from 'lucide-react';
import type { Metadata } from 'next';

import { ArticleJsonLd } from '@/components/seo/JsonLd';
import { getAllArticleSlugs, getArticleBySlug } from '@/lib/blog/articles';

export const dynamic = 'force-static';
export const revalidate = 3600;

export function generateStaticParams(): { slug: string }[] {
  return getAllArticleSlugs().map(slug => ({ slug }));
}

interface IPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: IPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: 'Article introuvable' };

  return {
    title: article.title,
    description: article.description,
    openGraph: {
      title: article.title,
      description: article.description,
      url: `/blog/${article.slug}`,
      type: 'article',
      publishedTime: article.date,
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    alternates: {
      canonical: `/blog/${article.slug}`,
    },
  };
}

export default async function BlogArticlePage({
  params,
}: IPageProps): Promise<JSX.Element> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <article className="pt-24 pb-20 lg:pt-32 lg:pb-28">
      <ArticleJsonLd
        title={article.title}
        description={article.description}
        slug={article.slug}
        date={article.date}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav
          aria-label="Fil d'Ariane"
          className="mb-8 flex items-center gap-2 text-sm text-[#183559]/60"
        >
          <Link href="/" className="hover:text-[#183559] transition-colors">
            Accueil
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/blog" className="hover:text-[#183559] transition-colors">
            Blog
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-[#183559] truncate">{article.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-12">
          <p className="text-sm text-[#5DBEBB] font-medium mb-3">
            {new Date(article.date).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#183559] leading-tight mb-4">
            {article.title}
          </h1>
          <p className="text-lg text-[#183559]/70 leading-relaxed">
            {article.description}
          </p>
        </header>

        {/* Body */}
        <div
          className="prose prose-lg max-w-none prose-headings:text-[#183559] prose-a:text-[#5DBEBB]"
          dangerouslySetInnerHTML={{ __html: article.contentHtml }}
        />
      </div>
    </article>
  );
}
