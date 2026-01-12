/**
 * Hook unifié pour Dashboard CRM/ERP 2025
 * Combine données réelles Phase 1 + Phase 2 + Treasury + LinkMe
 *
 * @updated 2026-01-12 - Intégration complète des KPIs (Finance, Orders, Stock, LinkMe)
 */

import { useCallback, useEffect, useState } from 'react';

import { useTreasuryStats } from '@verone/finance/hooks';
import { useOrganisations } from '@verone/organisations/hooks';
import { createClient } from '@verone/utils/supabase/client';

import { useStockOrdersMetrics } from '@verone/dashboard/hooks/metrics/use-stock-orders-metrics';

import { useRealDashboardMetrics } from './use-real-dashboard-metrics';

// ============================================================================
// Types
// ============================================================================

export interface CompleteDashboardMetrics {
  // Phase 1 - Données RÉELLES
  catalogue: {
    totalProducts: number;
    activeProducts: number;
    publishedProducts: number;
    collections: number;
    variantGroups: number;
    trend: number;
  };

  organisations: {
    totalOrganisations: number;
    suppliers: number;
    customersB2B: number;
    partners: number;
  };

  // Phase 2 - Données RÉELLES (Stock/Commandes/Sourcing)
  stocks: {
    totalValue: number;
    lowStockItems: number;
    recentMovements: number;
    inStock: number;
    outOfStock: number;
    critical: number;
  };

  orders: {
    purchaseOrders: number;
    salesOrders: number;
    monthRevenue: number;
    dayRevenue: number;
    averageOrderValue: number;
    pending: number;
    processing: number;
    completed: number;
    cancelled: number;
    trend: number;
  };

  sourcing: {
    productsToSource: number;
    samplesWaiting: number;
  };

  // Treasury - Données RÉELLES (Qonto + Supabase)
  treasury: {
    balance: number;
    accountsReceivable: number;
    accountsPayable: number;
    unpaidInvoices: number;
    burnRate: number;
    runwayMonths: number;
    cashFlowNet: number;
    trend: number;
  };

  // LinkMe - Données RÉELLES
  linkme: {
    totalCommissions: number;
    ordersCount: number;
    activeAffiliates: number;
    conversionRate: number;
    averageMargin: number;
    revenue: number;
    trend: number;
  };

  // Compatibilité avec sections de détail du dashboard
  collections: {
    total: number;
    active: number;
  };

  variantGroups: {
    total: number;
  };

  products: {
    trend: number;
  };
}

// ============================================================================
// Hook
// ============================================================================

