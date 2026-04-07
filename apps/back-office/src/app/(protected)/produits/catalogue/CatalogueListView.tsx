'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

import type { Product } from '@verone/categories';
import { useProductImages } from '@verone/products';
import { Badge } from '@verone/ui';
import { Package } from 'lucide-react';

// ProductListItem extracted as a permanent component to avoid calling
// hooks inside .map() (anti-pattern fixed from original page.tsx)
interface ProductListItemProps {
  product: Product;
}

function ProductListItem({ product }: ProductListItemProps) {
  const router = useRouter();
  const { primaryImage, loading: imageLoading } = useProductImages({
    productId: product.id,
    autoFetch: true,
  });

  const statusLabels: Record<string, string> = {
    active: '✓ Actif',
    preorder: '📅 Précommande',
    discontinued: '⚠ Arrêté',
    draft: '📝 Brouillon',
  };

  return (
    <div
      className="card-verone p-3 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => router.push(`/produits/catalogue/${product.id}`)}
    >
      <div className="flex items-center space-x-3">
        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-100 flex items-center justify-center">
          {primaryImage?.public_url && !imageLoading ? (
            <Image
              src={primaryImage.public_url}
              alt={product.name}
              width={48}
              height={48}
              className="object-contain"
            />
          ) : (
            <Package className="h-5 w-5 text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-black truncate hover:underline">
            {product.name}
          </h3>
          <p className="text-xs text-black opacity-70">{product.sku}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-semibold text-sm text-black">
            {product.cost_price != null
              ? `${product.cost_price.toFixed(2)} € HT`
              : 'Prix non défini'}
          </div>
          <div className="flex items-center gap-1 mt-0.5 justify-end">
            <Badge className="text-[10px] px-1.5 py-0">
              {statusLabels[product.product_status] ?? product.product_status}
            </Badge>
            {product.product_type === 'custom' && (
              <Badge
                variant="secondary"
                className="bg-purple-100 text-purple-800 border-purple-300 text-[10px] px-1.5 py-0"
              >
                Sur mesure
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CatalogueListViewProps {
  products: Product[];
}

export function CatalogueListView({ products }: CatalogueListViewProps) {
  return (
    <div className="space-y-2">
      {products.map(product => (
        <ProductListItem key={product.id} product={product} />
      ))}
    </div>
  );
}
