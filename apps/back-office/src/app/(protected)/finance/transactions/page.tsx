'use client';

import { useState, useMemo } from 'react';

import Link from 'next/link';

import {
  getPcgCategory,
  getPcgColor,
  detectBankPaymentMethod,
  BANK_PAYMENT_METHODS,
} from '@verone/finance';
import {
  RapprochementModal,
  InvoiceUploadModal,
  QuickClassificationModal,
  OrganisationLinkingModal,
  RuleModal,
  type TransactionForUpload,
} from '@verone/finance/components';
import { useMatchingRules, type MatchingRule } from '@verone/finance/hooks';
import {
  useAutoClassification,
  useUnifiedTransactions,
  useTransactionActions,
  type UnifiedTransaction,
} from '@verone/finance/hooks';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Separator,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@verone/ui';
import { SyncButton } from '@verone/ui-business';
import { createClient } from '@verone/utils/supabase/client';
import {
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  Search,
  Calendar,
  FileText,
  ExternalLink,
  Paperclip,
  Building2,
  Settings,
  Tag,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Lock,
  FileX,
  FileCheck,
  CheckCircle,
  Zap,
  Trash2,
  Filter,
  CreditCard,
  StickyNote,
} from 'lucide-react';
import { toast } from 'sonner';

// =====================================================================
// TYPES
// =====================================================================

interface SyncApiResponse {
  success: boolean;
  itemsCreated?: number;
  itemsUpdated?: number;
}

interface ApiErrorResponse {
  error?: string;
}

// Feature flag removed - v2 is now the only version

// =====================================================================
// HELPERS
// =====================================================================

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Date inconnue';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function getMonthKey(dateStr: string | null): string {
  if (!dateStr) return 'unknown';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(key: string): string {
  if (key === 'unknown') return 'Date inconnue';
  return new Date(`${key}-01`).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });
}

// =====================================================================
// PAGE V2 (FINANCE V2 - Unified)
// =====================================================================

type StatusFilter =
  | 'all'
  | 'to_process'
  | 'classified'
  | 'matched'
  | 'cca'
  | 'ignored';
