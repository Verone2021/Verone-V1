/**
 * Hook: useAffiliateCommissionStats
 * Statistiques agrégées des commissions de l'affilié
 *
 * SOURCE DE VÉRITÉ: Table `linkme_commissions`
 * Les montants sont récupérés directement depuis la BD (affiliate_commission_ttc)
 * calculés par triggers - pas de calcul dynamique côté client.
 *
 * @module use-affiliate-commission-stats
 * @since 2026-01-06
 */

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

import { useUserAffiliate } from './use-user-selection';

const supabase = createClient();

interface StatGroup {
  count: number;
  amountHT: number;
  amountTTC: number;
}

export interface CommissionStats {
  pending: StatGroup;
  validated: StatGroup; // = payable
  paid: StatGroup;
  total: StatGroup;
}

const emptyStats: CommissionStats = {
  pending: { count: 0, amountHT: 0, amountTTC: 0 },
  validated: { count: 0, amountHT: 0, amountTTC: 0 },
  paid: { count: 0, amountHT: 0, amountTTC: 0 },
  total: { count: 0, amountHT: 0, amountTTC: 0 },
};

/**
 * Hook pour récupérer les statistiques agrégées des commissions
 * Utilise directement la table linkme_commissions (source de vérité)
 */
export function useAffiliateCommissionStats() {
  const { data: affiliate } = useUserAffiliate();

  return useQuery({
    queryKey: ['affiliate-commission-stats', affiliate?.id],
    queryFn: async (): Promise<CommissionStats> => {
      if (!affiliate?.id) return emptyStats;

      const { data, error } = await supabase
        .from('linkme_commissions')
        .select('status, affiliate_commission, affiliate_commission_ttc')
        .eq('affiliate_id', affiliate.id);

      if (error) {
        console.error('Erreur fetch commission stats:', error);
        throw error;
      }

      const commissions = data || [];

      // Agrégation par statut
      const stats: CommissionStats = {
        pending: { count: 0, amountHT: 0, amountTTC: 0 },
        validated: { count: 0, amountHT: 0, amountTTC: 0 },
        paid: { count: 0, amountHT: 0, amountTTC: 0 },
        total: { count: 0, amountHT: 0, amountTTC: 0 },
      };

      commissions.forEach(c => {
        const ht = Number(c.affiliate_commission) || 0;
        const ttc = Number(c.affiliate_commission_ttc) || 0;

        // Par statut
        if (c.status === 'pending') {
          stats.pending.count++;
          stats.pending.amountHT += ht;
          stats.pending.amountTTC += ttc;
        } else if (c.status === 'validated' || c.status === 'payable') {
          // 'payable' est un alias de 'validated' dans certaines parties du code
          stats.validated.count++;
          stats.validated.amountHT += ht;
          stats.validated.amountTTC += ttc;
        } else if (c.status === 'paid') {
          stats.paid.count++;
          stats.paid.amountHT += ht;
          stats.paid.amountTTC += ttc;
        }

        // Total
        stats.total.count++;
        stats.total.amountHT += ht;
        stats.total.amountTTC += ttc;
      });

      return stats;
    },
    enabled: !!affiliate?.id,
    staleTime: 30000, // 30 secondes
    refetchOnWindowFocus: false,
  });
}
