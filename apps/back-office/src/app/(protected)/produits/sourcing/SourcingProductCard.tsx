'use client';

import type { SourcingProduct } from '@verone/products';
import type { SourcingListSegment } from '@verone/products/utils';
import { Checkbox } from '@verone/ui';

import { formatPrice, SourcingStateBadges } from './sourcing-page.helpers';
import {
  SourcingProductActions,
  type SourcingProductActionHandlers,
} from './SourcingProductActions';
import { SourcingProductThumbnail, supplierNameOf } from './SourcingProductRow';

interface SourcingProductCardProps extends SourcingProductActionHandlers {
  product: SourcingProduct;
  segment: SourcingListSegment;
  canDelete: boolean;
  /** Sélection multiple (commande d'échantillons groupée). */
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

/** Ligne de la liste sourcing en carte, sous 768 px. */
export function SourcingProductCard({
  product,
  segment,
  canDelete,
  selectable = false,
  selected = false,
  onToggleSelect,
  ...handlers
}: SourcingProductCardProps) {
  const supplierName = supplierNameOf(product);

  return (
    <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-start gap-3">
        {selectable && (
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center">
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggleSelect?.()}
              aria-label={`Sélectionner ${product.name}`}
            />
          </span>
        )}
        <SourcingProductThumbnail product={product} size={48} />
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={handlers.onView}
            title={product.name}
            className="block w-full truncate text-left text-sm font-medium text-gray-900"
          >
            {product.name}
          </button>
          <p className="truncate text-sm text-gray-500">
            {supplierName ?? 'Sans fournisseur'}
          </p>
        </div>
        <span className="flex-shrink-0 text-sm font-medium">
          {product.cost_price != null ? formatPrice(product.cost_price) : '—'}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <SourcingStateBadges product={product} />
        <SourcingProductActions
          product={product}
          segment={segment}
          canDelete={canDelete}
          {...handlers}
        />
      </div>
    </div>
  );
}
