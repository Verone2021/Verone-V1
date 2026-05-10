'use client';

import Link from 'next/link';

import { ArrowRight } from 'lucide-react';

import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedProductsSection } from '@/components/home/FeaturedProductsSection';
import { InspirationBanner } from '@/components/home/InspirationBanner';
import { NewsletterSection } from '@/components/home/NewsletterSection';
import { useCollections } from '@/hooks/use-collections';

export default function HomePage() {
  const { data: collections } = useCollections();
  const featuredCollections = collections?.slice(0, 3);

  return (
    <div>
      {/* 1. Hero typographique centré (Sprint 1 ✅) */}
      <HeroSection />

      {/* 2. Nos trouvailles — 4 produits éditoriaux (Sprint 2 ✅) */}
      <FeaturedProductsSection />

      {/* 3. Bannière éditoriale (Sprint 3 — refonte à venir, ancien composant en place) */}
      <InspirationBanner />

      {/* 4. Collections (Sprint 4 — refonte à venir, version legacy en place) */}
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

      {/* 5. Newsletter (Sprint 5 — refonte à venir, ancien composant en place) */}
      <NewsletterSection />
    </div>
  );
}
