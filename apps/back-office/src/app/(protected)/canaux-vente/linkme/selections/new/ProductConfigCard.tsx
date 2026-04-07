'use client';

import { ProductThumbnail } from '@verone/products';
import { Card, CardContent } from '@verone/ui';
import { Trash2 } from 'lucide-react';

import { calculateFinalClientPrice } from '../../types';

import { MarginGauge } from './MarginGauge';
import type { SelectedProduct } from './new-selection.types';

interface ProductConfigCardProps {
  product: SelectedProduct;
  onMarginChange: (marginRate: number) => void;
  onRemove: () => void;
}

export function ProductConfigCard({
  product,
  onMarginChange,
  onRemove,
}: ProductConfigCardProps) {
  const finalPrice = calculateFinalClientPrice(
    product.base_price_ht,
    product.commission_rate,
    product.margin_rate
  );

  const gain = product.base_price_ht * product.margin_rate;

  return (
    <Card className="relative">
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
        title="Retirer"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      <CardContent className="p-4">
        <div className="flex gap-4">
          <ProductThumbnail
            src={product.image_url}
            alt={product.name}
            size="md"
          />

          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{product.name}</h4>
            <p className="text-xs text-gray-500">{product.sku}</p>

            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Base HT</span>
                <p className="font-medium">
                  {product.base_price_ht.toFixed(2)} €
                </p>
              </div>
              <div>
                <span className="text-gray-500">Prix LinkMe</span>
                <p className="font-medium">
                  {product.linkme_price_ht.toFixed(2)} €
                </p>
              </div>
              <div>
                <span className="text-gray-500">Public</span>
                <p className="font-medium">
                  {product.public_price_ht?.toFixed(2) ?? '-'} €
                </p>
              </div>
            </div>

            <div className="mt-4">
              <MarginGauge
                marginRate={product.margin_rate}
                maxRate={product.max_margin_rate}
                suggestedRate={product.suggested_margin_rate}
                onChange={onMarginChange}
              />
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Votre gain:</span>
                <p className="font-medium text-green-600">
                  {gain.toFixed(2)} €
                </p>
              </div>
              <div>
                <span className="text-gray-500">Prix final:</span>
                <p className="font-semibold">{finalPrice.toFixed(2)} € HT</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
