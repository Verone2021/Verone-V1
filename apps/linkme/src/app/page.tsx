'use client';

import Image from 'next/image';
import Link from 'next/link';

import { Store, ArrowRight, Package } from 'lucide-react';

import {
  useFeaturedSelections,
  useVisibleSuppliers,
} from '../lib/hooks/use-linkme-public';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

export default function HomePage() {
  const { data: selections, isLoading: selectionsLoading } =
    useFeaturedSelections();
  const { data: suppliers, isLoading: suppliersLoading } =
    useVisibleSuppliers();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Découvrez les sélections de nos partenaires
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto mb-8">
            Mobilier et décoration d'intérieur haut de gamme, sélectionnés par
            des professionnels passionnés.
          </p>
        </div>
      </section>

      {/* Sélections Vedettes */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Sélections à découvrir
            </h2>
          </div>

          {selectionsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className="bg-gray-100 rounded-lg h-64 animate-pulse"
                />
              ))}
            </div>
          ) : selections && selections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {selections.map(selection => (
                <Link
                  key={selection.id}
                  href={`/${selection.affiliate.slug}/${selection.slug}`}
                  className="group bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Image */}
                  <div className="relative h-40 bg-gray-100">
                    {selection.image_url ? (
                      <Image
                        src={selection.image_url}
                        alt={selection.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package className="h-12 w-12" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {selection.name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                      <Store className="h-4 w-4" />
                      {selection.affiliate.display_name}
                    </p>
                    <div className="mt-3 flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        {selection.products_count} produits
                      </span>
                      <span className="text-blue-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                        Voir <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune sélection disponible pour le moment</p>
            </div>
          )}
        </div>
      </section>

      {/* Fournisseurs Partenaires */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Nos partenaires
            </h2>
          </div>

          {suppliersLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div
                  key={i}
                  className="bg-white rounded-lg h-32 animate-pulse"
                />
              ))}
            </div>
          ) : suppliers && suppliers.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {suppliers.map(supplier => (
                <div
                  key={supplier.id}
                  className="bg-white rounded-lg p-4 text-center hover:shadow-md transition-shadow"
                >
                  {/* Logo */}
                  <div className="relative w-16 h-16 mx-auto mb-3 bg-gray-100 rounded-full overflow-hidden">
                    {supplier.logo_url ? (
                      <Image
                        src={supplier.logo_url}
                        alt={supplier.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Store className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm truncate">
                    {supplier.name}
                  </h3>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun partenaire pour le moment</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