type SideFilter = 'all' | 'credit' | 'debit';

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

  // Transaction pour upload (séparée de selectedTransaction pour ne pas ouvrir le panneau latéral)
  const [uploadTransaction, setUploadTransaction] =
    useState<UnifiedTransaction | null>(null);

  // Auto-categorization state
  const [isAutoCategorizing, setIsAutoCategorizing] = useState(false);

  // Collapsible technical details in sidebar
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Hook pour les règles (preview/confirm workflow)
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

  // Auto-classification: obtenir les règles de matching associées
  const { transactionsWithSuggestions } = useAutoClassification(
    transactions as (UnifiedTransaction & Record<string, unknown>)[]
  );

  // Map pour accès rapide aux suggestions (avec ruleId)
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
    classify,
    linkOrganisation,
    ignore: _ignore,
    unignore: _unignore,
    toggleIgnore,
    markCCA,
  } = useTransactionActions();

  // Handle tab change
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

  // Handle side filter change
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

  // Handle year filter change
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

  // Handle search
  const handleSearch = (value: string) => {
    setSearch(value);
    setFilters({
      status: statusFilter === 'all' ? 'all' : statusFilter,
      side: sideFilter === 'all' ? 'all' : sideFilter,
      search: value ?? undefined,
      year: yearFilter,
    });
  };

  // Sync handler
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

  // Auto-categorize credit transactions as 707 (Ventes de marchandises)
  // Note: Les transactions spéciales (Romeo, AFFECT BUILDING, etc.) sont déjà catégorisées
  // avec leurs codes PCG appropriés (455, 101, 645, etc.) donc elles ne seront pas touchées
  const handleAutoCategorizeCredits = async () => {
    setIsAutoCategorizing(true);
    try {
      const supabase = createClient();

      // Récupérer les transactions crédit non catégorisées
      // Celles déjà catégorisées (y compris les cas spéciaux) ne sont pas touchées
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

      // Mettre à jour en batch
      const { error: updateError } = await supabase
        .from('bank_transactions')
        .update({ category_pcg: '707' })
        .in('id', eligibleIds);

      if (updateError) throw updateError;

      toast.success(`${eligibleIds.length} transactions catégorisées en 707`);
      void refresh().catch(error => {
        console.error('[Transactions] Refresh failed:', error);
      });
    } catch (err) {
      toast.error('Erreur lors de la catégorisation');
      console.error('[AutoCategorize] Error:', err);
    } finally {
      setIsAutoCategorizing(false);
    }
  };

  // Classification handler
  const _handleClassify = async (categoryPcg: string) => {
    if (!selectedTransaction) return;
    const result = await classify(selectedTransaction.id, categoryPcg);
    if (result.success) {
      toast.success('Transaction classee');
      await refresh();
      setShowClassificationModal(false);
    } else {
      toast.error(result.error ?? 'Erreur');
    }
  };

  // Link organisation handler
  const _handleLinkOrganisation = async (organisationId: string) => {
    if (!selectedTransaction) return;
    const result = await linkOrganisation(
      selectedTransaction.id,
      organisationId
    );
    if (result.success) {
      toast.success('Organisation liee');
      await refresh();
      setShowOrganisationModal(false);
    } else {
      toast.error(result.error ?? 'Erreur');
    }
  };

  // Toggle Ignore handler (supports both ignore and unignore)
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
      // Check for fiscal year lock
      if (result.isLocked) {
        toast.warning('Année clôturée', {
          description: 'Cette transaction ne peut pas être modifiée.',
        });
      } else {
        toast.error(result.error ?? 'Erreur');
      }
    }
  };

  // Legacy ignore handler (for backward compatibility)
  const _handleIgnore = async () => handleToggleIgnore(true);
  const _handleUnignore = async () => handleToggleIgnore(false);

  // Toggle justification optional (remplace "Ignorer")
  const handleToggleJustificationOptional = async (optional: boolean) => {
    if (!selectedTransaction) return;
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('bank_transactions')
        .update({ justification_optional: optional })
        .eq('id', selectedTransaction.id);

      if (error) throw error;
      toast.success(
        optional ? 'Justificatif marqué facultatif' : 'Justificatif requis'
      );
      await refresh();
    } catch (_err) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // CCA handler
  const _handleMarkCCA = async () => {
    if (!selectedTransaction) return;
    const result = await markCCA(selectedTransaction.id);
    if (result.success) {
      toast.success('Marque comme Compte Courant Associe (455)');
      await refresh();
      setSelectedTransaction(null);
    } else {
      toast.error(result.error ?? 'Erreur');
    }
  };

  // SLICE 5: Voir/Modifier la règle qui verrouille cette transaction
  const handleViewRule = () => {
    if (!selectedTransaction?.applied_rule_id) return;

    // Trouver la règle dans la liste
    const rule = rules.find(r => r.id === selectedTransaction.applied_rule_id);
    if (rule) {
      setEditingRule(rule);
      setShowRuleModal(true);
    } else {
      toast.error('Règle non trouvée');
    }
  };

  // Vérifier si la transaction est verrouillée par une règle
  const isLockedByRule = Boolean(selectedTransaction?.applied_rule_id);

  // Convert for upload modal
  // Utilise uploadTransaction (depuis le bouton liste) ou selectedTransaction (depuis le panneau)
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

  // Progress percentage
  const progressPercent = stats
    ? (Math.round(
        ((stats.total_count - stats.to_process_count) / stats.total_count) * 100
      ) ?? 0)
    : 0;

  // Solde total filtré
  const totalBalance = useMemo(() => {
    return transactions.reduce((sum, tx) => {
      const val =
        tx.side === 'credit' ? Math.abs(tx.amount) : -Math.abs(tx.amount);
      return sum + val;
    }, 0);
  }, [transactions]);

  // Grouper les transactions par mois (pour affichage chrono)
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

    // Trier mois décroissant
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
              void handleAutoCategorizeCredits().catch(error => {
                console.error('[Transactions] Auto categorize failed:', error);
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

      {/* Alerte transactions sans categorie (style Indy) */}
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-3xl font-bold">{formatAmount(totalBalance)}</p>
          <p className="text-sm text-muted-foreground">Solde affiche</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              className="pl-9 w-64"
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
          </div>

          {/* Filtre status */}
          <Select
            value={statusFilter}
            onValueChange={v => handleStatusChange(v as StatusFilter)}
          >
            <SelectTrigger className="w-40">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="to_process">A traiter</SelectItem>
              <SelectItem value="classified">Classees</SelectItem>
              <SelectItem value="matched">Rapprochees</SelectItem>
              <SelectItem value="cca">CCA</SelectItem>
              <SelectItem value="ignored">Ignorees</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtre Entrees/Sorties */}
          <Select
            value={sideFilter}
            onValueChange={v => handleSideChange(v as SideFilter)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="debit">Sorties</SelectItem>
              <SelectItem value="credit">Entrees</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtre Annee */}
          <Select
            value={yearFilter?.toString() ?? 'all'}
            onValueChange={v =>
              handleYearChange(v === 'all' ? null : parseInt(v))
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {years.map(year => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Liste chronologique groupee par mois */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-0">
              {[1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  className="h-16 border-b animate-pulse bg-muted/30"
                />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">Aucune transaction trouvee</p>
            </div>
          ) : (
            <div>
              {groupedByMonth.map(group => (
                <div key={group.month}>
                  {/* Separateur mensuel */}
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/40 border-b">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-semibold capitalize">
                      {group.label}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {group.txs.length}
                    </Badge>
                  </div>

                  {/* Transactions du mois */}
                  {group.txs.map(tx => (
                    <div
                      key={tx.id}
                      data-testid={`tx-row-${tx.id}`}
                      onClick={() => setSelectedTransaction(tx)}
                      className={`
                        flex items-center gap-3 px-4 py-3 border-b cursor-pointer transition-colors
                        ${selectedTransaction?.id === tx.id ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-muted/30'}
                        ${tx.unified_status === 'ignored' ? 'opacity-50' : ''}
                      `}
                    >
                      {/* Date empilee */}
                      <div className="w-12 text-center flex-shrink-0">
                        <p className="text-sm font-semibold leading-tight">
                          {new Date(
                            tx.settled_at ?? tx.emitted_at ?? ''
                          ).toLocaleDateString('fr-FR', { day: '2-digit' })}
                        </p>
                        <p className="text-[10px] text-muted-foreground uppercase">
                          {new Date(
                            tx.settled_at ?? tx.emitted_at ?? ''
                          ).toLocaleDateString('fr-FR', { month: 'short' })}
                        </p>
                      </div>

                      {/* Icone justificatif */}
                      <div className="flex-shrink-0">
                        {(tx.attachment_ids?.length ?? 0) > 0 ? (
                          <div className="relative">
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full" />
                          </div>
                        ) : (
                          <Paperclip className="h-4 w-4 text-muted-foreground/30" />
                        )}
                      </div>

                      {/* Nom contrepartie */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-sm">
                          {tx.counterparty_name ?? tx.label ?? 'Sans libelle'}
                        </p>
                        {tx.organisation_name && (
                          <p className="text-xs text-blue-600 truncate">
                            {tx.organisation_name}
                          </p>
                        )}
                      </div>

                      {/* Categorie (badge cliquable) */}
                      <div className="w-44 flex-shrink-0">
                        {tx.category_pcg ? (
                          <Badge
                            variant="secondary"
                            className="text-xs gap-1 max-w-full truncate"
                            style={{
                              backgroundColor: `${getPcgColor(tx.category_pcg)}15`,
                              color: getPcgColor(tx.category_pcg),
                              borderColor: `${getPcgColor(tx.category_pcg)}30`,
                            }}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: getPcgColor(tx.category_pcg),
                              }}
                            />
                            {getPcgCategory(tx.category_pcg)?.label ??
                              tx.category_pcg}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-xs border-orange-300 bg-orange-50 text-orange-700 cursor-pointer hover:bg-orange-100"
                            onClick={e => {
                              e.stopPropagation();
                              setSelectedTransaction(tx);
                              setShowClassificationModal(true);
                            }}
                          >
                            A categoriser
                          </Badge>
                        )}
                      </div>

                      {/* TVA (badge) */}
                      <div className="w-24 flex-shrink-0">
                        {tx.vat_rate != null ? (
                          <Badge variant="secondary" className="text-xs">
                            TVA {tx.vat_rate}%
                          </Badge>
                        ) : tx.vat_breakdown && tx.vat_breakdown.length > 0 ? (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-green-50 text-green-700"
                          >
                            TVA OCR
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            -
                          </span>
                        )}
                      </div>

                      {/* Montant */}
                      <div className="w-28 text-right flex-shrink-0">
                        <span
                          className={`font-semibold ${tx.side === 'credit' ? 'text-green-600' : ''}`}
                        >
                          {tx.side === 'credit' ? '+' : ''}
                          {formatAmount(
                            tx.side === 'credit'
                              ? Math.abs(tx.amount)
                              : -Math.abs(tx.amount)
                          )}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && transactions.length > 0 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Afficher</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={v => setPageSize(Number(v) as 10 | 20)}
                >
                  <SelectTrigger className="w-[70px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-muted-foreground">par page</span>
              </div>

              <span className="text-sm text-muted-foreground">
                {(currentPage - 1) * pageSize + 1}-
                {Math.min(currentPage * pageSize, totalCount)} sur {totalCount}
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPage}
                  disabled={currentPage <= 1 || isLoading}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Precedent
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Page {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={currentPage >= totalPages || isLoading}
                  className="gap-1"
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Side Panel */}
      <Sheet
        open={selectedTransaction !== null}
        onOpenChange={open => {
          if (!open) setSelectedTransaction(null);
        }}
      >
        <SheetContent
          className="w-[360px] sm:max-w-[360px]"
          data-testid="tx-side-panel"
        >
          {selectedTransaction && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-1 text-sm">
                  {selectedTransaction.side === 'credit' ? (
                    <ArrowDownLeft className="h-3 w-3 text-green-600" />
                  ) : (
                    <ArrowUpRight className="h-3 w-3 text-red-600" />
                  )}
                  Detail transaction
                </SheetTitle>
              </SheetHeader>

              <div className="space-y-1.5 mt-1.5">
                {/* Montant */}
                <div className="text-center py-0.5">
                  <p
                    className={`text-lg font-bold ${selectedTransaction.side === 'credit' ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {selectedTransaction.side === 'credit' ? '+' : ''}
                    {formatAmount(
                      selectedTransaction.side === 'credit'
                        ? Math.abs(selectedTransaction.amount)
                        : -Math.abs(selectedTransaction.amount)
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDate(
                      selectedTransaction.settled_at ??
                        selectedTransaction.emitted_at
                    )}
                  </p>

                  {/* Status badge */}
                  <div className="mt-0.5">
                    {selectedTransaction.unified_status === 'to_process' && (
                      <Badge variant="warning">A traiter</Badge>
                    )}
                    {selectedTransaction.unified_status === 'classified' && (
                      <Badge variant="secondary">Classee</Badge>
                    )}
                    {selectedTransaction.unified_status === 'matched' && (
                      <Badge variant="default" className="bg-green-600">
                        Rapprochee
                      </Badge>
                    )}
                    {selectedTransaction.unified_status === 'ignored' && (
                      <Badge variant="secondary">Ignoree</Badge>
                    )}
                    {selectedTransaction.unified_status === 'cca' && (
                      <Badge variant="default" className="bg-purple-600">
                        CCA 455
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Info */}
                <Card>
                  <CardContent className="pt-1 pb-1 space-y-1 text-xs">
                    <div>
                      <p className="text-xs text-muted-foreground">Libelle</p>
                      <p className="text-xs font-medium">
                        {selectedTransaction.label ?? '-'}
                      </p>
                    </div>

                    {/* Notes (style Indy — visible, pas cachée) */}
                    {/* Note éditable */}
                    <div className="mt-1 p-1.5 bg-blue-50 border border-blue-100 rounded">
                      <div className="flex items-center gap-1 mb-0.5">
                        <StickyNote className="h-3 w-3 text-blue-500" />
                        <p className="text-[10px] font-medium text-blue-700">
                          Note
                        </p>
                      </div>
                      <Textarea
                        key={selectedTransaction.id + '-note'}
                        defaultValue={selectedTransaction.note ?? ''}
                        placeholder="Ajouter une note..."
                        className="text-xs min-h-[40px] h-auto resize-none bg-white border-blue-200 focus:border-blue-400"
                        rows={2}
                        onBlur={e => {
                          const newNote = e.target.value.trim() || null;
                          if (newNote === (selectedTransaction.note ?? null))
                            return;
                          void (async () => {
                            try {
                              const supabase = createClient();
                              const { error: updateError } = await supabase
                                .from('bank_transactions')
                                .update({ note: newNote })
                                .eq('id', selectedTransaction.id);
                              if (updateError) throw updateError;
                              toast.success('Note sauvegardée');
                              void refresh().catch(err => {
                                console.error(
                                  '[Transactions] Refresh after note update failed:',
                                  err
                                );
                              });
                            } catch (err) {
                              console.error('[Note update] Error:', err);
                              toast.error(
                                'Erreur lors de la sauvegarde de la note'
                              );
                            }
                          })();
                        }}
                      />
                    </div>

                    <Separator className="my-0.5" />

                    {/* Contrepartie + Mode de paiement */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Contrepartie
                        </p>
                        <p className="text-xs font-medium">
                          {selectedTransaction.counterparty_name ?? '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Mode de paiement
                        </p>
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3 text-muted-foreground" />
                          <Select
                            value={
                              selectedTransaction.payment_method ??
                              detectBankPaymentMethod(
                                selectedTransaction.label ?? ''
                              ) ??
                              'none'
                            }
                            onValueChange={value => {
                              const newMethod = value === 'none' ? null : value;
                              void (async () => {
                                try {
                                  const supabase = createClient();
                                  const { error: updateError } = await supabase
                                    .from('bank_transactions')
                                    .update({ payment_method: newMethod })
                                    .eq('id', selectedTransaction.id);
                                  if (updateError) throw updateError;
                                  toast.success('Mode de paiement mis à jour');
                                  void refresh().catch(err => {
                                    console.error(
                                      '[Transactions] Refresh after payment method update failed:',
                                      err
                                    );
                                  });
                                } catch (err) {
                                  console.error(
                                    '[Payment method update] Error:',
                                    err
                                  );
                                  toast.error('Erreur lors de la mise à jour');
                                }
                              })();
                            }}
                          >
                            <SelectTrigger className="h-6 text-xs w-full">
                              <SelectValue placeholder="Non défini" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Non défini</SelectItem>
                              {BANK_PAYMENT_METHODS.map(pm => (
                                <SelectItem key={pm.value} value={pm.value}>
                                  {pm.icon} {pm.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    {selectedTransaction.category_pcg && (
                      <>
                        <Separator className="my-0.5" />
                        <div>
                          <p className="text-muted-foreground text-[10px]">
                            Catégorie comptable
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: getPcgColor(
                                  selectedTransaction.category_pcg
                                ),
                              }}
                            />
                            <span className="text-xs font-medium">
                              {getPcgCategory(selectedTransaction.category_pcg)
                                ?.label ?? selectedTransaction.category_pcg}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {selectedTransaction.category_pcg}
                            </Badge>
                          </div>
                        </div>
                      </>
                    )}
                    {selectedTransaction.organisation_name && (
                      <>
                        <Separator className="my-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Organisation
                          </p>
                          <p className="text-xs font-medium text-blue-600">
                            {selectedTransaction.organisation_name}
                          </p>
                        </div>
                      </>
                    )}

                    {/* Section TVA */}
                    {selectedTransaction.amount !== null && (
                      <>
                        <Separator className="my-0.5" />
                        <div className="space-y-0.5">
                          <p className="text-muted-foreground text-[10px]">
                            Montants TVA
                          </p>
                          {selectedTransaction.vat_breakdown &&
                          selectedTransaction.vat_breakdown.length > 0 ? (
                            <div className="space-y-0.5">
                              {selectedTransaction.vat_breakdown.map(
                                (item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex justify-between items-center text-xs"
                                  >
                                    <span className="text-muted-foreground">
                                      {item.description ||
                                        `TVA ${item.tva_rate}%`}
                                    </span>
                                    <div className="text-right">
                                      <span className="font-medium">
                                        {formatAmount(item.amount_ht)} HT
                                      </span>
                                      <span className="text-muted-foreground ml-2">
                                        ({formatAmount(item.tva_amount)} TVA)
                                      </span>
                                    </div>
                                  </div>
                                )
                              )}
                              <Separator />
                              <div className="flex justify-between font-medium">
                                <span>Total TTC</span>
                                <span>
                                  {formatAmount(
                                    Math.abs(selectedTransaction.amount)
                                  )}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              {/* HT / TVA / TTC sur une ligne */}
                              <div className="flex justify-between text-[10px] gap-2">
                                <div className="flex flex-col items-center">
                                  <span className="text-muted-foreground">
                                    HT
                                  </span>
                                  <span className="font-medium">
                                    {selectedTransaction.amount_ht
                                      ? formatAmount(
                                          selectedTransaction.amount_ht
                                        )
                                      : '-'}
                                  </span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <div className="flex items-center gap-1">
                                    <span className="text-muted-foreground">
                                      TVA
                                    </span>
                                    {selectedTransaction.vat_source ===
                                    'qonto_ocr' ? (
                                      <Badge
                                        variant="secondary"
                                        className="bg-green-100 text-green-700 text-[8px] px-0.5 py-0"
                                      >
                                        OCR
                                      </Badge>
                                    ) : selectedTransaction.vat_source ===
                                      'manual' ? (
                                      <Badge
                                        variant="secondary"
                                        className="bg-blue-100 text-blue-700 text-[8px] px-0.5 py-0"
                                      >
                                        Man
                                      </Badge>
                                    ) : selectedTransaction.vat_rate ? (
                                      <Badge
                                        variant="secondary"
                                        className="bg-gray-100 text-gray-600 text-[8px] px-0.5 py-0"
                                      >
                                        Règle
                                      </Badge>
                                    ) : null}
                                  </div>
                                  <span className="font-medium">
                                    {selectedTransaction.amount_vat
                                      ? formatAmount(
                                          selectedTransaction.amount_vat
                                        )
                                      : '-'}
                                  </span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="text-muted-foreground">
                                    TTC
                                  </span>
                                  <span className="font-semibold">
                                    {formatAmount(
                                      Math.abs(selectedTransaction.amount)
                                    )}
                                  </span>
                                </div>
                              </div>
                              {/* Sélecteur TVA compact */}
                              <Select
                                value={
                                  selectedTransaction.vat_rate?.toString() ??
                                  'none'
                                }
                                onValueChange={value => {
                                  void (async () => {
                                    const newRate =
                                      value === 'none'
                                        ? null
                                        : parseFloat(value);
                                    try {
                                      const res = await fetch(
                                        '/api/transactions/update-vat',
                                        {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                          },
                                          body: JSON.stringify({
                                            transaction_id:
                                              selectedTransaction.id,
                                            vat_rate: newRate,
                                          }),
                                        }
                                      );
                                      if (res.ok) {
                                        void refresh().catch(error => {
                                          console.error(
                                            '[Transactions] Refresh after update failed:',
                                            error
                                          );
                                        });
                                      }
                                    } catch (err) {
                                      console.error('[TVA update] Error:', err);
                                    }
                                  })();
                                }}
                              >
                                <SelectTrigger className="h-5 text-[9px]">
                                  <SelectValue placeholder="Taux TVA" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">
                                    Non défini
                                  </SelectItem>
                                  <SelectItem value="0">0%</SelectItem>
                                  <SelectItem value="5.5">5.5%</SelectItem>
                                  <SelectItem value="10">10%</SelectItem>
                                  <SelectItem value="20">20%</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Section Pièces jointes */}
                    <Separator className="my-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-muted-foreground text-[10px]">
                        Justificatif
                      </p>
                      {(() => {
                        // Source de vérité UNIQUE : attachment_ids
                        const attachmentIds =
                          selectedTransaction.attachment_ids ?? [];
                        const attachments = attachmentIds.map((id, idx) => ({
                          id,
                          file_name: `Pièce jointe ${idx + 1}`,
                        }));
                        const hasAttachment = attachments.length > 0;

                        if (hasAttachment && attachments.length > 0) {
                          const handleDeleteAttachment = async (
                            attachmentId: string
                          ) => {
                            if (
                              !confirm(
                                'Supprimer ce justificatif ? Cette action est irréversible.'
                              )
                            ) {
                              return;
                            }
                            try {
                              const res = await fetch(
                                `/api/qonto/attachments/${attachmentId}?transactionId=${selectedTransaction.id}`,
                                { method: 'DELETE' }
                              );
                              if (!res.ok) {
                                const err =
                                  (await res.json()) as ApiErrorResponse;
                                throw new Error(
                                  err.error ?? 'Erreur lors de la suppression'
                                );
                              }
                              toast.success('Justificatif supprimé');
                              // Fermer et rouvrir le panel pour rafraîchir
                              setSelectedTransaction(null);
                              // Petit délai pour permettre le re-fetch
                              setTimeout(() => {
                                window.location.reload();
                              }, 500);
                            } catch (err) {
                              toast.error(
                                err instanceof Error
                                  ? err.message
                                  : 'Erreur lors de la suppression'
                              );
                            }
                          };

                          return (
                            <div className="space-y-0.5">
                              {attachments.map((att, idx) => (
                                <div
                                  key={att.id ?? idx}
                                  className="flex items-center gap-1.5 group"
                                >
                                  <button
                                    onClick={() =>
                                      window.open(
                                        `/api/qonto/attachments/${att.id}`,
                                        '_blank'
                                      )
                                    }
                                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 hover:underline flex-1 text-left"
                                  >
                                    <Paperclip className="h-3 w-3 flex-shrink-0" />
                                    <span className="truncate">
                                      {att.file_name ||
                                        `Pièce jointe ${idx + 1}`}
                                    </span>
                                    <ExternalLink className="h-2.5 w-2.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      void handleDeleteAttachment(att.id).catch(
                                        error => {
                                          console.error(
                                            '[Transactions] Delete attachment failed:',
                                            error
                                          );
                                        }
                                      );
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-opacity"
                                    title="Supprimer ce justificatif"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                              <div className="flex items-center gap-1 text-[10px] text-green-600 mt-0.5">
                                <CheckCircle className="h-3 w-3" />
                                <span>
                                  {attachments.length} justificatif(s) déposé(s)
                                </span>
                              </div>
                            </div>
                          );
                        } else if (selectedTransaction.justification_optional) {
                          return (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <FileX className="h-3 w-3" />
                              <span>Non requis</span>
                            </div>
                          );
                        } else {
                          return (
                            <button
                              onClick={() => {
                                setUploadTransaction(selectedTransaction);
                                setShowUploadModal(true);
                              }}
                              className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-800"
                            >
                              <AlertCircle className="h-3 w-3" />
                              <span>Manquant - Cliquer pour déposer</span>
                            </button>
                          );
                        }
                      })()}
                    </div>
                  </CardContent>
                </Card>

                {/* Détails techniques (collapsible — référence Qonto, type opération) */}
                {(() => {
                  const rawData = selectedTransaction.raw_data as Record<
                    string,
                    unknown
                  > | null;
                  const reference =
                    rawData && typeof rawData.reference === 'string'
                      ? rawData.reference
                      : null;
                  if (!reference && !selectedTransaction.operation_type)
                    return null;
                  return (
                    <div className="mt-0.5">
                      <button
                        onClick={() =>
                          setShowTechnicalDetails(!showTechnicalDetails)
                        }
                        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full"
                      >
                        {showTechnicalDetails ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                        Détails techniques
                      </button>
                      {showTechnicalDetails && (
                        <div className="mt-0.5 p-1.5 bg-muted/30 rounded text-[10px] space-y-0.5">
                          {reference && (
                            <div>
                              <span className="text-muted-foreground">
                                Réf :{' '}
                              </span>
                              <span className="font-mono break-all">
                                {reference}
                              </span>
                            </div>
                          )}
                          {selectedTransaction.operation_type && (
                            <div>
                              <span className="text-muted-foreground">
                                Type :{' '}
                              </span>
                              <span className="font-mono">
                                {selectedTransaction.operation_type}
                              </span>
                            </div>
                          )}
                          {selectedTransaction.transaction_id && (
                            <div>
                              <span className="text-muted-foreground">
                                ID :{' '}
                              </span>
                              <span className="font-mono break-all">
                                {selectedTransaction.transaction_id}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Actions simplifiées - Transactions = Justificatifs + Rapprochement */}
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground">
                    Actions
                  </p>

                  {/* Si verrouillé par règle, afficher le lien vers la règle */}
                  {isLockedByRule && (
                    <>
                      <div className="p-1 bg-amber-50 border border-amber-200 rounded-lg mb-0.5">
                        <div className="flex items-center gap-1.5 text-amber-700">
                          <Lock className="h-3 w-3" />
                          <span className="text-[10px] font-medium">
                            Géré par règle
                          </span>
                        </div>
                        <p className="text-[9px] text-amber-600 mt-0">
                          Modifier via les règles ou la page Dépenses.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-1.5 h-7 text-xs"
                        onClick={handleViewRule}
                      >
                        <Settings className="h-3 w-3" />
                        Voir / Modifier la règle
                      </Button>
                    </>
                  )}

                  {/* Classer PCG - UNIQUEMENT si pas de règle ET pas de catégorie */}
                  {!isLockedByRule && !selectedTransaction.category_pcg && (
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-1.5 h-7 text-xs"
                      onClick={() => setShowClassificationModal(true)}
                      data-testid="btn-classify-pcg"
                    >
                      <Tag className="h-3 w-3" />
                      Classer PCG
                    </Button>
                  )}

                  {/* Lier organisation - UNIQUEMENT si:
                      - Pas de règle
                      - Pas d'organisation liée
                      - Transaction DEBIT (sorties) - pour les crédits, on passe par les commandes */}
                  {!isLockedByRule &&
                    !selectedTransaction.organisation_name &&
                    selectedTransaction.side === 'debit' && (
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-1.5 h-7 text-xs"
                        onClick={() => setShowOrganisationModal(true)}
                        data-testid="btn-link-org"
                      >
                        <Building2 className="h-3 w-3" />
                        Lier organisation
                      </Button>
                    )}

                  {/* Actions principales : Rapprochement uniquement */}
                  {/* Note: Upload justificatif se fait via le bouton dans la liste */}
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-1.5 h-7 text-xs"
                    onClick={() => setShowRapprochementModal(true)}
                  >
                    <FileText className="h-3 w-3" />
                    Rapprocher commande
                  </Button>

                  <Separator className="my-0.5" />

                  {/* Justificatif facultatif/requis */}
                  {selectedTransaction.justification_optional ? (
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-1.5 h-7 text-xs text-green-600 hover:text-green-700"
                      onClick={() => {
                        void handleToggleJustificationOptional(false).catch(
                          error => {
                            console.error(
                              '[Transactions] Toggle justification failed:',
                              error
                            );
                          }
                        );
                      }}
                    >
                      <FileCheck className="h-3 w-3" />
                      Justificatif requis
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-1.5 h-7 text-xs text-muted-foreground"
                      onClick={() => {
                        void handleToggleJustificationOptional(true).catch(
                          error => {
                            console.error(
                              '[Transactions] Toggle justification failed:',
                              error
                            );
                          }
                        );
                      }}
                    >
                      <FileX className="h-3 w-3" />
                      Justificatif facultatif
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Modal Classification PCG */}
      <QuickClassificationModal
        open={showClassificationModal}
        onOpenChange={setShowClassificationModal}
        label={
          selectedTransaction?.label ??
          selectedTransaction?.counterparty_name ??
          ''
        }
        amount={selectedTransaction?.amount}
        transactionId={selectedTransaction?.id}
        counterpartyName={selectedTransaction?.counterparty_name ?? undefined}
        currentCategory={selectedTransaction?.category_pcg ?? undefined}
        existingRuleId={
          selectedTransaction
            ? suggestionsMap.get(selectedTransaction.id)?.matchedRule?.id
            : undefined
        }
        onSuccess={() => {
          void refresh().catch(error => {
            console.error(
              '[Transactions] Refresh after success failed:',
              error
            );
          });
        }}
      />

      {/* Modal Organisation */}
      <OrganisationLinkingModal
        open={showOrganisationModal}
        onOpenChange={setShowOrganisationModal}
        label={
          selectedTransaction?.counterparty_name ??
          selectedTransaction?.label ??
          ''
        }
        transactionCount={1}
        totalAmount={selectedTransaction?.amount}
        onSuccess={() => {
          void refresh().catch(error => {
            console.error(
              '[Transactions] Refresh after success failed:',
              error
            );
          });
        }}
        transactionSide={selectedTransaction?.side}
      />

      {/* Modal Rapprochement */}
      <RapprochementModal
        open={showRapprochementModal}
        onOpenChange={setShowRapprochementModal}
        transactionId={selectedTransaction?.id}
        label={
          selectedTransaction?.label ??
          selectedTransaction?.counterparty_name ??
          ''
        }
        amount={selectedTransaction?.amount ?? 0}
        counterpartyName={selectedTransaction?.counterparty_name}
        onSuccess={() => {
          toast.success('Transaction rapprochee');
          void refresh().catch(error => {
            console.error('[Transactions] Refresh failed:', error);
          });
          setShowRapprochementModal(false);
        }}
      />

      {/* Modal Upload */}
      <InvoiceUploadModal
        transaction={transactionForUpload}
        open={showUploadModal}
        onOpenChange={open => {
          setShowUploadModal(open);
          if (!open) setUploadTransaction(null);
        }}
        onUploadComplete={() => {
          toast.success('Justificatif uploadé');
          void refresh().catch(error => {
            console.error('[Transactions] Refresh failed:', error);
          });
          setShowUploadModal(false);
          setUploadTransaction(null);
        }}
      />

      {/* SLICE 5: Modal Règle (voir/modifier) */}
      <RuleModal
        open={showRuleModal}
        onOpenChange={setShowRuleModal}
        rule={editingRule}
        onUpdate={updateRule}
        previewApply={previewApply}
        confirmApply={confirmApply}
        onSuccess={() => {
          setEditingRule(null);
          void refetchRules().catch(error => {
            console.error('[Transactions] Refetch rules failed:', error);
          });
          void refresh().catch(error => {
            console.error('[Transactions] Refresh failed:', error);
          });
        }}
      />
    </div>
  );
}

// =====================================================================
// EXPORT - Version unifiée (v2 only)
// =====================================================================

export default function TransactionsPage() {
  return <TransactionsPageV2 />;
}
