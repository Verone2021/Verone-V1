'use client';

/**
 * Page: Détail Produit Site Internet
 * Route: /canaux-vente/site-internet/produits/[id]
 *
 * Affichage complet des informations d'un produit avec édition inline
 */

import { use } from 'react';

import Link from 'next/link';

import { ButtonV2 } from '@verone/ui';
import { ArrowLeft, Loader2 } from 'lucide-react';

import ProductHeaderSection from './components/ProductHeaderSection';
import ProductInfoSection from './components/ProductInfoSection';
import ProductMetadataSection from './components/ProductMetadataSection';
import ProductPhotosSection from './components/ProductPhotosSection';
import ProductPricingSection from './components/ProductPricingSection';
import ProductStockSection from './components/ProductStockSection';
import { useProductDetail } from '../../hooks/use-product-detail';
import { useSiteInternetConfig } from '../../hooks/use-site-internet-config';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const { data: product, isLoading, error } = useProductDetail(productId);
  const { data: config, isLoading: isLoadingConfig } = useSiteInternetConfig();

  // Loading state
  if (isLoading || isLoadingConfig) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Error state
  if (error || !product || !config) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-2">
            Erreur de chargement
          </h2>
          <p className="text-red-700">
            {error
              ? 'Impossible de charger les détails du produit'
              : !config
                ? 'Configuration du canal introuvable'
                : 'Produit introuvable'}
          </p>
          <Link href="/canaux-vente/site-internet">
            <ButtonV2 variant="outline" size="sm" className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à la liste
            </ButtonV2>
          </Link>
        </div>
      </div>
    );
  }

  const channelId = config.id;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
        <Link
          href="/canaux-vente/site-internet"
          className="hover:text-gray-900 transition"
        >
          Site Internet
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{product.name}</span>
      </nav>

      {/* Header avec actions */}
      <ProductHeaderSection product={product} />

      {/* Layout 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Colonne gauche (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <ProductInfoSection product={product} channelId={channelId} />
          <ProductPhotosSection product={product} />
          <ProductMetadataSection product={product} />
        </div>

        {/* Colonne droite (1/3) */}
        <div className="space-y-6">
          <ProductPricingSection product={product} channelId={channelId} />
          <ProductStockSection product={product} />
        </div>
      </div>
    </div>
  );
}
