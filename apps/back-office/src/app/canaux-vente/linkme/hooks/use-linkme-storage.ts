/**
 * Hook: useLinkMeStorage
 * Gestion du stockage entrepot et volumetrie pour LinkMe
 *
 * @module use-linkme-storage
 * @since 2025-12-20
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

// Types
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
  allocated_at: string;
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
        console.error('Error fetching storage overview:', error);
        throw error;
      }

      // Filter out entries with no storage
      return ((data || []) as StorageOverviewItem[]).filter(
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

  const totals = (overview || []).reduce(
    (acc, item) => ({
      total_units: acc.total_units + (item.total_units || 0),
      total_volume_m3: acc.total_volume_m3 + (item.total_volume_m3 || 0),
      billable_volume_m3:
        acc.billable_volume_m3 + (item.billable_volume_m3 || 0),
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
        console.error('Error fetching storage summary:', summaryError);
        throw summaryError;
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
        console.error('Error fetching storage details:', detailsError);
        throw detailsError;
      }

      return {
        summary: (summaryData?.[0] as StorageSummary) || {
          total_units: 0,
          total_volume_m3: 0,
          billable_volume_m3: 0,
          products_count: 0,
          billable_products_count: 0,
        },
        allocations: (detailsData || []) as StorageAllocation[],
      };
    },
    enabled: !!ownerId,
    staleTime: 60000,
  });
}

/**
 * Hook: modifier le statut billable d'une allocation
 */
export function useUpdateAllocationBillable() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      allocationId,
      billable,
    }: {
      allocationId: string;
      billable: boolean;
    }): Promise<void> => {
      const supabase = createClient();

      // Table renommee - types seront regeneres
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('storage_allocations')
        .update({ billable_in_storage: billable })
        .eq('id', allocationId);

      if (error) {
        console.error('Error updating allocation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-overview'] });
      queryClient.invalidateQueries({ queryKey: ['affiliate-storage-detail'] });
    },
  });
}

/**
 * Hook: creer une nouvelle allocation de stockage
 */
export function useCreateStorageAllocation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      ownerType,
      ownerId,
      quantity,
      billable = true,
    }: {
      productId: string;
      ownerType: 'enseigne' | 'organisation';
      ownerId: string;
      quantity: number;
      billable?: boolean;
    }): Promise<void> => {
      const supabase = createClient();

      // Table renommee - types seront regeneres
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('storage_allocations')
        .upsert(
          {
            product_id: productId,
            owner_enseigne_id: ownerType === 'enseigne' ? ownerId : null,
            owner_organisation_id:
              ownerType === 'organisation' ? ownerId : null,
            stock_quantity: quantity,
            billable_in_storage: billable,
          },
          {
            onConflict: 'product_id,owner_enseigne_id,owner_organisation_id',
          }
        );

      if (error) {
        console.error('Error creating allocation:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-overview'] });
      queryClient.invalidateQueries({ queryKey: ['affiliate-storage-detail'] });
    },
  });
}

/**
 * Hook: mettre a jour la quantite stockee
 */
export function useUpdateStorageQuantity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      allocationId,
      quantity,
    }: {
      allocationId: string;
      quantity: number;
    }): Promise<void> => {
      const supabase = createClient();

      // Table renommee - types seront regeneres
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('storage_allocations')
        .update({ stock_quantity: quantity })
        .eq('id', allocationId);

      if (error) {
        console.error('Error updating quantity:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-overview'] });
      queryClient.invalidateQueries({ queryKey: ['affiliate-storage-detail'] });
    },
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
