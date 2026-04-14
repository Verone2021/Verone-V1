/**
 * Hook: useLinkMeStorage
 * Gestion du stockage entrepot et volumetrie pour LinkMe
 */

import { useQuery } from '@tanstack/react-query';

import { createClient } from '@verone/utils/supabase/client';

// Re-export pricing hooks from separate file
export {
  useStoragePricingTiers,
  useUpdatePricingTier,
  useCreatePricingTier,
  useDeletePricingTier,
  calculateStoragePrice,
  formatPrice,
  type StoragePricingTier,
} from './use-linkme-storage-pricing';

// Re-export allocation mutations from separate file
export {
  useUpdateAllocationBillable,
  useUpdateAllocationVisibility,
  useDeleteStorageAllocation,
  useCreateStorageAllocation,
  useUpdateStorageQuantity,
  useUpdateStorageStartDate,
} from './use-linkme-storage-mutations';

// Types métier
export interface StorageOverviewItem {
  owner_id: string;
  owner_type: 'enseigne' | 'organisation';
  owner_name: string;
  total_units: number;
  total_volume_m3: number;
  billable_volume_m3: number;
  products_count: number;
}

export interface StorageSummary {
  total_units: number;
  total_volume_m3: number;
  billable_volume_m3: number;
  products_count: number;
  billable_products_count: number;
}

export interface StorageAllocation {
  allocation_id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  stock_quantity: number;
  unit_volume_m3: number;
  total_volume_m3: number;
  billable_in_storage: boolean;
  is_visible: boolean;
  allocated_at: string;
  storage_start_date: string;
  product_image_url: string | null;
}

/**
 * Hook: recupere la vue d'ensemble du stockage (tous affilies)
 */
export function useStorageOverview() {
  return useQuery({
    queryKey: ['storage-overview'],
    queryFn: async (): Promise<StorageOverviewItem[]> => {
      const supabase = createClient();

      const { data, error } = await supabase.rpc('get_all_storage_overview');

      if (error) {
        // Graceful fallback - RPC may not exist yet
        console.warn('Storage overview not available:', error.message);
        return [];
      }

      // Filter out entries with no storage
      return ((data ?? []) as StorageOverviewItem[]).filter(
        item => item.total_units > 0 || item.products_count > 0
      );
    },
    staleTime: 60000,
  });
}

/**
 * Hook: recupere les totaux globaux de stockage
 */
export function useStorageTotals() {
  const { data: overview, ...rest } = useStorageOverview();

  const totals = (overview ?? []).reduce(
    (acc, item) => ({
      total_units: acc.total_units + (item.total_units ?? 0),
      total_volume_m3: acc.total_volume_m3 + (item.total_volume_m3 ?? 0),
      billable_volume_m3:
        acc.billable_volume_m3 + (item.billable_volume_m3 ?? 0),
      affiliates_count: acc.affiliates_count + 1,
    }),
    {
      total_units: 0,
      total_volume_m3: 0,
      billable_volume_m3: 0,
      affiliates_count: 0,
    }
  );

  return { data: totals, ...rest };
}

/**
 * Hook: recupere le detail du stockage pour un affilie specifique
 */
export function useAffiliateStorageDetail(
  ownerType: 'enseigne' | 'organisation',
  ownerId: string | undefined
) {
  return useQuery({
    queryKey: ['affiliate-storage-detail', ownerType, ownerId],
    queryFn: async (): Promise<{
      summary: StorageSummary;
      allocations: StorageAllocation[];
    }> => {
      if (!ownerId) {
        return {
          summary: {
            total_units: 0,
            total_volume_m3: 0,
            billable_volume_m3: 0,
            products_count: 0,
            billable_products_count: 0,
          },
          allocations: [],
        };
      }

      const supabase = createClient();

      // Get summary
      const { data: summaryData, error: summaryError } = await supabase.rpc(
        'get_affiliate_storage_summary',
        {
          p_owner_enseigne_id: ownerType === 'enseigne' ? ownerId : undefined,
          p_owner_organisation_id:
            ownerType === 'organisation' ? ownerId : undefined,
        }
      );

      if (summaryError) {
        console.warn('Storage summary not available:', summaryError.message);
        return {
          summary: {
            total_units: 0,
            total_volume_m3: 0,
            billable_volume_m3: 0,
            products_count: 0,
            billable_products_count: 0,
          },
          allocations: [],
        };
      }

      // Get details
      const { data: detailsData, error: detailsError } = await supabase.rpc(
        'get_storage_details',
        {
          p_owner_enseigne_id: ownerType === 'enseigne' ? ownerId : undefined,
          p_owner_organisation_id:
            ownerType === 'organisation' ? ownerId : undefined,
        }
      );

      if (detailsError) {
        console.warn('Storage details not available:', detailsError.message);
        // Continue with summary only
      }

      return {
        summary: (summaryData?.[0] as StorageSummary) || {
          total_units: 0,
          total_volume_m3: 0,
          billable_volume_m3: 0,
          products_count: 0,
          billable_products_count: 0,
        },
        allocations: (detailsData ?? []) as StorageAllocation[],
      };
    },
    enabled: !!ownerId,
    staleTime: 60000,
  });
}

/**
 * Formatage du volume en m3 avec precision adaptee
 */
export function formatVolumeM3(volumeM3: number | null | undefined): string {
  if (!volumeM3 || volumeM3 === 0) return '0 m3';
  if (volumeM3 < 0.001) return '< 0.001 m3';
  if (volumeM3 < 1) return `${volumeM3.toFixed(3)} m3`;
  return `${volumeM3.toFixed(2)} m3`;
}
