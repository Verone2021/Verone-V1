'use client';

import { ButtonV2 } from '@verone/ui';
import { ScrollArea } from '@verone/ui';

import type { SelectedProduct } from './types';
import { EmptyState } from './EmptyState';
import { SelectedProductCard } from './SelectedProductCard';

// ============================================================================
// COMPOSANT - SelectedPanel (colonne droite: produits sélectionnés)
// ============================================================================

interface SelectedPanelProps {
  localSelectedProducts: SelectedProduct[];
  showImages: boolean;
  showQuantity: boolean;
  onRemove: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onClearAll: () => void;
}

export function SelectedPanel({
  localSelectedProducts,
  showImages,
  showQuantity,
  onRemove,
  onUpdateQuantity,
  onClearAll,
}: SelectedPanelProps) {
  return (
    <div className="flex flex-col gap-4 overflow-hidden border-l-2 border-gray-100 pl-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-gray-700">
          Sélectionnés ({localSelectedProducts.length})
        </h3>
        {localSelectedProducts.length > 0 && (
          <ButtonV2
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            Tout retirer
          </ButtonV2>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 pr-4">
          {localSelectedProducts.length === 0 ? (
            <EmptyState type="no-selection" />
          ) : (
            localSelectedProducts.map((product, index) => (
              <SelectedProductCard
                key={product.id}
                product={product}
                index={index}
                showImages={showImages}
                showQuantity={showQuantity}
                onRemove={onRemove}
                onUpdateQuantity={onUpdateQuantity}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
