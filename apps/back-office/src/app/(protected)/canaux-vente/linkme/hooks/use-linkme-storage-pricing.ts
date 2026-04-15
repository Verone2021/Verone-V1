/**
 * Hook: Grille tarifaire stockage LinkMe
 * Extrait de use-linkme-storage.ts pour reduction de taille
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

export interface StoragePricingTier {
  id: string;
  min_volume_m3: number;
  max_volume_m3: number | null;
  price_per_m3: number;
  label: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export function useStoragePricingTiers() {
  return useQuery({
    queryKey: ['storage-pricing-tiers'],
    queryFn: async (): Promise<StoragePricingTier[]> => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('storage_pricing_tiers')
        .select(
          'id, min_volume_m3, max_volume_m3, price_per_m3, label, is_active, created_at, updated_at'
        )
        .eq('is_active', true)
        .order('min_volume_m3', { ascending: true });
      if (error) {
        console.warn('Storage pricing tiers not available:', error.message);
        return [];
      }
      return data ?? [];
    },
    staleTime: 300_000,
  });
}

export function useUpdatePricingTier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      price_per_m3,
      max_volume_m3,
      label,
    }: {
      id: string;
      price_per_m3: number;
      max_volume_m3?: number | null;
      label?: string;
    }): Promise<void> => {
      const supabase = createClient();
      const updateData: Record<string, unknown> = { price_per_m3 };
      if (max_volume_m3 !== undefined) updateData.max_volume_m3 = max_volume_m3;
      if (label !== undefined) updateData.label = label;
      const { error } = await supabase
        .from('storage_pricing_tiers')
        .update(updateData)
        .eq('id', id);
      if (error) {
        console.warn('Error updating pricing tier:', error.message);
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['storage-pricing-tiers'],
      });
    },
  });
}

export function useCreatePricingTier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      min_volume_m3,
      max_volume_m3,
      price_per_m3,
      label,
    }: {
      min_volume_m3: number;
      max_volume_m3: number | null;
      price_per_m3: number;
      label: string;
    }): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase.from('storage_pricing_tiers').insert({
        min_volume_m3,
        max_volume_m3,
        price_per_m3,
        label,
        is_active: true,
      });
      if (error) {
        console.warn('Error creating pricing tier:', error.message);
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['storage-pricing-tiers'],
      });
    },
  });
}

export function useDeletePricingTier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const supabase = createClient();
      const { error } = await supabase
        .from('storage_pricing_tiers')
        .update({ is_active: false })
        .eq('id', id);
      if (error) {
        console.warn('Error deleting pricing tier:', error.message);
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['storage-pricing-tiers'],
      });
    },
  });
}

export function calculateStoragePrice(
  volumeM3: number,
  tiers: StoragePricingTier[]
): number {
  if (!tiers.length || volumeM3 <= 0) return 0;
  const tier = tiers.find(
    t =>
      t.min_volume_m3 <= volumeM3 &&
      (t.max_volume_m3 === null || t.max_volume_m3 >= volumeM3)
  );
  if (!tier) return 0;
  return tier.price_per_m3 * volumeM3;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}
