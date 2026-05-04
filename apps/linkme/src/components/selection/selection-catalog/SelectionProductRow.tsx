'use client';

/**
 * SelectionProductRow - Ligne produit dans SelectionCatalogDialog
 *
 * @module SelectionProductRow
 * @since 2026-04-14
 */

import { AlertTriangle, EyeOff } from 'lucide-react';

import { CloudflareImage } from '@verone/ui';

import type { SelectionItem } from '../../../lib/hooks/use-user-selection';

// ============================================================================
// HELPERS
// ============================================================================

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: { label: 'Actif', className: 'bg-green-100 text-green-700' },
  preorder: { label: 'Précommande', className: 'bg-blue-100 text-blue-700' },
  discontinued: { label: 'Arrêté', className: 'bg-red-100 text-red-700' },
  draft: { label: 'Brouillon', className: 'bg-gray-100 text-gray-500' },
};

function ProductStatusBadge({
  status,
}: {
  status: string;
}): React.JSX.Element | null {
  if (status === 'active') return null;
  const config = STATUS_CONFIG[status];
  if (!config) return null;
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function StockBadgeCompact({ stock }: { stock: number }): React.JSX.Element {
  if (stock > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600">
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        {stock}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-red-500">
      <AlertTriangle className="h-3 w-3" />
      Rupture
    </span>
  );
}

// ============================================================================
// PRODUCT ROW
// ============================================================================

interface SelectionProductRowProps {
  item: SelectionItem;
  onClick: () => void;
}

export function SelectionProductRow({
  item,
  onClick,
}: SelectionProductRowProps): React.JSX.Element {
  const isHidden = item.is_hidden_by_staff;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg border p-2.5 hover:shadow-sm transition-all text-left w-full cursor-pointer ${
        isHidden
          ? 'opacity-50 bg-orange-50 border-orange-200'
          : 'bg-white border-gray-100 hover:border-linkme-turquoise/40'
      }`}
    >
      <div className="relative h-16 w-16 flex-shrink-0 rounded-md bg-gray-50 overflow-hidden">
        <CloudflareImage
          cloudflareId={item.product_cloudflare_image_id ?? null}
          fallbackSrc={item.product_image_url}
          alt={item.product_name}
          fill
          className="object-cover"
          sizes="64px"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-[10px] text-gray-400 font-mono flex-shrink-0">
            {item.product_reference}
          </span>
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {item.product_name}
          </h3>
          {isHidden && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-orange-100 text-orange-700 flex-shrink-0">
              <EyeOff className="h-2.5 w-2.5" />
              Masqué par Vérone
            </span>
          )}
        </div>
        {item.subcategory_name && (
          <p className="text-xs text-gray-400 truncate mt-0.5">
            {item.subcategory_name}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-sm font-semibold text-gray-900">
            {formatPrice(item.selling_price_ht)}
            <span className="text-[10px] font-normal text-gray-400 ml-0.5">
              HT
            </span>
          </span>
          {!item.is_affiliate_product ? (
            <span className="text-xs text-linkme-turquoise font-medium">
              M:{item.margin_rate.toFixed(2)}%
            </span>
          ) : (
            <span className="text-xs text-indigo-500 font-medium">Affilie</span>
          )}
          <StockBadgeCompact stock={item.product_stock_forecasted} />
          <ProductStatusBadge status={item.product_status} />
        </div>
      </div>
    </button>
  );
}
