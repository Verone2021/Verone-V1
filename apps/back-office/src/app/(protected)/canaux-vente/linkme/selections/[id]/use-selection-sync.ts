'use client';

import { useState } from 'react';

import { type SelectionItem } from '../../hooks/use-linkme-selections';

type UpdateItemMutation = {
  mutateAsync: (args: {
    itemId: string;
    selectionId: string;
    data: { base_price_ht?: number };
  }) => Promise<unknown>;
};

type SelectionWithItems = {
  id: string;
  items?: SelectionItem[] | null;
};

export function useSelectionSync(
  selection: SelectionWithItems | null | undefined,
  updateItem: UpdateItemMutation
) {
  const [syncingItemIds, setSyncingItemIds] = useState<Set<string>>(new Set());
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const divergentItems = (selection?.items ?? []).filter(
    (item: SelectionItem) =>
      item.catalog_price_ht !== null &&
      item.catalog_price_ht !== item.base_price_ht
  );

  const handleSyncItem = async (item: SelectionItem) => {
    if (!selection || item.catalog_price_ht === null) return;
    setSyncingItemIds(prev => new Set(prev).add(item.id));
    try {
      await updateItem.mutateAsync({
        itemId: item.id,
        selectionId: selection.id,
        data: { base_price_ht: item.catalog_price_ht },
      });
    } catch (syncError) {
      console.error('[Selections] syncItem failed:', syncError);
    } finally {
      setSyncingItemIds(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleSyncAll = async () => {
    if (!selection || divergentItems.length === 0) return;
    setIsSyncingAll(true);
    try {
      await Promise.all(
        divergentItems.map((item: SelectionItem) =>
          updateItem.mutateAsync({
            itemId: item.id,
            selectionId: selection.id,
            data: { base_price_ht: item.catalog_price_ht! },
          })
        )
      );
    } catch (syncError) {
      console.error('[Selections] syncAll failed:', syncError);
    } finally {
      setIsSyncingAll(false);
    }
  };

  return {
    divergentItems,
    syncingItemIds,
    isSyncingAll,
    handleSyncItem,
    handleSyncAll,
  };
}
