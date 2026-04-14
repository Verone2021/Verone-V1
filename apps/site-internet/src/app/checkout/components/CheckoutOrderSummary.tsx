'use client';

import Image from 'next/image';

import { formatPrice } from '@verone/utils';
import { ShoppingCart, Truck } from 'lucide-react';

import { useCart } from '@/contexts/CartContext';

import type { PromoResult, ShippingConfigPublic } from '../types';

interface CheckoutOrderSummaryProps {
  promoCode: string;
  onPromoCodeChange: (value: string) => void;
  promoResult: PromoResult | null;
  promoError: string;
  promoLoading: boolean;
  onApplyPromo: () => void;
  shippingConfig: ShippingConfigPublic | null;
  subtotal: number;
  discount: number;
  shippingEstimate: number;
  total: number;
}

export function CheckoutOrderSummary({
  promoCode,
  onPromoCodeChange,
  promoResult,
  promoError,
  promoLoading,
  onApplyPromo,
  shippingConfig,
  subtotal,
  discount,
  shippingEstimate,
  total,
}: CheckoutOrderSummaryProps) {
  const { items, itemCount } = useCart();

  return (
    <div className="border border-verone-gray-200 rounded-lg p-6 sticky top-24">
      <h2 className="text-lg font-semibold text-verone-black mb-4">
        Récapitulatif ({itemCount} article{itemCount > 1 ? 's' : ''})
      </h2>

      <div className="space-y-4 mb-6">
        {items.map(item => {
          const itemTotal =
            (item.price_ttc +
              item.eco_participation +
              (item.include_assembly ? item.assembly_price : 0)) *
            item.quantity;
          return (
            <div key={item.id} className="flex gap-3">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-verone-gray-50 flex-shrink-0">
                {item.primary_image_url ? (
                  <Image
                    src={item.primary_image_url}
                    alt={item.name}
                    fill
                    sizes="64px"
                    className="object-contain p-1"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ShoppingCart className="h-4 w-4 text-verone-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-verone-black truncate">
                  {item.name}
                </p>
                <p className="text-xs text-verone-gray-500">
                  Qté : {item.quantity}
                </p>
                {item.include_assembly && (
                  <p className="text-xs text-blue-600">+ Montage</p>
                )}
              </div>
              <p className="text-sm font-medium text-verone-black">
                {formatPrice(itemTotal)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Promo code */}
      <div className="border-t border-verone-gray-100 pt-4 mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={promoCode}
            onChange={e => onPromoCodeChange(e.target.value.toUpperCase())}
            placeholder="Code promo"
            className="flex-1 px-3 py-2 border border-verone-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-verone-black"
          />
          <button
            type="button"
            onClick={() => {
              void Promise.resolve(onApplyPromo()).catch(err => {
                console.error('[Promo]', err);
              });
            }}
            disabled={promoLoading || !promoCode.trim()}
            className="px-4 py-2 text-sm border border-verone-black text-verone-black hover:bg-verone-black hover:text-verone-white transition-colors disabled:opacity-30"
          >
            {promoLoading ? '...' : 'Appliquer'}
          </button>
        </div>
        {promoError && (
          <p className="text-xs text-red-500 mt-1.5">{promoError}</p>
        )}
        {promoResult && (
          <p className="text-xs text-green-600 mt-1.5">
            {promoResult.name} : -{formatPrice(promoResult.discount_amount)}
          </p>
        )}
      </div>

      {/* Totals */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm text-verone-gray-600">
          <span>Sous-total</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Réduction ({promoResult?.code})</span>
            <span>-{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-verone-gray-600">
          <span className="flex items-center gap-1">
            <Truck className="h-3.5 w-3.5" />
            Livraison
          </span>
          <span>
            {shippingEstimate === 0 ? (
              <span className="text-green-600 font-medium">Offerte</span>
            ) : (
              formatPrice(shippingEstimate)
            )}
          </span>
        </div>
        {shippingEstimate > 0 &&
          shippingConfig?.free_shipping_enabled &&
          shippingConfig.shipping_info_message && (
            <p className="text-xs text-verone-gray-400">
              {shippingConfig.shipping_info_message}
            </p>
          )}
        <div className="border-t border-verone-gray-100 pt-3 flex justify-between text-lg font-bold text-verone-black">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );
}
