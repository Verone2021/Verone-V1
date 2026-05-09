'use client';

import { ProductImagesDashboard } from './product-images-dashboard';
import type { Product } from './types';

interface ProductImagesTabProps {
  product: Product;
  completionPercentage: number;
  productId: string;
  productName: string;
  imageCount: number;
  onOpenPhotosModal: () => void;
  onTabChange: (tabId: string) => void;
}

export function ProductImagesTab({
  product,
  completionPercentage,
  onTabChange,
}: ProductImagesTabProps) {
  return (
    <ProductImagesDashboard
      product={product}
      completionPercentage={completionPercentage}
      onTabChange={onTabChange}
    />
  );
}
