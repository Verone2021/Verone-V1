import { useMemo } from 'react';

import type { SalesOrder } from '../../../hooks/use-sales-orders';

interface UseSalesOrdersStatsParams {
  orders: SalesOrder[];
  filteredOrders: SalesOrder[];
}

export function useSalesOrdersStats({
  orders,
  filteredOrders,
}: UseSalesOrdersStatsParams) {
  const filteredStats = useMemo(() => {
    if (filteredOrders.length === 0) {
      return {
        total_orders: 0,
        total_ht: 0,
        total_tva: 0,
        total_ttc: 0,
        eco_tax_total: 0,
        average_basket: 0,
        pending_orders: 0,
        shipped_orders: 0,
      };
    }

    const statsData = filteredOrders.reduce(
      (acc, order) => {
        acc.total_orders++;
        acc.total_ht += order.total_ht || 0;
        acc.total_ttc += order.total_ttc || 0;
        acc.eco_tax_total += order.eco_tax_total || 0;

        if (order.status === 'draft' || order.status === 'validated') {
          acc.pending_orders++;
        } else if (
          order.status === 'shipped' ||
          order.status === 'partially_shipped'
        ) {
          acc.shipped_orders++;
        }

        return acc;
      },
      {
        total_orders: 0,
        total_ht: 0,
        total_ttc: 0,
        total_tva: 0,
        eco_tax_total: 0,
        average_basket: 0,
        pending_orders: 0,
        shipped_orders: 0,
      }
    );

    statsData.total_tva = statsData.total_ttc - statsData.total_ht;
    statsData.average_basket =
      statsData.total_orders > 0
        ? statsData.total_ttc / statsData.total_orders
        : 0;

    return statsData;
  }, [filteredOrders]);

  const tabCounts = useMemo(() => {
    return {
      all: orders.length,
      pending_approval: orders.filter(
        o => o.status === 'draft' && o.pending_admin_validation === true
      ).length,
      draft: orders.filter(
        o => o.status === 'draft' && o.pending_admin_validation !== true
      ).length,
      validated: orders.filter(o => o.status === 'validated').length,
      shipped: orders.filter(
        o => o.status === 'shipped' || o.status === 'partially_shipped'
      ).length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };
  }, [orders]);

  return { filteredStats, tabCounts };
}
