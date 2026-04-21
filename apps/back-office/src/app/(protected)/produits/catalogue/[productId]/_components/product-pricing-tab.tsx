'use client';

/**
 * ProductPricingTab — wrapper minimal vers ProductPricingDashboard.
 * Sprint : BO-UI-PROD-PRICING-001
 */

import { ProductPricingDashboard } from './product-pricing-dashboard';
import type { Product, ProductRow } from './types';

interface ProductPricingTabProps {
  product: Product;
  completionPercentage: number;
  primaryImageUrl: string | null;
  onProductUpdate: (updates: Partial<ProductRow>) => Promise<void>;
  onTabChange: (tabId: string) => void;
}

export function ProductPricingTab(props: ProductPricingTabProps) {
  return <ProductPricingDashboard {...props} />;
}
