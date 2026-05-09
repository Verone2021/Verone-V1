'use client';

import { ProductStockDashboard } from './product-stock-dashboard';
import type { Product, ProductRow } from './types';

interface ProductStockTabProps {
  product: Product;
  completionPercentage: number;
  onProductUpdate: (updates: Partial<ProductRow>) => Promise<void>;
  onTabChange: (tabId: string) => void;
}

export function ProductStockTab(props: ProductStockTabProps) {
  return <ProductStockDashboard {...props} />;
}
