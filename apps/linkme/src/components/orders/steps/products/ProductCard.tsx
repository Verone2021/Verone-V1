'use client';

/**
 * ProductCard - Carte produit dans l'étape produits de commande
 *
 * @module ProductCard
 * @since 2026-04-14
 */

import { Card, CloudflareImage, cn } from '@verone/ui';
import { AlertCircle, Check, Plus, User } from 'lucide-react';

import type { SelectionItem } from '../../../../lib/hooks/use-user-selection';
import type { CartItem } from '../../schemas/order-form.schema';

// ============================================================================
// MARGIN HELPER
// ============================================================================

export function getMarginIndicator(marginRate: number): {
  color: string;
  bgColor: string;
  label: string;
} {
  if (marginRate >= 30)
    return {
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      label: 'Excellente',
    };
  if (marginRate >= 20)
    return {
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      label: 'Correcte',
    };
  return { color: 'text-red-600', bgColor: 'bg-red-100', label: 'Faible' };
}

// ============================================================================
// PRODUCT CARD
// ============================================================================

interface ProductCardProps {
  item: SelectionItem;
  inCart: boolean;
  cartItem: CartItem | undefined;
  displayQuantity: number;
  customPrice: number | undefined;
  canViewCommissions: boolean;
  onAddToCart: (item: SelectionItem) => void;
  onUpdateQuantity: (selectionItemId: string, quantity: number) => void;
  onLocalQuantityChange: (itemId: string, quantity: number) => void;
  onPriceChange: (itemId: string, price: number) => void;
  onPriceSave: (item: SelectionItem) => void;
}

export function ProductCard({
  item,
  inCart,
  cartItem,
  displayQuantity,
  customPrice,
  canViewCommissions,
  onAddToCart,
  onUpdateQuantity,
  onLocalQuantityChange,
  onPriceChange,
  onPriceSave,
}: ProductCardProps) {
  const marginIndicator = getMarginIndicator(item.margin_rate);
  const maxStock =
    item.product_stock_forecasted > 0
      ? item.product_stock_forecasted
      : Infinity;

  return (
    <Card
      className={cn(
        'overflow-hidden transition-all',
        inCart && 'border-green-300 bg-green-50/30'
      )}
    >
      {/* Image */}
      <div className="aspect-square bg-gray-100 relative">
        <CloudflareImage
          cloudflareId={item.product_cloudflare_image_id ?? null}
          fallbackSrc={item.product_image_url}
          alt={item.product_name}
          fill
          className="object-contain"
        />
        {inCart && (
          <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
            <Check className="h-3 w-3" />
            Dans le panier
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-medium text-gray-900 line-clamp-2">
            {item.product_name}
          </h3>
          {item.product_reference && (
            <p className="text-xs text-gray-400 mt-0.5">
              Réf: {item.product_reference}
            </p>
          )}
        </div>

        {/* Prix et badge */}
        <div className="flex items-center justify-between">
          <div>
            {item.is_affiliate_product ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={customPrice ?? item.selling_price_ht}
                  onChange={e =>
                    onPriceChange(item.id, parseFloat(e.target.value) || 0)
                  }
                  onBlur={() => onPriceSave(item)}
                  className="w-20 text-lg font-bold text-gray-900 border rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
                <span className="text-lg font-bold text-gray-900">€</span>
              </div>
            ) : (
              <p className="text-lg font-bold text-gray-900">
                {item.selling_price_ht.toLocaleString('fr-FR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                €
              </p>
            )}
            <p className="text-xs text-gray-500">
              {item.is_affiliate_product ? 'Prix HT (modifiable)' : 'Prix HT'}
            </p>
          </div>
          {item.is_affiliate_product ? (
            <div className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-600 flex items-center gap-1">
              <User className="h-3 w-3" />
              Votre produit
            </div>
          ) : canViewCommissions ? (
            <div
              className={cn(
                'px-2 py-1 rounded text-xs font-medium',
                marginIndicator.bgColor,
                marginIndicator.color
              )}
              title={`Marge: ${item.margin_rate.toFixed(2)}%`}
            >
              {item.margin_rate.toFixed(2)}%
            </div>
          ) : null}
        </div>

        {/* Stock */}
        <div className="flex items-center justify-between text-xs">
          {item.product_stock_forecasted > 0 ? (
            <span className="inline-flex items-center gap-1 text-green-600">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Stock : {item.product_stock_forecasted}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-red-500 font-medium">
              <AlertCircle className="h-3 w-3" />
              Rupture
            </span>
          )}
        </div>

        {/* Quantité + Ajouter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-lg">
            <button
              type="button"
              onClick={() => {
                if (inCart && cartItem) {
                  onUpdateQuantity(item.id, Math.max(1, cartItem.quantity - 1));
                } else {
                  onLocalQuantityChange(
                    item.id,
                    Math.max(1, displayQuantity - 1)
                  );
                }
              }}
              className="px-2 py-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
            >
              -
            </button>
            <input
              type="number"
              min={1}
              max={
                item.product_stock_forecasted > 0
                  ? item.product_stock_forecasted
                  : undefined
              }
              value={displayQuantity}
              onChange={e => {
                const newValue = Math.max(
                  1,
                  Math.min(maxStock, parseInt(e.target.value) || 1)
                );
                if (inCart && cartItem) {
                  onUpdateQuantity(item.id, newValue);
                } else {
                  onLocalQuantityChange(item.id, newValue);
                }
              }}
              className="w-12 text-center border-x py-1.5 text-sm focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                if (inCart && cartItem) {
                  if (cartItem.quantity < maxStock)
                    onUpdateQuantity(item.id, cartItem.quantity + 1);
                } else {
                  onLocalQuantityChange(
                    item.id,
                    Math.min(maxStock, displayQuantity + 1)
                  );
                }
              }}
              disabled={
                item.product_stock_forecasted > 0 &&
                displayQuantity >= item.product_stock_forecasted
              }
              className="px-2 py-1.5 text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-30"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={() => onAddToCart(item)}
            disabled={item.product_stock_forecasted <= 0}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-medium text-sm transition-colors',
              item.product_stock_forecasted <= 0
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : inCart
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-linkme-turquoise text-white hover:bg-linkme-turquoise/90'
            )}
          >
            <Plus className="h-4 w-4" />
            {inCart ? 'Ajouter encore' : 'Ajouter'}
          </button>
        </div>
      </div>
    </Card>
  );
}
