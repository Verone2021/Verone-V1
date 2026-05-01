'use client';

import { memo, useCallback } from 'react';

import type { Product } from '@verone/categories';
import { useProductImages } from '@verone/products';
import type { QuickEditField } from '@verone/products';
import { Badge, Checkbox, CloudflareImage } from '@verone/ui';
import type { Database } from '@verone/types';
import { cn } from '@verone/utils';
import { Package, Pencil } from 'lucide-react';

import {
  STATUS_CONFIG,
  formatDimensions,
  completionColor,
  stockColor,
} from './catalogue-list-helpers';
import { ProductBrandChips } from './_components/ProductBrandChips';

type ProductImage = Database['public']['Tables']['product_images']['Row'];

interface ProductRowProps {
  product: Product;
  preloadedImage?: ProductImage | null;
  onQuickEdit?: (product: Product, field: QuickEditField) => void;
  onRowClick: (productId: string) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (productId: string) => void;
}

export const ProductRow = memo(function ProductRow({
  product,
  preloadedImage,
  onQuickEdit,
  onRowClick,
  selectable = false,
  selected = false,
  onToggleSelect,
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
      className={cn(
        'border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors',
        selected && 'bg-blue-50/60 hover:bg-blue-50'
      )}
      onClick={() => onRowClick(product.id)}
    >
      {selectable && (
        <td
          className="py-2 px-2 w-10"
          onClick={e => {
            e.stopPropagation();
            onToggleSelect?.(product.id);
          }}
        >
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelect?.(product.id)}
            aria-label={`Sélectionner ${product.name}`}
          />
        </td>
      )}
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
        <ProductBrandChips
          brandIds={product.brand_ids}
          collapsed
          size="xs"
          className="mt-1"
        />
      </td>

      <td className="py-2 px-2 hidden lg:table-cell">
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
              aria-label="Ajouter fournisseur"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
        </div>
      </td>

      <td className="py-2 px-2 hidden xl:table-cell">
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
              aria-label="Ajouter sous-categorie"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
        </div>
      </td>

      <td className="py-2 px-2 text-right hidden 2xl:table-cell">
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
              aria-label="Ajouter poids"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
        </div>
      </td>

      <td className="py-2 px-2 text-center hidden 2xl:table-cell">
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
              aria-label="Ajouter dimensions"
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
              ? `${product.cost_price.toFixed(2)} €`
              : '-'}
          </span>
          {product.cost_price == null && onQuickEdit && (
            <button
              type="button"
              onClick={e => handleEditClick(e, 'price')}
              className="p-0.5 rounded hover:bg-orange-100 text-orange-500"
              title="Ajouter prix"
              aria-label="Ajouter prix"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
        </div>
      </td>

      <td className="py-2 px-2 text-right hidden lg:table-cell">
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

      <td className="py-2 px-2 text-center hidden xl:table-cell">
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
