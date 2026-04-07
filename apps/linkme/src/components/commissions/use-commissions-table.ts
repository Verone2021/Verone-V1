'use client';

import { useState, useMemo } from 'react';

import { FileText } from 'lucide-react';

import type { CommissionItem, CommissionStatus } from '../../types/analytics';
import type {
  SortField,
  SortDirection,
  TabDef,
} from './commissions-table.types';
import { ITEMS_PER_PAGE } from './commissions-table.types';
import { isPayableStatus } from './commissions-table.sub-components';

export function useCommissionsTable(
  commissions: CommissionItem[],
  paymentRequestsCount: number
) {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleTabChange = (index: number): void => {
    setSelectedTab(index);
    setCurrentPage(1);
    setExpandedId(null);
    setSortField(null);
    setSortDirection('desc');
  };

  const handleSort = (field: SortField): void => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const applySorting = (items: CommissionItem[]): CommissionItem[] => {
    if (!sortField) return items;
    const sorted = [...items];
    sorted.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') {
        cmp = a.orderDate.localeCompare(b.orderDate);
      } else if (sortField === 'order') {
        cmp = a.orderNumber.localeCompare(b.orderNumber, undefined, {
          numeric: true,
        });
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
    return sorted;
  };

  const filterByStatus = (
    status: CommissionStatus | 'all'
  ): CommissionItem[] => {
    if (status === 'all') return commissions;
    if (status === 'validated') {
      return commissions.filter(c => isPayableStatus(c.status));
    }
    return commissions.filter(c => c.status === status);
  };

  const tabs: TabDef[] = [
    { label: 'Toutes', status: 'all' },
    { label: 'Payables', status: 'validated' },
    { label: 'En attente', status: 'pending' },
    { label: 'Payees', status: 'paid' },
    { label: 'Mes Demandes', status: 'requests', icon: FileText },
  ];

  const counts = useMemo(
    () => ({
      all: commissions.length,
      pending: commissions.filter(c => c.status === 'pending').length,
      validated: commissions.filter(c => isPayableStatus(c.status)).length,
      paid: commissions.filter(c => c.status === 'paid').length,
      requests: paymentRequestsCount,
    }),
    [commissions, paymentRequestsCount]
  );

  const payableCommissions = useMemo(
    () => commissions.filter(c => isPayableStatus(c.status)),
    [commissions]
  );

  const selectedTotal = useMemo(
    () =>
      commissions
        .filter(c => selectedIds.has(c.id))
        .reduce((sum, c) => sum + c.totalPayoutTTC, 0),
    [commissions, selectedIds]
  );

  const handleSelect = (id: string, selected: boolean): void => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (selected) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleSelectAll = (checked: boolean): void => {
    if (checked) setSelectedIds(new Set(payableCommissions.map(c => c.id)));
    else setSelectedIds(new Set());
  };

  const allPayableSelected =
    payableCommissions.length > 0 &&
    payableCommissions.every(c => selectedIds.has(c.id));

  const showCheckbox = payableCommissions.length > 0;
  const isRequestsTab = tabs[selectedTab]?.status === 'requests';

  const clearSelection = (): void => setSelectedIds(new Set<string>());

  const getPaginatedData = (status: CommissionStatus | 'all') => {
    const filtered = applySorting(filterByStatus(status));
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginatedItems = filtered.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
    return { filtered, totalPages, paginatedItems };
  };

  return {
    selectedTab,
    selectedIds,
    currentPage,
    setCurrentPage,
    expandedId,
    setExpandedId,
    sortField,
    sortDirection,
    handleTabChange,
    handleSort,
    tabs,
    counts,
    payableCommissions,
    selectedTotal,
    handleSelect,
    handleSelectAll,
    allPayableSelected,
    showCheckbox,
    isRequestsTab,
    getPaginatedData,
    clearSelection,
  };
}
