'use client';

import { useState, useEffect } from 'react';

import { useSearchParams } from 'next/navigation';

import { useStockInventory } from '@verone/stock';

import type {
  InventoryFilters,
  QuickDateFilter,
  StockLevelFilter,
} from './inventaire.types';

export function useInventairePage() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<InventoryFilters>({
    search: '',
    dateFrom: '',
    dateTo: '',
  });
  const [showOnlyWithStock, setShowOnlyWithStock] = useState(false);
  const [quickDateFilter, setQuickDateFilter] =
    useState<QuickDateFilter>('all');
  const [stockLevelFilter, setStockLevelFilter] =
    useState<StockLevelFilter>('all');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

  const { inventory, stats, loading, fetchInventory, exportInventoryCSV } =
    useStockInventory();

  const [selectedProduct, setSelectedProduct] = useState<
    (typeof inventory)[number] | null
  >(null);

  useEffect(() => {
    let stale = false;
    void fetchInventory()
      .then(() => {})
      .catch(error => {
        if (!stale) console.error('[Inventaire] fetchInventory failed:', error);
      });
    return () => {
      stale = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const productId = searchParams.get('id');
    if (productId && inventory.length > 0 && !isHistoryModalOpen) {
      const product = inventory.find(p => p.id === productId);
      if (product) {
        setSelectedProduct(product);
        setIsHistoryModalOpen(true);
      }
    }
  }, [searchParams, inventory, isHistoryModalOpen]);

  const getQuickDateRange = (
    filter: QuickDateFilter
  ): { from: string; to: string } | null => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    switch (filter) {
      case 'today':
        return { from: formatDate(today), to: formatDate(today) };
      case '7days': {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return { from: formatDate(weekAgo), to: formatDate(today) };
      }
      case '30days': {
        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 30);
        return { from: formatDate(monthAgo), to: formatDate(today) };
      }
      default:
        return null;
    }
  };

  const handleRefresh = () => {
    void fetchInventory(filters).catch(error => {
      console.error('[Inventaire] handleRefresh failed:', error);
    });
  };

  const handleExport = () => {
    exportInventoryCSV(inventory);
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
  };

  const handleApplyFilters = () => {
    void fetchInventory(filters).catch(error => {
      console.error('[Inventaire] handleApplyFilters failed:', error);
    });
  };

  const handleQuickDateFilter = (filter: QuickDateFilter) => {
    setQuickDateFilter(filter);
    const range = getQuickDateRange(filter);
    if (range) {
      setFilters(prev => ({ ...prev, dateFrom: range.from, dateTo: range.to }));
    } else {
      setFilters(prev => ({ ...prev, dateFrom: '', dateTo: '' }));
    }
  };

  const handleResetFilters = () => {
    setFilters({ search: '', dateFrom: '', dateTo: '' });
    setShowOnlyWithStock(false);
    setQuickDateFilter('all');
    setStockLevelFilter('all');
    void fetchInventory().catch(error => {
      console.error('[Inventaire] handleResetFilters failed:', error);
    });
  };

  const openHistoryModal = (product: (typeof inventory)[number]) => {
    setSelectedProduct(product);
    setIsHistoryModalOpen(true);
  };

  const openAdjustmentModal = (product: (typeof inventory)[number]) => {
    setSelectedProduct(product);
    setIsAdjustmentModalOpen(true);
  };

  const activeFiltersCount = [
    filters.search,
    filters.dateFrom,
    filters.dateTo,
    showOnlyWithStock,
    stockLevelFilter !== 'all',
  ].filter(Boolean).length;

  const filteredInventory = inventory.filter(item => {
    if (showOnlyWithStock && item.stock_real <= 0) return false;
    const threshold = item.min_stock || 5;
    if (stockLevelFilter === 'critical' && item.stock_real > 0) return false;
    if (
      stockLevelFilter === 'low' &&
      (item.stock_real === 0 || item.stock_real >= threshold)
    )
      return false;
    if (stockLevelFilter === 'sufficient' && item.stock_real < threshold)
      return false;
    return true;
  });

  return {
    filters,
    setFilters,
    showOnlyWithStock,
    setShowOnlyWithStock,
    quickDateFilter,
    stockLevelFilter,
    setStockLevelFilter,
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    isReportsModalOpen,
    setIsReportsModalOpen,
    isAdjustmentModalOpen,
    setIsAdjustmentModalOpen,
    selectedProduct,
    inventory,
    stats,
    loading,
    fetchInventory,
    activeFiltersCount,
    filteredInventory,
    handleRefresh,
    handleExport,
    handleSearch,
    handleApplyFilters,
    handleQuickDateFilter,
    handleResetFilters,
    openHistoryModal,
    openAdjustmentModal,
  };
}
