'use client';

/**
 * ProductGeneralTab — wrapper minimal qui délègue au dashboard synthèse.
 * Refactor sprint BO-UI-PROD-GENERAL-001 : remplacement des 10 sections
 * empilées par un dashboard synthèse (rail + KPI + prix canal + grid 3 cols
 * + notes).
 */

import { ProductGeneralDashboard } from './product-general-dashboard';
import type { Product, ProductRow } from './types';

interface ProductGeneralTabProps {
  product: Product;
  completionPercentage: number;
  onProductUpdate: (updates: Partial<ProductRow>) => Promise<void>;
  onTabChange: (tabId: string) => void;
}

export function ProductGeneralTab({
  product,
  completionPercentage,
  onProductUpdate,
  onTabChange,
}: ProductGeneralTabProps) {
  return (
    <ProductGeneralDashboard
      product={product}
      completionPercentage={completionPercentage}
      onProductUpdate={onProductUpdate}
      onTabChange={onTabChange}
    />
  );
}
