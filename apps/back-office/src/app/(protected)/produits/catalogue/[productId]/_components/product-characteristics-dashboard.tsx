'use client';

/**
 * ProductCharacteristicsDashboard — orchestrateur onglet Caractéristiques.
 *
 * Design cible : stitch-caracteristiques-v3d-2026-04-22.png (validé Romeo)
 * Sprint : BO-UI-PROD-CHAR-001
 *
 * Layout : rail gauche sticky (GeneralRail réutilisé) + body 3 lignes de blocs.
 * Edition 100 % inline — aucun modal.
 */

import { useMemo } from 'react';

import { AttributesVariantesCard } from './_characteristics-blocks/AttributesVariantesCard';
import { DimensionsWeightCard } from './_characteristics-blocks/DimensionsWeightCard';
import { IdentificationCommerceCard } from './_characteristics-blocks/IdentificationCommerceCard';
import { InheritanceRulesCard } from './_characteristics-blocks/InheritanceRulesCard';
import { PackagingPlaceholderCard } from './_characteristics-blocks/PackagingPlaceholderCard';
import { GeneralRail } from './_dashboard-blocks/GeneralRail';
import type { Product, ProductRow } from './types';

interface ProductCharacteristicsDashboardProps {
  product: Product;
  completionPercentage: number;
  onProductUpdate: (updates: Partial<ProductRow>) => Promise<void>;
  onTabChange: (tabId: string) => void;
}

export function ProductCharacteristicsDashboard({
  product,
  completionPercentage,
  onProductUpdate,
  onTabChange,
}: ProductCharacteristicsDashboardProps) {
  const tabEntries = useMemo(
    () => [
      { id: 'general', label: 'Général', percent: completionPercentage },
      {
        id: 'descriptions',
        label: 'Descriptions',
        percent: product.description ? 100 : 0,
      },
      {
        id: 'characteristics',
        label: 'Caractéristiques',
        percent: product.dimensions ? 80 : 30,
      },
      {
        id: 'stock',
        label: 'Stock',
        percent: product.min_stock != null ? 100 : 50,
      },
      {
        id: 'images',
        label: 'Images',
        percent: product.has_images ? 100 : 0,
      },
      {
        id: 'publication',
        label: 'Publication',
        percent: product.is_published_online ? 100 : 60,
      },
    ],
    [product, completionPercentage]
  );

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Rail gauche sticky */}
      <GeneralRail
        productId={product.id}
        productName={product.name}
        sku={product.sku ?? ''}
        completionPercentage={completionPercentage}
        tabEntries={tabEntries}
        variantGroupId={product.variant_group_id ?? null}
        variants={[]}
        onTabClick={onTabChange}
        onExportPdf={undefined}
        hasSourcing={Boolean(product.consultation_id)}
      />

      {/* Body principal */}
      <div className="flex-1 space-y-4 min-w-0 pb-8">
        {/* Ligne 1 : Attributs (col 8) + Dimensions (col 4) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8">
            <AttributesVariantesCard
              product={product}
              onProductUpdate={onProductUpdate}
            />
          </div>
          <div className="lg:col-span-4">
            <DimensionsWeightCard
              product={product}
              onProductUpdate={onProductUpdate}
            />
          </div>
        </div>

        {/* Ligne 2 : Identification & Commerce (full width) */}
        <IdentificationCommerceCard
          product={product}
          onProductUpdate={onProductUpdate}
        />

        {/* Ligne 3 : Emballage (col 6) + Héritage (col 6) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PackagingPlaceholderCard />
          <InheritanceRulesCard product={product} />
        </div>
      </div>
    </div>
  );
}
