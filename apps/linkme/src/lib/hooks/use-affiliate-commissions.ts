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

      const supabase = createClient();
      // PERF: Server-side filtering for period and status
      let query = supabase
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
          total_payout_ht,
          total_payout_ttc,
          linkme_commission,
          margin_rate_applied,
          status,
          created_at,
          validated_at,
          paid_at,
          linkme_selections!inner (
            name
          ),
          sales_order:sales_orders!linkme_commissions_order_id_fkey (
            order_date,
            created_at,
            linkme_display_number,
            total_ttc
          )
        `
        )
        .eq('affiliate_id', affiliate.id)
        .order('created_at', { ascending: false });

      // Server-side period filter (fallback on created_at since order_date is on joined table)
      if (period !== 'all') {
        const periodStart = getPeriodStartDate(period);
        if (periodStart) {
          query = query.gte('created_at', periodStart.toISOString());
        }
      }

      // Server-side status filter
      if (status !== 'all') {
        query = query.eq('status', status);
      }

      const { data: commissionsData, error: commissionsError } = await query;

      if (commissionsError) {
        console.error('Erreur fetch commissions list:', commissionsError);
        throw commissionsError;
      }

      const filteredData = commissionsData ?? [];

      // Récupérer les noms des clients depuis linkme_orders_enriched
      const orderIds = filteredData.map(c => c.order_id).filter(Boolean);
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

      // Transformer les données
      const mapped = filteredData.map(item => {
        const selection = item.linkme_selections as unknown as { name: string };
        const salesOrder = item.sales_order as unknown as {
          order_date: string;
          created_at: string;
          linkme_display_number: string | null;
          total_ttc: number | null;
        } | null;
        const customerName =
          customerNameMap.get(item.order_id) ?? 'Client inconnu';

        return {
          id: item.id,
          orderId: item.order_id,
          orderNumber:
            salesOrder?.linkme_display_number ?? item.order_number ?? '',
          orderAmountHT: item.order_amount_ht ?? 0,
          orderAmountTTC: salesOrder?.total_ttc ?? 0,
          affiliateCommission: item.affiliate_commission ?? 0,
          affiliateCommissionTTC: item.affiliate_commission_ttc ?? 0,
          totalPayoutHT: item.total_payout_ht ?? item.affiliate_commission ?? 0,
          totalPayoutTTC:
            item.total_payout_ttc ?? item.affiliate_commission_ttc ?? 0,
          linkmeCommission: item.linkme_commission ?? 0,
          marginRateApplied: item.margin_rate_applied ?? 0,
          status: item.status as CommissionStatus,
          createdAt: item.created_at ?? '',
          orderDate:
            salesOrder?.order_date ??
            salesOrder?.created_at?.slice(0, 10) ??
            item.created_at ??
            '',
          validatedAt: item.validated_at,
          paidAt: item.paid_at,
          selectionName: selection?.name ?? 'Sélection inconnue',
          customerName,
        };
      });

      // Trier par date de commande décroissante (le .order() Supabase ne trie pas sur la table jointe)
      mapped.sort((a, b) => b.orderDate.localeCompare(a.orderDate));

      return mapped;
    },
    enabled: !!affiliate,
    staleTime: 300_000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook pour compter les commissions par statut
 *
 * PERF: Utilise count:exact + head:true en parallèle (4 requêtes COUNT)
 * au lieu de rapatrier toutes les lignes et filtrer en JS.
 * Pour N commissions : O(1) au lieu de O(N) lignes réseau.
 */
export function useCommissionsCounts() {
  const { data: affiliate } = useUserAffiliate();

  return useQuery({
    queryKey: ['commissions-counts', affiliate?.id],
    queryFn: async () => {
      if (!affiliate) return { pending: 0, validated: 0, paid: 0, total: 0 };

      const supabase = createClient();

      // 4 requêtes COUNT parallèles — aucune ligne de données rapatriée
      const [pendingResult, validatedResult, paidResult, totalResult] =
        await Promise.all([
          supabase
            .from('linkme_commissions')
            .select('*', { count: 'exact', head: true })
            .eq('affiliate_id', affiliate.id)
            .eq('status', 'pending'),
          supabase
            .from('linkme_commissions')
            .select('*', { count: 'exact', head: true })
            .eq('affiliate_id', affiliate.id)
            .in('status', ['validated', 'payable']),
          supabase
            .from('linkme_commissions')
            .select('*', { count: 'exact', head: true })
            .eq('affiliate_id', affiliate.id)
            .eq('status', 'paid'),
          supabase
            .from('linkme_commissions')
            .select('*', { count: 'exact', head: true })
            .eq('affiliate_id', affiliate.id),
        ]);

      // Vérifier les erreurs (non-bloquant : on retourne 0 si erreur)
      if (pendingResult.error) {
        console.error('Erreur fetch commissions counts:', pendingResult.error);
        throw pendingResult.error;
      }

      return {
        pending: pendingResult.count ?? 0,
        validated: validatedResult.count ?? 0,
        paid: paidResult.count ?? 0,
        total: totalResult.count ?? 0,
      };
    },
    enabled: !!affiliate,
    staleTime: 300_000,
    refetchOnWindowFocus: false,
  });
}
