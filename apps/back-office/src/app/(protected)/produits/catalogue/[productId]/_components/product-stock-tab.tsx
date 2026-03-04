'use client';

import type { ComponentProps } from 'react';

import { StockEditSection } from '@verone/stock';
import { StockStatusCompact } from '@verone/stock';

import type { Product, ProductRow } from './types';

interface ProductStockTabProps {
  product: Product;
  onProductUpdate: (updates: Partial<ProductRow>) => Promise<void>;
}

export function ProductStockTab({
  product,
  onProductUpdate,
}: ProductStockTabProps) {
  return (
    <div className="space-y-6">
      {/* Stock status dashboard */}
      <StockStatusCompact
        product={{
          id: product.id,
          stock_real: product.stock_real ?? 0,
          stock_forecasted_in: product.stock_forecasted_in ?? 0,
        }}
      />

      {/* Stock edit section */}
      <section className="bg-white rounded-lg border border-neutral-200 p-5">
        <StockEditSection
          product={
            {
              id: product.id,
              condition: product.condition,
              min_stock: product.min_stock ?? undefined,
            } as ComponentProps<typeof StockEditSection>['product']
          }
          onUpdate={updates => {
            void onProductUpdate(updates).catch(console.error);
          }}
        />
      </section>
    </div>
  );
}
