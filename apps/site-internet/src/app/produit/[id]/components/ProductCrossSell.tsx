/**
 * ProductCrossSell - Carrousel produits similaires
 * Features:
 * - Carrousel horizontal avec navigation arrows
 * - "Les clients ont également consulté"
 * - 6 produits mock (à implémenter réellement plus tard)
 * - Cards produits responsive
 */

'use client';

import Link from 'next/link';

import { formatPrice } from '@verone/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Mock data (à remplacer par vraies données plus tard)
// Note: Placeholders couleurs pour éviter erreur Next.js Image (Unsplash non configuré)
const MOCK_PRODUCTS = [
  {
    id: '1',
    slug: 'canape-wolke',
    name: 'Canapé Wolke 3 places',
    placeholder_color: 'bg-blue-100',
    price_ttc: 1999,
  },
  {
    id: '2',
    slug: 'table-basse-oslo',
    name: 'Table basse Oslo',
    placeholder_color: 'bg-amber-100',
    price_ttc: 449,
  },
  {
    id: '3',
    slug: 'lampadaire-arc',
    name: 'Lampadaire Arc moderne',
    placeholder_color: 'bg-purple-100',
    price_ttc: 299,
  },
  {
    id: '4',
    slug: 'buffet-scandinave',
    name: 'Buffet scandinave',
    placeholder_color: 'bg-green-100',
    price_ttc: 899,
  },
  {
    id: '5',
    slug: 'tapis-berbere',
    name: 'Tapis berbère 200x300',
    placeholder_color: 'bg-rose-100',
    price_ttc: 349,
  },
  {
    id: '6',
    slug: 'miroir-laiton',
    name: 'Miroir rond laiton',
    placeholder_color: 'bg-yellow-100',
    price_ttc: 179,
  },
];

export function ProductCrossSell() {
  return (
    <section className="mt-16 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">
          Les clients ont également consulté
        </h2>

        {/* Navigation arrows (placeholder pour carrousel futur) */}
        <div className="flex gap-2">
          <button
            className="p-2 rounded-full border hover:bg-gray-100 transition-colors disabled:opacity-50"
            aria-label="Produit précédent"
            disabled
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            className="p-2 rounded-full border hover:bg-gray-100 transition-colors disabled:opacity-50"
            aria-label="Produit suivant"
            disabled
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Grid produits (responsive) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {MOCK_PRODUCTS.map(product => (
          <Link
            key={product.id}
            href={`/produit/${product.slug}`}
            className="group"
          >
            <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              {/* Placeholder image (mock data) */}
              <div
                className={`relative aspect-[4/3] ${product.placeholder_color} flex items-center justify-center text-gray-400 text-xs`}
              >
                Mock Image
              </div>

              {/* Info produit */}
              <div className="p-3 space-y-1">
                <h3 className="text-sm font-medium line-clamp-2 group-hover:text-gray-600 transition-colors">
                  {product.name}
                </h3>
                <p className="text-base font-semibold">
                  {formatPrice(product.price_ttc)}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Note mock data */}
      <p className="text-xs text-muted-foreground text-center mt-6">
        (Mock data - À remplacer par recommandations réelles)
      </p>
    </section>
  );
}
