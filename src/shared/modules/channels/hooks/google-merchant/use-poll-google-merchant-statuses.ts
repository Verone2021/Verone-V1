/**
 * Hook: usePollGoogleMerchantStatuses
 *
 * Mutation pour récupérer les statuts Google réels (polling manuel)
 * Appelle API POST /api/google-merchant/poll-statuses
 *
 * Note: Le polling automatique est géré par le cron job
 * Ce hook permet un refresh manuel par l'utilisateur
 */

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

import { logger } from '@verone/utils/logger';

interface StatusData {
  productId: string;
  googleStatus: 'approved' | 'pending' | 'rejected' | 'not_synced';
  googleStatusDetail?: Record<string, any>;
}

interface PollStatusesRequest {
  statusesData: StatusData[];
}

interface PollStatusesResponse {
  success: boolean;
  data?: {
    updatedCount: number;
  };
  error?: string;
}

/**
 * Hook: Polling statuts Google Merchant (manuel)
 */
export function usePollGoogleMerchantStatuses() {
  const queryClient = useQueryClient();

  return useMutation<PollStatusesResponse, Error, PollStatusesRequest>({
    mutationFn: async ({ statusesData }: PollStatusesRequest) => {
      logger.info('[usePollGoogleMerchantStatuses] Polling statuses', {
        count: statusesData.length,
      });

      const response = await fetch('/api/google-merchant/poll-statuses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ statusesData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data: PollStatusesResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to poll statuses');
      }

      return data;
    },
    onSuccess: data => {
      const { updatedCount } = data.data || {};

      logger.info('[usePollGoogleMerchantStatuses] Success', {
        updatedCount,
      });

      toast.success(`${updatedCount} statut(s) mis à jour depuis Google`);

      // Invalidate queries pour refresh dashboard
      queryClient.invalidateQueries({ queryKey: ['google-merchant-products'] });
      queryClient.invalidateQueries({ queryKey: ['google-merchant-stats'] });
    },
    onError: error => {
      logger.error(`[usePollGoogleMerchantStatuses] Failed: ${error.message}`);
      toast.error(`Échec polling statuts: ${error.message}`);
    },
  });
}
