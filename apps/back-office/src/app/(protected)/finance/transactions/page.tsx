'use client';

import { useState, useMemo, useEffect } from 'react';

import Link from 'next/link';

import type { TransactionForUpload } from '@verone/finance/components';
import { useMatchingRules, type MatchingRule } from '@verone/finance/hooks';
import {
  useAutoClassification,
  useUnifiedTransactions,
  useTransactionActions,
  type UnifiedTransaction,
} from '@verone/finance/hooks';
import { Card, CardContent, Button } from '@verone/ui';
import { SyncButton } from '@verone/ui-business';
import { createClient } from '@verone/utils/supabase/client';
import { AlertCircle, Settings, Zap } from 'lucide-react';
import { toast } from 'sonner';

import { TransactionDetailPanel } from './_components/TransactionDetailPanel';
import { TransactionFilters } from './_components/TransactionFilters';
import { TransactionList } from './_components/TransactionList';
import { TransactionModals } from './_components/TransactionModals';
import {
  getMonthKey,
  formatMonthLabel,
  type SyncApiResponse,
  type StatusFilter,
  type SideFilter,
} from './_components/transaction-helpers';

function TransactionsPageV2() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sideFilter, setSideFilter] = useState<SideFilter>('all');
  const [selectedTransaction, setSelectedTransaction] =
    useState<UnifiedTransaction | null>(null);
  const [search, setSearch] = useState('');

  // Filtre année (par défaut année courante)
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 2021 },
    (_, i) => currentYear - i
  );
  const [yearFilter, setYearFilter] = useState<number | null>(currentYear);

  // Modals state
  const [showRapprochementModal, setShowRapprochementModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showClassificationModal, setShowClassificationModal] = useState(false);
  const [showOrganisationModal, setShowOrganisationModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<MatchingRule | null>(null);

  // Transaction pour upload (séparée de selectedTransaction)
  const [uploadTransaction, setUploadTransaction] =
    useState<UnifiedTransaction | null>(null);

  // Auto-categorization state
  const [isAutoCategorizing, setIsAutoCategorizing] = useState(false);

  // Hook pour les règles
  const {
    rules,
    update: updateRule,
    refetch: refetchRules,
    previewApply,
    confirmApply,
  } = useMatchingRules();

  // Unified hook with pagination
  const {
    transactions,
    stats,
    isLoading,
    error,
    refresh,
    setFilters,
    totalCount,
    currentPage,
    totalPages,
    pageSize,
    setPageSize,
    nextPage,
    prevPage,
  } = useUnifiedTransactions({
    filters: {
      status: statusFilter === 'all' ? 'all' : statusFilter,
      side: sideFilter === 'all' ? 'all' : sideFilter,
      search: search ?? undefined,
      year: yearFilter,
    },
    pageSize: 20,
  });

  // Synchroniser selectedTransaction quand les données sont rafraîchies
  useEffect(() => {
    if (selectedTransaction) {
      const updated = transactions.find(tx => tx.id === selectedTransaction.id);
      if (updated) {
        setSelectedTransaction(updated);
      }
    }
  }, [transactions]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-classification
  const { transactionsWithSuggestions } = useAutoClassification(
    transactions as (UnifiedTransaction & Record<string, unknown>)[]
  );

  const suggestionsMap = useMemo(() => {
    const map = new Map<
      string,
      (typeof transactionsWithSuggestions)[0]['suggestion']
    >();
    transactionsWithSuggestions.forEach(({ original, suggestion }) => {
      const tx = original as UnifiedTransaction;
      map.set(tx.id, suggestion);
    });
    return map;
  }, [transactionsWithSuggestions]);

  // Actions
  const {
    ignore: _ignore,
    unignore: _unignore,
    toggleIgnore,
    classify: _classify,
    linkOrganisation: _linkOrganisation,
    markCCA: _markCCA,
  } = useTransactionActions();

  const handleStatusChange = (tab: StatusFilter) => {
    setStatusFilter(tab);
    setSelectedTransaction(null);
    setFilters({
      status: tab === 'all' ? 'all' : tab,
      side: sideFilter === 'all' ? 'all' : sideFilter,
      search: search ?? undefined,
      year: yearFilter,
    });
  };

  const handleSideChange = (side: SideFilter) => {
    setSideFilter(side);
    setSelectedTransaction(null);
    setFilters({
      status: statusFilter === 'all' ? 'all' : statusFilter,
      side: side === 'all' ? 'all' : side,
      search: search ?? undefined,
      year: yearFilter,
    });
  };

  const handleYearChange = (year: number | null) => {
    setYearFilter(year);
    setSelectedTransaction(null);
    setFilters({
      status: statusFilter === 'all' ? 'all' : statusFilter,
      side: sideFilter === 'all' ? 'all' : sideFilter,
      search: search ?? undefined,
      year,
    });
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setFilters({
      status: statusFilter === 'all' ? 'all' : statusFilter,
      side: sideFilter === 'all' ? 'all' : sideFilter,
      search: value ?? undefined,
      year: yearFilter,
    });
  };

  const handleSync = async () => {
    try {
      const response = await fetch('/api/qonto/sync', { method: 'POST' });
      const result = (await response.json()) as SyncApiResponse;
      if (result.success) {
        toast.success('Synchronisation terminee', {
          description: `${result.itemsCreated ?? 0} nouvelles, ${result.itemsUpdated ?? 0} mises a jour`,
        });
      }
      await refresh();
    } catch (err) {
      console.error('[Qonto Sync] Error:', err);
      toast.error('Erreur de synchronisation');
      await refresh();
    }
  };

  const handleAutoCategorizeCredits = async () => {
    setIsAutoCategorizing(true);
    try {
      const supabase = createClient();
      const { data: txs, error: fetchError } = await supabase
        .from('bank_transactions')
        .select('id')
        .eq('side', 'credit')
        .is('category_pcg', null);

      if (fetchError) throw fetchError;
      const eligibleIds = txs?.map(t => t.id) ?? [];

      if (eligibleIds.length === 0) {
        toast.info('Aucune transaction à catégoriser');
        setIsAutoCategorizing(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('bank_transactions')
        .update({ category_pcg: '707' })
        .in('id', eligibleIds);

      if (updateError) throw updateError;
      toast.success(`${eligibleIds.length} transactions catégorisées en 707`);
      void refresh().catch(err => {
        console.error('[Transactions] Refresh failed:', err);
      });
    } catch (err) {
      toast.error('Erreur lors de la catégorisation');
      console.error('[AutoCategorize] Error:', err);
    } finally {
      setIsAutoCategorizing(false);
    }
  };

  const handleToggleIgnore = async (shouldIgnore: boolean) => {
    if (!selectedTransaction) return;
    const result = await toggleIgnore(selectedTransaction.id, shouldIgnore);
    if (result.success) {
      toast.success(
        shouldIgnore ? 'Transaction ignorée' : 'Transaction restaurée'
      );
      await refresh();
      setSelectedTransaction(null);
    } else {
      if (result.isLocked) {
        toast.warning('Année clôturée', {
          description: 'Cette transaction ne peut pas être modifiée.',
        });
      } else {
        toast.error(result.error ?? 'Erreur');
      }
    }
  };

  const handleViewRule = () => {
    if (!selectedTransaction?.applied_rule_id) return;
    const rule = rules.find(r => r.id === selectedTransaction.applied_rule_id);
    if (rule) {
      setEditingRule(rule);
      setShowRuleModal(true);
    } else {
      toast.error('Règle non trouvée');
    }
  };

  const isLockedByRule = Boolean(selectedTransaction?.applied_rule_id);

  const transactionForUpload: TransactionForUpload | null = useMemo(() => {
    const tx = uploadTransaction ?? selectedTransaction;
    if (!tx) return null;
    return {
      id: tx.id,
      transaction_id: tx.transaction_id,
      label: tx.label ?? '',
      counterparty_name: tx.counterparty_name,
      amount: tx.amount,
      currency: 'EUR',
      emitted_at: tx.emitted_at ?? '',
      has_attachment: tx.has_attachment,
      matched_document_id: tx.matched_document_id,
      order_number: null,
    };
  }, [uploadTransaction, selectedTransaction]);

  const progressPercent = stats
    ? (Math.round(
        ((stats.total_count - stats.to_process_count) / stats.total_count) * 100
      ) ?? 0)
    : 0;

  // Trésorerie actuelle : solde réel depuis Qonto API
  const [totalBalance, setTotalBalance] = useState(0);
  useEffect(() => {
    async function fetchQontoBalance() {
      try {
        const res = await fetch('/api/qonto/balance');
        if (!res.ok) return;
        const data = (await res.json()) as { totalBalance?: number };
        setTotalBalance(data.totalBalance ?? 0);
      } catch {
        // Silencieux — le solde reste à 0
      }
    }
    void fetchQontoBalance();
  }, []);

  const groupedByMonth = useMemo(() => {
    const groups: {
      month: string;
      label: string;
      txs: UnifiedTransaction[];
    }[] = [];
    const monthMap = new Map<string, UnifiedTransaction[]>();

    for (const tx of transactions) {
      const key = getMonthKey(tx.settled_at ?? tx.emitted_at);
      const existing = monthMap.get(key);
      if (existing) {
        existing.push(tx);
      } else {
        monthMap.set(key, [tx]);
      }
    }

    const sortedKeys = Array.from(monthMap.keys()).sort((a, b) =>
      b.localeCompare(a)
    );
    for (const key of sortedKeys) {
      groups.push({
        month: key,
        label: formatMonthLabel(key),
        txs: monthMap.get(key) ?? [],
      });
    }
    return groups;
  }, [transactions]);

  // Unused handlers kept for backward compat
  void handleToggleIgnore;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Transactions</h1>
          <p className="text-muted-foreground">
            {totalCount} transaction{totalCount !== 1 ? 's' : ''} —{' '}
            {progressPercent}% traitees
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void handleAutoCategorizeCredits().catch(err => {
                console.error('[Transactions] Auto categorize failed:', err);
              });
            }}
            disabled={isAutoCategorizing}
            title="Categoriser toutes les entrees non classees en 707 (Ventes)"
          >
            <Zap className="h-4 w-4 mr-2" />
            {isAutoCategorizing ? 'En cours...' : 'Entrees → 707'}
          </Button>
          <Link href="/finance/depenses/regles">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Regles
            </Button>
          </Link>
          <SyncButton onSync={handleSync} label="Sync Qonto" showLastSync />
        </div>
      </div>

      {/* Alerte transactions sans categorie */}
      {stats && stats.to_process_count > 0 && (
        <div className="flex items-center justify-between px-5 py-4 bg-rose-50 border border-rose-200 rounded-xl">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-rose-500" />
            <div>
              <p className="font-medium text-rose-900">
                Transactions sans categorie
              </p>
              <p className="text-sm text-rose-700">
                Vous avez <strong>{stats.to_process_count}</strong> transaction
                {stats.to_process_count > 1 ? 's' : ''} non categorisee
                {stats.to_process_count > 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="bg-rose-600 hover:bg-rose-700 text-white"
            onClick={() => handleStatusChange('to_process')}
          >
            Categoriser
          </Button>
        </div>
      )}

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <p>{error.message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Solde + Recherche + Filtres */}
      <TransactionFilters
        totalBalance={totalBalance}
        search={search}
        statusFilter={statusFilter}
        sideFilter={sideFilter}
        yearFilter={yearFilter}
        years={years}
        onSearch={handleSearch}
        onStatusChange={handleStatusChange}
        onSideChange={handleSideChange}
        onYearChange={handleYearChange}
      />

      {/* Liste transactions */}
      <TransactionList
        isLoading={isLoading}
        transactions={transactions}
        groupedByMonth={groupedByMonth}
        selectedTransactionId={selectedTransaction?.id ?? null}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
        setPageSize={setPageSize}
        nextPage={nextPage}
        prevPage={prevPage}
        onSelectTransaction={setSelectedTransaction}
        onOpenClassificationModal={tx => {
          setSelectedTransaction(tx);
          setShowClassificationModal(true);
        }}
      />

      {/* Panneau latéral détail transaction */}
      <TransactionDetailPanel
        selectedTransaction={selectedTransaction}
        isLockedByRule={isLockedByRule}
        suggestionsMap={suggestionsMap}
        onClose={() => setSelectedTransaction(null)}
        onRefresh={refresh}
        onOpenClassificationModal={() => setShowClassificationModal(true)}
        onOpenOrganisationModal={() => setShowOrganisationModal(true)}
        onOpenRapprochementModal={() => setShowRapprochementModal(true)}
        onOpenUploadModal={tx => {
          setUploadTransaction(tx);
          setShowUploadModal(true);
        }}
        onViewRule={handleViewRule}
      />

      {/* Modals */}
      <TransactionModals
        selectedTransaction={selectedTransaction}
        transactionForUpload={transactionForUpload}
        suggestionsMap={suggestionsMap}
        showClassificationModal={showClassificationModal}
        setShowClassificationModal={setShowClassificationModal}
        showOrganisationModal={showOrganisationModal}
        setShowOrganisationModal={setShowOrganisationModal}
        showRapprochementModal={showRapprochementModal}
        setShowRapprochementModal={setShowRapprochementModal}
        showUploadModal={showUploadModal}
        setShowUploadModal={setShowUploadModal}
        setUploadTransaction={setUploadTransaction}
        showRuleModal={showRuleModal}
        setShowRuleModal={setShowRuleModal}
        editingRule={editingRule}
        setEditingRule={setEditingRule}
        updateRule={updateRule}
        previewApply={previewApply}
        confirmApply={confirmApply}
        refetchRules={refetchRules}
        onRefresh={refresh}
      />
    </div>
  );
}

export default function TransactionsPage() {
  return <TransactionsPageV2 />;
}
