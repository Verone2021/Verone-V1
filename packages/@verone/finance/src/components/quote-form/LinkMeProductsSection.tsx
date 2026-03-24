'use client';

import type { SelectionItem } from '@verone/orders/hooks';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { Plus } from 'lucide-react';

import type { QuoteItemLocal } from './types';

// =====================================================================
// PROPS
// =====================================================================

interface SelectionDetails {
  name: string;
  items?: SelectionItem[];
}

export interface LinkMeProductsSectionProps {
  selectionDetails: SelectionDetails;
  currentItems: QuoteItemLocal[];
  onAddProduct: (item: SelectionItem) => void;
}

// =====================================================================
// COMPONENT
// =====================================================================

export function LinkMeProductsSection({
  selectionDetails,
  currentItems,
  onAddProduct,
}: LinkMeProductsSectionProps): React.ReactNode {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          Produits de la sélection — {selectionDetails.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {(selectionDetails.items ?? []).length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <p className="text-sm">Aucun produit dans cette sélection</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[250px] overflow-y-auto">
            {(selectionDetails.items ?? []).map(selItem => {
              const marginRate = selItem.margin_rate / 100;
              const commissionRate = (selItem.commission_rate ?? 0) / 100;
              const sellingPrice =
                Math.round(
                  selItem.base_price_ht *
                    (1 + marginRate) *
                    (1 + commissionRate) *
                    100
                ) / 100;
              const alreadyAdded = currentItems.some(
                i => i.product_id === selItem.product_id
              );

              return (
                <div
                  key={selItem.id}
                  className="flex items-center gap-3 p-2 border rounded-md hover:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {selItem.product?.name ?? 'Produit'}
                    </p>
                    <p className="text-xs text-gray-500">
                      SKU: {selItem.product?.sku ?? '-'} · Base:{' '}
                      {formatCurrency(selItem.base_price_ht)} · Marge:{' '}
                      {selItem.margin_rate}%
                    </p>
                  </div>
                  <div className="text-right mr-2">
                    <p className="text-sm font-semibold">
                      {formatCurrency(sellingPrice)}
                    </p>
                    <p className="text-xs text-gray-400">Prix affilié HT</p>
                  </div>
                  <ButtonV2
                    type="button"
                    variant={alreadyAdded ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => onAddProduct(selItem)}
                  >
                    <Plus className="h-4 w-4" />
                  </ButtonV2>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
