/**
 * Hook: useOrganisationStats
 * Récupère CA et commissions totales par organisation via RPC
 *
 * Utilise une fonction RPC SECURITY DEFINER pour contourner les RLS policies
 * qui empêchent les utilisateurs LinkMe de lire directement sales_orders
 *
 * @module use-organisation-stats
 * @since 2026-01-10
 */

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

// =====================================================================
// TYPES
// =====================================================================

export interface OrganisationStats {
  orgId: string;
  totalRevenueHT: number;
  totalCommissionsHT: number;
  orderCount: number;
}

export type OrganisationStatsMap = Record<string, OrganisationStats>;

// Type de retour de la RPC
interface RpcStatsRow {
  org_id: string;
  total_revenue_ht: number;
  total_commissions_ht: number;
  order_count: number;
}

// =====================================================================
// HOOK
// =====================================================================

/**
 * Hook pour charger les stats (CA, commissions) des organisations d'une enseigne
 *
 * @param enseigneId - ID de l'enseigne
 * @returns Map des stats par organisation ID
 */
export function useOrganisationStats(enseigneId: string | null) {
  return useQuery({
    queryKey: ['organisation-stats', enseigneId],
    queryFn: async (): Promise<OrganisationStatsMap> => {
      if (!enseigneId) return {};

      const supabase = createClient();

      // Utiliser la RPC SECURITY DEFINER pour contourner les RLS
      const { data, error } = await supabase.rpc(
        'get_enseigne_organisation_stats',
        { p_enseigne_id: enseigneId }
      );

      if (error) {
        console.error('Error fetching organisation stats:', error);
        throw error;
      }

      // Transformer les données en map
      const statsMap: OrganisationStatsMap = {};
      const rows = (data as RpcStatsRow[]) ?? [];

      rows.forEach(row => {
        statsMap[row.org_id] = {
          orgId: row.org_id,
          totalRevenueHT: Number(row.total_revenue_ht) ?? 0,
          totalCommissionsHT: Number(row.total_commissions_ht) ?? 0,
          orderCount: row.order_count ?? 0,
        };
      });

      return statsMap;
    },
    enabled: !!enseigneId,
    staleTime: 60000, // 1 minute
  });
}

export default useOrganisationStats;
