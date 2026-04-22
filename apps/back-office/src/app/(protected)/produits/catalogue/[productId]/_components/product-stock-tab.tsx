'use client';

import { useState, type ComponentProps } from 'react';
import { History } from 'lucide-react';

import { Button } from '@verone/ui';
import { StockDisplay, StockEditSection } from '@verone/stock';
import { StockAlertsBanner } from '@verone/stock/components/cards';
import { ProductStockHistoryModal } from '@verone/products';

import type { Product, ProductRow } from './types';

interface ProductStockTabProps {
  product: Product;
  onProductUpdate: (updates: Partial<ProductRow>) => Promise<void>;
}

export function ProductStockTab({
  product,
  onProductUpdate,
}: ProductStockTabProps) {
  const [showHistory, setShowHistory] = useState(false);

  return (
    <div className="space-y-6">
      {/* A2 : Banniere d'alertes stock actives pour ce produit */}
      <StockAlertsBanner productId={product.id} />

      {/* Stock display with details */}
      <section className="bg-white rounded-lg border border-neutral-200 p-5">
        <StockDisplay
          stock_real={product.stock_real ?? 0}
          stock_forecasted_in={product.stock_forecasted_in ?? 0}
          stock_forecasted_out={product.stock_forecasted_out ?? 0}
          min_stock={product.min_stock ?? 5}
          showDetails
        />
      </section>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setShowHistory(true)}>
          <History className="mr-2 h-4 w-4" />
          Historique mouvements
        </Button>
      </div>

      {/* Stock edit section */}
      <section className="bg-white rounded-lg border border-neutral-200 p-5">
        <StockEditSection
          product={
            {
              id: product.id,
              min_stock: product.min_stock ?? undefined,
            } as ComponentProps<typeof StockEditSection>['product']
          }
          onUpdate={updates => {
            void onProductUpdate(updates).catch(console.error);
          }}
        />
      </section>

      {/* Stock history modal */}
      <ProductStockHistoryModal
        product={{
          id: product.id,
          name: product.name,
          sku: product.sku,
        }}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
}
