'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';

import { calculateMargin, calculateMarginRateFromPrices } from '@verone/utils';

import {
  useLinkMeOrder,
  useUpdateLinkMeOrder,
  type UpdateLinkMeOrderInput,
  type LinkMeOrderItem,
} from '../hooks/use-linkme-orders';

export interface EditableItem extends LinkMeOrderItem {
  originalQuantity: number;
  originalUnitPriceHt: number;
  editableMarginRate: number;
}

export function useEditLinkMeOrder(
  orderId: string | null,
  onClose: () => void
) {
  const { data: order, isLoading } = useLinkMeOrder(orderId);
  const updateOrder = useUpdateLinkMeOrder();

  const [taxRate, setTaxRate] = useState<number>(0.2);
  const [shippingCostHt, setShippingCostHt] = useState<number>(0);
  const [insuranceCostHt, setInsuranceCostHt] = useState<number>(0);
  const [handlingCostHt, setHandlingCostHt] = useState<number>(0);
  const [internalNotes, setInternalNotes] = useState<string>('');
  const [items, setItems] = useState<EditableItem[]>([]);

  const isEditable = order?.status === 'draft';

  useEffect(() => {
    if (order) {
      setTaxRate(order.tax_rate ?? 0.2);
      setShippingCostHt(order.shipping_cost_ht ?? 0);
      setInsuranceCostHt(order.insurance_cost_ht ?? 0);
      setHandlingCostHt(order.handling_cost_ht ?? 0);
      setInternalNotes(order.notes ?? '');
      setItems(
        (order.items ?? []).map(item => ({
          ...item,
          originalQuantity: item.quantity,
          originalUnitPriceHt: item.unit_price_ht,
          editableMarginRate: calculateMarginRateFromPrices(
            item.base_price_ht,
            item.unit_price_ht
          ),
        }))
      );
    }
  }, [order]);

  const totals = useMemo(() => {
    const roundMoney = (value: number): number => Math.round(value * 100) / 100;

    let productsHt = 0;
    let totalCommission = 0;
    for (const item of items) {
      productsHt = roundMoney(productsHt + item.quantity * item.unit_price_ht);
      const commission =
        (item.unit_price_ht - item.base_price_ht) * item.quantity;
      totalCommission = roundMoney(totalCommission + commission);
    }

    const feesHt = roundMoney(
      shippingCostHt + insuranceCostHt + handlingCostHt
    );
    const totalHt = roundMoney(productsHt + feesHt);
    const totalTtc = roundMoney(totalHt * (1 + taxRate));

    return { productsHt, feesHt, totalHt, totalTtc, totalCommission };
  }, [items, taxRate, shippingCostHt, insuranceCostHt, handlingCostHt]);

  const updateQuantity = (itemId: string, delta: number) => {
    setItems(
      items.map(item => {
        if (item.id === itemId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const updateItemPrice = useCallback((itemId: string, newPrice: number) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id !== itemId) return item;
        const safePrice = Math.max(0, newPrice);
        const newMarginRate =
          safePrice > item.base_price_ht
            ? calculateMarginRateFromPrices(item.base_price_ht, safePrice)
            : 0;
        return {
          ...item,
          unit_price_ht: safePrice,
          editableMarginRate: newMarginRate,
        };
      })
    );
  }, []);

  const updateItemMarginRate = useCallback(
    (itemId: string, newRate: number) => {
      setItems(prev =>
        prev.map(item => {
          if (item.id !== itemId) return item;
          const safeRate = Math.max(0, Math.min(99.9, newRate));
          const { sellingPriceHt } = calculateMargin({
            basePriceHt: item.base_price_ht,
            marginRate: safeRate,
          });
          return {
            ...item,
            unit_price_ht: sellingPriceHt,
            editableMarginRate: safeRate,
          };
        })
      );
    },
    []
  );

  const hasChanges = useMemo(() => {
    if (!order) return false;

    const taxChanged = taxRate !== (order.tax_rate ?? 0.2);
    const shippingChanged = shippingCostHt !== (order.shipping_cost_ht ?? 0);
    const insuranceChanged = insuranceCostHt !== (order.insurance_cost_ht ?? 0);
    const handlingChanged = handlingCostHt !== (order.handling_cost_ht ?? 0);
    const notesChanged = internalNotes !== (order.notes ?? '');
    const itemsChanged = items.some(
      item =>
        item.quantity !== item.originalQuantity ||
        item.unit_price_ht !== item.originalUnitPriceHt
    );

    return (
      taxChanged ||
      shippingChanged ||
      insuranceChanged ||
      handlingChanged ||
      notesChanged ||
      itemsChanged
    );
  }, [
    order,
    taxRate,
    shippingCostHt,
    insuranceCostHt,
    handlingCostHt,
    internalNotes,
    items,
  ]);

  const handleSave = async () => {
    if (!orderId || !hasChanges) return;

    const input: UpdateLinkMeOrderInput = {
      id: orderId,
      tax_rate: taxRate,
      shipping_cost_ht: shippingCostHt,
      insurance_cost_ht: insuranceCostHt,
      handling_cost_ht: handlingCostHt,
      internal_notes: internalNotes,
      items: items.map(item => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price_ht: item.unit_price_ht,
        ...(item.unit_price_ht !== item.originalUnitPriceHt
          ? { retrocession_rate: item.editableMarginRate / 100 }
          : {}),
      })),
    };

    try {
      await updateOrder.mutateAsync(input);
      onClose();
    } catch (error) {
      console.error('Erreur mise a jour commande:', error);
    }
  };

  return {
    // Data
    order,
    isLoading,
    isEditable,
    items,
    totals,
    hasChanges,
    // Form state
    taxRate,
    setTaxRate,
    shippingCostHt,
    setShippingCostHt,
    insuranceCostHt,
    setInsuranceCostHt,
    handlingCostHt,
    setHandlingCostHt,
    internalNotes,
    setInternalNotes,
    // Mutation
    updateOrder,
    // Handlers
    updateQuantity,
    updateItemPrice,
    updateItemMarginRate,
    handleSave,
  };
}
