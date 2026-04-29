'use client';

import { memo, useCallback, useState } from 'react';

import { useRouter } from 'next/navigation';

import { CloudflareImage } from '@verone/ui';

import type { Product } from '@verone/categories';
import { useProductImages } from '@verone/products';
import type { QuickEditField } from '@verone/products';
import { Badge } from '@verone/ui';
import { cn } from '@verone/utils';
import type { Database } from '@verone/types';
import { Package, Pencil } from 'lucide-react';

import {
  type SortField,
  type SortDir,
  STATUS_CONFIG,
  formatDimensions,
  completionColor,
  stockColor,
  SortableHeader,
} from './catalogue-list-helpers';

type ProductImage = Database['public']['Tables']['product_images']['Row'];

interface ProductRowProps {
  product: Product;
  preloadedImage?: ProductImage | null;
  onQuickEdit?: (product: Product, field: QuickEditField) => void;
  onRowClick: (productId: string) => void;
}

const ProductRow = memo(function ProductRow({
  product,
  preloadedImage,
  onQuickEdit,
  onRowClick,
}: ProductRowProps) {
  const { primaryImage: fetchedImage, loading: imageLoading } =
    useProductImages({
      productId: product.id,
      autoFetch: !preloadedImage,
    });

  const primaryImage = preloadedImage ?? fetchedImage;
  const supplierName =
    product.supplier?.trade_name ?? product.supplier?.legal_name ?? '-';
  const subcategoryName = product.subcategories?.name ?? '-';
  const statusCfg =
    STATUS_CONFIG[product.product_status] ?? STATUS_CONFIG.draft;

  const handleEditClick = useCallback(
    (e: React.MouseEvent, field: QuickEditField) => {
      e.stopPropagation();
      if (onQuickEdit) onQuickEdit(product, field);
    },
    [product, onQuickEdit]
  );

  return (
    <tr
      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={() => onRowClick(product.id)}
    >
      <td className="py-2 px-2 w-12">
        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-50 flex items-center justify-center">
          {(primaryImage?.public_url || primaryImage?.cloudflare_image_id) &&
          !imageLoading ? (
            <CloudflareImage
              cloudflareId={primaryImage?.cloudflare_image_id}
              fallbackSrc={primaryImage?.public_url}
              alt={product.name}
              width={40}
              height={40}
              className="object-contain"
            />
          ) : (
            <Package className="h-4 w-4 text-gray-300" />
          )}
        </div>
      </td>

      <td className="py-2 px-2 min-w-[180px]">
        <div className="font-medium text-sm text-black truncate max-w-[220px]">
          {product.name}
        </div>
        <div className="text-[10px] text-gray-500 font-mono">{product.sku}</div>
      </td>

      <td className="py-2 px-2">
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-700 truncate max-w-[120px]">
            {supplierName}
          </span>
          {!product.supplier_id && onQuickEdit && (
            <button
              type="button"
              onClick={e => handleEditClick(e, 'supplier')}
              className="p-0.5 rounded hover:bg-orange-100 text-orange-500"
              title="Ajouter fournisseur"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
        </div>
      </td>

      <td className="py-2 px-2">
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-700 truncate max-w-[100px]">
            {subcategoryName}
          </span>
          {!product.subcategory_id && onQuickEdit && (
            <button
              type="button"
              onClick={e => handleEditClick(e, 'subcategory')}
              className="p-0.5 rounded hover:bg-orange-100 text-orange-500"
              title="Ajouter sous-categorie"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
        </div>
      </td>

      <td className="py-2 px-2 text-right">
        <div className="flex items-center justify-end gap-1">
          <span className="text-sm text-gray-700">
            {product.weight != null ? `${product.weight} kg` : '-'}
          </span>
          {product.weight == null && onQuickEdit && (
            <button
              type="button"
              onClick={e => handleEditClick(e, 'weight')}
              className="p-0.5 rounded hover:bg-orange-100 text-orange-500"
              title="Ajouter poids"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
        </div>
      </td>

      <td className="py-2 px-2 text-center">
        <div className="flex items-center justify-center gap-1">
          <span className="text-xs text-gray-600">
            {formatDimensions(product.dimensions)}
          </span>
          {product.dimensions == null && onQuickEdit && (
            <button
              type="button"
              onClick={e => handleEditClick(e, 'dimensions')}
              className="p-0.5 rounded hover:bg-orange-100 text-orange-500"
              title="Ajouter dimensions"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
        </div>
      </td>

      <td className="py-2 px-2 text-right">
        <span
          className={cn(
            'text-sm font-semibold',
            stockColor(product.stock_real)
          )}
        >
          {product.stock_real ?? '-'}
        </span>
      </td>

      <td className="py-2 px-2 text-right">
        <div className="flex items-center justify-end gap-1">
          <span className="text-sm font-semibold text-black">
            {product.cost_price != null
              ? `${product.cost_price.toFixed(2)} \u20AC`
              : '-'}
          </span>
          {product.cost_price == null && onQuickEdit && (
            <button
              type="button"
              onClick={e => handleEditClick(e, 'price')}
              className="p-0.5 rounded hover:bg-orange-100 text-orange-500"
              title="Ajouter prix"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
        </div>
      </td>

      <td className="py-2 px-2 text-right">
        <span
          className={cn(
            'text-sm',
            product.margin_percentage != null && product.margin_percentage >= 40
              ? 'text-green-600 font-semibold'
              : product.margin_percentage != null &&
                  product.margin_percentage >= 20
                ? 'text-orange-600'
                : product.margin_percentage != null
                  ? 'text-red-600'
                  : 'text-gray-400'
          )}
        >
          {product.margin_percentage != null
            ? `${product.margin_percentage.toFixed(1)}%`
            : '-'}
        </span>
      </td>

      <td className="py-2 px-2 text-center">
        <div className="flex items-center justify-center gap-1">
          <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                (product.completion_percentage ?? 0) >= 80
                  ? 'bg-green-500'
                  : (product.completion_percentage ?? 0) >= 50
                    ? 'bg-orange-500'
                    : 'bg-red-500'
              )}
              style={{ width: `${product.completion_percentage ?? 0}%` }}
            />
          </div>
          <span
            className={cn(
              'text-xs font-medium',
              completionColor(product.completion_percentage)
            )}
          >
            {product.completion_percentage ?? 0}%
          </span>
        </div>
      </td>

      <td className="py-2 px-2">
        <Badge
          className={cn(
            'text-[10px] font-medium px-1.5 py-0.5 border',
            statusCfg.className
          )}
        >
          {statusCfg.label}
        </Badge>
      </td>
    </tr>
  );
});

interface CatalogueListViewProps {
  products: Product[];
  activeTab?: 'active' | 'incomplete' | 'archived';
  getPrimaryImage?: (id: string) => ProductImage | null;
  getIncompletePrimaryImage?: (id: string) => ProductImage | null;
  onQuickEdit?: (product: Product, field: QuickEditField) => void;
}

export function CatalogueListView({
  products,
  activeTab = 'active',
  getPrimaryImage,
  getIncompletePrimaryImage,
  onQuickEdit,
}: CatalogueListViewProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDir('asc');
      }
    },
    [sortField]
  );

  const handleRowClick = useCallback(
    (productId: string) => {
      router.push(`/produits/catalogue/${productId}`);
    },
    [router]
  );

  const sortedProducts = [...products].sort((a, b) => {
    const dir = sortDir === 'asc' ? 1 : -1;
    switch (sortField) {
      case 'name':
        return dir * (a.name ?? '').localeCompare(b.name ?? '');
      case 'supplier': {
        const sa = a.supplier?.trade_name ?? a.supplier?.legal_name ?? '';
        const sb = b.supplier?.trade_name ?? b.supplier?.legal_name ?? '';
        return dir * sa.localeCompare(sb);
      }
      case 'subcategory': {
        const ca = a.subcategories?.name ?? '';
        const cb = b.subcategories?.name ?? '';
        return dir * ca.localeCompare(cb);
      }
      case 'weight':
        return dir * ((a.weight ?? 0) - (b.weight ?? 0));
      case 'stock_real':
        return dir * ((a.stock_real ?? 0) - (b.stock_real ?? 0));
      case 'cost_price':
        return dir * ((a.cost_price ?? 0) - (b.cost_price ?? 0));
      case 'margin_percentage':
        return dir * ((a.margin_percentage ?? 0) - (b.margin_percentage ?? 0));
      case 'completion_percentage':
        return (
          dir *
          ((a.completion_percentage ?? 0) - (b.completion_percentage ?? 0))
        );
      case 'product_status':
        return (
          dir * (a.product_status ?? '').localeCompare(b.product_status ?? '')
        );
      default:
        return 0;
    }
  });

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
      <table className="w-full text-left">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="py-2 px-2 w-12 text-xs font-semibold text-gray-500 uppercase">
              Photo
            </th>
            <SortableHeader
              label="Produit"
              field="name"
              currentSort={sortField}
              currentDir={sortDir}
              onSort={handleSort}
              className="min-w-[180px]"
            />
            <SortableHeader
              label="Fournisseur"
              field="supplier"
              currentSort={sortField}
              currentDir={sortDir}
              onSort={handleSort}
            />
            <SortableHeader
              label="Sous-cat."
              field="subcategory"
              currentSort={sortField}
              currentDir={sortDir}
              onSort={handleSort}
            />
            <SortableHeader
              label="Poids"
              field="weight"
              currentSort={sortField}
              currentDir={sortDir}
              onSort={handleSort}
              className="text-right"
            />
            <th className="py-2 px-2 text-xs font-semibold text-gray-500 uppercase text-center">
              Dimensions
            </th>
            <SortableHeader
              label="Stock"
              field="stock_real"
              currentSort={sortField}
              currentDir={sortDir}
              onSort={handleSort}
              className="text-right"
            />
            <SortableHeader
              label="Prix HT"
              field="cost_price"
              currentSort={sortField}
              currentDir={sortDir}
              onSort={handleSort}
              className="text-right"
            />
            <SortableHeader
              label="Marge"
              field="margin_percentage"
              currentSort={sortField}
              currentDir={sortDir}
              onSort={handleSort}
              className="text-right"
            />
            <SortableHeader
              label="Compl."
              field="completion_percentage"
              currentSort={sortField}
              currentDir={sortDir}
              onSort={handleSort}
              className="text-center"
            />
            <SortableHeader
              label="Statut"
              field="product_status"
              currentSort={sortField}
              currentDir={sortDir}
              onSort={handleSort}
            />
          </tr>
        </thead>
        <tbody>
          {sortedProducts.map(product => {
            const preloadedImage =
              activeTab === 'active'
                ? (getPrimaryImage?.(product.id) ?? null)
                : activeTab === 'incomplete'
                  ? (getIncompletePrimaryImage?.(product.id) ?? null)
                  : null;

            return (
              <ProductRow
                key={product.id}
                product={product}
                preloadedImage={preloadedImage}
                onQuickEdit={onQuickEdit}
                onRowClick={handleRowClick}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
