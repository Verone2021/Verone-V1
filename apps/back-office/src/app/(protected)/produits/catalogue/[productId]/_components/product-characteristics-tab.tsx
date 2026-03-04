'use client';

import type { ComponentProps } from 'react';

import { ProductFixedCharacteristics } from '@verone/products';
import { ButtonUnified } from '@verone/ui';

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

        <div className="mt-4">
          <ButtonUnified
            variant="outline"
            size="sm"
            onClick={onOpenCharacteristicsModal}
          >
            Éditer caractéristiques
          </ButtonUnified>
        </div>
      </section>
    </div>
  );
}
