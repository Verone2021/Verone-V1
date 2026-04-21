'use client';

import { ChannelPricingEditor } from './ChannelPricingEditor';
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
  const isCostPriceManagedByGroup = !!(
    variantGroup?.has_common_cost_price && product.variant_group_id
  );
  // Prix de revient (landed cost) : préfère cost_net_avg (moyenne pondérée achats)
  // sur le cost_price brut. Fallback sur cost_price si pas encore d'historique PO.
  const landedCost = isCostPriceManagedByGroup
    ? (variantGroup?.common_cost_price ?? 0)
    : (product.cost_net_avg ?? product.cost_price ?? 0);
  const ecoTax = isCostPriceManagedByGroup
    ? (variantGroup?.common_eco_tax ?? 0)
    : (product.eco_tax_default ?? 0);
  const margin = product.margin_percentage ?? 0;
  const minimumSellingPrice =
    margin > 0 ? calculateMinSellingPrice(landedCost, ecoTax, margin) : 0;

  return (
    <div className={className}>
      <div className="space-y-4">
        <SupplierVsPricingEditSection
          product={product}
          variantGroup={variantGroup}
          onUpdate={onUpdate}
        />

        <ChannelPricingEditor
          productId={product.id}
          minimumSellingPrice={minimumSellingPrice}
        />
      </div>
    </div>
  );
}
