'use client';

import { use } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Store, Package, ArrowRight } from 'lucide-react';

import { useAffiliateBySlug } from '../../../lib/hooks/use-linkme-public';

interface AffiliatePageProps {
  params: Promise<{ affiliateSlug: string }>;
}

export default function AffiliatePage({ params }: AffiliatePageProps) {
  const { affiliateSlug } = use(params);
  const {
    data: affiliate,
    isLoading,
    error,
  } = useAffiliateBySlug(affiliateSlug);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-8" />
          <div className="flex items-center gap-6 mb-12">
            <div className="w-24 h-24 bg-gray-200 rounded-full" />
            <div className="space-y-3">
              <div className="h-8 w-64 bg-gray-200 rounded" />
              <div className="h-4 w-96 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !affiliate) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <Store className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Partenaire introuvable
        </h1>
        <p className="text-gray-600 mb-8">
          Ce partenaire n'existe pas ou n'est plus actif.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à l'accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à l'accueil
          </Link>
        </div>
      </div>

      {/* Affiliate Header */}
      <section className="bg-gradient-to-br from-gray-50 to-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Logo */}
            <div className="relative w-24 h-24 bg-white rounded-full overflow-hidden shadow-md flex-shrink-0">
              {affiliate.logo_url ? (
                <Image
                  src={affiliate.logo_url}
                  alt={affiliate.display_name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Store className="h-12 w-12" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900">
                {affiliate.display_name}
              </h1>
              {affiliate.bio && (
                <p className="text-gray-600 mt-2 max-w-2xl">{affiliate.bio}</p>
              )}
              <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  {affiliate.selections_count} sélections
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sélections */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            Sélections de {affiliate.display_name}
          </h2>

          {affiliate.selections.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {affiliate.selections.map(selection => (
                <Link
                  key={selection.id}
                  href={`/${affiliate.slug}/${selection.slug}`}
                  className="group bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Image */}
                  <div className="relative h-48 bg-gray-100">
                    {selection.image_url ? (
                      <Image
                        src={selection.image_url}
                        alt={selection.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package className="h-16 w-16" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                      {selection.name}
                    </h3>
                    {selection.description && (
                      <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                        {selection.description}
                      </p>
                    )}
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-sm text-gray-500">
                        {selection.products_count} produits
                      </span>
                      <span className="text-blue-600 flex items-center gap-1 text-sm group-hover:gap-2 transition-all">
                        Découvrir <ArrowRight className="h-4 w-4" />
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
    </div>
  );
}
