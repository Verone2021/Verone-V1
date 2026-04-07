import { useMemo } from 'react';

import type { SalesAdvancedFilters } from '../../../types/advanced-filters';
import {
  countActiveFilters,
  DEFAULT_SALES_FILTERS,
} from '../../../types/advanced-filters';
import type {
  SalesOrder,
  SalesOrderStatus,
} from '../../../hooks/use-sales-orders';
import type { SortColumn, SortDirection } from '../sales-orders-constants';

interface UseSalesOrdersFilterParams {
  orders: SalesOrder[];
  activeTab: SalesOrderStatus | 'all';
  advancedFilters: SalesAdvancedFilters;
  searchTerm: string;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  customFilter?: (order: SalesOrder) => boolean;
  currentYear: number;
}

export function useSalesOrdersFilter({
  orders,
  activeTab,
  advancedFilters,
  searchTerm,
  sortColumn,
  sortDirection,
  customFilter,
  currentYear,
}: UseSalesOrdersFilterParams) {
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    orders.forEach(order => {
      const dateRef = order.order_date ?? order.created_at;
      years.add(new Date(dateRef).getFullYear());
    });
    years.add(currentYear);
    return Array.from(years).sort((a, b) => a - b);
  }, [orders, currentYear]);

  const isPeriodEnabled =
    advancedFilters.filterYear === null ||
    advancedFilters.filterYear === currentYear;

  const hasActiveFilters = useMemo(
    () => countActiveFilters(advancedFilters, DEFAULT_SALES_FILTERS) > 0,
    [advancedFilters]
  );

  const filteredOrders = useMemo(() => {
    const normalizeString = (str: string | null | undefined): string => {
      if (!str) return '';
      return str
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    };

    const filtered = orders.filter(order => {
      // Filtre onglet statut (acces direct, prioritaire)
      // pending_approval = status 'pending_approval' OU legacy 'draft' + pending_admin_validation
      if (activeTab !== 'all') {
        if (activeTab === 'pending_approval') {
          if (
            !(
              order.status === 'draft' &&
              order.pending_admin_validation === true
            )
          )
            return false;
        } else if (activeTab === 'draft') {
          if (
            order.status !== 'draft' ||
            order.pending_admin_validation === true
          )
            return false;
        } else if (order.status !== activeTab) {
          return false;
        }
      }

      // Filtre avance: statuts multi-select (si onglet = 'all')
      if (
        activeTab === 'all' &&
        advancedFilters.statuses.length > 0 &&
        !advancedFilters.statuses.includes(order.status)
      ) {
        return false;
      }

      // Filtre avance: type client
      if (advancedFilters.customerType !== 'all') {
        switch (advancedFilters.customerType) {
          case 'individual':
            if (order.customer_type !== 'individual') return false;
            break;
          case 'professional':
            if (order.customer_type !== 'organization') return false;
            break;
          case 'enseigne':
            if (
              order.customer_type !== 'organization' ||
              !order.organisations?.enseigne_id
            )
              return false;
            // Filtre enseigne specifique
            if (
              advancedFilters.enseigneId &&
              order.organisations?.enseigne_id !== advancedFilters.enseigneId
            )
              return false;
            break;
        }
      }

      // Filtre avance: annee specifique (base sur date commande, fallback date creation)
      const orderDateRef = order.order_date ?? order.created_at;
      if (advancedFilters.filterYear !== null) {
        const orderDate = new Date(orderDateRef);
        if (orderDate.getFullYear() !== advancedFilters.filterYear)
          return false;
      }

      // Filtre avance: periode (seulement si annee courante ou toutes)
      const periodActive =
        advancedFilters.filterYear === null ||
        advancedFilters.filterYear === currentYear;

      if (periodActive && advancedFilters.period !== 'all') {
        const orderDate = new Date(orderDateRef);
        const now = new Date();

        switch (advancedFilters.period) {
          case 'month': {
            const monthAgo = new Date(
              now.getFullYear(),
              now.getMonth() - 1,
              now.getDate()
            );
            if (orderDate < monthAgo) return false;
            break;
          }
          case 'quarter': {
            const quarterAgo = new Date(
              now.getFullYear(),
              now.getMonth() - 3,
              now.getDate()
            );
            if (orderDate < quarterAgo) return false;
            break;
          }
          case 'year': {
            const yearAgo = new Date(
              now.getFullYear() - 1,
              now.getMonth(),
              now.getDate()
            );
            if (orderDate < yearAgo) return false;
            break;
          }
        }
      }

      // Filtre avance: montant TTC
      if (
        advancedFilters.amountMin !== null &&
        (order.total_ttc || 0) < advancedFilters.amountMin
      ) {
        return false;
      }
      if (
        advancedFilters.amountMax !== null &&
        (order.total_ttc || 0) > advancedFilters.amountMax
      ) {
        return false;
      }

      // Filtre avance: rapprochement bancaire
      if (advancedFilters.matching !== 'all') {
        if (advancedFilters.matching === 'matched' && !order.is_matched) {
          return false;
        }
        if (advancedFilters.matching === 'unmatched' && order.is_matched) {
          return false;
        }
      }

      // Filtre recherche (acces direct)
      if (searchTerm) {
        const term = normalizeString(searchTerm);
        const matchesOrderNumber = normalizeString(order.order_number).includes(
          term
        );
        const matchesOrgName = normalizeString(
          order.organisations?.trade_name ??
            order.organisations?.legal_name ??
            ''
        ).includes(term);
        const matchesIndividualName =
          normalizeString(order.individual_customers?.first_name).includes(
            term
          ) ||
          normalizeString(order.individual_customers?.last_name).includes(term);

        if (!matchesOrderNumber && !matchesOrgName && !matchesIndividualName) {
          return false;
        }
      }

      // Filtre personnalise
      if (customFilter && !customFilter(order)) {
        return false;
      }

      return true;
    });

    // Tri des commandes
    if (sortColumn) {
      filtered.sort((a, b) => {
        let comparison = 0;

        switch (sortColumn) {
          case 'date':
            comparison =
              new Date(a.order_date ?? a.created_at).getTime() -
              new Date(b.order_date ?? b.created_at).getTime();
            break;
          case 'client': {
            const nameA =
              a.customer_type === 'organization'
                ? (a.organisations?.trade_name ??
                  a.organisations?.legal_name ??
                  '')
                : a.individual_customers
                  ? [
                      a.individual_customers.first_name,
                      a.individual_customers.last_name,
                    ]
                      .filter(Boolean)
                      .join(' ')
                  : '';
            const nameB =
              b.customer_type === 'organization'
                ? (b.organisations?.trade_name ??
                  b.organisations?.legal_name ??
                  '')
                : b.individual_customers
                  ? [
                      b.individual_customers.first_name,
                      b.individual_customers.last_name,
                    ]
                      .filter(Boolean)
                      .join(' ')
                  : '';
            comparison = nameA.localeCompare(nameB);
            break;
          }
          case 'order_number':
            comparison = (a.order_number || '').localeCompare(
              b.order_number || ''
            );
            break;
          case 'amount':
            comparison = (a.total_ttc || 0) - (b.total_ttc || 0);
            break;
        }

        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [
    orders,
    activeTab,
    advancedFilters,
    searchTerm,
    sortColumn,
    sortDirection,
    customFilter,
    currentYear,
  ]);

  return { filteredOrders, availableYears, isPeriodEnabled, hasActiveFilters };
}
