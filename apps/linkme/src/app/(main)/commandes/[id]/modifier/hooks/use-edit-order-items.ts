import { useState, useMemo, useCallback } from 'react';

import { LINKME_CONSTANTS } from '@verone/utils';

import type { EditableItem } from '../types';
import type { OrderItemData } from '../page';
import { mapOrderItemToEditable } from '../helpers';

// ============================================================================
// TYPES
// ============================================================================

export interface AddProductInput {
  product_id: string;
  product_name: string;
  product_sku: string | null;
  product_image_url: string | null;
  unit_price_ht: number;
  base_price_ht: number;
  margin_rate: number;
  quantity: number;
  is_affiliate_product?: boolean;
  affiliate_commission_rate?: number;
}

// ============================================================================
// HOOK
// ============================================================================

export function useEditOrderItems(
  initialItems: OrderItemData[],
  shippingCostHt: number | null | undefined
) {
  const [items, setItems] = useState<EditableItem[]>(() =>
    initialItems.map(mapOrderItemToEditable)
  );

  // ---- Handlers: Items ----
  const updateQuantity = useCallback((itemId: string, delta: number) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === itemId || (item._isNew && item.product_id === itemId)) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  }, []);

  const setQuantity = useCallback((itemId: string, quantity: number) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === itemId || (item._isNew && item.product_id === itemId)) {
          return { ...item, quantity: Math.max(1, quantity) };
        }
        return item;
      })
    );
  }, []);

  const toggleDeleteItem = useCallback((itemId: string) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          return { ...item, _delete: !item._delete };
        }
        return item;
      })
    );
  }, []);

  const removeNewItem = useCallback((productId: string) => {
    setItems(prev =>
      prev.filter(i => !(i._isNew && i.product_id === productId))
    );
  }, []);

  // Modifier prix unitaire (produits affiliés uniquement)
  const updateItemPrice = useCallback((itemId: string, newPrice: number) => {
    if (newPrice < 0 || isNaN(newPrice)) return;
    setItems(prev =>
      prev.map(item => {
        if (item.id === itemId || (item._isNew && item.product_id === itemId)) {
          return { ...item, unit_price_ht: Math.round(newPrice * 100) / 100 };
        }
        return item;
      })
    );
  }, []);

  const handleAddProducts = useCallback((newProducts: AddProductInput[]) => {
    setItems(prev => {
      const updated = [...prev];
      for (const product of newProducts) {
        const existingIdx = updated.findIndex(
          i => i.product_id === product.product_id
        );
        if (existingIdx >= 0) {
          const existing = updated[existingIdx];
          updated[existingIdx] = {
            ...existing,
            quantity: existing._delete
              ? product.quantity
              : existing.quantity + product.quantity,
            _delete: false,
          };
        } else {
          updated.push({
            id: `new-${product.product_id}`,
            product_id: product.product_id,
            product_name: product.product_name,
            product_sku: product.product_sku,
            product_image_url: product.product_image_url,
            quantity: product.quantity,
            originalQuantity: 0,
            unit_price_ht: product.unit_price_ht,
            original_unit_price_ht: product.unit_price_ht,
            base_price_ht: product.base_price_ht,
            margin_rate: product.margin_rate,
            tax_rate: 0.2,
            _delete: false,
            _isNew: true,
            is_affiliate_product: product.is_affiliate_product ?? false,
            affiliate_commission_rate: product.affiliate_commission_rate ?? 0,
          });
        }
      }
      return updated;
    });
  }, []);

  // ---- Computed: Totals ----
  const totals = useMemo(() => {
    const roundMoney = (value: number): number => Math.round(value * 100) / 100;

    let productsHt = 0;
    let totalCommission = 0;

    for (const item of items) {
      if (!item._delete) {
        productsHt = roundMoney(
          productsHt + item.quantity * item.unit_price_ht
        );
        // Commission = unit_price * retrocession_rate * quantity
        // Aligned with DB trigger lock_prices_on_order_validation()
        // margin_rate here is retrocession_rate (decimal, e.g. 0.15 = 15%)
        totalCommission = roundMoney(
          totalCommission +
            item.unit_price_ht * item.margin_rate * item.quantity
        );
      }
    }

    const shippingHt = shippingCostHt ?? 0;
    const totalHt = roundMoney(productsHt + shippingHt);
    const totalTtc = roundMoney(
      totalHt * (1 + LINKME_CONSTANTS.DEFAULT_TAX_RATE)
    );

    return { productsHt, shippingHt, totalHt, totalTtc, totalCommission };
  }, [items, shippingCostHt]);

  // ---- Computed: Active items count ----
  const activeItemsCount = useMemo(
    () => items.filter(i => !i._delete).length,
    [items]
  );

  // ---- Existing product IDs (for dialog filter) ----
  const existingProductIds = useMemo(
    () => new Set(items.filter(i => !i._delete).map(i => i.product_id)),
    [items]
  );

  return {
    items,
    totals,
    activeItemsCount,
    existingProductIds,
    updateQuantity,
    setQuantity,
    toggleDeleteItem,
    removeNewItem,
    updateItemPrice,
    handleAddProducts,
  };
}
