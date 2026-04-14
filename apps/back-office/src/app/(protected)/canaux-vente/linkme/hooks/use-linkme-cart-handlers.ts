'use client';

/**
 * Cart handlers extracted from use-create-linkme-order-form.ts
 */

import type { Dispatch, SetStateAction } from 'react';

import type { SelectionItem } from './use-linkme-selections';
import {
  buildCartItemFromSelection,
  type CartItem,
} from './create-order-form-helpers';

export function buildCartHandlers(
  setCart: Dispatch<SetStateAction<CartItem[]>>
) {
  const addProductFromSelection = (item: SelectionItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.product_id === item.product_id);
      if (existing) {
        return prev.map(c =>
          c.product_id === item.product_id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [...prev, buildCartItemFromSelection(item)];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(
      prev =>
        prev
          .map(item => {
            if (item.id === itemId) {
              const q = Math.max(0, item.quantity + delta);
              return q === 0 ? null : { ...item, quantity: q };
            }
            return item;
          })
          .filter(Boolean) as CartItem[]
    );
  };

  const updateUnitPrice = (itemId: string, newPrice: number) => {
    if (newPrice < 0 || isNaN(newPrice)) return;
    setCart(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, unit_price_ht: Math.round(newPrice * 100) / 100 }
          : item
      )
    );
  };

  const updateRetrocessionRate = (itemId: string, newRatePercent: number) => {
    if (newRatePercent < 0 || newRatePercent > 100 || isNaN(newRatePercent))
      return;
    const newRate = newRatePercent / 100;
    setCart(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, retrocession_rate: newRate } : item
      )
    );
  };

  const updateCommissionRate = (itemId: string, newRatePercent: number) => {
    if (newRatePercent < 0 || newRatePercent > 100 || isNaN(newRatePercent))
      return;
    const newRate = newRatePercent / 100;
    setCart(prev =>
      prev.map(item =>
        item.id === itemId
          ? {
              ...item,
              affiliate_commission_rate: newRate,
              retrocession_rate: newRate,
            }
          : item
      )
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  return {
    addProductFromSelection,
    updateQuantity,
    updateUnitPrice,
    updateRetrocessionRate,
    updateCommissionRate,
    removeFromCart,
  };
}
