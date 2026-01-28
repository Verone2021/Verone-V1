/**
 * Hook: use-affiliate-network
 * Gestion du réseau d'organisations pour les affiliés (enseignes)
 * ================================================================
 * - Liste des organisations du réseau (propres + franchisés)
 * - Statistiques par type et région
 * - Archivage/restauration d'organisations
 */

'use client';

import { useMemo } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';
import { toast } from 'sonner';

import type { AffiliateCustomer } from './use-affiliate-orders';

// ============================================
// TYPES
// ============================================

export interface NetworkStats {
  total: number;
  propres: number;
  franchises: number;
  byRegion: RegionStats[];
}

export interface RegionStats {
  region: string;
  regionCode: string;
  count: number;
}

// Mapping des codes postaux vers les régions françaises
const REGION_MAPPING: Record<string, { name: string; code: string }> = {
  '01': { name: 'Auvergne-Rhône-Alpes', code: 'ARA' },
  '03': { name: 'Auvergne-Rhône-Alpes', code: 'ARA' },
  '07': { name: 'Auvergne-Rhône-Alpes', code: 'ARA' },
  '15': { name: 'Auvergne-Rhône-Alpes', code: 'ARA' },
  '26': { name: 'Auvergne-Rhône-Alpes', code: 'ARA' },
  '38': { name: 'Auvergne-Rhône-Alpes', code: 'ARA' },
  '42': { name: 'Auvergne-Rhône-Alpes', code: 'ARA' },
  '43': { name: 'Auvergne-Rhône-Alpes', code: 'ARA' },
  '63': { name: 'Auvergne-Rhône-Alpes', code: 'ARA' },
  '69': { name: 'Auvergne-Rhône-Alpes', code: 'ARA' },
  '73': { name: 'Auvergne-Rhône-Alpes', code: 'ARA' },
  '74': { name: 'Auvergne-Rhône-Alpes', code: 'ARA' },
  '21': { name: 'Bourgogne-Franche-Comté', code: 'BFC' },
  '25': { name: 'Bourgogne-Franche-Comté', code: 'BFC' },
  '39': { name: 'Bourgogne-Franche-Comté', code: 'BFC' },
  '58': { name: 'Bourgogne-Franche-Comté', code: 'BFC' },
  '70': { name: 'Bourgogne-Franche-Comté', code: 'BFC' },
  '71': { name: 'Bourgogne-Franche-Comté', code: 'BFC' },
  '89': { name: 'Bourgogne-Franche-Comté', code: 'BFC' },
  '90': { name: 'Bourgogne-Franche-Comté', code: 'BFC' },
  '22': { name: 'Bretagne', code: 'BRE' },
  '29': { name: 'Bretagne', code: 'BRE' },
  '35': { name: 'Bretagne', code: 'BRE' },
  '56': { name: 'Bretagne', code: 'BRE' },
  '18': { name: 'Centre-Val de Loire', code: 'CVL' },
  '28': { name: 'Centre-Val de Loire', code: 'CVL' },
  '36': { name: 'Centre-Val de Loire', code: 'CVL' },
  '37': { name: 'Centre-Val de Loire', code: 'CVL' },
  '41': { name: 'Centre-Val de Loire', code: 'CVL' },
  '45': { name: 'Centre-Val de Loire', code: 'CVL' },
  '2A': { name: 'Corse', code: 'COR' },
  '2B': { name: 'Corse', code: 'COR' },
  '20': { name: 'Corse', code: 'COR' },
  '08': { name: 'Grand Est', code: 'GES' },
  '10': { name: 'Grand Est', code: 'GES' },
  '51': { name: 'Grand Est', code: 'GES' },
  '52': { name: 'Grand Est', code: 'GES' },
  '54': { name: 'Grand Est', code: 'GES' },
  '55': { name: 'Grand Est', code: 'GES' },
  '57': { name: 'Grand Est', code: 'GES' },
  '67': { name: 'Grand Est', code: 'GES' },
  '68': { name: 'Grand Est', code: 'GES' },
  '88': { name: 'Grand Est', code: 'GES' },
  '02': { name: 'Hauts-de-France', code: 'HDF' },
  '59': { name: 'Hauts-de-France', code: 'HDF' },
  '60': { name: 'Hauts-de-France', code: 'HDF' },
  '62': { name: 'Hauts-de-France', code: 'HDF' },
  '80': { name: 'Hauts-de-France', code: 'HDF' },
  '75': { name: 'Île-de-France', code: 'IDF' },
  '77': { name: 'Île-de-France', code: 'IDF' },
  '78': { name: 'Île-de-France', code: 'IDF' },
  '91': { name: 'Île-de-France', code: 'IDF' },
  '92': { name: 'Île-de-France', code: 'IDF' },
  '93': { name: 'Île-de-France', code: 'IDF' },
  '94': { name: 'Île-de-France', code: 'IDF' },
  '95': { name: 'Île-de-France', code: 'IDF' },
  '14': { name: 'Normandie', code: 'NOR' },
  '27': { name: 'Normandie', code: 'NOR' },
  '50': { name: 'Normandie', code: 'NOR' },
  '61': { name: 'Normandie', code: 'NOR' },
  '76': { name: 'Normandie', code: 'NOR' },
  '16': { name: 'Nouvelle-Aquitaine', code: 'NAQ' },
  '17': { name: 'Nouvelle-Aquitaine', code: 'NAQ' },
  '19': { name: 'Nouvelle-Aquitaine', code: 'NAQ' },
  '23': { name: 'Nouvelle-Aquitaine', code: 'NAQ' },
  '24': { name: 'Nouvelle-Aquitaine', code: 'NAQ' },
  '33': { name: 'Nouvelle-Aquitaine', code: 'NAQ' },
  '40': { name: 'Nouvelle-Aquitaine', code: 'NAQ' },
  '47': { name: 'Nouvelle-Aquitaine', code: 'NAQ' },
  '64': { name: 'Nouvelle-Aquitaine', code: 'NAQ' },
  '79': { name: 'Nouvelle-Aquitaine', code: 'NAQ' },
  '86': { name: 'Nouvelle-Aquitaine', code: 'NAQ' },
  '87': { name: 'Nouvelle-Aquitaine', code: 'NAQ' },
  '09': { name: 'Occitanie', code: 'OCC' },
  '11': { name: 'Occitanie', code: 'OCC' },
  '12': { name: 'Occitanie', code: 'OCC' },
  '30': { name: 'Occitanie', code: 'OCC' },
  '31': { name: 'Occitanie', code: 'OCC' },
  '32': { name: 'Occitanie', code: 'OCC' },
  '34': { name: 'Occitanie', code: 'OCC' },
  '46': { name: 'Occitanie', code: 'OCC' },
  '48': { name: 'Occitanie', code: 'OCC' },
  '65': { name: 'Occitanie', code: 'OCC' },
  '66': { name: 'Occitanie', code: 'OCC' },
  '81': { name: 'Occitanie', code: 'OCC' },
  '82': { name: 'Occitanie', code: 'OCC' },
  '44': { name: 'Pays de la Loire', code: 'PDL' },
  '49': { name: 'Pays de la Loire', code: 'PDL' },
  '53': { name: 'Pays de la Loire', code: 'PDL' },
  '72': { name: 'Pays de la Loire', code: 'PDL' },
  '85': { name: 'Pays de la Loire', code: 'PDL' },
  '04': { name: "Provence-Alpes-Côte d'Azur", code: 'PAC' },
  '05': { name: "Provence-Alpes-Côte d'Azur", code: 'PAC' },
  '06': { name: "Provence-Alpes-Côte d'Azur", code: 'PAC' },
  '13': { name: "Provence-Alpes-Côte d'Azur", code: 'PAC' },
  '83': { name: "Provence-Alpes-Côte d'Azur", code: 'PAC' },
  '84': { name: "Provence-Alpes-Côte d'Azur", code: 'PAC' },
};

