/**
 * Hook: useGoogleMerchantSync
 *
 * React hook pour synchroniser des produits avec Google Merchant Center
 * Features: progress tracking, error handling, success/failure states
 */

'use client';

import { useState, useCallback } from 'react';

import { logger } from '@verone/utils/logger';

/**
 * Résultat d'une synchronisation
 */
interface SyncResult {
  productId: string;
  sku: string;
  success: boolean;
  operation: 'insert' | 'update' | 'delete' | 'skipped';
  error?: string;
}

/**
 * État de la synchronisation
 */
interface SyncState {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  total: number;
  synced: number;
  failed: number;
  skipped: number;
  duration: number;
  results: SyncResult[];
  error: string | null;
}

/**
 * Options de synchronisation
 */
interface SyncOptions {
  productIds: string[];
  action: 'insert' | 'update' | 'delete';
  onSuccess?: (data: SyncState) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: { synced: number; total: number }) => void;
}

/**
 * Hook de synchronisation Google Merchant
 */
export function useGoogleMerchantSync() {
  const [state, setState] = useState<SyncState>({
    isLoading: false,
    isSuccess: false,
    isError: false,
    total: 0,
    synced: 0,
    failed: 0,
    skipped: 0,
    duration: 0,
    results: [],
    error: null,
  });

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isSuccess: false,
      isError: false,
      total: 0,
      synced: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      results: [],
      error: null,
    });
  }, []);

  /**
   * Synchronise des produits
   */
  const sync = useCallback(async (options: SyncOptions) => {
    const { productIds, action, onSuccess, onError, onProgress } = options;

    logger.info('[useGoogleMerchantSync] Starting sync', {
      action,
      productCount: productIds.length,
    });

    // Reset et set loading
    setState({
      isLoading: true,
      isSuccess: false,
      isError: false,
      total: productIds.length,
      synced: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      results: [],
      error: null,
    });

    try {
      const startTime = Date.now();

      // Call API
      const response = await fetch('/api/google-merchant/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productIds,
          action,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();

      const newState: SyncState = {
        isLoading: false,
        isSuccess: data.success,
        isError: !data.success,
        total: data.total,
        synced: data.synced,
        failed: data.failed,
        skipped: data.skipped,
        duration: data.duration,
        results: data.results,
        error: data.success ? null : 'Some products failed to sync',
      };

      setState(newState);

      logger.info('[useGoogleMerchantSync] Sync completed', {
        action,
        total: data.total,
        synced: data.synced,
        failed: data.failed,
        skipped: data.skipped,
        duration: data.duration,
      });

      // Callbacks
      if (data.success && onSuccess) {
        onSuccess(newState);
      } else if (!data.success && onError) {
        onError('Some products failed to sync');
      }

      if (onProgress) {
        onProgress({ synced: data.synced, total: data.total });
      }

      return newState;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      logger.error('[useGoogleMerchantSync] Sync failed', {
        action,
        error: errorMessage,
      } as any);

      const errorState: SyncState = {
        isLoading: false,
        isSuccess: false,
        isError: true,
        total: productIds.length,
        synced: 0,
        failed: productIds.length,
        skipped: 0,
        duration: 0,
        results: [],
        error: errorMessage,
      };

      setState(errorState);

      if (onError) {
        onError(errorMessage);
      }

      return errorState;
    }
  }, []);

  /**
   * Insert produits
   */
  const insertProducts = useCallback(
    (
      productIds: string[],
      options?: Omit<SyncOptions, 'productIds' | 'action'>
    ) => {
      return sync({ ...options, productIds, action: 'insert' });
    },
    [sync]
  );

  /**
   * Update produits
   */
  const updateProducts = useCallback(
    (
      productIds: string[],
      options?: Omit<SyncOptions, 'productIds' | 'action'>
    ) => {
      return sync({ ...options, productIds, action: 'update' });
    },
    [sync]
  );

  /**
   * Delete produits
   */
  const deleteProducts = useCallback(
    (
      productIds: string[],
      options?: Omit<SyncOptions, 'productIds' | 'action'>
    ) => {
      return sync({ ...options, productIds, action: 'delete' });
    },
    [sync]
  );

  return {
    // État
    ...state,

    // Actions
    sync,
    insertProducts,
    updateProducts,
    deleteProducts,
    reset,

    // Computed
    progress:
      state.total > 0 ? Math.round((state.synced / state.total) * 100) : 0,
    hasErrors: state.failed > 0,
    hasSkipped: state.skipped > 0,
  };
}
