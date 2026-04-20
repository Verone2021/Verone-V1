'use client';

/**
 * Composant: ProductInfoSection
 * Affiche les infos produit en lecture seule sur la page canal site-internet.
 * SI-DESC-001 (2026-04-21) : édition retirée — les descriptions / brand /
 * selling points sont gérées dans la fiche produit mère (onglet Descriptions).
 */

import Link from 'next/link';

import { Badge, ButtonV2 } from '@verone/ui';
import { ExternalLink } from 'lucide-react';

import type { SiteInternetProduct } from '../../../types';

interface ProductInfoSectionProps {
  product: SiteInternetProduct;
}

export default function ProductInfoSection({
  product,
}: ProductInfoSectionProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Informations générales
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Édition dans la fiche produit mère.
          </p>
        </div>
        <Link href={`/produits/catalogue/${product.product_id}`}>
          <ButtonV2 variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" />
            Ouvrir la fiche produit
          </ButtonV2>
        </Link>
      </div>

      {/* Contenu */}
      <div className="space-y-6">
        {/* Description courte */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
            Description
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {product.description ?? (
              <span className="text-gray-400 italic">Non renseignée</span>
            )}
          </p>
        </div>

        {/* Description technique */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
            Description technique
          </div>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {product.technical_description ?? (
              <span className="text-gray-400 italic">Non renseignée</span>
            )}
          </p>
        </div>

        {/* Marque */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
            Marque
          </div>
          {product.brand ? (
            <Badge variant="secondary">{product.brand}</Badge>
          ) : (
            <p className="text-sm text-gray-400 italic">Non renseignée</p>
          )}
        </div>

        {/* Selling Points */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
            Points de vente
          </div>
          {product.selling_points && product.selling_points.length > 0 ? (
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              {product.selling_points.map((point, index) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-400 italic">Aucun point de vente</p>
          )}
        </div>
      </div>
    </div>
  );
}
