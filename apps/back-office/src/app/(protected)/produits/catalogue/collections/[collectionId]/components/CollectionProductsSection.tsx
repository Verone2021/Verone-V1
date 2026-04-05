'use client';

import { useRouter } from 'next/navigation';

import { ButtonV2 } from '@verone/ui';
import { Package, Plus } from 'lucide-react';

import { CollectionProductCard } from './CollectionProductCard';
import type { CollectionData, CollectionProduct } from './types';

interface CollectionProductsSectionProps {
  collection: CollectionData;
  onManageProducts: () => void;
  onRemoveProduct: (productId: string, productName: string) => Promise<void>;
}

export function CollectionProductsSection({
  collection,
  onManageProducts,
  onRemoveProduct,
}: CollectionProductsSectionProps) {
  const router = useRouter();

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Produits de la collection ({collection.products?.length ?? 0})
        </h2>
        <ButtonV2
          onClick={onManageProducts}
          className="bg-black text-white hover:bg-gray-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter des produits
        </ButtonV2>
      </div>

      {collection.products && collection.products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 auto-rows-fr">
          {collection.products.map(product => (
            <CollectionProductCard
              key={product.id}
              product={product as CollectionProduct}
              position={(product as CollectionProduct).position ?? 0}
              onRemove={() => {
                void onRemoveProduct(product.id, product.name).catch(error => {
                  console.error('[Collections] Remove product failed:', error);
                });
              }}
              router={router}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucun produit
          </h3>
          <p className="text-gray-600 mb-4">
            Cette collection ne contient pas encore de produits.
          </p>
          <ButtonV2
            onClick={onManageProducts}
            className="bg-black text-white hover:bg-gray-800"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter des produits
          </ButtonV2>
        </div>
      )}
    </div>
  );
}
