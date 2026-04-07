import { useEffect, useState } from 'react';

import type { SalesAdvancedFilters } from '../../../types/advanced-filters';
import type {
  SalesOrder,
  SalesOrderStatus,
} from '../../../hooks/use-sales-orders';

interface UseSalesOrdersPaginationParams {
  filteredOrders: SalesOrder[];
  enablePagination: boolean;
  defaultItemsPerPage: 10 | 20;
  // For reset trigger
  activeTab: SalesOrderStatus | 'all';
  advancedFilters: SalesAdvancedFilters;
  searchTerm: string;
  customFilter?: (order: SalesOrder) => boolean;
}

export function useSalesOrdersPagination({
  filteredOrders,
  enablePagination,
  defaultItemsPerPage,
  activeTab,
  advancedFilters,
  searchTerm,
  customFilter,
}: UseSalesOrdersPaginationParams) {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<10 | 20>(
    defaultItemsPerPage
  );

  // Reset page quand les filtres changent
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, advancedFilters, searchTerm, customFilter]);

  const totalPages = enablePagination
    ? Math.ceil(filteredOrders.length / itemsPerPage)
    : 1;

  const paginatedOrders = enablePagination
    ? filteredOrders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      )
    : filteredOrders;

  return {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    paginatedOrders,
  };
}
