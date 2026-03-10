'use client';

import type { ComponentProps } from 'react';

import { ProductFixedCharacteristics } from '@verone/products';
import { ButtonV2 } from '@verone/ui';
import { Edit } from 'lucide-react';

import type { Product } from './types';

interface ProductCharacteristicsTabProps {
  product: Product;
  onOpenCharacteristicsModal: () => void;
}

export function ProductCharacteristicsTab({
  product,
  onOpenCharacteristicsModal,
}: ProductCharacteristicsTabProps) {
  return (
    <div className="space-y-6">
      <section className="bg-white rounded-lg border border-neutral-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-black">Caractéristiques</h3>
          <ButtonV2
            variant="outline"
            size="sm"
            onClick={onOpenCharacteristicsModal}
          >
            <Edit className="h-3 w-3 mr-1" />
            Modifier
          </ButtonV2>
        </div>

        {product.variant_group_id && (
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
            ℹ️ Les caractéristiques sont gérées au niveau du groupe de
            variantes.{' '}
            <a
              href={`/produits/catalogue/variantes/${product.variant_group_id}`}
              className="underline font-medium hover:text-blue-900"
            >
              Voir le groupe
            </a>
          </div>
        )}

        <ProductFixedCharacteristics
          product={
            product as ComponentProps<
              typeof ProductFixedCharacteristics
            >['product']
          }
        />
      </section>
    </div>
  );
}
