'use client';

import { useState, useCallback } from 'react';

import type { SelectionItem } from '@verone/orders/hooks';

import type { QuoteItemLocal } from './types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export interface UseQuoteItemsReturn {
  items: QuoteItemLocal[];
  setItems: React.Dispatch<React.SetStateAction<QuoteItemLocal[]>>;
  showAddProduct: boolean;
  setShowAddProduct: (v: boolean) => void;
  handleAddProduct: (data: {
    product_id: string;
    quantity: number;
    unit_price_ht: number;
    tax_rate?: number;
    discount_percentage?: number;
    eco_tax?: number;
    notes?: string;
    product_name?: string;
    product_sku?: string;
    product_image_url?: string;
    product_description?: string;
  }) => void;
  handleAddLinkMeProduct: (item: SelectionItem) => void;
  handleAddServiceLine: () => void;
  handleRemoveItem: (itemId: string) => void;
  handleItemChange: (
    itemId: string,
    field: keyof QuoteItemLocal,
    value: string | number
  ) => void;
  resetItems: () => void;
}

export function useQuoteItems(): UseQuoteItemsReturn {
  const [items, setItems] = useState<QuoteItemLocal[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);

  const resetItems = useCallback(() => {
    setItems([]);
    setShowAddProduct(false);
  }, []);

  const handleAddProduct = useCallback(
    (data: {
      product_id: string;
      quantity: number;
      unit_price_ht: number;
      tax_rate?: number;
      discount_percentage?: number;
      eco_tax?: number;
      notes?: string;
      product_name?: string;
      product_sku?: string;
      product_image_url?: string;
      product_description?: string;
    }) => {
      const newItem: QuoteItemLocal = {
        id: generateId(),
        product_id: data.product_id,
        description: data.product_description ?? data.product_name ?? '',
        quantity: data.quantity,
        unit_price_ht: data.unit_price_ht,
        tva_rate: (data.tax_rate ?? 0.2) * 100,
        discount_percentage: data.discount_percentage ?? 0,
        eco_tax: data.eco_tax ?? 0,
        is_service: false,
        product: {
          name: data.product_name ?? '',
          sku: data.product_sku ?? '',
          primary_image_url: data.product_image_url,
        },
      };
      setItems(prev => [...prev, newItem]);
      setShowAddProduct(false);
    },
    []
  );

  const handleAddLinkMeProduct = useCallback((item: SelectionItem) => {
    const roundMoney = (value: number): number => Math.round(value * 100) / 100;

    setItems(prev => {
      const existing = prev.find(i => i.product_id === item.product_id);
      if (existing) {
        return prev.map(i =>
          i.product_id === item.product_id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }

      const commissionRate = (item.commission_rate ?? 0) / 100;
      const marginRate = item.margin_rate / 100;
      const sellingPrice = roundMoney(
        item.base_price_ht * (1 + marginRate) * (1 + commissionRate)
      );

      const newItem: QuoteItemLocal = {
        id: generateId(),
        product_id: item.product_id,
        description:
          item.custom_description ??
          item.product?.description ??
          item.product?.name ??
          '',
        quantity: 1,
        unit_price_ht: sellingPrice,
        tva_rate: 20,
        discount_percentage: 0,
        eco_tax: 0,
        is_service: false,
        product: {
          name: item.product?.name ?? '',
          sku: item.product?.sku ?? '',
          primary_image_url: item.product_image_url ?? undefined,
        },
        linkme_selection_item_id: item.id,
        base_price_ht: item.base_price_ht,
        retrocession_rate: marginRate,
      };
      return [...prev, newItem];
    });
  }, []);

  const handleAddServiceLine = useCallback(() => {
    setItems(prev => [
      ...prev,
      {
        id: generateId(),
        product_id: null,
        description: '',
        quantity: 1,
        unit_price_ht: 0,
        tva_rate: 20,
        discount_percentage: 0,
        eco_tax: 0,
        is_service: true,
      },
    ]);
  }, []);

  const handleRemoveItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId));
  }, []);

  const handleItemChange = useCallback(
    (itemId: string, field: keyof QuoteItemLocal, value: string | number) => {
      setItems(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, [field]: value } : item
        )
      );
    },
    []
  );

  return {
    items,
    setItems,
    showAddProduct,
    setShowAddProduct,
    handleAddProduct,
    handleAddLinkMeProduct,
    handleAddServiceLine,
    handleRemoveItem,
    handleItemChange,
    resetItems,
  };
}
