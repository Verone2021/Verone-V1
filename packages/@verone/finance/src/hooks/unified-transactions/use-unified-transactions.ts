// =====================================================================
// Hook: useUnifiedTransactions (orchestrator)
// =====================================================================

import { useState, useEffect, useCallback, useMemo } from 'react';

import { createClient } from '@verone/utils/supabase/client';

import { fetchTransactions, fetchStats } from './use-transaction-fetch';
import type {
  UnifiedFilters,
  UnifiedStats,
  UnifiedTransaction,
  UseUnifiedTransactionsOptions,
  UseUnifiedTransactionsResult,
} from './types';

const DEFAULT_LIMIT = 50;

export function useUnifiedTransactions(
  options: UseUnifiedTransactionsOptions = {}
): UseUnifiedTransactionsResult {
  const {
    filters: initialFilters = {},
    limit: _limit = DEFAULT_LIMIT,
    pageSize: initialPageSize = 20,
    autoRefresh = false,
    refreshInterval = 30000,
  } = options;

  const [transactions, setTransactions] = useState<UnifiedTransaction[]>([]);
  const [stats, setStats] = useState<UnifiedStats | null>(null);
  const [filters, setFilters] = useState<UnifiedFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSizeState] = useState<10 | 20>(initialPageSize);
  const [currentPage, setCurrentPage] = useState(1);

  const supabase = useMemo(() => createClient(), []);

  // Calculated values
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const runFetchTransactions = useCallback(
    async (append = false, targetPage?: number) => {
      try {
        if (!append) {
          setIsLoading(true);
        }

        const result = await fetchTransactions({
          supabase,
          filters,
          pageSize,
          currentPage,
          offset,
          append,
          targetPage,
        });

        if (append) {
          setTransactions(prev => [...prev, ...result.transactions]);
        } else {
          setTransactions(result.transactions);
        }

        if (result.count !== null) {
          setTotalCount(result.count);
        }

        setOffset(result.newOffset);
        setHasMore(result.hasMore);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [supabase, filters, pageSize, offset, currentPage]
  );

  const runFetchStats = useCallback(async () => {
    const result = await fetchStats({ supabase, filters });
    if (result !== null) {
      setStats(result);
    }
  }, [supabase, filters]);

  // Refresh
  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([runFetchTransactions(false), runFetchStats()]);
  }, [runFetchTransactions, runFetchStats]);

  // Load more (for infinite scroll - legacy)
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await runFetchTransactions(true);
  }, [runFetchTransactions, hasMore, isLoading]);

  // Pagination functions
  const goToPage = useCallback(
    async (page: number) => {
      if (page < 1 || page > totalPages || isLoading) return;
      setCurrentPage(page);
      await runFetchTransactions(false, page);
    },
    [runFetchTransactions, totalPages, isLoading]
  );

  const nextPage = useCallback(async () => {
    if (currentPage < totalPages) {
      await goToPage(currentPage + 1);
    }
  }, [currentPage, totalPages, goToPage]);

  const prevPage = useCallback(async () => {
    if (currentPage > 1) {
      await goToPage(currentPage - 1);
    }
  }, [currentPage, goToPage]);

  const setPageSize = useCallback((size: 10 | 20) => {
    setPageSizeState(size);
    setCurrentPage(1);
    // Refetch will happen via useEffect dependency
  }, []);

  // Initial load and when filters/pageSize change
  useEffect(() => {
    setCurrentPage(1);
    void runFetchTransactions(false, 1);
    void runFetchStats();
  }, [filters, pageSize]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      void refresh();
    }, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refresh]);

  return {
    transactions,
    stats,
    isLoading,
    isRefreshing,
    error,
    hasMore,
    loadMore,
    totalCount,
    currentPage,
    totalPages,
    pageSize,
    setPageSize,
    goToPage,
    nextPage,
    prevPage,
    refresh,
    setFilters,
  };
}
