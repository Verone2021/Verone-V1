'use client';

import { memo } from 'react';

import type { Product } from '@verone/categories';
import { useProductImages } from '@verone/products';
import type { QuickEditField } from '@verone/products';
import {
  Badge,
  Checkbox,
  CloudflareImage,
  ResponsiveActionMenu,
} from '@verone/ui';
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
import type { CataloguePricingView } from './_lib/catalogue-pricing-view';

type ProductImage = Database['public']['Tables']['product_images']['Row'];

interface ProductCardMobileProps {
  product: Product;
  preloadedImage?: ProductImage | null;
  onQuickEdit?: (product: Product, field: QuickEditField) => void;
  onCardClick: (productId: string) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (productId: string) => void;
  /** Vue prix de la carte. `undefined` tant que le lot de prix charge. */
  pricingView?: CataloguePricingView;
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
  selectable = false,
  selected = false,
  onToggleSelect,
  pricingView,
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
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white p-3 shadow-sm',
        selected && 'border-blue-300 bg-blue-50/40'
      )}
    >
      <div className="flex items-start gap-3">
        {selectable && (
          <div
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggleSelect?.(product.id)}
              aria-label={`Sélectionner ${product.name}`}
              checkboxSize="lg"
            />
          </div>
        )}
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
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm">
            <span className="text-xs text-gray-600">
              Achat{' '}
              <span className="font-semibold text-black">
                {product.cost_price != null
                  ? `${product.cost_price.toFixed(2)} €`
                  : '—'}
              </span>
            </span>
            {pricingView && (
              <span className="text-xs text-gray-600">
                Site{' '}
                <span
                  className={cn(
                    'font-semibold',
                    pricingView.sitePriceHt == null
                      ? 'text-gray-400'
                      : pricingView.sitePriceSource === 'base_price'
                        ? 'text-red-600'
                        : 'text-black'
                  )}
                >
                  {pricingView.sitePriceHt != null
                    ? `${pricingView.sitePriceHt.toFixed(2)} €`
                    : '—'}
                </span>
              </span>
            )}
            <span className={cn('text-xs', stockColor(product.stock_real))}>
              Stock {product.stock_real ?? '-'}
            </span>
          </div>
          {pricingView && (
            <div className="flex flex-wrap items-center gap-2 mt-1">
              {pricingView.marginPercent != null ? (
                <span
                  className={cn(
                    'text-xs font-semibold',
                    pricingView.severity === 'critical'
                      ? 'text-red-600'
                      : pricingView.severity === 'warning'
                        ? 'text-orange-600'
                        : 'text-green-600'
                  )}
                >
                  Marge {pricingView.marginPercent.toFixed(0)} %
                  {pricingView.coefficient != null &&
                    ` · ×${pricingView.coefficient.toFixed(2)}`}
                </span>
              ) : (
                <span className="text-xs text-gray-400">
                  Marge inconnue (prix de revient manquant)
                </span>
              )}
              {pricingView.alerts.length > 0 && (
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.5 rounded border',
                    pricingView.severity === 'critical'
                      ? 'text-red-700 border-red-200 bg-red-50'
                      : 'text-orange-700 border-orange-200 bg-orange-50'
                  )}
                >
                  {pricingView.alerts[0].message}
                </span>
              )}
            </div>
          )}
        </button>
        <div className="flex-shrink-0">
          <ResponsiveActionMenu actions={quickEditActions} breakpoint="md" />
        </div>
      </div>
    </div>
  );
});
