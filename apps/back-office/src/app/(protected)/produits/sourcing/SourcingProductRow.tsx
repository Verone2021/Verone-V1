'use client';

import type { SourcingProduct } from '@verone/products';
import type { SourcingListSegment } from '@verone/products/utils';
import { Checkbox, CloudflareImage } from '@verone/ui';
import { Package } from 'lucide-react';

import {
  formatDate,
  formatPrice,
  getPrimaryImage,
  getSourcingTypeBadge,
  SourcingStateBadges,
} from './sourcing-page.helpers';
import {
  SourcingProductActions,
  type SourcingProductActionHandlers,
} from './SourcingProductActions';

interface SourcingProductRowProps extends SourcingProductActionHandlers {
  product: SourcingProduct;
  segment: SourcingListSegment;
  canDelete: boolean;
  /** Sélection multiple (commande d'échantillons groupée). */
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

export function supplierNameOf(product: SourcingProduct): string | undefined {
  return (
    product.supplier?.trade_name ??
    product.supplier?.legal_name ??
    product.supplier?.name
  );
}

export function SourcingProductThumbnail({
  product,
  size,
}: {
  product: SourcingProduct;
  size: 40 | 48;
}) {
  const primaryImage = getPrimaryImage(product);
  const hasImage = primaryImage.cloudflareId ?? primaryImage.publicUrl;
  return (
    <div
      className={`flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 ${size === 40 ? 'h-10 w-10' : 'h-12 w-12'}`}
    >
      {hasImage ? (
        <CloudflareImage
          cloudflareId={primaryImage.cloudflareId}
          fallbackSrc={primaryImage.publicUrl}
          alt={product.name}
          width={size}
          height={size}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Package className="h-4 w-4 text-gray-300" />
        </div>
      )}
    </div>
  );
}

export function SourcingProductRow({
  product,
  segment,
  canDelete,
  selectable = false,
  selected = false,
  onToggleSelect,
  ...handlers
}: SourcingProductRowProps) {
  const supplierName = supplierNameOf(product);

  return (
    <tr className="border-b border-gray-100 transition-colors hover:bg-gray-50/50">
      {selectable && (
        <td className="w-[44px] p-3">
          <Checkbox
            checked={selected}
            onCheckedChange={() => onToggleSelect?.()}
            aria-label={`Sélectionner ${product.name}`}
          />
        </td>
      )}

      {/* Photo + Nom */}
      <td className="min-w-[220px] p-3">
        <div className="flex items-center gap-3">
          <SourcingProductThumbnail product={product} size={40} />
          <div className="min-w-0">
            <button
              type="button"
              onClick={handlers.onView}
              title={product.name}
              className="block max-w-[250px] truncate text-left text-sm font-medium text-gray-900 hover:text-blue-600 hover:underline"
            >
              {product.name}
            </button>
            <p className="font-mono text-xs text-gray-400">{product.sku}</p>
          </div>
        </div>
      </td>

      {/* Fournisseur */}
      <td className="hidden p-3 lg:table-cell">
        {supplierName ? (
          <button
            type="button"
            onClick={handlers.onViewSupplier}
            title={supplierName}
            className="block max-w-[150px] truncate text-sm text-gray-600 hover:text-blue-600 hover:underline"
          >
            {supplierName}
          </button>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>

      {/* Prix */}
      <td className="w-[110px] p-3 text-right">
        {product.cost_price != null ? (
          <span className="text-sm font-medium">
            {formatPrice(product.cost_price)}
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </td>

      {/* Étape / état */}
      <td className="p-3">
        <SourcingStateBadges product={product} />
      </td>

      {/* Type */}
      <td className="hidden p-3 text-center xl:table-cell">
        {getSourcingTypeBadge(product.sourcing_type, product.requires_sample)}
      </td>

      {/* Date */}
      <td className="hidden w-[100px] p-3 text-right xl:table-cell">
        <span className="text-xs text-gray-500">
          {formatDate(product.created_at)}
        </span>
      </td>

      {/* Actions */}
      <td className="w-[150px] p-3 text-right">
        <SourcingProductActions
          product={product}
          segment={segment}
          canDelete={canDelete}
          {...handlers}
        />
      </td>
    </tr>
  );
}