export function useCompleteDashboardMetrics() {
  // Phase 1 - Données réelles
  const {
    metrics: catalogueMetrics,
    isLoading: catalogueLoading,
    error: catalogueError,
  } = useRealDashboardMetrics();

  const { organisations, loading: organisationsLoading } = useOrganisations();

  // Phase 2 - Données réelles Stock/Commandes/Sourcing
  const { metrics: stockOrdersMetrics, isLoading: stockOrdersLoading } =
    useStockOrdersMetrics();

  // Treasury - Données Qonto + Supabase
  const {
    stats: treasuryStats,
    bankBalance,
    metrics: treasuryMetrics,
    loading: treasuryLoading,
  } = useTreasuryStats();

  // États internes pour les données qui nécessitent un fetch explicite
  const [orderMetrics, setOrderMetrics] = useState({
    pending: 0,
    processing: 0,
    completed: 0,
    cancelled: 0,
    trend: 0,
    dayRevenue: 0,
    monthRevenue: 0,
    averageOrderValue: 0,
  });
  const [linkmeMetrics, setLinkmeMetrics] = useState({
    revenue: 0,
    commissions: 0,
    ordersCount: 0,
    activeAffiliates: 0,
    trend: 0,
    averageMargin: 0,
    conversionRate: 0,
  });
  const [stockMetrics, setStockMetrics] = useState({
    inStock: 0,
    outOfStock: 0,
    lowStock: 0,
    critical: 0,
  });
  const [salesOrdersCount, setSalesOrdersCount] = useState<number>(0);
  const [dataLoading, setDataLoading] = useState(true);

  const supabase = createClient();

  // Fetch des données additionnelles
  const fetchAdditionalData = useCallback(async () => {
    try {
      setDataLoading(true);

      // Vérifier authentification
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setDataLoading(false);
        return;
      }

      // ========================================
      // Orders Metrics
      // ========================================
      const now = new Date();
      const startOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfPrevMonth = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Récupérer les commandes du mois (pour stats de statut)
      const { data: monthOrders } = await supabase
        .from('sales_orders')
        .select('id, status, total_ht, created_at')
        .gte('created_at', startOfMonth.toISOString());

      // ========================================
      // CA calculé depuis les FACTURES (pas les commandes)
      // ========================================
      const { data: monthInvoices } = await supabase
        .from('invoices')
        .select('total_ht, status, created_at')
        .gte('created_at', startOfMonth.toISOString())
        .eq('type', 'invoice')
        .not('status', 'eq', 'cancelled');

      const { data: prevMonthInvoices } = await supabase
        .from('invoices')
        .select('total_ht')
        .gte('created_at', startOfPrevMonth.toISOString())
        .lt('created_at', startOfMonth.toISOString())
        .eq('type', 'invoice')
        .not('status', 'eq', 'cancelled');

      const { data: todayInvoices } = await supabase
        .from('invoices')
        .select('total_ht')
        .gte('created_at', startOfToday.toISOString())
        .eq('type', 'invoice')
        .not('status', 'eq', 'cancelled');

      // Calculer les métriques de commandes (statuts)
      const pending =
        monthOrders?.filter(o => ['draft', 'validated'].includes(o.status))
          .length || 0;
      const processing =
        monthOrders?.filter(o => o.status === 'partially_shipped').length || 0;
      const completed =
        monthOrders?.filter(o => ['shipped', 'delivered'].includes(o.status))
          .length || 0;
      const cancelled =
        monthOrders?.filter(o => o.status === 'cancelled').length || 0;

      // CA du mois = somme des factures (pas des commandes)
      const monthRevenue = (monthInvoices || []).reduce(
        (sum, i) => sum + parseFloat(String(i.total_ht || 0)),
        0
      );

      const prevMonthRevenue = (prevMonthInvoices || []).reduce(
        (sum, i) => sum + parseFloat(String(i.total_ht || 0)),
        0
      );

      const dayRevenue = (todayInvoices || []).reduce(
        (sum, i) => sum + parseFloat(String(i.total_ht || 0)),
        0
      );

      const validMonthOrders = (monthOrders || []).filter(o =>
        ['validated', 'partially_shipped', 'shipped', 'delivered'].includes(
          o.status
        )
      );
      const averageOrderValue =
        validMonthOrders.length > 0
          ? monthRevenue / validMonthOrders.length
          : 0;

      let orderTrend = 0;
      if (prevMonthRevenue > 0) {
        orderTrend =
          ((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100;
      } else if (monthRevenue > 0) {
        orderTrend = 100;
      }

      setSalesOrdersCount(monthOrders?.length || 0);
      setOrderMetrics({
        pending,
        processing,
        completed,
        cancelled,
        trend: Math.round(orderTrend * 10) / 10,
        dayRevenue: Math.round(dayRevenue * 100) / 100,
        monthRevenue: Math.round(monthRevenue * 100) / 100,
        averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      });

      // ========================================
      // Stock Metrics
      // ========================================
      const { data: products } = await supabase
        .from('products')
        .select('id, stock_real, min_stock')
        .eq('archived', false);

      let inStock = 0;
      let outOfStock = 0;
      let lowStock = 0;
      let critical = 0;

      (products || []).forEach(p => {
        const stockQty = p.stock_real || 0;
        const threshold = p.min_stock || 5;

        if (stockQty === 0) {
          outOfStock++;
        } else if (stockQty <= 2) {
          critical++;
        } else if (stockQty <= threshold) {
          lowStock++;
        } else {
          inStock++;
        }
      });

      setStockMetrics({ inStock, outOfStock, lowStock, critical });

      // ========================================
      // LinkMe Metrics
      // ========================================
      const { data: linkmeOrders } = await supabase
        .from('linkme_orders_with_margins')
        .select('id, total_ht, total_affiliate_margin, created_at')
        .gte('created_at', startOfMonth.toISOString());

      const { data: prevLinkmeOrders } = await supabase
        .from('linkme_orders_with_margins')
        .select('id, total_ht')
        .gte('created_at', startOfPrevMonth.toISOString())
        .lt('created_at', startOfMonth.toISOString());

      const { data: pendingPayments } = await supabase
        .from('linkme_payment_requests')
        .select('total_amount_ttc')
        .in('status', ['pending', 'invoice_received']);

      const { data: affiliates } = await supabase
        .from('linkme_affiliates')
        .select('id, status')
        .eq('status', 'active');

      const { data: selections } = await supabase
        .from('linkme_selections')
        .select('id')
        .gte('created_at', startOfMonth.toISOString());

      const linkmeRevenue = (linkmeOrders || []).reduce(
        (sum, o) => sum + parseFloat(String(o.total_ht || 0)),
        0
      );
      const prevLinkmeRevenue = (prevLinkmeOrders || []).reduce(
        (sum, o) => sum + parseFloat(String(o.total_ht || 0)),
        0
      );
      const linkmeCommissions = (pendingPayments || []).reduce(
        (sum, p) => sum + parseFloat(String(p.total_amount_ttc || 0)),
        0
      );

      // Calcul du taux de marge moyen
      const totalMargin = (linkmeOrders || []).reduce(
        (sum, o) => sum + parseFloat(String(o.total_affiliate_margin || 0)),
        0
      );
      const avgMargin =
        linkmeRevenue > 0 ? (totalMargin / linkmeRevenue) * 100 : 0;

      // Taux de conversion (commandes / sélections)
      const selectionsCount = selections?.length || 0;
      const conversionRate =
        selectionsCount > 0
          ? ((linkmeOrders?.length || 0) / selectionsCount) * 100
          : 0;

      let linkmeTrend = 0;
      if (prevLinkmeRevenue > 0) {
        linkmeTrend =
          ((linkmeRevenue - prevLinkmeRevenue) / prevLinkmeRevenue) * 100;
      } else if (linkmeRevenue > 0) {
        linkmeTrend = 100;
      }

      setLinkmeMetrics({
        revenue: linkmeRevenue,
        commissions: linkmeCommissions,
        ordersCount: linkmeOrders?.length || 0,
        activeAffiliates: affiliates?.length || 0,
        trend: Math.round(linkmeTrend * 10) / 10,
        averageMargin: Math.round(avgMargin * 10) / 10,
        conversionRate: Math.round(conversionRate * 10) / 10,
      });
    } catch (err) {
      console.error('Error fetching additional dashboard data:', err);
    } finally {
      setDataLoading(false);
    }
  }, [supabase]);

  // Charger les données au montage
  useEffect(() => {
    fetchAdditionalData();
  }, [fetchAdditionalData]);

  // Calcul statistiques organisations (excluant particuliers)
  const organisationsOnly = organisations.filter(
    o =>
      o.type !== 'customer' ||
      (o.type === 'customer' && o.customer_type !== 'individual')
  );

  const organisationsStats = {
    totalOrganisations: organisationsOnly.length,
    suppliers: organisations.filter(o => o.type === 'supplier').length,
    customersB2B: organisations.filter(
      o =>
        o.type === 'customer' &&
        (!o.customer_type || o.customer_type === 'professional')
    ).length,
    partners: organisations.filter(o => o.type === 'partner').length,
  };

  // Phase 2 - Données réelles depuis Supabase
  const stocksData = {
    totalValue: stockOrdersMetrics?.stock_value || 0,
    lowStockItems:
      stockMetrics.outOfStock + stockMetrics.lowStock + stockMetrics.critical,
    recentMovements: 0,
    inStock: stockMetrics.inStock,
    outOfStock: stockMetrics.outOfStock,
    critical: stockMetrics.critical,
  };

  const ordersData = {
    purchaseOrders: stockOrdersMetrics?.purchase_orders_count || 0,
    salesOrders: salesOrdersCount,
    monthRevenue:
      orderMetrics.monthRevenue || stockOrdersMetrics?.month_revenue || 0,
    dayRevenue: orderMetrics.dayRevenue,
    averageOrderValue: orderMetrics.averageOrderValue,
    pending: orderMetrics.pending,
    processing: orderMetrics.processing,
    completed: orderMetrics.completed,
    cancelled: orderMetrics.cancelled,
    trend: orderMetrics.trend,
  };

  const sourcingData = {
    productsToSource: stockOrdersMetrics?.products_to_source || 0,
    samplesWaiting: 0,
  };

  // Treasury data
  const treasuryData = {
    balance: bankBalance || 0,
    accountsReceivable: treasuryStats?.total_invoiced_ar || 0,
    accountsPayable: treasuryStats?.total_invoiced_ap || 0,
    unpaidInvoices:
      (treasuryStats?.unpaid_count_ar || 0) +
      (treasuryStats?.unpaid_count_ap || 0),
    burnRate: treasuryMetrics?.burnRate || 0,
    runwayMonths: treasuryMetrics?.runwayMonths || 0,
    cashFlowNet: treasuryMetrics?.cashFlowNet || 0,
    trend: treasuryMetrics?.cashFlowVariation || 0,
  };

  // LinkMe data
  const linkmeData = {
    totalCommissions: linkmeMetrics.commissions,
    ordersCount: linkmeMetrics.ordersCount,
    activeAffiliates: linkmeMetrics.activeAffiliates,
    conversionRate: linkmeMetrics.conversionRate,
    averageMargin: linkmeMetrics.averageMargin,
    revenue: linkmeMetrics.revenue,
    trend: linkmeMetrics.trend,
  };

  const metrics: CompleteDashboardMetrics = {
    catalogue: {
      totalProducts: catalogueMetrics?.products.total || 0,
      activeProducts: catalogueMetrics?.products.active || 0,
      publishedProducts: catalogueMetrics?.products.published || 0,
      collections: catalogueMetrics?.collections.total || 0,
      variantGroups: catalogueMetrics?.variantGroups.total || 0,
      trend: catalogueMetrics?.products.trend || 0,
    },
    organisations: organisationsStats,
    stocks: stocksData,
    orders: ordersData,
    sourcing: sourcingData,
    treasury: treasuryData,
    linkme: linkmeData,
    // Compatibilité avec sections de détail du dashboard
    collections: {
      total: catalogueMetrics?.collections.total || 0,
      active: catalogueMetrics?.collections.active || 0,
    },
    variantGroups: {
      total: catalogueMetrics?.variantGroups.total || 0,
    },
    products: {
      trend: catalogueMetrics?.products.trend || 0,
    },
  };

  const isLoading =
    catalogueLoading ||
    organisationsLoading ||
    stockOrdersLoading ||
    treasuryLoading ||
    dataLoading;
  const error = catalogueError;

  return {
    metrics,
    isLoading: isLoading,
    error,
    refresh: fetchAdditionalData,
  };
}
