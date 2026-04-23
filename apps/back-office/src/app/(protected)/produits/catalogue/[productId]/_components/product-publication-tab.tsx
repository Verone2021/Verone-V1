'use client';

/**
 * ProductPublicationTab — wrapper minimal vers ProductPublicationDashboard.
 * Sprint : BO-UI-PROD-PUB-001
 */

import { ProductPublicationDashboard } from './product-publication-dashboard';
import type { Product } from './types';

interface ProductPublicationTabProps {
  product: Product;
  completionPercentage?: number;
  onTabChange?: (tabId: string) => void;
}

export function ProductPublicationTab({
  product,
  completionPercentage = 0,
  onTabChange = () => {},
}: ProductPublicationTabProps) {
  return (
    <ProductPublicationDashboard
      product={product}
      completionPercentage={completionPercentage}
      onTabChange={onTabChange}
    />
  );
}
