/**
 * Hook: useAffiliateStorage
 * Gestion du stockage entrepot pour les affilies
 *
 * Permet de visualiser:
 * - Volume total stocke (m3)
 * - Unites stockees
 * - Produits en stockage
 *
 * @module use-affiliate-storage
 * @since 2025-12-20
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

import { useAuth } from '../../contexts/AuthContext';

// Types pour le stockage
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
 * Hook: recupere le resume du stockage pour l'affilie connecte
 */
export function useAffiliateStorageSummary() {
  const { linkMeRole } = useAuth();
  const enseigneId = linkMeRole?.enseigne_id;
  const organisationId = linkMeRole?.organisation_id;

  return useQuery({
    queryKey: ['affiliate-storage-summary', enseigneId, organisationId],
    queryFn: async (): Promise<StorageSummary | null> => {
      if (!enseigneId && !organisationId) {
        return null;
      }

      const supabase = createClient();

      const { data, error } = await (supabase.rpc as any)(
        'get_affiliate_storage_summary',
        {
          p_owner_enseigne_id: enseigneId || null,
          p_owner_organisation_id: organisationId || null,
        }
      );

      if (error) {
        console.error('Error fetching storage summary:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          total_units: 0,
          total_volume_m3: 0,
          billable_volume_m3: 0,
          products_count: 0,
          billable_products_count: 0,
        };
      }

      return data[0] as StorageSummary;
    },
    enabled: !!(enseigneId || organisationId),
    staleTime: 60000,
  });
}

/**
 * Hook: recupere le detail des allocations de stockage
 */
export function useAffiliateStorageDetails() {
  const { linkMeRole } = useAuth();
  const enseigneId = linkMeRole?.enseigne_id;
  const organisationId = linkMeRole?.organisation_id;

  return useQuery({
    queryKey: ['affiliate-storage-details', enseigneId, organisationId],
    queryFn: async (): Promise<StorageAllocation[]> => {
      if (!enseigneId && !organisationId) {
        return [];
      }

      const supabase = createClient();

      const { data, error } = await (supabase.rpc as any)(
        'get_storage_details',
        {
          p_owner_enseigne_id: enseigneId || null,
          p_owner_organisation_id: organisationId || null,
        }
      );

      if (error) {
        console.error('Error fetching storage details:', error);
        throw error;
      }

      return (data || []) as StorageAllocation[];
    },
    enabled: !!(enseigneId || organisationId),
    staleTime: 60000,
  });
}

/**
 * Hook: recupere UNIQUEMENT les allocations facturables
 * C'est cette vue que l'affilié voit
 */
export function useAffiliateBillableStorage() {
  const { linkMeRole } = useAuth();
  const enseigneId = linkMeRole?.enseigne_id;
  const organisationId = linkMeRole?.organisation_id;

  return useQuery({
    queryKey: ['affiliate-billable-storage', enseigneId, organisationId],
    queryFn: async (): Promise<StorageAllocation[]> => {
      if (!enseigneId && !organisationId) {
        return [];
      }

      const supabase = createClient();

      const { data, error } = await (supabase.rpc as any)(
        'get_storage_details',
        {
          p_owner_enseigne_id: enseigneId || null,
          p_owner_organisation_id: organisationId || null,
        }
      );

      if (error) {
        console.error('Error fetching billable storage:', error);
        throw error;
      }

      // Filtrer uniquement les produits facturables
      return ((data || []) as StorageAllocation[]).filter(
        allocation => allocation.billable_in_storage === true
      );
    },
    enabled: !!(enseigneId || organisationId),
    staleTime: 60000,
  });
}

// Types pour la grille tarifaire
export interface StoragePricingTier {
  id: string;
  min_volume_m3: number;
  max_volume_m3: number | null;
  price_per_m3: number;
  label: string | null;
}

/**
 * Hook: recupere la grille tarifaire stockage (lecture seule)
 */
export function useStoragePricingTiers() {
  return useQuery({
    queryKey: ['storage-pricing-tiers-public'],
    queryFn: async (): Promise<StoragePricingTier[]> => {
      const supabase = createClient();

      const { data, error } = await (supabase as any)
        .from('storage_pricing_tiers')
        .select('id, min_volume_m3, max_volume_m3, price_per_m3, label')
        .eq('is_active', true)
        .order('min_volume_m3', { ascending: true });

      if (error) {
        console.error('Error fetching pricing tiers:', error);
        return [];
      }

      return data || [];
    },
    staleTime: 300000, // 5 minutes
  });
}

/**
 * Calcule le prix estime pour un volume donne
 */
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

/**
 * Formatage du volume en m3 avec precision
 */
export function formatVolume(volumeM3: number): string {
  if (volumeM3 === 0) return '0 m³';
  if (volumeM3 < 0.001) return '< 0.001 m³';
  if (volumeM3 < 1) return `${volumeM3.toFixed(3)} m³`;
  return `${volumeM3.toFixed(2)} m³`;
}

/**
 * Formatage du prix en euros
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}
