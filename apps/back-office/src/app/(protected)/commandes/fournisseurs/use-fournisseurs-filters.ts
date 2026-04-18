'use client';

import { useMemo } from 'react';

import type { PurchaseOrder, PurchaseOrderStatus } from '@verone/orders';
import type { PurchaseAdvancedFilters } from '@verone/orders';
import { getOrganisationDisplayName } from '@verone/utils/utils/organisation-helpers';

import type { SortColumn, SortDirection, PurchaseOrderExtended } from './types';

interface UseFournisseursFiltersParams {
  orders: PurchaseOrder[];
  activeTab: PurchaseOrderStatus | 'all';
  searchTerm: string;
  advancedFilters: PurchaseAdvancedFilters;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  currentYear: number;
}

export function useFournisseursFilters({
  orders,
  activeTab,
  searchTerm,
  advancedFilters,
  sortColumn,
  sortDirection,
  currentYear,
}: UseFournisseursFiltersParams) {
  const tabCounts = useMemo(() => {
    return {
      all: orders.length,
      draft: orders.filter(o => o.status === 'draft').length,
      validated: orders.filter(o => o.status === 'validated').length,
      partially_received: orders.filter(o => o.status === 'partially_received')
        .length,
      received: orders.filter(o => o.status === 'received').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const filtered = orders.filter(order => {
      if (activeTab !== 'all' && order.status !== activeTab) return false;

      const matchesSearch =
        searchTerm === '' ||
        order.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.organisations
          ? getOrganisationDisplayName(order.organisations)
          : ''
        )
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      if (
        advancedFilters.statuses.length > 0 &&
        !advancedFilters.statuses.includes(order.status)
      )
        return false;

      if (
        advancedFilters.supplierId &&
        order.supplier_id !== advancedFilters.supplierId
      )
        return false;

      const orderDateRef = order.order_date ?? order.created_at;
      if (advancedFilters.filterYear !== null) {
        const orderDate = new Date(orderDateRef);
        if (orderDate.getFullYear() !== advancedFilters.filterYear)
          return false;
      }

      const periodActive =
        advancedFilters.filterYear === null ||
        advancedFilters.filterYear === currentYear;

      if (periodActive && advancedFilters.period !== 'all') {
        const orderDate = new Date(orderDateRef);
        const now = new Date();
        switch (advancedFilters.period) {
          case 'month':
            if (
              orderDate.getMonth() !== now.getMonth() ||
              orderDate.getFullYear() !== now.getFullYear()
            )
              return false;
            break;
          case 'quarter': {
            const currentQuarter = Math.floor(now.getMonth() / 3);
            const orderQuarter = Math.floor(orderDate.getMonth() / 3);
            if (
              orderQuarter !== currentQuarter ||
              orderDate.getFullYear() !== now.getFullYear()
            )
              return false;
            break;
          }
          case 'year':
            if (orderDate.getFullYear() !== now.getFullYear()) return false;
            break;
        }
      }

      if (
        advancedFilters.amountMin !== null &&
        (order.total_ht ?? 0) < advancedFilters.amountMin
      )
        return false;
      if (
        advancedFilters.amountMax !== null &&
        (order.total_ht ?? 0) > advancedFilters.amountMax
      )
        return false;

      if (advancedFilters.matching !== 'all') {
        const extended = order as PurchaseOrderExtended;
        const isMatched = extended.is_matched === true;
        if (advancedFilters.matching === 'matched' && !isMatched) return false;
        if (advancedFilters.matching === 'unmatched' && isMatched) return false;
      }

      return true;
    });

    if (sortColumn) {
      filtered.sort((a, b) => {
        let comparison = 0;
        switch (sortColumn) {
          case 'date':
            comparison =
              new Date(a.order_date ?? a.created_at).getTime() -
              new Date(b.order_date ?? b.created_at).getTime();
            break;
          case 'po_number':
            comparison = (a.po_number || '').localeCompare(b.po_number || '');
            break;
          case 'amount':
            comparison = (a.total_ttc ?? 0) - (b.total_ttc ?? 0);
            break;
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [
    orders,
    activeTab,
    searchTerm,
    advancedFilters,
    sortColumn,
    sortDirection,
    currentYear,
  ]);

  const filteredStats = useMemo(() => {
    const stats = filteredOrders.reduce(
      (acc, order) => {
        acc.total_orders++;
        acc.total_ht += order.total_ht ?? 0;
        acc.eco_tax_total += order.eco_tax_total ?? 0;
        acc.total_ttc += order.total_ttc ?? 0;
        if (
          ['draft', 'validated', 'validated', 'partially_received'].includes(
            order.status
          )
        ) {
          acc.pending_orders++;
        }
        if (order.status === 'received') acc.received_orders++;
        if (order.status === 'cancelled') acc.cancelled_orders++;
        return acc;
      },
      {
        total_orders: 0,
        total_ht: 0,
        eco_tax_total: 0,
        total_ttc: 0,
        total_tva: 0,
        pending_orders: 0,
        received_orders: 0,
        cancelled_orders: 0,
      }
    );
    stats.total_tva = stats.total_ttc - stats.total_ht;
    return stats;
  }, [filteredOrders]);

  return { tabCounts, filteredOrders, filteredStats };
}
