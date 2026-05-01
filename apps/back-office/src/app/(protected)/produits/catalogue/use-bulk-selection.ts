'use client';

import { useCallback, useMemo, useState } from 'react';

import type { Product } from '@verone/categories';

export interface BulkSelection {
  selectedIds: Set<string>;
  selectedCount: number;
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  toggleAll: (products: Product[]) => void;
  clear: () => void;
  allSelected: (products: Product[]) => boolean;
  someSelected: (products: Product[]) => boolean;
}

export function useBulkSelection(): BulkSelection {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const toggle = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback((products: Product[]) => {
    setSelectedIds(prev => {
      const ids = products.map(p => p.id);
      const all = ids.every(id => prev.has(id));
      if (all) {
        const next = new Set(prev);
        ids.forEach(id => next.delete(id));
        return next;
      }
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const allSelected = useCallback(
    (products: Product[]) =>
      products.length > 0 && products.every(p => selectedIds.has(p.id)),
    [selectedIds]
  );

  const someSelected = useCallback(
    (products: Product[]) => products.some(p => selectedIds.has(p.id)),
    [selectedIds]
  );

  return useMemo(
    () => ({
      selectedIds,
      selectedCount: selectedIds.size,
      isSelected,
      toggle,
      toggleAll,
      clear,
      allSelected,
      someSelected,
    }),
    [
      selectedIds,
      isSelected,
      toggle,
      toggleAll,
      clear,
      allSelected,
      someSelected,
    ]
  );
}
