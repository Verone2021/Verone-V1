'use client';

import Link from 'next/link';

import { ArrowRight } from 'lucide-react';

import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedProductsSection } from '@/components/home/FeaturedProductsSection';
import { CategoryTiles } from '@/components/home/CategoryTiles';
import { InspirationBanner } from '@/components/home/InspirationBanner';
import { HomepageReviews } from '@/components/home/HomepageReviews';
import { NewsletterSection } from '@/components/home/NewsletterSection';
import { useCatalogueProducts } from '@/hooks/use-catalogue-products';
import { useCollections } from '@/hooks/use-collections';
import { useReassuranceContent } from '@/hooks/use-site-content';

export default function HomePage() {
  const { data: products } = useCatalogueProducts({
    sortBy: 'newest',
    limit: 6,
    offset: 0,
  });

  const { data: collections } = useCollections();
  const featuredCollections = collections?.slice(0, 3);
  const { data: reassuranceContent } = useReassuranceContent();

  const defaultValues: Array<{
    title: string;
    description: string;
    icon: string;
  }> = [
    {
      title: 'Sourcing créatif',
      description:
        'On chine, on déniche, on sélectionne : chaque pièce est choisie pour son originalité et sa qualité.',
      icon: '🔍',
    },
    {
      title: 'Qualité-prix',
      description:
        'Des produits de qualité à des prix justes, sans les marges excessives du circuit traditionnel.',
      icon: '💰',
    },
    {
      title: 'Sélection curatée',
      description:
        'Notre catalogue est petit, mais chaque pièce y est pour une bonne raison. On ne vend que ce qui nous plaît.',
      icon: '✨',
    },
    {
      title: 'Service attentif',
      description:
        'Une petite équipe qui connaît ses produits. On répond vite, on conseille bien.',
      icon: '🤝',
    },
  ];
  const reassuranceItems = reassuranceContent?.items ?? defaultValues;

  return (
    <div>
      {/* 1. Hero — split layout avec image produit */}
      <HeroSection />

      {/* 2. Catégories — tuiles visuelles (legacy, à retirer Sprint 4) */}
      {products && products.length > 0 && <CategoryTiles products={products} />}

      {/* 3. Nos trouvailles — 4 produits éditoriaux (Sprint 2) */}
      <FeaturedProductsSection />

      {/* 4. Valeurs / Reassurance — fond noir, 4 colonnes avec icônes */}
      <section className="bg-verone-black py-12 md:py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400 mb-3">
              Notre philosophie
            </p>
            <h2 className="font-playfair text-4xl font-bold text-verone-white">
              Ce qui nous différencie
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 text-center">
            {defaultValues.map((item, index) => (
              <div key={index}>
                <p className="text-4xl mb-4">{item.icon}</p>
                <h4 className="font-playfair text-lg font-semibold text-verone-white mb-3">
                  {reassuranceItems[index]?.title ?? item.title}
                </h4>
                <p className="text-sm text-verone-gray-400 leading-relaxed">
                  {reassuranceItems[index]?.description ?? item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Inspiration — bannière plein écran */}
      <InspirationBanner />

      {/* 6. Collections */}
      {featuredCollections && featuredCollections.length > 0 && (
        <section className="py-12 md:py-24">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 mb-3">
                Thématiques
              </p>
              <h2 className="font-playfair text-4xl font-bold text-verone-black">
                Nos Collections
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredCollections.map(collection => (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.slug ?? collection.id}`}
                  className="group"
                >
                  <div className="border border-verone-gray-200 bg-white hover:shadow-luxury transition-all duration-500 overflow-hidden">
                    <div className="bg-verone-gray-100 h-64 overflow-hidden">
                      <div className="w-full h-full bg-verone-gray-200 group-hover:scale-[1.02] transition-transform duration-700" />
                    </div>
                    <div className="p-6">
                      <h4 className="font-playfair text-xl font-semibold text-verone-black mb-2">
                        {collection.name}
                      </h4>
                      {collection.description && (
                        <p className="text-sm text-verone-gray-500 line-clamp-2 mb-3">
                          {collection.description}
                        </p>
                      )}
                      <span className="flex items-center gap-1 text-xs text-verone-black uppercase tracking-wide group-hover:gap-2 transition-all duration-300">
                        Découvrir <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-12">
              <Link
                href="/collections"
                className="inline-flex items-center gap-2 px-8 py-3 border border-verone-black text-verone-black text-sm uppercase tracking-wide hover:bg-verone-black hover:text-verone-white transition-all duration-300"
              >
                Toutes les collections
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* 7. Avis clients */}
      <HomepageReviews />

      {/* 8. Newsletter */}
      <NewsletterSection />
    </div>
  );
}
