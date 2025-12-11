/**
 * Hook: useLinkMeDashboard
 * Métriques centralisées pour le dashboard LinkMe (4 KPIs essentiels)
 *
 * KPIs:
 * 1. CA Généré (ce mois vs mois précédent)
 * 2. Commissions à payer (montant + count)
 * 3. Affiliés actifs (+ nouveaux ce mois)
 * 4. Commandes ce mois (+ % vs mois précédent)
 *
 * @module use-linkme-dashboard
 * @since 2025-12-11
 */

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@verone/utils/supabase/client';

// ============================================================================
// Types
// ============================================================================

export interface DashboardKPIs {
  // KPI 1: CA Généré
  revenue: {
    current: number;
    previous: number;
    growth: number; // Pourcentage
  };
  // KPI 2: Commissions à payer
  pendingCommissions: {
    amount: number;
    count: number;
  };
  // KPI 3: Affiliés actifs
  affiliates: {
    active: number;
    newThisMonth: number;
  };
  // KPI 4: Commandes ce mois
  orders: {
    current: number;
    previous: number;
    growth: number; // Pourcentage
  };
}

export interface RecentActivity {
  id: string;
  type: 'order' | 'affiliate' | 'payment' | 'commission';
  title: string;
  description: string;
  timestamp: string;
  amount?: number;
}

// ============================================================================
// Helpers
// ============================================================================

function getMonthBounds(monthOffset: number = 0) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + monthOffset;

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
}

function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// ============================================================================
// Hook principal
// ============================================================================

export function useLinkMeDashboard() {
  const supabase = createClient();

  return useQuery({
    queryKey: ['linkme-dashboard-kpis'],
    queryFn: async (): Promise<DashboardKPIs> => {
      const currentMonth = getMonthBounds(0);
      const previousMonth = getMonthBounds(-1);

      // ========================================
      // KPI 1 & 4: Commissions (CA + Orders count)
      // ========================================
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: commissionsCurrentMonth } = await (supabase as any)
        .from('linkme_commissions')
        .select('id, order_amount_ht, status')
        .gte('created_at', currentMonth.start)
        .lte('created_at', currentMonth.end);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: commissionsPreviousMonth } = await (supabase as any)
        .from('linkme_commissions')
        .select('id, order_amount_ht')
        .gte('created_at', previousMonth.start)
        .lte('created_at', previousMonth.end);

      const currentRevenue = (commissionsCurrentMonth || []).reduce(
        (sum: number, c: { order_amount_ht: number }) =>
          sum + Number(c.order_amount_ht || 0),
        0
      );
      const previousRevenue = (commissionsPreviousMonth || []).reduce(
        (sum: number, c: { order_amount_ht: number }) =>
          sum + Number(c.order_amount_ht || 0),
        0
      );

      const currentOrdersCount = (commissionsCurrentMonth || []).length;
      const previousOrdersCount = (commissionsPreviousMonth || []).length;

      // ========================================
      // KPI 2: Commissions en attente (pending + invoice_received)
      // ========================================
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: pendingRequests } = await (supabase as any)
        .from('linkme_payment_requests')
        .select('id, total_amount_ttc, status')
        .in('status', ['pending', 'invoice_received']);

      const pendingAmount = (pendingRequests || []).reduce(
        (sum: number, r: { total_amount_ttc: number }) =>
          sum + Number(r.total_amount_ttc || 0),
        0
      );
      const pendingCount = (pendingRequests || []).length;

      // ========================================
      // KPI 3: Affiliés actifs + nouveaux ce mois
      // ========================================
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: affiliates } = await (supabase as any)
        .from('linkme_affiliates')
        .select('id, status, created_at');

      const activeAffiliates = (affiliates || []).filter(
        (a: { status: string }) => a.status === 'active'
      ).length;

      const newAffiliatesThisMonth = (affiliates || []).filter(
        (a: { created_at: string }) => {
          const createdAt = new Date(a.created_at);
          return (
            createdAt >= new Date(currentMonth.start) &&
            createdAt <= new Date(currentMonth.end)
          );
        }
      ).length;

      return {
        revenue: {
          current: currentRevenue,
          previous: previousRevenue,
          growth: calculateGrowth(currentRevenue, previousRevenue),
        },
        pendingCommissions: {
          amount: pendingAmount,
          count: pendingCount,
        },
        affiliates: {
          active: activeAffiliates,
          newThisMonth: newAffiliatesThisMonth,
        },
        orders: {
          current: currentOrdersCount,
          previous: previousOrdersCount,
          growth: calculateGrowth(currentOrdersCount, previousOrdersCount),
        },
      };
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // Rafraîchir toutes les 2 minutes
  });
}

// ============================================================================
// Hook activité récente
// ============================================================================

export function useRecentActivity(limit: number = 5) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['linkme-recent-activity', limit],
    queryFn: async (): Promise<RecentActivity[]> => {
      const activities: RecentActivity[] = [];

      // Récupérer les dernières commissions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: recentCommissions } = await (supabase as any)
        .from('linkme_commissions')
        .select(
          `
          id,
          order_number,
          order_amount_ht,
          created_at,
          linkme_affiliates (display_name)
        `
        )
        .order('created_at', { ascending: false })
        .limit(limit);

      (recentCommissions || []).forEach(
        (c: {
          id: string;
          order_number: string;
          order_amount_ht: number;
          created_at: string;
          linkme_affiliates: { display_name: string } | null;
        }) => {
          activities.push({
            id: `order-${c.id}`,
            type: 'order',
            title: `Commande #${c.order_number}`,
            description: c.linkme_affiliates?.display_name || 'Affilié',
            timestamp: c.created_at,
            amount: c.order_amount_ht,
          });
        }
      );

      // Récupérer les derniers affiliés
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: recentAffiliates } = await (supabase as any)
        .from('linkme_affiliates')
        .select('id, display_name, status, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);

      (recentAffiliates || []).forEach(
        (a: {
          id: string;
          display_name: string;
          status: string;
          created_at: string;
        }) => {
          activities.push({
            id: `affiliate-${a.id}`,
            type: 'affiliate',
            title: a.display_name,
            description:
              a.status === 'active'
                ? 'Nouvel affilié actif'
                : 'Inscription en attente',
            timestamp: a.created_at,
          });
        }
      );

      // Récupérer les dernières demandes de paiement
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: recentPayments } = await (supabase as any)
        .from('linkme_payment_requests')
        .select(
          `
          id,
          request_number,
          total_amount_ttc,
          status,
          created_at,
          linkme_affiliates (display_name)
        `
        )
        .order('created_at', { ascending: false })
        .limit(limit);

      (recentPayments || []).forEach(
        (p: {
          id: string;
          request_number: string;
          total_amount_ttc: number;
          status: string;
          created_at: string;
          linkme_affiliates: { display_name: string } | null;
        }) => {
          const statusLabel =
            p.status === 'paid'
              ? 'Paiement effectué'
              : p.status === 'pending'
                ? 'En attente'
                : p.status === 'invoice_received'
                  ? 'Facture reçue'
                  : p.status;

          activities.push({
            id: `payment-${p.id}`,
            type: 'payment',
            title: `${p.linkme_affiliates?.display_name || 'Affilié'}`,
            description: statusLabel,
            timestamp: p.created_at,
            amount: p.total_amount_ttc,
          });
        }
      );

      // Trier par date et limiter
      return activities
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, limit);
    },
    staleTime: 30000, // 30 secondes
  });
}
