'use client';

import { ProductCharacteristicsDashboard } from './product-characteristics-dashboard';
import type { Product, ProductRow } from './types';

interface ProductCharacteristicsTabProps {
  product: Product;
  completionPercentage: number;
  onProductUpdate: (updates: Partial<ProductRow>) => Promise<void>;
  onTabChange: (tabId: string) => void;
}

export function ProductCharacteristicsTab(
  props: ProductCharacteristicsTabProps
) {
  return <ProductCharacteristicsDashboard {...props} />;
}
