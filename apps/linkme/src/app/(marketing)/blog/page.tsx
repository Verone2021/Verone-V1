/**
 * Page /blog - Index des articles publiés
 *
 * SSG : la liste est figée au build. Quand un article passe de
 * draft → published, un rebuild est nécessaire (ou ISR via revalidate).
 *
 * @module BlogIndexPage
 * @since 2026-05-15 - LM-SEO-NAV-BLOG-001
 */

import Link from 'next/link';

import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';

import { getPublishedArticles } from '@/lib/blog/articles';

export const dynamic = 'force-static';
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Blog LinkMe — Affiliation, ambassadeurs, réseaux',
  description:
    'Guides et conseils pour monétiser votre réseau ou votre audience avec LinkMe.',
  openGraph: {
    title: 'Blog LinkMe — Affiliation, ambassadeurs, réseaux',
    description:
      'Guides et conseils pour monétiser votre réseau ou votre audience avec LinkMe.',
    url: '/blog',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Blog LinkMe',
      },
    ],
  },
  alternates: {
    canonical: '/blog',
  },
};

const PAGE_SIZE = 10;

export default function BlogIndexPage(): JSX.Element {
  const articles = getPublishedArticles().slice(0, PAGE_SIZE);

  return (
    <section className="pt-24 pb-20 lg:pt-32 lg:pb-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#183559] mb-6 leading-tight">
            Le blog LinkMe
          </h1>
          <p className="text-lg md:text-xl text-[#183559]/70 max-w-2xl mx-auto leading-relaxed">
            Guides, retours d&apos;expérience et bonnes pratiques pour monétiser
            votre réseau ou votre audience.
          </p>
        </header>

        {articles.length === 0 ? (
          <div className="text-center py-12 text-[#183559]/60">
            <p className="text-lg">
              Les premiers articles arrivent bientôt. Reviens vite.
            </p>
          </div>
        ) : (
          <ul className="space-y-6">
            {articles.map(article => (
              <li
                key={article.slug}
                className="bg-white p-6 lg:p-8 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <Link
                  href={`/blog/${article.slug}`}
                  className="block group"
                  aria-label={`Lire l'article : ${article.title}`}
                >
                  <p className="text-sm text-[#5DBEBB] font-medium mb-2">
                    {new Date(article.date).toLocaleDateString('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <h2 className="text-2xl font-semibold text-[#183559] mb-3 group-hover:text-[#5DBEBB] transition-colors">
                    {article.title}
                  </h2>
                  <p className="text-[#183559]/70 leading-relaxed mb-4">
                    {article.description}
                  </p>
                  <span className="inline-flex items-center gap-2 text-sm font-medium text-[#5DBEBB]">
                    Lire l&apos;article
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
