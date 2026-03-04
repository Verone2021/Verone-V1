'use client';

import { ProductDescriptionsEditSection } from '@verone/products';

import type { Product, ProductRow } from './types';

interface ProductDescriptionsTabProps {
  product: Product;
  onProductUpdate: (updates: Partial<ProductRow>) => Promise<void>;
}

export function ProductDescriptionsTab({
  product,
  onProductUpdate,
}: ProductDescriptionsTabProps) {
  return (
    <div className="space-y-6">
      <section className="bg-white rounded-lg border border-neutral-200 p-5">
        <ProductDescriptionsEditSection
          product={{
            id: product.id,
            description: product.description,
            technical_description: product.technical_description,
            selling_points: product.selling_points as string[] | null,
          }}
          onUpdate={updates => {
            void onProductUpdate(updates).catch(console.error);
          }}
        />
      </section>
    </div>
  );
}
