'use client';

import { useQuery } from '@tanstack/react-query';

import { createClient } from '@verone/utils/supabase/client';

import { SITE_INTERNET_CHANNEL_ID } from '../constants';

const supabase = createClient();

export interface SiteCustomersKpis {
  /** Total clients actifs source site-internet */
  totalCustomers: number;
  /** Clients ayant au moins 1 commande dans les 6 derniers mois */
  activeCustomers: number;
  /** Valeur vie client moyenne (somme des achats par client, en moyenne) */
  averageLtv: number;
  /** Panier moyen sur toutes les commandes site-internet */
  averageOrderValue: number;
}

async function fetchSiteCustomersKpis(): Promise<SiteCustomersKpis> {
  // 6 mois en arrière
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const sixMonthsAgoStr = sixMonthsAgo.toISOString();

  const [customersResult, ordersResult] = await Promise.all([
    // Tous les clients actifs site-internet (max 1000 pour calcul LTV)
    supabase
      .from('individual_customers')
      .select('id')
      .eq('source_type', 'site-internet')
      .eq('is_active', true)
      .limit(1000),

    // Toutes les commandes site-internet (hors draft/cancelled)
    supabase
      .from('sales_orders')
      .select('id, individual_customer_id, total_ttc, created_at')
      .eq('channel_id', SITE_INTERNET_CHANNEL_ID)
      .not('status', 'in', '("draft","cancelled")')
      .limit(5000),
  ]);

  const totalCustomers = customersResult.data?.length ?? 0;
  const allOrders = ordersResult.data ?? [];

  // Clients actifs = ceux qui ont commandé dans les 6 derniers mois
  const recentCustomerIds = new Set(
    allOrders
      .filter(o => o.created_at && o.created_at >= sixMonthsAgoStr)
      .map(o => o.individual_customer_id)
      .filter(Boolean)
  );
  const activeCustomers = recentCustomerIds.size;

  // LTV moyenne : somme des achats par client, puis moyenne
  if (allOrders.length === 0) {
    return {
      totalCustomers,
      activeCustomers,
      averageLtv: 0,
      averageOrderValue: 0,
    };
  }

  // Regrouper par client
  const totalByCustomer = new Map<string, number>();
  for (const order of allOrders) {
    if (!order.individual_customer_id) continue;
    const prev = totalByCustomer.get(order.individual_customer_id) ?? 0;
    totalByCustomer.set(
      order.individual_customer_id,
      prev + (Number(order.total_ttc) || 0)
    );
  }

  const ltvValues = Array.from(totalByCustomer.values());
  const averageLtv =
    ltvValues.length > 0
      ? Math.round(
          (ltvValues.reduce((a, b) => a + b, 0) / ltvValues.length) * 100
        ) / 100
      : 0;

  // Panier moyen = moyenne de total_ttc sur toutes les commandes
  const totalRevenue = allOrders.reduce(
    (sum, o) => sum + (Number(o.total_ttc) || 0),
    0
  );
  const averageOrderValue =
    allOrders.length > 0
      ? Math.round((totalRevenue / allOrders.length) * 100) / 100
      : 0;

  return { totalCustomers, activeCustomers, averageLtv, averageOrderValue };
}

export function useSiteCustomersKpis() {
  return useQuery({
    queryKey: ['site-internet-customers-kpis'],
    queryFn: fetchSiteCustomersKpis,
    staleTime: 5 * 60_000,
  });
}
