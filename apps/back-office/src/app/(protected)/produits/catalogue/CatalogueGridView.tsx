'use client';

import { useMemo } from 'react';

import type { Product } from '@verone/categories';
import { useChannelPricesBatch } from '@verone/channels';
import { ProductCardV2 as ProductCard } from '@verone/products';
import type { QuickEditField } from '@verone/products';
import type { Database } from '@verone/types';

import { useProductsWithHistory } from '@/hooks/use-products-with-history';

import { buildPricingView } from './_lib/catalogue-pricing-view';

type ProductImage = Database['public']['Tables']['product_images']['Row'];

interface CatalogueGridViewProps {
  products: Product[];
  activeTab: 'active' | 'incomplete' | 'archived';
  getPrimaryImage: (id: string) => ProductImage | null;
  getIncompletePrimaryImage: (id: string) => ProductImage | null;
  onQuickEdit: (product: Product, field: QuickEditField) => void;
  onArchive: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function CatalogueGridView({
  products,
  activeTab,
  getPrimaryImage,
  getIncompletePrimaryImage,
  onQuickEdit,
  onArchive,
  onDelete,
}: CatalogueGridViewProps) {
  // La carte n'affiche « Supprimer » que pour un produit archivé et seulement
  // si on lui passe onDelete : un produit qui a servi se retire, il ne se supprime pas.
  const archivedIds = useMemo(
    () => products.filter(p => p.archived_at).map(p => p.id),
    [products]
  );
  const { canDelete } = useProductsWithHistory(archivedIds);

  // Le meme verdict que la vue liste : sans ca, deux vues du meme ecran
  // affichent deux verites differentes sur le prix d'un produit.
  const productIds = useMemo(() => products.map(p => p.id), [products]);
  const { getPrices } = useChannelPricesBatch(productIds);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {products.map((product, index) => {
        const preloadedImage =
          activeTab === 'active'
            ? getPrimaryImage(product.id)
            : activeTab === 'incomplete'
              ? getIncompletePrimaryImage(product.id)
              : null;

        return (
          <ProductCard
            key={product.id}
            product={
              {
                ...product,
                supplier: product.supplier
                  ? {
                      ...product.supplier,
                      slug: (
                        product.supplier.trade_name ??
                        product.supplier.legal_name
                      )
                        .toLowerCase()
                        .replace(/\s+/g, '-'),
                      is_active: true,
                    }
                  : undefined,
              } as Product
            }
            index={index}
            pricingView={
              activeTab === 'active'
                ? buildPricingView(product, getPrices(product.id))
                : null
            }
            preloadedImage={preloadedImage}
            incompleteMode={activeTab === 'incomplete'}
            onQuickEdit={onQuickEdit}
            onArchive={product => {
              void onArchive(product);
            }}
            onDelete={
              canDelete(product.id)
                ? product => {
                    void onDelete(product);
                  }
                : undefined
            }
            archived={!!product.archived_at}
          />
        );
      })}
    </div>
  );
}
