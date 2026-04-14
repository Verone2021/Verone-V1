/**
 * Hook unifié pour Dashboard CRM/ERP 2025
 * Combine données réelles Phase 1 + Phase 2 + Treasury + LinkMe
 *
 * @updated 2026-01-12 - Intégration complète des KPIs (Finance, Orders, Stock, LinkMe)
 */

import { useEffect } from 'react';

import { useTreasuryStats } from '@verone/finance/hooks';
import { useOrganisations } from '@verone/organisations/hooks';

import { useStockOrdersMetrics } from '@verone/dashboard/hooks/metrics/use-stock-orders-metrics';

import { useDashboardAdditionalData } from './use-dashboard-additional-data';
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
    trend: number;
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
  const {
    metrics: catalogueMetrics,
    isLoading: catalogueLoading,
    error: catalogueError,
  } = useRealDashboardMetrics();

  const { organisations, loading: organisationsLoading } = useOrganisations();

  const { metrics: stockOrdersMetrics, isLoading: stockOrdersLoading } =
    useStockOrdersMetrics();

  const {
    stats: treasuryStats,
    bankBalance,
    metrics: treasuryMetrics,
    loading: treasuryLoading,
  } = useTreasuryStats();

  const {
    orderMetrics,
    linkmeMetrics,
    stockMetrics,
    salesOrdersCount,
    stockAlertsFromRPC,
    dataLoading,
    fetchAdditionalData,
  } = useDashboardAdditionalData();

  useEffect(() => {
    void fetchAdditionalData();
  }, [fetchAdditionalData]);

  // Organisations stats (excluant particuliers)
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

  const stocksData = {
    totalValue: stockOrdersMetrics?.stock_value ?? 0,
    lowStockItems: stockAlertsFromRPC,
    recentMovements: 0,
    inStock: stockMetrics.inStock,
    outOfStock: stockMetrics.outOfStock,
    critical: stockMetrics.critical,
    trend: 0,
  };

  const ordersData = {
    purchaseOrders: stockOrdersMetrics?.purchase_orders_count ?? 0,
    salesOrders: salesOrdersCount,
    monthRevenue:
      orderMetrics.monthRevenue ?? stockOrdersMetrics?.month_revenue ?? 0,
    dayRevenue: orderMetrics.dayRevenue,
    averageOrderValue: orderMetrics.averageOrderValue,
    pending: orderMetrics.pending,
    processing: orderMetrics.processing,
    completed: orderMetrics.completed,
    cancelled: orderMetrics.cancelled,
    trend: orderMetrics.trend,
  };

  const metrics: CompleteDashboardMetrics = {
    catalogue: {
      totalProducts: catalogueMetrics?.products.total ?? 0,
      activeProducts: catalogueMetrics?.products.active ?? 0,
      publishedProducts: catalogueMetrics?.products.published ?? 0,
      collections: catalogueMetrics?.collections.total ?? 0,
      variantGroups: catalogueMetrics?.variantGroups.total ?? 0,
      trend: catalogueMetrics?.products.trend ?? 0,
    },
    organisations: organisationsStats,
    stocks: stocksData,
    orders: ordersData,
    sourcing: {
      productsToSource: stockOrdersMetrics?.products_to_source ?? 0,
      samplesWaiting: 0,
    },
    treasury: {
      balance: bankBalance ?? 0,
      accountsReceivable: treasuryStats?.total_invoiced_ar ?? 0,
      accountsPayable: treasuryStats?.total_invoiced_ap ?? 0,
      unpaidInvoices:
        (treasuryStats?.unpaid_count_ar ?? 0) +
        (treasuryStats?.unpaid_count_ap ?? 0),
      burnRate: treasuryMetrics?.burnRate ?? 0,
      runwayMonths: treasuryMetrics?.runwayMonths ?? 0,
      cashFlowNet: treasuryMetrics?.cashFlowNet ?? 0,
      trend: treasuryMetrics?.cashFlowVariation ?? 0,
    },
    linkme: {
      totalCommissions: linkmeMetrics.commissions,
      ordersCount: linkmeMetrics.ordersCount,
      activeAffiliates: linkmeMetrics.activeAffiliates,
      conversionRate: linkmeMetrics.conversionRate,
      averageMargin: linkmeMetrics.averageMargin,
      revenue: linkmeMetrics.revenue,
      trend: linkmeMetrics.trend,
    },
    collections: {
      total: catalogueMetrics?.collections.total ?? 0,
      active: catalogueMetrics?.collections.active ?? 0,
    },
    variantGroups: {
      total: catalogueMetrics?.variantGroups.total ?? 0,
    },
    products: {
      trend: catalogueMetrics?.products.trend ?? 0,
    },
  };

  const isLoading =
    catalogueLoading ||
    organisationsLoading ||
    stockOrdersLoading ||
    treasuryLoading ||
    dataLoading;

  return {
    metrics,
    isLoading,
    error: catalogueError,
    refresh: fetchAdditionalData,
  };
}
