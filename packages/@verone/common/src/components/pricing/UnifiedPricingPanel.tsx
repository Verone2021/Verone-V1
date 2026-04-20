'use client';

import { useState } from 'react';

import { ButtonV2 } from '@verone/ui';
import { History } from 'lucide-react';

import { ChannelPricingEditor } from './ChannelPricingEditor';
import { PurchasePriceHistoryTimeline } from './PurchasePriceHistoryTimeline';
import { SupplierVsPricingEditSection } from './SupplierVsPricingEditSection';
import type { Product, VariantGroup } from './supplier-pricing-types';
import { calculateMinSellingPrice } from './use-supplier-pricing-calc';

interface UnifiedPricingPanelProps {
  product: Product;
  variantGroup?: VariantGroup | null;
  onUpdate: (updates: Partial<Product>) => void;
  className?: string;
}

export function UnifiedPricingPanel({
  product,
  variantGroup,
  onUpdate,
  className,
}: UnifiedPricingPanelProps) {
  const [historyOpen, setHistoryOpen] = useState(false);

  const costPrice =
    variantGroup?.has_common_cost_price && product.variant_group_id
      ? (variantGroup.common_cost_price ?? 0)
      : (product.cost_price ?? 0);
  const ecoTax =
    variantGroup?.has_common_cost_price && product.variant_group_id
      ? (variantGroup.common_eco_tax ?? 0)
      : (product.eco_tax_default ?? 0);
  const margin = product.margin_percentage ?? 0;
  const minimumSellingPrice = calculateMinSellingPrice(
    costPrice,
    ecoTax,
    margin
  );

  return (
    <div className={className}>
      <div className="space-y-4">
        <SupplierVsPricingEditSection
          product={product}
          variantGroup={variantGroup}
          onUpdate={onUpdate}
        />

        <div className="flex items-center justify-end">
          <ButtonV2
            variant="outline"
            size="sm"
            onClick={() => setHistoryOpen(true)}
          >
            <History className="h-3 w-3 mr-1" />
            Historique des achats
          </ButtonV2>
        </div>

        <ChannelPricingEditor
          productId={product.id}
          minimumSellingPrice={minimumSellingPrice}
        />
      </div>

      <PurchasePriceHistoryTimeline
        productId={product.id}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </div>
  );
}
