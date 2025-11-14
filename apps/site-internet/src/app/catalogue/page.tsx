'use client';

import { useState } from 'react';

import { CardProductLuxury } from '@/components/ui/CardProductLuxury';
import { useCatalogueProducts } from '@/hooks/use-catalogue-products';

export default function CataloguePage() {
  const [sortBy, setSortBy] = useState<string>('newest');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { data: products, isLoading: productsLoading } = useCatalogueProducts({
    sortBy: sortBy as any,
    searchQuery: searchQuery || undefined,
  });

  const isLoading = productsLoading;

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="font-playfair text-5xl font-bold text-verone-black mb-4">
          Notre Catalogue
        </h1>
        <p className="text-lg text-verone-gray-600">
          Découvrez notre sélection de mobilier et décoration haut de gamme
        </p>
      </div>

      {/* Filtres */}
      <div className="bg-verone-white border border-verone-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Recherche */}
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="border border-verone-gray-300 rounded-none px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-verone-black"
          />

          {/* Tri */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="border border-verone-gray-300 rounded-none px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-verone-black"
          >
            <option value="newest">Nouveautés</option>
            <option value="oldest">Plus anciens</option>
            <option value="name_asc">Nom A-Z</option>
            <option value="name_desc">Nom Z-A</option>
            <option value="price_asc">Prix croissant</option>
            <option value="price_desc">Prix décroissant</option>
          </select>
        </div>
      </div>

      {/* Grille produits */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="border border-verone-gray-200 animate-pulse"
            >
              <div className="bg-verone-gray-200 aspect-[3/4]" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-verone-gray-200 rounded" />
                <div className="h-4 bg-verone-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products && products.length > 0 ? (
        <>
          <p className="text-sm text-verone-gray-600 mb-6">
            {products.length} produit{products.length > 1 ? 's' : ''} trouvé
            {products.length > 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <CardProductLuxury
                key={product.product_id}
                id={product.product_id}
                name={product.name}
                price={product.price_ttc}
                imageUrl={product.primary_image_url}
                href={`/produit/${product.slug}`}
                priority={index < 4}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-24">
          <p className="font-playfair text-2xl text-verone-gray-500 mb-4">
            Aucun produit trouvé
          </p>
          <p className="text-verone-gray-400">
            Essayez de modifier vos filtres
          </p>
        </div>
      )}
    </div>
  );
}
