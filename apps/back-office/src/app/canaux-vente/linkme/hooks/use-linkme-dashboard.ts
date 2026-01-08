/**
 * Hook: useLinkMeDashboard
 * Métriques centralisées pour le dashboard LinkMe (4 KPIs essentiels)
 *
 * KPIs:
 * 1. CA Généré (ce mois vs moyenne mensuelle)
 * 2. Commissions à payer (montant + count)
 * 3. Affiliés actifs (+ nouveaux ce mois)
 * 4. Commandes ce mois (+ % vs moyenne mensuelle)
 *
 * @module use-linkme-dashboard
 * @since 2025-12-11
 * @updated 2026-01-06 - Comparaison avec moyenne au lieu de mois précédent
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
    average: number; // Moyenne mensuelle historique
    growth: number; // Pourcentage vs moyenne
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
    average: number; // Moyenne mensuelle historique
    growth: number; // Pourcentage vs moyenne
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

function calculateGrowthVsAverage(current: number, average: number): number {
  if (average === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - average) / average) * 100);
}

/**
 * Groupe les commandes par mois et calcule la moyenne mensuelle
 * Exclut le mois courant du calcul de la moyenne
 */
function calculateMonthlyAverage(
  orders: Array<{ created_at: string; total_ht?: number }>,
  currentMonthStart: Date
): { avgRevenue: number; avgCount: number; monthsCount: number } {
  // Grouper par mois (YYYY-MM)
  const monthlyData: Record<string, { revenue: number; count: number }> = {};

  orders.forEach(order => {
    const orderDate = new Date(order.created_at);
    // Exclure le mois courant
    if (orderDate >= currentMonthStart) return;

    const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { revenue: 0, count: 0 };
    }

    monthlyData[monthKey].revenue += Number(order.total_ht || 0);
    monthlyData[monthKey].count += 1;
  });

  const months = Object.values(monthlyData);
  const monthsCount = months.length;

  if (monthsCount === 0) {
    return { avgRevenue: 0, avgCount: 0, monthsCount: 0 };
  }

  const totalRevenue = months.reduce((sum, m) => sum + m.revenue, 0);
  const totalCount = months.reduce((sum, m) => sum + m.count, 0);

  return {
    avgRevenue: totalRevenue / monthsCount,
    avgCount: totalCount / monthsCount,
    monthsCount,
  };
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
      const currentMonthStart = new Date(currentMonth.start);

      // ========================================
      // KPI 1 & 4: CA + Orders count
      // Récupère TOUTES les commandes pour calculer la moyenne mensuelle
      // ========================================
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: allOrders } = await (supabase as any)
        .from('linkme_orders_with_margins')
        .select('id, total_ht, total_affiliate_margin, created_at')
        .order('created_at', { ascending: true });

      // Filtrer les commandes du mois courant
      const ordersCurrentMonth = (allOrders || []).filter(
        (o: { created_at: string }) => {
          const orderDate = new Date(o.created_at);
          return (
            orderDate >= new Date(currentMonth.start) &&
            orderDate <= new Date(currentMonth.end)
          );
        }
      );

      // Calculer le CA et le nombre de commandes du mois courant
      const currentRevenue = ordersCurrentMonth.reduce(
        (sum: number, o: { total_ht: number }) => sum + Number(o.total_ht || 0),
        0
      );
      const currentOrdersCount = ordersCurrentMonth.length;

      // Calculer la moyenne mensuelle (tous les mois précédents)
      const { avgRevenue, avgCount } = calculateMonthlyAverage(
        allOrders || [],
        currentMonthStart
      );

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
          average: avgRevenue,
          growth: calculateGrowthVsAverage(currentRevenue, avgRevenue),
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
          average: avgCount,
          growth: calculateGrowthVsAverage(currentOrdersCount, avgCount),
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
