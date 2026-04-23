'use client';

/**
 * ProductDescriptionsTab — Onglet Descriptions (refonte "Editorial Studio").
 *
 * Design Sprint : BO-UI-PROD-DESC-001
 * Layout : GeneralRail (sticky gauche, partagé) + body flex-1 avec
 *   CompletionCard en haut puis 3 cards thématiques.
 *
 * PAS de secondary sidebar — le GeneralRail occupe déjà la gauche.
 */

import { useMemo } from 'react';

import { GeneralRail } from './_dashboard-blocks/GeneralRail';
import { DescriptionsCompletionCard } from './_descriptions-blocks/DescriptionsCompletionCard';
import { MarketingContentCard } from './_descriptions-blocks/MarketingContentCard';
import { SeoCard } from './_descriptions-blocks/SeoCard';
import { TechnicalDescriptionCard } from './_descriptions-blocks/TechnicalDescriptionCard';
import type { Product, ProductRow } from './types';

interface ProductDescriptionsTabProps {
  product: Product;
  completionPercentage?: number;
  onProductUpdate: (updates: Partial<ProductRow>) => Promise<void>;
  onTabChange?: (tabId: string) => void;
}

export function ProductDescriptionsTab({
  product,
  completionPercentage = 0,
  onProductUpdate,
  onTabChange,
}: ProductDescriptionsTabProps) {
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
      {/* Rail gauche sticky — partagé avec tous les onglets */}
      <GeneralRail
        productId={product.id}
        productName={product.name}
        sku={product.sku ?? ''}
        completionPercentage={completionPercentage}
        tabEntries={tabEntries}
        variantGroupId={product.variant_group_id ?? null}
        variants={[]}
        onTabClick={onTabChange ?? (() => undefined)}
        onExportPdf={undefined}
      />

      {/* Body principal */}
      <div className="flex-1 space-y-4 min-w-0 pb-8">
        {/* CompletionCard : jauge + status list + boutons */}
        <DescriptionsCompletionCard product={product} />

        {/* Card 1 : Contenu marketing */}
        <MarketingContentCard
          product={product}
          onProductUpdate={onProductUpdate}
        />

        {/* Card 2 : Fiche technique */}
        <TechnicalDescriptionCard
          product={product}
          onProductUpdate={onProductUpdate}
        />

        {/* Card 3 : SEO & Référencement */}
        <SeoCard product={product} onProductUpdate={onProductUpdate} />
      </div>
    </div>
  );
}
