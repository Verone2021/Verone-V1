'use client';

/**
 * ProductPricingDashboard — orchestrateur de l'onglet Tarification.
 *
 * Design cible : stitch-tarification-v4-aligne-general-2026-04-22.png
 * Sprint : BO-UI-PROD-PRICING-001
 *
 * Layout : rail gauche 220px (réutilise GeneralRail) + body (KPI strip →
 * Formula → grid 2 cols historique/PO → Canal détaillé → Footer note).
 */

import { useMemo, useCallback } from 'react';

import { calculateMinSellingPrice } from '@verone/common';
import { useProductPricingDashboard } from '@verone/products';

import { GeneralRail } from './_dashboard-blocks/GeneralRail';
import { ChannelPricingDetailed } from './_pricing-blocks/ChannelPricingDetailed';
import { CostHistoryCard } from './_pricing-blocks/CostHistoryCard';
import { FormulaExplainerCard } from './_pricing-blocks/FormulaExplainerCard';
import { PricingFooterNote } from './_pricing-blocks/PricingFooterNote';
import { PricingKpiStrip } from './_pricing-blocks/PricingKpiStrip';
import { PurchaseOrdersTable } from './_pricing-blocks/PurchaseOrdersTable';
import type { Product, ProductRow } from './types';

interface ProductPricingDashboardProps {
  product: Product;
  completionPercentage: number;
  onProductUpdate: (updates: Partial<ProductRow>) => Promise<void>;
  onTabChange: (tabId: string) => void;
}

export function ProductPricingDashboard({
  product,
  completionPercentage,
  onProductUpdate,
  onTabChange,
}: ProductPricingDashboardProps) {
  const { data, isLoading } = useProductPricingDashboard(product.id);

  // Prix de revient : priorité à cost_net_avg (moyenne pondérée PO),
  // fallback sur cost_price si aucun historique d'achat.
  const landedCost = useMemo(() => {
    const netAvg =
      product.cost_net_avg != null ? Number(product.cost_net_avg) : null;
    const costPrice = product.cost_price ?? null;
    return netAvg ?? costPrice;
  }, [product.cost_net_avg, product.cost_price]);

  const ecoTax = product.eco_tax_default ?? 0;
  const margin = product.margin_percentage ?? 0;

  const minSellingPriceHt = useMemo(
    () =>
      margin > 0 && landedCost != null && landedCost > 0
        ? calculateMinSellingPrice(landedCost, ecoTax, margin)
        : null,
    [landedCost, ecoTax, margin]
  );

  const minSellingPriceTtc = useMemo(
    () =>
      minSellingPriceHt != null
        ? Number((minSellingPriceHt * 1.2).toFixed(2))
        : null,
    [minSellingPriceHt]
  );

  // Tabs completion (miroir du dashboard Général pour le rail)
  const tabEntries = useMemo(
    () => [
      { id: 'general', label: 'Général', percent: completionPercentage },
      {
        id: 'descriptions',
        label: 'Descriptions',
        percent: product.description ? 100 : 0,
      },
      {
        id: 'pricing',
        label: 'Tarification',
        percent: product.cost_price != null && margin > 0 ? 100 : 50,
      },
      {
        id: 'stock',
        label: 'Stock',
        percent: product.min_stock != null ? 100 : 50,
      },
      {
        id: 'characteristics',
        label: 'Caractéristiques',
        percent: product.dimensions ? 80 : 30,
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
    [product, completionPercentage, margin]
  );

  const handleMarginSave = useCallback(
    async (newMargin: number) => {
      await onProductUpdate({ margin_percentage: newMargin });
    },
    [onProductUpdate]
  );

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Rail gauche sticky — réutilisé tel quel depuis Général */}
      <GeneralRail
        productName={product.name}
        sku={product.sku ?? ''}
        brandIds={product.brand_ids ?? null}
        completionPercentage={completionPercentage}
        tabEntries={tabEntries}
        variantGroupId={product.variant_group_id ?? null}
        variants={[]}
        onTabClick={onTabChange}
        onExportPdf={undefined}
      />

      {/* Body principal */}
      <div className="flex-1 space-y-4 min-w-0">
        {/* Zone 1 — KPI strip */}
        <PricingKpiStrip
          purchasePriceHt={product.cost_price ?? null}
          supplierName={
            product.supplier?.trade_name ?? product.supplier?.legal_name ?? null
          }
          ecoTax={ecoTax > 0 ? ecoTax : null}
          landedCost={landedCost}
          purchasesCount={data.costStats.purchasesCount}
          minSellingPriceHt={minSellingPriceHt}
          minSellingPriceTtc={minSellingPriceTtc}
          marginPercent={margin}
          onMarginSave={handleMarginSave}
        />

        {/* Zone 2 — Formula explainer */}
        <FormulaExplainerCard
          landedCost={landedCost}
          marginPercent={margin}
          ecoTax={ecoTax}
          minSellingPriceHt={minSellingPriceHt}
          minSellingPriceTtc={minSellingPriceTtc}
        />

        {/* Zone 3 — Grid 2 cols : historique + tableau PO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <CostHistoryCard
            costStats={data.costStats}
            purchases={data.purchases}
          />
          <PurchaseOrdersTable
            purchases={data.purchases}
            isLoading={isLoading}
          />
        </div>

        {/* Zone 4 — Canal détaillé */}
        <ChannelPricingDetailed
          productId={product.id}
          minimumSellingPrice={minSellingPriceHt ?? 0}
          landedCost={landedCost}
        />

        {/* Zone 5 — Footer note */}
        <PricingFooterNote />
      </div>
    </div>
  );
}
