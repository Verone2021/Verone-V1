'use client';

import type { Product } from '@verone/categories';
import { ProductCardV2 as ProductCard } from '@verone/products';
import type { QuickEditField } from '@verone/products';
import type { Database } from '@verone/types';

import { useProductsWithHistory } from '@/hooks/use-products-with-history';

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
  const archivedIds = products.filter(p => p.archived_at).map(p => p.id);
  const { canDelete } = useProductsWithHistory(archivedIds);

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
