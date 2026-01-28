/**
 * Hook: useAffiliateCommissions
 * Liste détaillée des commissions de l'affilié
 *
 * Récupère toutes les commissions avec les infos sélection
 * Permet le filtrage par statut
 *
 * @module use-affiliate-commissions
 * @since 2025-12-10
 */

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

const supabase = createClient();

import { useUserAffiliate } from './use-user-selection';
import type {
  AnalyticsPeriod,
  CommissionItem,
  CommissionStatus,
} from '../../types/analytics';
import { getPeriodStartDate } from '../../types/analytics';

interface UseAffiliateCommissionsOptions {
  status?: CommissionStatus | 'all';
  /** Filtrer par période (pour synchroniser avec les KPIs) */
  period?: AnalyticsPeriod;
}

export function useAffiliateCommissions(
  options: UseAffiliateCommissionsOptions = {}
) {
  const { status = 'all', period = 'all' } = options;
  const { data: affiliate } = useUserAffiliate();

  return useQuery({
    queryKey: ['affiliate-commissions', affiliate?.id, status, period],
    queryFn: async (): Promise<CommissionItem[]> => {
      if (!affiliate) return [];

      // Construction de la requête
      // PERF: Limiter à 100 commissions pour éviter chargement lent
      const query = supabase
        .from('linkme_commissions')
        .select(
          `
          id,
          order_id,
          selection_id,
          order_number,
          order_amount_ht,
          affiliate_commission,
          affiliate_commission_ttc,
          linkme_commission,
          margin_rate_applied,
          status,
          created_at,
          validated_at,
          paid_at,
          linkme_selections!inner (
            name
          )
        `
        )
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false })
        .limit(100);

      // Récupérer les order_ids pour chercher les noms clients
      const { data: commissionsData, error: commissionsError } = await query;

      if (commissionsError) {
        console.error('Erreur fetch commissions list:', commissionsError);
        throw commissionsError;
      }

      // Filtrer par période si spécifiée
      let filteredByPeriod = commissionsData || [];
      if (period !== 'all') {
        const periodStart = getPeriodStartDate(period);
        if (periodStart) {
          const periodStartISO = periodStart.toISOString();
          filteredByPeriod = filteredByPeriod.filter(
            c => c.created_at && c.created_at >= periodStartISO
          );
        }
      }

      // Récupérer les noms des clients depuis linkme_orders_enriched
      const orderIds = filteredByPeriod.map(c => c.order_id).filter(Boolean);
      let customerNameMap = new Map<string, string>();

      if (orderIds.length > 0) {
        const { data: ordersData } = await supabase
          .from('linkme_orders_enriched')
          .select('id, customer_name')
          .in('id', orderIds);

        customerNameMap = new Map(
          (ordersData ?? []).map(o => [
            o.id!,
            o.customer_name ?? 'Client inconnu',
          ])
        );
      }

      // Filtrer par statut si nécessaire (déjà filtré par période)
      let filteredData = filteredByPeriod;
      if (status !== 'all') {
        filteredData = filteredData.filter(c => c.status === status);
      }

      // Transformer les données
      return filteredData.map(item => {
        const selection = item.linkme_selections as unknown as { name: string };
        const customerName =
          customerNameMap.get(item.order_id) ?? 'Client inconnu';

        return {
          id: item.id,
          orderNumber: item.order_number ?? '',
          orderAmountHT: item.order_amount_ht ?? 0,
          affiliateCommission: item.affiliate_commission ?? 0,
          affiliateCommissionTTC: item.affiliate_commission_ttc ?? 0,
          linkmeCommission: item.linkme_commission ?? 0,
          marginRateApplied: item.margin_rate_applied ?? 0,
          status: item.status as CommissionStatus,
          createdAt: item.created_at ?? '',
          validatedAt: item.validated_at,
          paidAt: item.paid_at,
          selectionName: selection?.name ?? 'Sélection inconnue',
          customerName,
        };
      });
    },
    enabled: !!affiliate,
    staleTime: 30000, // 30 secondes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook pour compter les commissions par statut
 */
export function useCommissionsCounts() {
  const { data: affiliate } = useUserAffiliate();

  return useQuery({
    queryKey: ['commissions-counts', affiliate?.id],
    queryFn: async () => {
      if (!affiliate) return { pending: 0, validated: 0, paid: 0, total: 0 };

      const { data, error } = await supabase
        .from('linkme_commissions')
        .select('status')
        .eq('affiliate_id', affiliate.id);

      if (error) {
        console.error('Erreur fetch commissions counts:', error);
        throw error;
      }

      const commissions = data || [];

      return {
        pending: commissions.filter(c => c.status === 'pending').length,
        validated: commissions.filter(c => c.status === 'validated').length,
        paid: commissions.filter(c => c.status === 'paid').length,
        total: commissions.length,
      };
    },
    enabled: !!affiliate,
    staleTime: 30000,
  });
}
