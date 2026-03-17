'use client';

import Link from 'next/link';

import { ArrowRight } from 'lucide-react';

import { HeroSection } from '@/components/home/HeroSection';
import { CardProductLuxury } from '@/components/ui/CardProductLuxury';
import { useCatalogueProducts } from '@/hooks/use-catalogue-products';
import { useCollections } from '@/hooks/use-collections';

export default function HomePage() {
  const { data: products, isLoading: productsLoading } = useCatalogueProducts({
    sortBy: 'newest',
    limit: 6,
    offset: 0,
  });

  const { data: collections } = useCollections();
  const featuredCollections = collections?.slice(0, 3);

  return (
    <div>
      <HeroSection />

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <h3 className="font-playfair text-4xl font-bold text-verone-black text-center mb-16">
          Sélection du moment
        </h3>

        {productsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="bg-verone-gray-200 h-80" />
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-verone-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-verone-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {products && products.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {products.slice(0, 6).map((p, index) => (
                <CardProductLuxury
                  key={p.product_id}
                  id={p.product_id}
                  name={p.name}
                  description={p.seo_meta_description ?? undefined}
                  price={p.price_ttc}
                  imageUrl={p.primary_image_url}
                  href={`/produit/${p.slug}`}
                  priority={index < 3}
                />
              ))}
            </div>
            <div className="text-center mt-12">
              <Link
                href="/catalogue"
                className="inline-flex items-center gap-2 px-8 py-3 border border-verone-black text-verone-black text-sm uppercase tracking-wide hover:bg-verone-black hover:text-verone-white transition-all duration-300"
              >
                Voir tout le catalogue
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </>
        )}
      </section>

      {/* Featured Collections */}
      {featuredCollections && featuredCollections.length > 0 && (
        <section className="bg-verone-gray-50 py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h3 className="font-playfair text-4xl font-bold text-verone-black text-center mb-16">
              Nos Collections
            </h3>
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

      {/* Reassurance */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div>
            <h4 className="font-playfair text-lg font-semibold text-verone-black mb-2">
              Livraison soignée
            </h4>
            <p className="text-sm text-verone-gray-500 leading-relaxed">
              Chaque pièce est emballée avec soin et livrée à domicile avec
              prise de rendez-vous.
            </p>
          </div>
          <div>
            <h4 className="font-playfair text-lg font-semibold text-verone-black mb-2">
              Qualité garantie
            </h4>
            <p className="text-sm text-verone-gray-500 leading-relaxed">
              Des matériaux nobles sélectionnés auprès des meilleurs artisans et
              manufactures.
            </p>
          </div>
          <div>
            <h4 className="font-playfair text-lg font-semibold text-verone-black mb-2">
              Conseil personnalisé
            </h4>
            <p className="text-sm text-verone-gray-500 leading-relaxed">
              Notre équipe vous accompagne dans le choix de vos pièces de
              mobilier et décoration.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
