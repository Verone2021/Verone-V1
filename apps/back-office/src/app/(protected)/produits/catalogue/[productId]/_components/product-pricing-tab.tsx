'use client';

import { UnifiedPricingPanel } from '@verone/common';

import type { Product, ProductRow } from './types';

interface ProductPricingTabProps {
  product: Product;
  onProductUpdate: (updates: Partial<ProductRow>) => Promise<void>;
}

export function ProductPricingTab({
  product,
  onProductUpdate,
}: ProductPricingTabProps) {
  return (
    <div className="space-y-6">
      <UnifiedPricingPanel
        product={{
          id: product.id,
          cost_price: product.cost_price ?? undefined,
          eco_tax_default: product.eco_tax_default ?? undefined,
          margin_percentage: product.margin_percentage ?? undefined,
          variant_group_id: product.variant_group_id ?? undefined,
          cost_price_avg: product.cost_price_avg,
          cost_price_min: product.cost_price_min,
          cost_price_max: product.cost_price_max,
          cost_price_last: product.cost_price_last,
          cost_price_count: product.cost_price_count,
          target_margin_percentage: product.target_margin_percentage,
          cost_net_avg: product.cost_net_avg,
          cost_net_min: product.cost_net_min,
          cost_net_max: product.cost_net_max,
          cost_net_last: product.cost_net_last,
        }}
        variantGroup={product.variant_group ?? null}
        onUpdate={updates => {
          void onProductUpdate(updates as Partial<ProductRow>).catch(
            console.error
          );
        }}
      />
    </div>
  );
}
