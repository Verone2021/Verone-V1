'use client';

import { useState, useCallback, useEffect } from 'react';

import { useSearchParams } from 'next/navigation';

import { useMonthlyKPIs } from '@verone/orders/hooks/use-monthly-kpis';

import {
  useLinkMeOrders,
  type LinkMeOrder,
} from '../../../hooks/use-linkme-orders';
import { useAffiliateCommissionStats } from '../../../lib/hooks/use-affiliate-commission-stats';
import { usePermissions } from '../../../hooks/use-permissions';
import { ITEMS_PER_PAGE, type TabType } from './commandes.constants';

export function useCommandesPage() {
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [page, setPage] = useState(0);
  const [yearFilter, setYearFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [ownershipTypeFilter, setOwnershipTypeFilter] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<LinkMeOrder | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [pendingDetailId, setPendingDetailId] = useState<string | null>(
    searchParams?.get('detail') ?? null
  );

  const {
    orders,
    totalCount,
    isLoading: ordersLoading,
    error,
    statusCounts,
  } = useLinkMeOrders({
    page,
    pageSize: ITEMS_PER_PAGE,
    yearFilter,
    periodFilter,
    ownershipTypeFilter,
    statusFilter: activeTab,
  });

  const { data: monthlyKPIs, isLoading: kpisLoading } = useMonthlyKPIs({
    enabled: true,
  });

  const { canViewCommissions } = usePermissions();

  const { data: commissionStats, isLoading: commissionStatsLoading } =
    useAffiliateCommissionStats();

  const isLoading =
    ordersLoading ||
    kpisLoading ||
    (canViewCommissions && commissionStatsLoading);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  useEffect(() => {
    if (pendingDetailId && orders.length > 0) {
      const order = orders.find(o => o.id === pendingDetailId);
      if (order) {
        setSelectedOrder(order);
        setIsDetailModalOpen(true);
      }
      setPendingDetailId(null);
    }
  }, [pendingDetailId, orders]);

  const handleTabChange = useCallback((tab: TabType) => {
    setActiveTab(tab);
    setPage(0);
  }, []);

  const handleYearChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      setYearFilter(value);
      if (value === 'all') setPeriodFilter('all');
      setPage(0);
    },
    []
  );

  const handlePeriodChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setPeriodFilter(e.target.value);
      setPage(0);
    },
    []
  );

  const handleOwnershipTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      setOwnershipTypeFilter(e.target.value);
      setPage(0);
    },
    []
  );

  const toggleOrder = (orderId: string) => {
    setExpandedOrderId(prev => (prev === orderId ? null : orderId));
  };

  const openDetailModal = (order: LinkMeOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedOrder(null);
  };

  const getTabCount = (tabId: TabType): number => {
    if (tabId === 'all') return statusCounts['all'] ?? 0;
    if (tabId === 'shipped') return statusCounts['shipped_tab'] ?? 0;
    if (tabId === 'pending_approval')
      return statusCounts['pending_approval_tab'] ?? 0;
    return statusCounts[tabId] ?? 0;
  };

  return {
    activeTab,
    page,
    setPage,
    yearFilter,
    periodFilter,
    ownershipTypeFilter,
    expandedOrderId,
    selectedOrder,
    isDetailModalOpen,
    orders,
    totalCount,
    totalPages,
    isLoading,
    error,
    monthlyKPIs,
    kpisLoading,
    commissionStats,
    commissionStatsLoading,
    canViewCommissions,
    handleTabChange,
    handleYearChange,
    handlePeriodChange,
    handleOwnershipTypeChange,
    toggleOrder,
    openDetailModal,
    closeDetailModal,
    getTabCount,
  };
}
