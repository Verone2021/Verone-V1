/**
 * Hook: useStorageBilling
 * Gestion du stockage global et facturation pour le back-office core
 *
 * @module use-storage-billing
 * @since 2025-12-20
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

// Helper pour appeler des RPC non encore dans les types generes

const callRpc = (
  supabase: SupabaseClient<any>,
  name: string,
  params?: Record<string, unknown>
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase.rpc as any)(name, params);
};

// Re-export hooks from LinkMe storage for reuse
export {
  useStorageOverview,
  useStorageTotals,
  useAffiliateStorageDetail,
  useUpdateAllocationBillable,
  useCreateStorageAllocation,
  useUpdateStorageQuantity,
  formatVolumeM3,
  type StorageOverviewItem,
  type StorageSummary,
  type StorageAllocation,
} from '@/app/(protected)/canaux-vente/linkme/hooks/use-linkme-storage';

// Additional types for billing
export interface WeightedAverageResult {
  total_m3_days: number;
  days_in_period: number;
  average_m3: number;
  billable_m3_days: number;
  billable_average_m3: number;
}

export interface StorageEvent {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  qty_change: number;
  volume_m3_change: number;
  billable: boolean;
  happened_at: string;
  source: string;
  created_at: string;
}

export interface GlobalStorageTotals {
  total_volume_m3: number;
  billable_volume_m3: number;
  total_units: number;
  active_owners: number;
  products_count: number;
}

export interface GlobalStorageOverviewItem {
  owner_type: 'enseigne' | 'organisation';
  owner_id: string;
  owner_name: string;
  total_units: number;
  total_volume_m3: number;
  billable_volume_m3: number;
  products_count: number;
  billable_products_count: number;
}

/**
 * Hook: recupere les totaux globaux de stockage (RPC optimisee)
 */
export function useGlobalStorageTotals() {
  return useQuery({
    queryKey: ['global-storage-totals'],
    queryFn: async (): Promise<GlobalStorageTotals> => {
      const supabase = createClient();

      const { data, error } = await callRpc(supabase, 'get_storage_totals');

      if (error) {
        // RPC may not exist yet - graceful fallback
        console.warn('Storage totals RPC not available:', error.message);
        return {
          total_volume_m3: 0,
          billable_volume_m3: 0,
          total_units: 0,
          active_owners: 0,
          products_count: 0,
        };
      }

      const result = data?.[0] || {
        total_volume_m3: 0,
        billable_volume_m3: 0,
        total_units: 0,
        active_owners: 0,
        products_count: 0,
      };

      return result as GlobalStorageTotals;
    },
    staleTime: 60000,
  });
}

/**
 * Hook: recupere la vue d'ensemble globale du stockage (tous owners)
 */
export function useGlobalStorageOverview() {
  return useQuery({
    queryKey: ['global-storage-overview'],
    queryFn: async (): Promise<GlobalStorageOverviewItem[]> => {
      const supabase = createClient();

      const { data, error } = await callRpc(
        supabase,
        'get_global_storage_overview'
      );

      if (error) {
        // RPC may not exist yet - graceful fallback
        console.warn(
          'Global storage overview RPC not available:',
          error.message
        );
        return [];
      }

      return (data ?? []) as GlobalStorageOverviewItem[];
    },
    staleTime: 60000,
  });
}

/**
 * Hook: calcul de la moyenne ponderee m3 pour un owner sur une periode
 */
export function useStorageWeightedAverage(
  ownerType: 'enseigne' | 'organisation' | null,
  ownerId: string | null,
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: [
      'storage-weighted-average',
      ownerType,
      ownerId,
      startDate,
      endDate,
    ],
    queryFn: async (): Promise<WeightedAverageResult> => {
      if (!ownerId || !ownerType) {
        return {
          total_m3_days: 0,
          days_in_period: 0,
          average_m3: 0,
          billable_m3_days: 0,
          billable_average_m3: 0,
        };
      }

      const supabase = createClient();

      const { data, error } = await callRpc(
        supabase,
        'get_storage_weighted_average',
        {
          p_owner_enseigne_id: ownerType === 'enseigne' ? ownerId : null,
          p_owner_organisation_id:
            ownerType === 'organisation' ? ownerId : null,
          p_start_date: startDate ?? null,
          p_end_date: endDate ?? null,
        }
      );

      if (error) {
        // RPC may not exist yet - graceful fallback
        console.warn(
          'Storage weighted average RPC not available:',
          error.message
        );
        return {
          total_m3_days: 0,
          days_in_period: 0,
          average_m3: 0,
          billable_m3_days: 0,
          billable_average_m3: 0,
        };
      }

      const result = data?.[0] || {
        total_m3_days: 0,
        days_in_period: 0,
        average_m3: 0,
        billable_m3_days: 0,
        billable_average_m3: 0,
      };

      return result as WeightedAverageResult;
    },
    enabled: !!ownerId && !!ownerType,
    staleTime: 60000,
  });
}

/**
 * Hook: historique des evenements de stockage pour un owner
 */
export function useStorageEventsHistory(
  ownerType: 'enseigne' | 'organisation' | null,
  ownerId: string | null,
  limit = 50,
  offset = 0
) {
  return useQuery({
    queryKey: ['storage-events-history', ownerType, ownerId, limit, offset],
    queryFn: async (): Promise<StorageEvent[]> => {
      if (!ownerId || !ownerType) {
        return [];
      }

      const supabase = createClient();

      const { data, error } = await callRpc(
        supabase,
        'get_storage_events_history',
        {
          p_owner_enseigne_id: ownerType === 'enseigne' ? ownerId : null,
          p_owner_organisation_id:
            ownerType === 'organisation' ? ownerId : null,
          p_limit: limit,
          p_offset: offset,
        }
      );

      if (error) {
        // RPC may not exist yet - graceful fallback
        console.warn(
          'Storage events history RPC not available:',
          error.message
        );
        return [];
      }

      return (data ?? []) as StorageEvent[];
    },
    enabled: !!ownerId && !!ownerType,
    staleTime: 30000,
  });
}

/**
 * Get source label for display
 */
export function getSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    allocation_create: 'Allocation creee',
    allocation_update: 'Quantite modifiee',
    allocation_delete: 'Allocation supprimee',
    billable_toggle: 'Statut facturable modifie',
    manual_adjustment: 'Ajustement manuel',
  };
  return labels[source] ?? source;
}

/**
 * Get source color for display
 */
export function getSourceColor(
  source: string
): 'green' | 'blue' | 'red' | 'amber' | 'gray' {
  const colors: Record<string, 'green' | 'blue' | 'red' | 'amber' | 'gray'> = {
    allocation_create: 'green',
    allocation_update: 'blue',
    allocation_delete: 'red',
    billable_toggle: 'amber',
    manual_adjustment: 'gray',
  };
  return colors[source] ?? 'gray';
}
