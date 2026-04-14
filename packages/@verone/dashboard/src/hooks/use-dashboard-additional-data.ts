'use client';

import { useCallback, useState } from 'react';

import { createClient } from '@verone/utils/supabase/client';

export interface OrderMetrics {
  pending: number;
  processing: number;
  completed: number;
  cancelled: number;
  trend: number;
  dayRevenue: number;
  monthRevenue: number;
  averageOrderValue: number;
}

export interface LinkmeMetrics {
  revenue: number;
  commissions: number;
  ordersCount: number;
  activeAffiliates: number;
  trend: number;
  averageMargin: number;
  conversionRate: number;
}

export interface StockMetrics {
  inStock: number;
  outOfStock: number;
  lowStock: number;
  critical: number;
}

interface AdditionalDataResult {
  orderMetrics: OrderMetrics;
  linkmeMetrics: LinkmeMetrics;
  stockMetrics: StockMetrics;
  salesOrdersCount: number;
  stockAlertsFromRPC: number;
  dataLoading: boolean;
  fetchAdditionalData: () => Promise<void>;
}

const DEFAULT_ORDER_METRICS: OrderMetrics = {
  pending: 0,
  processing: 0,
  completed: 0,
  cancelled: 0,
  trend: 0,
  dayRevenue: 0,
  monthRevenue: 0,
  averageOrderValue: 0,
};

const DEFAULT_LINKME_METRICS: LinkmeMetrics = {
  revenue: 0,
  commissions: 0,
  ordersCount: 0,
  activeAffiliates: 0,
  trend: 0,
  averageMargin: 0,
  conversionRate: 0,
};

const DEFAULT_STOCK_METRICS: StockMetrics = {
  inStock: 0,
  outOfStock: 0,
  lowStock: 0,
  critical: 0,
};

