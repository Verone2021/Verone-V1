'use client';

import { useState, useCallback } from 'react';

import type { QuoteItemLocal } from './types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export interface UseQuoteItemsReturn {
  items: QuoteItemLocal[];
  setItems: React.Dispatch<React.SetStateAction<QuoteItemLocal[]>>;
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

  const resetItems = useCallback(() => {
    setItems([]);
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
    handleAddServiceLine,
    handleRemoveItem,
    handleItemChange,
    resetItems,
  };
}