/**
 * Extrait la région à partir du code postal
 */
function getRegionFromPostalCode(
  postalCode: string | null
): { name: string; code: string } | null {
  if (!postalCode || postalCode.length < 2) return null;

  const prefix = postalCode.substring(0, 2);
  return REGION_MAPPING[prefix] || null;
}

// ============================================
// HOOKS
// ============================================

/**
 * Hook principal pour le réseau d'un affilié
 * Retourne les organisations du réseau (propres + franchisés)
 */
export function useAffiliateNetwork(affiliateId: string | null) {
  return useQuery({
    queryKey: ['affiliate-network', affiliateId],
    queryFn: async () => {
      if (!affiliateId) return [];

      const supabase = createClient();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const { data, error } = await (supabase.rpc as any)(
        'get_customers_for_affiliate',
        { p_affiliate_id: affiliateId }
      );

      if (error) {
        console.error('Erreur récupération réseau affilié:', error);
        throw error;
      }

      // Filtrer uniquement le réseau (is_franchisee = true ou organisations créées par l'affilié)
      // Pour l'instant, on garde toutes les organisations (réseau = tous)
      const customers = (data ?? []) as AffiliateCustomer[];

      // Ne garder que les organisations (pas les particuliers)
      return customers.filter(c => c.customer_type === 'organization');
    },
    enabled: !!affiliateId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook pour les statistiques du réseau
 */
export function useNetworkStats(affiliateId: string | null) {
  const { data: network, isLoading } = useAffiliateNetwork(affiliateId);

  const stats = useMemo((): NetworkStats => {
    if (!network || network.length === 0) {
      return {
        total: 0,
        propres: 0,
        franchises: 0,
        byRegion: [],
      };
    }

    const propres = network.filter(org => !org.is_franchisee).length;
    const franchises = network.filter(org => org.is_franchisee).length;

    // Grouper par région
    const regionCounts = new Map<
      string,
      { name: string; code: string; count: number }
    >();

    for (const org of network) {
      const region = getRegionFromPostalCode(org.postal_code);
      if (region) {
        const existing = regionCounts.get(region.code);
        if (existing) {
          existing.count++;
        } else {
          regionCounts.set(region.code, { ...region, count: 1 });
        }
      }
    }

    // Trier par count décroissant
    const byRegion = Array.from(regionCounts.values())
      .map(r => ({ region: r.name, regionCode: r.code, count: r.count }))
      .sort((a, b) => b.count - a.count);

    return {
      total: network.length,
      propres,
      franchises,
      byRegion,
    };
  }, [network]);

  return { stats, isLoading };
}

/**
 * Hook pour archiver une organisation (soft-delete)
 */
export function useArchiveOrganisation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organisationId,
      _note,
    }: {
      organisationId: string;
      _note?: string;
    }) => {
      const supabase = createClient();

      const { error } = await supabase
        .from('organisations')
        .update({
          archived_at: new Date().toISOString(),
          is_active: false,
        })
        .eq('id', organisationId);

      if (error) {
        console.error('Erreur archivage organisation:', error);
        throw new Error(error.message || "Erreur lors de l'archivage");
      }

      return organisationId;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['affiliate-network'] });
      await queryClient.invalidateQueries({
        queryKey: ['affiliate-customers'],
      });
      toast.success('Organisation archivée', {
        description: "L'équipe Vérone a été notifiée.",
      });
    },
    onError: (error: Error) => {
      toast.error('Erreur', {
        description: error.message || "Impossible d'archiver l'organisation",
      });
    },
  });
}

/**
 * Hook pour restaurer une organisation archivée
 */
export function useRestoreOrganisation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (organisationId: string) => {
      const supabase = createClient();

      const { error } = await supabase
        .from('organisations')
        .update({
          archived_at: null,
          is_active: true,
        })
        .eq('id', organisationId);

      if (error) {
        console.error('Erreur restauration organisation:', error);
        throw new Error(error.message || 'Erreur lors de la restauration');
      }

      return organisationId;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['affiliate-network'] });
      await queryClient.invalidateQueries({
        queryKey: ['affiliate-customers'],
      });
      toast.success('Organisation restaurée');
    },
    onError: (error: Error) => {
      toast.error('Erreur', {
        description: error.message || "Impossible de restaurer l'organisation",
      });
    },
  });
}
