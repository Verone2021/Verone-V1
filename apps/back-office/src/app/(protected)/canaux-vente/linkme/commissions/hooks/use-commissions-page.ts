'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useToast } from '@verone/common';
import { useActiveEnseignes } from '@verone/organisations';
import { createClient } from '@verone/utils/supabase/client';

import { TABS_CONFIG } from '../constants';
import type {
  Affiliate,
  Commission,
  CommissionsPageState,
  SortColumn,
  SortDirection,
  TabType,
} from '../types';
import { buildCommissionsCsv, downloadCsv } from '../utils/export-csv';

export type { CommissionsPageState };

export function useCommissionsPage(): CommissionsPageState {
  const { toast } = useToast();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [affiliateFilter, setAffiliateFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<number | null>(null);
  const [enseigneFilter, setEnseigneFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('payables');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { enseignes } = useActiveEnseignes();

  const fetchData = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);

    try {
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('linkme_commissions')
        .select(
          `
          *,
          affiliate:linkme_affiliates(display_name, enseigne_id, organisation_id),
          sales_order:sales_orders(order_number, payment_status_v2, customer_type, total_ht, total_ttc, created_at, customer:organisations(trade_name, legal_name))
        `
        )
        .order('created_at', { ascending: false })
        .returns<Commission[]>();

      if (commissionsError) throw commissionsError;

      const { data: affiliatesData, error: affiliatesError } = await supabase
        .from('linkme_affiliates')
        .select('id, display_name, enseigne_id, organisation_id')
        .returns<Affiliate[]>();

      if (affiliatesError) throw affiliatesError;

      setCommissions(commissionsData ?? []);
      setAffiliates(affiliatesData ?? []);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[CommissionsPage] Error fetching commissions:', message);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les commissions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void fetchData().catch(error => {
      console.error('[CommissionsPage] fetchData failed:', error);
    });
  }, [fetchData]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    commissions.forEach(c => {
      const dateRef = c.sales_order?.created_at ?? c.created_at;
      if (dateRef) years.add(new Date(dateRef).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [commissions]);

  const hasActiveFilters =
    searchTerm !== '' ||
    filterYear !== null ||
    typeFilter !== 'all' ||
    enseigneFilter !== 'all' ||
    affiliateFilter !== 'all';

  function resetFilters() {
    setSearchTerm('');
    setFilterYear(null);
    setTypeFilter('all');
    setEnseigneFilter('all');
    setAffiliateFilter('all');
    setCurrentPage(0);
  }

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  function getCommissionsByTab(tab: TabType): Commission[] {
    return commissions.filter(c => {
      const commissionStatus = c.status ?? 'pending';

      switch (tab) {
        case 'en_attente':
          return commissionStatus === 'pending';
        case 'payables':
          return commissionStatus === 'validated';
        case 'en_cours':
          return commissionStatus === 'requested';
        case 'payees':
          return commissionStatus === 'paid';
        default:
          return false;
      }
    });
  }

  function applyFilters(list: Commission[]): Commission[] {
    const filtered = list.filter(c => {
      const orderNum =
        c.sales_order?.order_number ?? c.order_number ?? c.order_id ?? '';
      const matchesSearch = orderNum
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesAffiliate =
        affiliateFilter === 'all' || c.affiliate_id === affiliateFilter;

      let matchesType = true;
      if (typeFilter !== 'all') {
        const isEnseigne = !!c.affiliate?.enseigne_id;
        matchesType =
          (typeFilter === 'enseigne' && isEnseigne) ||
          (typeFilter === 'organisation' && !isEnseigne);
      }

      if (filterYear !== null) {
        const dateRef = c.sales_order?.created_at ?? c.created_at;
        if (!dateRef || new Date(dateRef).getFullYear() !== filterYear)
          return false;
      }

      if (enseigneFilter !== 'all') {
        if (c.affiliate?.enseigne_id !== enseigneFilter) return false;
      }

      return matchesSearch && matchesAffiliate && matchesType;
    });

    if (sortColumn) {
      filtered.sort((a, b) => {
        let comparison = 0;

        switch (sortColumn) {
          case 'date': {
            const dateA = a.sales_order?.created_at ?? a.created_at ?? '';
            const dateB = b.sales_order?.created_at ?? b.created_at ?? '';
            comparison = new Date(dateA).getTime() - new Date(dateB).getTime();
            break;
          }
          case 'order_number': {
            const numA = a.sales_order?.order_number ?? a.order_number ?? '';
            const numB = b.sales_order?.order_number ?? b.order_number ?? '';
            comparison = numA.localeCompare(numB);
            break;
          }
        }

        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }

  function openPaymentModal() {
    if (selectedIds.length === 0) {
      toast({
        title: 'Aucune sélection',
        description: 'Veuillez sélectionner au moins une commission',
        variant: 'destructive',
      });
      return;
    }
    setIsPaymentModalOpen(true);
  }

  function handlePaymentSuccess() {
    toast({
      title: 'Demande créée',
      description: `Demande de paiement créée avec succès`,
    });
    setSelectedIds([]);
    void fetchData().catch(error => {
      console.error('[CommissionsPage] fetchData after create failed:', error);
    });
  }

  async function handleMarkPaid(ids: string[]) {
    const supabase = createClient();
    setProcessing(true);

    try {
      const { error } = await supabase
        .from('linkme_commissions')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .in('id', ids);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: `${ids.length} commission(s) marquée(s) comme payée(s)`,
      });

      setSelectedIds([]);
      void fetchData().catch(error => {
        console.error(
          '[CommissionsPage] fetchData after mark paid failed:',
          error
        );
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[CommissionsPage] Error marking paid:', message);
      toast({
        title: 'Erreur',
        description: 'Impossible de marquer comme payé',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  }

  const filteredByTab = useMemo(() => {
    const result = {} as Record<TabType, Commission[]>;
    for (const tab of Object.keys(TABS_CONFIG) as TabType[]) {
      result[tab] = applyFilters(getCommissionsByTab(tab));
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    commissions,
    searchTerm,
    affiliateFilter,
    typeFilter,
    filterYear,
    enseigneFilter,
    sortColumn,
    sortDirection,
  ]);

  function exportToCSV() {
    const filtered = filteredByTab[activeTab];
    if (filtered.length === 0) {
      toast({
        title: 'Aucune donnée',
        description: 'Aucune commission à exporter',
        variant: 'destructive',
      });
      return;
    }

    const csv = buildCommissionsCsv(filtered);
    downloadCsv(csv, activeTab, filtered.length);

    toast({
      title: 'Export réussi',
      description: `${filtered.length} commission(s) exportée(s)`,
    });
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }

  function toggleSelectAll(list: Commission[]) {
    if (selectedIds.length === list.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(list.map(c => c.id));
    }
  }

  const tabCounts = useMemo(() => {
    const result = {} as Record<TabType, { count: number; total: number }>;
    for (const tab of Object.keys(TABS_CONFIG) as TabType[]) {
      const list = filteredByTab[tab];
      result[tab] = {
        count: list.length,
        total: list.reduce(
          (sum, c) =>
            sum + (c.total_payout_ttc ?? c.affiliate_commission_ttc ?? 0),
          0
        ),
      };
    }
    return result;
  }, [filteredByTab]);

  return {
    commissions,
    affiliates,
    loading,
    processing,
    searchTerm,
    setSearchTerm,
    affiliateFilter,
    setAffiliateFilter,
    typeFilter,
    setTypeFilter,
    filterYear,
    setFilterYear,
    enseigneFilter,
    setEnseigneFilter,
    availableYears,
    hasActiveFilters,
    resetFilters,
    enseignes,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    activeTab,
    setActiveTab,
    pageSize,
    setPageSize,
    currentPage,
    setCurrentPage,
    sortColumn,
    sortDirection,
    handleSort,
    expandedId,
    setExpandedId,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    openPaymentModal,
    handlePaymentSuccess,
    handleMarkPaid,
    exportToCSV,
    filteredByTab,
    tabCounts,
  };
}
