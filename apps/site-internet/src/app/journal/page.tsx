import { Suspense } from 'react';

import type { Metadata } from 'next';

import { JournalCategoryFilter } from '@/components/journal/JournalCategoryFilter';
import { JournalFeaturedArticle } from '@/components/journal/JournalFeaturedArticle';
import { JournalGrid } from '@/components/journal/JournalGrid';
import { JournalHero } from '@/components/journal/JournalHero';
import { getPublishedArticles } from '@/lib/article-queries';

export const metadata: Metadata = {
  title: 'Journal — Idées déco & guides intérieur | Vérone',
  description:
    'Inspiration, guides pratiques et tendances pour aménager ton intérieur avec goût. Le journal Vérone.',
  openGraph: {
    title: 'Journal Vérone — Idées déco & guides intérieur',
    description:
      'Inspiration, guides pratiques et tendances pour aménager ton intérieur avec goût.',
    type: 'website',
  },
};

interface JournalPageProps {
  searchParams: Promise<{ categorie?: string }>;
}

export default async function JournalPage({ searchParams }: JournalPageProps) {
  const { categorie } = await searchParams;
  const activeCategory = categorie ?? 'Tous';

  const articles = await getPublishedArticles({
    category: activeCategory !== 'Tous' ? activeCategory : undefined,
  });

  const featured = articles.find(a => a.is_featured) ?? articles[0] ?? null;
  const grid = featured ? articles.filter(a => a.id !== featured.id) : articles;

  return (
    <main>
      <JournalHero />

      <div className="mx-auto max-w-6xl px-4 py-12 md:px-8 md:py-16">
        {/* Filtres */}
        <div className="mb-10">
          <Suspense fallback={null}>
            <JournalCategoryFilter activeCategory={activeCategory} />
          </Suspense>
        </div>

        {articles.length === 0 ? (
          /* État vide */
          <div className="py-24 text-center">
            <p className="font-bodoni text-2xl italic text-[#9B9B98]">
              Le journal arrive bientôt.
            </p>
          </div>
        ) : (
          <>
            {/* Article à la une */}
            {featured && <JournalFeaturedArticle article={featured} />}

            {/* Grille */}
            <JournalGrid articles={grid} />
          </>
        )}
      </div>
    </main>
  );
}
