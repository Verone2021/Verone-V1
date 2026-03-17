'use client';

import Image from 'next/image';
import Link from 'next/link';

import { ArrowRight, Package } from 'lucide-react';

import { useCollections } from '@/hooks/use-collections';

export default function CollectionsPage() {
  const { data: collections, isLoading, error } = useCollections();

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
      <div className="text-center mb-16">
        <h1 className="font-playfair text-4xl md:text-5xl font-bold text-verone-black mb-4">
          Nos Collections
        </h1>
        <p className="text-verone-gray-500 max-w-2xl mx-auto leading-relaxed">
          Découvrez nos collections soigneusement composées pour sublimer votre
          intérieur
        </p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse">
              <div className="bg-verone-gray-200 h-64 rounded-lg" />
              <div className="mt-4 space-y-2">
                <div className="h-6 bg-verone-gray-200 rounded w-3/4" />
                <div className="h-4 bg-verone-gray-100 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="text-center py-20">
          <p className="text-verone-gray-500">
            Impossible de charger les collections. Veuillez réessayer.
          </p>
        </div>
      )}

      {collections?.length === 0 && (
        <div className="text-center py-20">
          <Package className="h-12 w-12 text-verone-gray-300 mx-auto mb-4" />
          <p className="text-verone-gray-500">
            Aucune collection disponible pour le moment.
          </p>
        </div>
      )}

      {collections && collections.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {collections.map(collection => (
            <Link
              key={collection.id}
              href={`/collections/${collection.slug ?? collection.id}`}
              className="group"
            >
              <div className="border border-verone-gray-200 hover:shadow-luxury transition-all duration-500 overflow-hidden">
                <div className="relative h-64 bg-verone-gray-100 overflow-hidden">
                  {collection.image_url ? (
                    <Image
                      src={collection.image_url}
                      alt={collection.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Package className="h-16 w-16 text-verone-gray-300" />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <h2 className="font-playfair text-xl font-semibold text-verone-black mb-2 group-hover:text-verone-gray-700 transition-colors">
                    {collection.name}
                  </h2>
                  {collection.description && (
                    <p className="text-sm text-verone-gray-500 leading-relaxed line-clamp-2 mb-3">
                      {collection.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-verone-gray-400 uppercase tracking-wide">
                      {collection.product_count} produit
                      {collection.product_count > 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-verone-black uppercase tracking-wide group-hover:gap-2 transition-all duration-300">
                      Découvrir <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
