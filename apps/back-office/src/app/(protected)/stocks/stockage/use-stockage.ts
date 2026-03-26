'use client';

/**
 * Data fetching hook for StockagePage
 *
 * @module use-stockage
 * @since 2025-12-20
 */

import { useState, useMemo } from 'react';

import {
  useGlobalStorageTotals,
  useGlobalStorageOverview,
  type GlobalStorageOverviewItem,
} from './hooks/use-storage-billing';
import { type OwnerTypeFilter } from './stockage-types';

interface UseStockageReturn {
  totals: ReturnType<typeof useGlobalStorageTotals>['data'];
  totalsLoading: boolean;
  overview: GlobalStorageOverviewItem[] | undefined;
  overviewLoading: boolean;
  isLoading: boolean;
  filteredOverview: GlobalStorageOverviewItem[];
  refetch: ReturnType<typeof useGlobalStorageOverview>['refetch'];
  selectedOwner: GlobalStorageOverviewItem | null;
  setSelectedOwner: (owner: GlobalStorageOverviewItem | null) => void;
  ownerTypeFilter: OwnerTypeFilter;
  setOwnerTypeFilter: (filter: OwnerTypeFilter) => void;
  showBillableOnly: boolean;
  setShowBillableOnly: (value: boolean) => void;
  showAddDialog: boolean;
  setShowAddDialog: (value: boolean) => void;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
}

export function useStockage(): UseStockageReturn {
  const [selectedOwner, setSelectedOwner] =
    useState<GlobalStorageOverviewItem | null>(null);
  const [ownerTypeFilter, setOwnerTypeFilter] =
    useState<OwnerTypeFilter>('all');
  const [showBillableOnly, setShowBillableOnly] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: totals, isLoading: totalsLoading } = useGlobalStorageTotals();
  const {
    data: overview,
    isLoading: overviewLoading,
    refetch,
  } = useGlobalStorageOverview();

  const isLoading = totalsLoading || overviewLoading;

  const filteredOverview = useMemo(() => {
    if (!overview) return [];

    return overview.filter(item => {
      if (ownerTypeFilter !== 'all' && item.owner_type !== ownerTypeFilter) {
        return false;
      }
      if (showBillableOnly && item.billable_volume_m3 <= 0) {
        return false;
      }
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const name = (item.owner_name ?? '').toLowerCase();
        if (!name.includes(term)) {
          return false;
        }
      }
      return true;
    });
  }, [overview, ownerTypeFilter, showBillableOnly, searchTerm]);

  return {
    totals,
    totalsLoading,
    overview,
    overviewLoading,
    isLoading,
    filteredOverview,
    refetch,
    selectedOwner,
    setSelectedOwner,
    ownerTypeFilter,
    setOwnerTypeFilter,
    showBillableOnly,
    setShowBillableOnly,
    showAddDialog,
    setShowAddDialog,
    searchTerm,
    setSearchTerm,
  };
}