export function useDashboardAdditionalData(): AdditionalDataResult {
  const [orderMetrics, setOrderMetrics] = useState<OrderMetrics>(
    DEFAULT_ORDER_METRICS
  );
  const [linkmeMetrics, setLinkmeMetrics] = useState<LinkmeMetrics>(
    DEFAULT_LINKME_METRICS
  );
  const [stockMetrics, setStockMetrics] = useState<StockMetrics>(
    DEFAULT_STOCK_METRICS
  );
  const [salesOrdersCount, setSalesOrdersCount] = useState<number>(0);
  const [stockAlertsFromRPC, setStockAlertsFromRPC] = useState<number>(0);
  const [dataLoading, setDataLoading] = useState(true);

  const supabase = createClient();

  const fetchAdditionalData = useCallback(async () => {
    try {
      setDataLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setDataLoading(false);
        return;
      }

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

      const [
        { data: stockAlertsCount },
        { data: monthOrders },
        { data: allInvoices },
        { data: products },
        { data: allLinkmeCommissions },
        { data: _pendingPayments },
        { data: affiliates },
        { data: selections },
      ] = await Promise.all([
        supabase.rpc('get_stock_alerts_count'),
        supabase
          .from('sales_orders')
          .select('id, status, total_ht, created_at')
          .gte('created_at', startOfMonth.toISOString()),
        supabase
          .from('financial_documents')
          .select('total_ht, status, created_at')
          .eq('document_type', 'customer_invoice')
          .gte('created_at', startOfPrevMonth.toISOString())
          .neq('status', 'cancelled'),
        supabase
          .from('products')
          .select('id, stock_real, min_stock')
          .is('archived_at', null),
        supabase
          .from('linkme_commissions')
          .select('id, order_amount_ht, affiliate_commission_ttc, created_at'),
        supabase
          .from('linkme_payment_requests')
          .select('total_amount_ttc')
          .in('status', ['pending', 'invoice_received']),
        supabase
          .from('linkme_affiliates')
          .select('id, status')
          .eq('status', 'active'),
        supabase
          .from('linkme_selections')
          .select('id')
          .gte('created_at', startOfMonth.toISOString()),
      ]);

      setStockAlertsFromRPC(stockAlertsCount ?? 0);

      // Filtrage client-side des factures
      const monthInvoices = (allInvoices ?? []).filter(
        i => new Date(i.created_at) >= startOfMonth
      );
      const prevMonthInvoices = (allInvoices ?? []).filter(
        i =>
          new Date(i.created_at) >= startOfPrevMonth &&
          new Date(i.created_at) < startOfMonth
      );
      const todayInvoices = (allInvoices ?? []).filter(
        i => new Date(i.created_at) >= startOfToday
      );

      // Orders Metrics
      const pending =
        monthOrders?.filter(o => ['draft', 'validated'].includes(o.status))
          .length ?? 0;
      const processing =
        monthOrders?.filter(o => o.status === 'partially_shipped').length ?? 0;
      const completed =
        monthOrders?.filter(o => ['shipped', 'delivered'].includes(o.status))
          .length ?? 0;
      const cancelled =
        monthOrders?.filter(o => o.status === 'cancelled').length ?? 0;

      const monthRevenue = monthInvoices.reduce(
        (sum, i) => sum + parseFloat(String(i.total_ht ?? 0)),
        0
      );
      const prevMonthRevenue = prevMonthInvoices.reduce(
        (sum, i) => sum + parseFloat(String(i.total_ht ?? 0)),
        0
      );
      const dayRevenue = todayInvoices.reduce(
        (sum, i) => sum + parseFloat(String(i.total_ht ?? 0)),
        0
      );

      const validMonthOrders = (monthOrders ?? []).filter(
        o => o.status !== 'cancelled'
      );
      const totalOrdersRevenue = validMonthOrders.reduce(
        (sum, o) => sum + parseFloat(String(o.total_ht ?? 0)),
        0
      );
      const averageOrderValue =
        validMonthOrders.length > 0
          ? totalOrdersRevenue / validMonthOrders.length
          : 0;

      let orderTrend = 0;
      if (prevMonthRevenue > 0) {
        orderTrend =
          ((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100;
      } else if (monthRevenue > 0) {
        orderTrend = 100;
      }

      setSalesOrdersCount(monthOrders?.length ?? 0);
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

      // Stock Metrics
      let inStock = 0;
      let outOfStock = 0;
      let lowStock = 0;
      let critical = 0;

      (products ?? []).forEach(p => {
        const stockQty = p.stock_real ?? 0;
        const threshold = p.min_stock ?? 5;
        if (stockQty === 0) outOfStock++;
        else if (stockQty <= 2) critical++;
        else if (stockQty <= threshold) lowStock++;
        else inStock++;
      });

      setStockMetrics({ inStock, outOfStock, lowStock, critical });

      // LinkMe Metrics
      const linkmeCommissions = (allLinkmeCommissions ?? []).reduce(
        (sum, c) => sum + parseFloat(String(c.affiliate_commission_ttc ?? 0)),
        0
      );
      const linkmeRevenue = (allLinkmeCommissions ?? []).reduce(
        (sum, c) => sum + parseFloat(String(c.order_amount_ht ?? 0)),
        0
      );
      const avgMargin =
        linkmeRevenue > 0 ? (linkmeCommissions / linkmeRevenue) * 100 : 0;
      const selectionsCount = selections?.length ?? 0;
      const commissionsCount = (allLinkmeCommissions ?? []).length;
      const conversionRate =
        selectionsCount > 0 ? (commissionsCount / selectionsCount) * 100 : 0;

      setLinkmeMetrics({
        revenue: linkmeRevenue,
        commissions: linkmeCommissions,
        ordersCount: commissionsCount,
        activeAffiliates: affiliates?.length ?? 0,
        trend: 0,
        averageMargin: Math.round(avgMargin * 10) / 10,
        conversionRate: Math.round(conversionRate * 10) / 10,
      });
    } catch (err) {
      console.error('Error fetching additional dashboard data:', err);
    } finally {
      setDataLoading(false);
    }
  }, [supabase]);

  return {
    orderMetrics,
    linkmeMetrics,
    stockMetrics,
    salesOrdersCount,
    stockAlertsFromRPC,
    dataLoading,
    fetchAdditionalData,
  };
}
