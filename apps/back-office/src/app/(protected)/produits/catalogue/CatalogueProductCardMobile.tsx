'use client';

import { memo } from 'react';

import type { Product } from '@verone/categories';
import { useProductImages } from '@verone/products';
import type { QuickEditField } from '@verone/products';
import { Badge, CloudflareImage, ResponsiveActionMenu } from '@verone/ui';
import type { Database } from '@verone/types';
import { cn } from '@verone/utils';
import {
  Eye,
  Image as ImageIcon,
  Package,
  Pencil,
  Tag,
  Warehouse,
} from 'lucide-react';

import { STATUS_CONFIG, stockColor } from './catalogue-list-helpers';
import { ProductBrandChips } from './_components/ProductBrandChips';

type ProductImage = Database['public']['Tables']['product_images']['Row'];

interface ProductCardMobileProps {
  product: Product;
  preloadedImage?: ProductImage | null;
  onQuickEdit?: (product: Product, field: QuickEditField) => void;
  onCardClick: (productId: string) => void;
}

/**
 * Carte mobile (< md) — version compacte de ProductRow.
 * Affiche : image, nom, sku, statut, prix, stock + menu d'actions
 * pour les quick-edits (touch targets 44px via ResponsiveActionMenu).
 */
export const ProductCardMobile = memo(function ProductCardMobile({
  product,
  preloadedImage,
  onQuickEdit,
  onCardClick,
}: ProductCardMobileProps) {
  const { primaryImage: fetchedImage, loading: imageLoading } =
    useProductImages({
      productId: product.id,
      autoFetch: !preloadedImage,
    });
  const primaryImage = preloadedImage ?? fetchedImage;
  const statusCfg =
    STATUS_CONFIG[product.product_status] ?? STATUS_CONFIG.draft;

  const quickEditActions = onQuickEdit
    ? [
        {
          label: 'Voir détail',
          icon: Eye,
          onClick: () => onCardClick(product.id),
          alwaysVisible: true,
        },
        ...(product.cost_price == null
          ? [
              {
                label: 'Ajouter prix',
                icon: Tag,
                onClick: () => onQuickEdit(product, 'price'),
              },
            ]
          : []),
        ...(product.weight == null
          ? [
              {
                label: 'Ajouter poids',
                icon: Warehouse,
                onClick: () => onQuickEdit(product, 'weight'),
              },
            ]
          : []),
        ...(!product.supplier_id
          ? [
              {
                label: 'Ajouter fournisseur',
                icon: Pencil,
                onClick: () => onQuickEdit(product, 'supplier'),
              },
            ]
          : []),
        ...(!product.subcategory_id
          ? [
              {
                label: 'Ajouter sous-catégorie',
                icon: Pencil,
                onClick: () => onQuickEdit(product, 'subcategory'),
              },
            ]
          : []),
        ...(!product.has_images
          ? [
              {
                label: 'Ajouter photo',
                icon: ImageIcon,
                onClick: () => onQuickEdit(product, 'photo'),
              },
            ]
          : []),
      ]
    : [
        {
          label: 'Voir détail',
          icon: Eye,
          onClick: () => onCardClick(product.id),
          alwaysVisible: true,
        },
      ];

  const supplierName =
    product.supplier?.trade_name ?? product.supplier?.legal_name ?? null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => onCardClick(product.id)}
          className="h-16 w-16 flex-shrink-0 overflow-hidden rounded border border-gray-200 bg-gray-50 flex items-center justify-center"
          aria-label="Voir le détail"
        >
          {(primaryImage?.public_url || primaryImage?.cloudflare_image_id) &&
          !imageLoading ? (
            <CloudflareImage
              cloudflareId={primaryImage?.cloudflare_image_id}
              fallbackSrc={primaryImage?.public_url}
              alt={product.name}
              width={64}
              height={64}
              className="object-contain"
            />
          ) : (
            <Package className="h-6 w-6 text-gray-300" />
          )}
        </button>
        <button
          type="button"
          onClick={() => onCardClick(product.id)}
          className="flex-1 min-w-0 text-left"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="font-medium text-sm text-black line-clamp-2">
              {product.name}
            </span>
            <Badge
              className={cn(
                'text-[10px] font-medium px-1.5 py-0.5 border flex-shrink-0',
                statusCfg.className
              )}
            >
              {statusCfg.label}
            </Badge>
          </div>
          <ProductBrandChips
            brandIds={product.brand_ids}
            collapsed
            size="xs"
            className="mt-1"
          />
          <div className="text-[10px] text-gray-500 font-mono mt-0.5">
            {product.sku}
          </div>
          {supplierName && (
            <div className="text-xs text-gray-700 mt-1 truncate">
              {supplierName}
            </div>
          )}
          <div className="flex items-center gap-3 mt-2 text-sm">
            <span className="font-semibold text-black">
              {product.cost_price != null
                ? `${product.cost_price.toFixed(2)} €`
                : '—'}
            </span>
            <span className={cn('text-xs', stockColor(product.stock_real))}>
              Stock {product.stock_real ?? '-'}
            </span>
          </div>
        </button>
        <div className="flex-shrink-0">
          <ResponsiveActionMenu actions={quickEditActions} breakpoint="md" />
        </div>
      </div>
    </div>
  );
});
