'use client';

import { useGoogleMerchantSync } from '@verone/channels';
import { logger } from '@verone/utils/logger';
import { createClient } from '@verone/utils/supabase/client';

const GOOGLE_MERCHANT_CHANNEL_ID = 'd3d2b018-dfee-41c1-a955-f0690320afec';

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Hook centralisant l'état de sync et tous les handlers de la page Google Merchant
 */
export function useGoogleMerchantPage() {
  const {
    isLoading,
    isSuccess,
    isError,
    synced,
    failed,
    skipped,
    total,
    progress,
    duration,
    error,
    insertProducts,
  } = useGoogleMerchantSync();

  const syncStatus: 'idle' | 'syncing' | 'success' | 'error' = isLoading
    ? 'syncing'
    : isSuccess
      ? 'success'
      : isError
        ? 'error'
        : 'idle';

  const handleAddProducts = async (
    productIds: string[],
    _customData: Record<string, unknown>,
    onProgress?: (progress: { synced: number; total: number }) => void
  ): Promise<{ success: boolean; synced: number; failed: number }> => {
    logger.info('[Google Merchant Page] Adding products', {
      count: productIds.length,
    });

    return new Promise(resolve => {
      void insertProducts(productIds, {
        onSuccess: data => {
          logger.info('[Google Merchant Page] Products added successfully', {
            synced: data.synced,
            failed: data.failed,
          });
          resolve({ success: true, synced: data.synced, failed: data.failed });
        },
        onError: err => {
          logger.error(`[Google Merchant Page] Failed to add products: ${err}`);
          resolve({ success: false, synced: 0, failed: productIds.length });
        },
        onProgress: prog => {
          if (onProgress) onProgress(prog);
        },
      });
    });
  };

  const handleUpdatePrice = async (
    productId: string,
    newPriceHT: number
  ): Promise<void> => {
    logger.info('[Google Merchant Page] Updating custom price', {
      productId,
      price: newPriceHT,
    });
    // TODO: Implémenter API update prix custom
  };

  const handleUpdateMetadata = async (
    productId: string,
    _metadata: { title: string; description: string }
  ): Promise<void> => {
    logger.info('[Google Merchant Page] Updating metadata', { productId });
    // TODO: Implémenter API update métadonnées
  };

  const handleResyncProduct = async (productId: string): Promise<void> => {
    logger.info('[Google Merchant Page] Resyncing product', { productId });
    await insertProducts([productId]);
  };

  const handleHideProduct = async (productId: string): Promise<void> => {
    logger.info('[Google Merchant Page] Hiding product from Google Merchant', {
      productId,
    });
    const supabase = createClient();
    const { error: dbError } = await supabase.from('channel_pricing').upsert(
      {
        product_id: productId,
        channel_id: GOOGLE_MERCHANT_CHANNEL_ID,
        is_active: false,
        min_quantity: 1,
      },
      { onConflict: 'product_id,channel_id,min_quantity' }
    );
    if (dbError) {
      logger.error(
        `[Google Merchant] Failed to hide product: ${dbError.message}`
      );
    }
  };

  const handleRemoveProduct = async (productId: string): Promise<void> => {
    await handleHideProduct(productId);
  };

  const handleSync = async (): Promise<void> => {
    logger.info('[Google Merchant Page] Manual sync triggered');
    try {
      const response = await fetch('/api/google-merchant/poll-statuses', {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Sync failed');
      const result = (await response.json()) as Record<string, unknown>;
      logger.info('[Google Merchant Page] Sync completed', result);
      window.location.reload();
    } catch (err) {
      logger.error(
        '[Google Merchant Page] Sync error:',
        err instanceof Error ? err : new Error(String(err))
      );
    }
  };

  return {
    // Sync state
    syncStatus,
    synced,
    failed,
    skipped,
    total,
    progress,
    duration,
    error,
    // Handlers
    handleAddProducts,
    handleUpdatePrice,
    handleUpdateMetadata,
    handleResyncProduct,
    handleHideProduct,
    handleRemoveProduct,
    handleSync,
  };
}
