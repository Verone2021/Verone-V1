'use client';

// =============================================================================
// Onglet Variantes — Wrapper ProductVariantsGrid
// =============================================================================

import { ProductVariantsGrid } from '@verone/products';
import { Badge } from '@verone/ui';
import { Package } from 'lucide-react';

import type { SiteInternetProduct } from './types';

interface TabVariantesProps {
  product: SiteInternetProduct;
}

export function TabVariantes({ product }: TabVariantesProps) {
  return (
    <div className="space-y-6">
      {/* Header avec badge count */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-gray-600" />
          <div className="font-medium">Variantes du produit</div>
          {product.has_variants && product.variants_count > 0 && (
            <Badge variant="outline">{product.variants_count}</Badge>
          )}
        </div>
      </div>

      {/* Grille variantes (composant réutilisable) */}
      <ProductVariantsGrid
        productId={product.product_id}
        currentProductId={product.product_id}
      />
    </div>
  );
}
