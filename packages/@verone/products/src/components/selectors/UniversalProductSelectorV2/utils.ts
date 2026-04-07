import type { ProductData } from './types';

// ============================================================================
// HELPER - getPrimaryImage
// ============================================================================

export function getPrimaryImage(product: ProductData): string | null {
  const images = product.product_images;
  return (
    images?.find(img => img.is_primary)?.public_url ??
    images?.[0]?.public_url ??
    null
  );
}
