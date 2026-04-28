'use client';

/**
 * ProductGeneralDashboard — refonte dashboard synthèse de l'onglet Général.
 *
 * Base validée : V-D+ v2 (docs/scratchpad/stitch/stitch-general-VALIDATED-vd+v2.png)
 * Sprint : BO-UI-PROD-GENERAL-001
 *
 * Layout : rail gauche 220px + body 3 zones (KPI strip · Prix par canal dominant · grid 3 cols · footer notes).
 * Composants : voir `./_dashboard-blocks/`.
 */

import { useMemo } from 'react';

import { calculateMinSellingPrice } from '@verone/common';
import { useProductGeneralDashboard } from '@verone/products';

import { ActivityHistoryCompact } from './_dashboard-blocks/ActivityHistoryCompact';
import { ChannelPricingTable } from './_dashboard-blocks/ChannelPricingTable';
import { GeneralRail } from './_dashboard-blocks/GeneralRail';
import { InternalNotesFooter } from './_dashboard-blocks/InternalNotesFooter';
import { KpiStrip } from './_dashboard-blocks/KpiStrip';
import { PublishChecklist } from './_dashboard-blocks/PublishChecklist';
import { SupplierPoCompactCard } from './_dashboard-blocks/SupplierPoCompactCard';
import type { Product, ProductRow } from './types';

interface ProductGeneralDashboardProps {
  product: Product;
  completionPercentage: number;
  onProductUpdate: (updates: Partial<ProductRow>) => Promise<void>;
  onTabChange: (tabId: string) => void;
}

export function ProductGeneralDashboard({
  product,
  completionPercentage,
  onProductUpdate,
  onTabChange,
}: ProductGeneralDashboardProps) {
  // Dashboard aggregation hook — Phase 2
  const { data: dash } = useProductGeneralDashboard(product.id);

  // KPI source values
  const costPrice = product.cost_price ?? null;
  const costNetAvg =
    product.cost_net_avg != null ? Number(product.cost_net_avg) : null;
  // Prix de revient = cost_net_avg (moyenne achats + frais logistiques),
  // fallback sur cost_price si pas d'historique PO.
  const landedCost = costNetAvg ?? costPrice;
  const ecoTax = product.eco_tax_default ?? 0;
  const margin = product.margin_percentage ?? 0;

  const minimumSellingPrice = useMemo(
    () =>
      margin > 0 && landedCost != null && landedCost > 0
        ? calculateMinSellingPrice(landedCost, ecoTax, margin)
        : 0,
    [landedCost, ecoTax, margin]
  );

  const minSellingPriceTtc = useMemo(
    () =>
      minimumSellingPrice > 0
        ? Number((minimumSellingPrice * 1.2).toFixed(2))
        : null,
    [minimumSellingPrice]
  );

  // Marge site live — calculée côté wrapper à partir du prix négocié min
  const siteMarginPercent = useMemo(() => {
    const sitePriceHt = dash?.siteLivePriceHt ?? null;
    if (sitePriceHt == null || minimumSellingPrice <= 0) return null;
    return ((sitePriceHt - minimumSellingPrice) / minimumSellingPrice) * 100;
  }, [dash?.siteLivePriceHt, minimumSellingPrice]);

  // Publication checklist (logique extraite de product-publication-tab.tsx)
  const checklistItems = useMemo(
    () => [
      {
        id: 'name-desc',
        label: 'Nom + Description',
        ok:
          Boolean(product.name?.trim()) && Boolean(product.description?.trim()),
        required: true,
        targetTab: 'descriptions',
      },
      {
        id: 'images',
        label: 'Images (≥ 1)',
        ok: product.has_images === true,
        required: true,
        targetTab: 'images',
      },
      {
        id: 'category-slug',
        label: 'Catégorisation + Slug',
        ok: Boolean(product.subcategory_id) && Boolean(product.slug),
        required: true,
        targetTab: 'publication',
      },
      {
        id: 'meta-desc',
        label: 'Meta description SEO',
        ok: Boolean(product.meta_description?.trim()),
        required: false,
        targetTab: 'descriptions',
      },
    ],
    [product]
  );

  // Tabs completion (stub — Phase 2 branchera le vrai calcul par onglet)
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
        percent: costPrice != null && margin > 0 ? 100 : 50,
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
    [product, completionPercentage, costPrice, margin]
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
      <div className="flex-1 space-y-4 min-w-0">
        {/* Zone 1 — KPI strip */}
        <KpiStrip
          costPrice={costPrice}
          landedCost={costNetAvg}
          minSellingPriceHt={
            minimumSellingPrice > 0 ? minimumSellingPrice : null
          }
          minSellingPriceTtc={minSellingPriceTtc}
          marginPercent={margin}
          stockAvailable={product.stock_real ?? 0}
          minStock={product.min_stock ?? null}
          siteLivePriceHt={dash?.siteLivePriceHt ?? null}
          siteMarginPercent={siteMarginPercent}
        />

        {/* Zone 2 — Bloc dominant prix par canal */}
        <ChannelPricingTable
          productId={product.id}
          minimumSellingPrice={minimumSellingPrice}
          landedCost={landedCost}
          onManageAll={() => onTabChange('pricing')}
        />

        {/* Zone 3 — Grid 3 cols */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <PublishChecklist items={checklistItems} onItemClick={onTabChange} />
          <SupplierPoCompactCard
            supplierId={product.supplier_id ?? null}
            supplierName={
              product.supplier?.legal_name ??
              product.supplier?.trade_name ??
              null
            }
            supplierSiret={dash?.supplierSiret ?? null}
            lastPo={dash?.lastPo ?? null}
            supplierReference={product.supplier_reference ?? null}
            supplierPageUrl={product.supplier_page_url ?? null}
            supplierMoq={product.supplier_moq ?? null}
            onUpdateSupplierFields={onProductUpdate}
          />
          <ActivityHistoryCompact
            events={dash?.events ?? []}
            stockMoves={dash?.stockMoves ?? []}
          />
        </div>

        {/* Footer — Notes internes */}
        <InternalNotesFooter
          initialValue={product.internal_notes ?? null}
          onSave={async value => {
            await onProductUpdate({ internal_notes: value });
          }}
        />
      </div>
    </div>
  );
}
