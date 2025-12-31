'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';

import Link from 'next/link';

import { useToast } from '@verone/common/hooks';
import { getPcgCategory, PCG_SUGGESTED_CATEGORIES } from '@verone/finance';
import {
  QuickClassificationModal,
  RuleModal,
  SupplierCell,
  ExpenseDonutChart,
  MonthlyFlowChart,
} from '@verone/finance/components';
import {
  useExpenses,
  useAutoClassification,
  useTreasuryStats,
  useMatchingRules,
  type Expense,
  type ExpenseFilters,
  type ExpenseBreakdown,
} from '@verone/finance/hooks';
import {
  Badge,
  Button,
  cn,
  Input,
  KPICardUnified,
  TabsNavigation,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Edit2,
  Eye,
  FileText,
  Filter,
  Paperclip,
  RefreshCw,
  Search,
  Settings,
  XCircle,
} from 'lucide-react';

// Format montant en euros
function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(Math.abs(amount));
}

// Format date
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Badge de statut
function StatusBadge({ status }: { status: Expense['status'] }) {
  const config = {
    unclassified: {
      label: 'Non classé',
      variant: 'outline' as const,
      icon: Clock,
    },
    classified: {
      label: 'Classé',
      variant: 'default' as const,
      icon: CheckCircle2,
    },
    needs_review: {
      label: 'À revoir',
      variant: 'warning' as const,
      icon: AlertCircle,
    },
    ignored: { label: 'Ignoré', variant: 'secondary' as const, icon: XCircle },
  };

  const { label, variant, icon: Icon } = config[status];

  return (
    <Badge variant={variant} className="gap-1">
      <Icon size={12} />
      {label}
    </Badge>
  );
}

// Ligne de dépense
function ExpenseRow({
  expense,
  onClassify,
  onViewAttachment,
  onLink,
  onViewRule,
  onConfirmSuggestion,
  suggestion,
}: {
  expense: Expense;
  onClassify: (expense: Expense) => void;
  onViewAttachment: (expense: Expense) => void;
  onLink: () => void;
  onViewRule?: (ruleId: string) => void; // SLICE 3: Voir/modifier la règle
  onConfirmSuggestion?: (ruleId: string, organisationId: string) => void;
  suggestion?: {
    matchedRule?: { id: string } | null;
    organisationId: string | null;
    organisationName: string | null;
    category: string | null;
    confidence: 'high' | 'medium' | 'none';
    matchType?: 'exact' | 'similar' | 'none';
  };
}) {
  // PCG uniquement - plus d'ancien système
  const pcgCategory = getPcgCategory(expense.category ?? '');
  const categoryLabel = pcgCategory?.label ?? null;

  // Déterminer si la dépense est classée
  const isClassified =
    expense.status === 'classified' || expense.category !== null;

  // SLICE 3: Verrouillage si une règle est appliquée
  const isLockedByRule = Boolean(expense.applied_rule_id);

  return (
    <tr
      className={cn(
        'border-b border-slate-100 hover:bg-slate-50',
        isClassified && 'bg-green-50/30'
      )}
    >
      <td className="px-4 py-3 text-sm text-slate-600">
        {formatDate(expense.emitted_at)}
      </td>
      <td className="px-4 py-3">
        <div className="max-w-xs">
          <p className="text-sm font-medium text-slate-900 truncate">
            {expense.label}
          </p>
          <div className="text-xs text-slate-500 truncate">
            <SupplierCell
              counterpartyName={expense.transaction_counterparty_name}
              label={expense.label}
              organisationId={expense.organisation_id}
              organisationName={expense.organisation_name}
              transactionId={expense.id}
              onLink={onLink}
              onConfirm={
                suggestion?.matchedRule?.id &&
                suggestion?.organisationId &&
                onConfirmSuggestion
                  ? () =>
                      onConfirmSuggestion(
                        suggestion.matchedRule!.id,
                        suggestion.organisationId!
                      )
                  : undefined
              }
              suggestedOrganisationId={suggestion?.organisationId}
              suggestedOrganisationName={suggestion?.organisationName}
              suggestedCategory={suggestion?.category}
              confidence={suggestion?.confidence}
              matchType={suggestion?.matchType}
            />
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="text-sm font-semibold text-red-600">
          -{formatAmount(expense.amount)}
        </span>
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={expense.status} />
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {categoryLabel || '-'}
      </td>
      {/* Actions (incluant le bouton pièce jointe) */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {/* Bouton justificatif - toujours visible si pièce jointe existe */}
          {expense.has_attachment && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewAttachment(expense)}
              className="text-blue-600 hover:text-blue-800 px-2"
              title="Voir pièce jointe Qonto"
            >
              <Eye size={14} />
            </Button>
          )}

          {/* Actions de classification */}
          {isLockedByRule ? (
            <>
              {/* Modification individuelle - même avec règle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onClassify(expense)}
                className="gap-1 text-slate-600 hover:text-slate-800"
                title="Modifier cette ligne uniquement"
              >
                <Edit2 size={14} />
              </Button>
              {/* Modification de la règle */}
              {onViewRule && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewRule(expense.applied_rule_id!)}
                  className="gap-1 text-blue-600 hover:text-blue-800"
                  title={`Règle: ${expense.rule_display_label || expense.rule_match_value}`}
                >
                  <Settings size={14} />
                </Button>
              )}
            </>
          ) : isClassified ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onClassify(expense)}
              className="gap-1 text-slate-500"
            >
              <Edit2 size={14} />
              Modifier
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onClassify(expense)}
              className="gap-1"
            >
              <FileText size={14} />
              Classer
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function DepensesPage() {
  const [filters, setFilters] = useState<ExpenseFilters>({
    status: 'all',
  });
  const [searchValue, setSearchValue] = useState('');
  const { expenses, stats, isLoading, error, refetch } = useExpenses(filters);
  const { toast } = useToast();

  // Dashboard stats pour les graphiques
  const {
    evolution,
    expenseBreakdown,
    loading: dashboardLoading,
  } = useTreasuryStats();

  // Auto-classification: appliquer les règles de matching
  const { transactionsWithSuggestions } = useAutoClassification(
    expenses as (Expense & Record<string, unknown>)[]
  );

  // SLICE 3: Hook pour les règles de matching
  const {
    rules,
    update: updateMatchingRule,
    previewApply,
    confirmApply,
    refetch: refetchRules,
  } = useMatchingRules();

  // Map pour accès rapide aux suggestions par ID
  const suggestionsMap = useMemo(() => {
    const map = new Map<
      string,
      (typeof transactionsWithSuggestions)[0]['suggestion']
    >();
    transactionsWithSuggestions.forEach(({ original, suggestion }) => {
      const exp = original as Expense;
      map.set(exp.id, suggestion);
    });
    return map;
  }, [transactionsWithSuggestions]);

  // Handler pour confirmer une suggestion d'organisation
  const handleConfirmSuggestion = useCallback(
    async (ruleId: string, organisationId: string) => {
      try {
        await updateMatchingRule(ruleId, {
          organisation_id: organisationId,
        });
        toast({
          title: 'Organisation liée',
          description: 'La suggestion a été confirmée avec succès.',
        });
        await refetch();
      } catch (err) {
        console.error('Error confirming suggestion:', err);
        toast({
          title: 'Erreur',
          description: 'Impossible de confirmer la suggestion.',
          variant: 'destructive',
        });
      }
    },
    [updateMatchingRule, toast, refetch]
  );

  // État du modal de classement
  const [classifyModalOpen, setClassifyModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // SLICE 3: État du RuleModal pour voir/modifier une règle
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);

  // SLICE 3: Trouver la règle sélectionnée
  const selectedRule = useMemo(
    () => rules.find(r => r.id === selectedRuleId) || null,
    [rules, selectedRuleId]
  );

  // SLICE 3: Ouvrir le modal de règle
  const handleViewRule = useCallback((ruleId: string) => {
    setSelectedRuleId(ruleId);
    setRuleModalOpen(true);
  }, []);

  // SLICE 3: Callback après modification de règle
  const handleRuleSuccess = useCallback(async () => {
    await refetchRules();
    await refetch();
  }, [refetchRules, refetch]);

  // Années disponibles (2022 à aujourd'hui)
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 2021 },
    (_, i) => currentYear - i
  );

  // État pour le filtre d'année du graphique Dépenses par Catégorie
  const [chartYear, setChartYear] = useState<number | null>(null);
  const [chartExpenseBreakdown, setChartExpenseBreakdown] = useState<
    ExpenseBreakdown[]
  >([]);
  const [chartLoading, setChartLoading] = useState(false);

  // Charger les données du graphique filtrées par année
  const supabase = createClient();

  const fetchChartData = useCallback(async () => {
    setChartLoading(true);
    try {
      // Construire les dates de filtre
      let startDate: string | undefined;
      let endDate: string | undefined;

      if (chartYear) {
        startDate = `${chartYear}-01-01`;
        endDate = `${chartYear}-12-31`;
      }

      // Requête pour les dépenses par catégorie
      let query = supabase
        .from('v_expenses_with_details')
        .select('category, amount')
        .eq('side', 'debit');

      if (startDate && endDate) {
        query = query.gte('emitted_at', startDate).lte('emitted_at', endDate);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        console.warn('Error fetching chart data:', queryError);
        return;
      }

      // Agréger par catégorie
      const categoryData: Record<string, { total: number; count: number }> = {};
      let totalExpenses = 0;

      (data || []).forEach(
        (exp: { category: string | null; amount: number | null }) => {
          const cat = exp.category || 'other';
          const amount = exp.amount ?? 0;
          if (!categoryData[cat]) {
            categoryData[cat] = { total: 0, count: 0 };
          }
          categoryData[cat].total += Math.abs(amount);
          categoryData[cat].count += 1;
          totalExpenses += Math.abs(amount);
        }
      );

      const breakdownArray: ExpenseBreakdown[] = Object.entries(categoryData)
        .map(([name, catData]) => ({
          category_name: name,
          category_code: name,
          total_amount: catData.total,
          count: catData.count,
          percentage:
            totalExpenses > 0 ? (catData.total / totalExpenses) * 100 : 0,
        }))
        .sort((a, b) => b.total_amount - a.total_amount);

      setChartExpenseBreakdown(breakdownArray);
    } catch (err) {
      console.error('Error fetching chart data:', err);
    } finally {
      setChartLoading(false);
    }
  }, [chartYear, supabase]);

  // Charger les données du graphique au montage et quand l'année change
  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  // Onglets de statut avec compteurs
  const statusTabs = [
    {
      id: 'all',
      label: 'Toutes',
      icon: <FileText size={16} />,
      badge: stats.total,
    },
    {
      id: 'unclassified',
      label: 'Non classées',
      icon: <Clock size={16} />,
      badge: stats.unclassified,
    },
    {
      id: 'classified',
      label: 'Classées',
      icon: <CheckCircle2 size={16} />,
      badge: stats.classified,
    },
    {
      id: 'needs_review',
      label: 'À revoir',
      icon: <AlertCircle size={16} />,
      badge: stats.needsReview,
    },
    {
      id: 'ignored',
      label: 'Ignorées',
      icon: <XCircle size={16} />,
      badge: stats.ignored,
    },
  ];

  const handleStatusTabChange = (tabId: string) => {
    setFilters(prev => ({
      ...prev,
      status: tabId as ExpenseFilters['status'],
    }));
  };

  // Handlers
  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchValue }));
  };

  const handleClassify = (expense: Expense) => {
    setSelectedExpense(expense);
    setClassifyModalOpen(true);
  };

  const handleClassifySuccess = async () => {
    toast({
      title: 'Dépense classée',
      description: 'La règle a été créée et appliquée avec succès.',
    });
    // Rafraîchir la liste
    await refetch();
  };

  const handleViewAttachment = (expense: Expense) => {
    // Extraire l'ID de l'attachment depuis raw_data
    const rawData = expense.raw_data as { attachments?: Array<{ id: string }> };
    const attachmentId = rawData.attachments?.[0]?.id;

    if (attachmentId) {
      window.open(`/api/qonto/attachments/${attachmentId}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Gestion des Dépenses
            </h1>
            <p className="text-sm text-slate-600">
              Classez et catégorisez vos dépenses bancaires
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/finance/depenses/regles">
              <Button variant="outline">
                <Settings size={16} />
                Gérer les règles
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw
                size={16}
                className={isLoading ? 'animate-spin' : ''}
              />
              Actualiser
            </Button>
            <Button variant="outline">
              <Download size={16} />
              Exporter
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICardUnified
            variant="elegant"
            title="Total Dépenses"
            value={stats.total}
            icon={FileText}
          />
          <KPICardUnified
            variant="elegant"
            title="Non classées"
            value={stats.unclassified}
            icon={Clock}
            onClick={() => setFilters({ status: 'unclassified' })}
          />
          <KPICardUnified
            variant="elegant"
            title="Classées"
            value={stats.classified}
            icon={CheckCircle2}
            onClick={() => setFilters({ status: 'classified' })}
          />
          <KPICardUnified
            variant="elegant"
            title="À revoir"
            value={stats.needsReview}
            icon={AlertCircle}
            onClick={() => setFilters({ status: 'needs_review' })}
          />
          <KPICardUnified
            variant="elegant"
            title="Montant Total"
            value={formatAmount(stats.totalAmount)}
            icon={FileText}
          />
        </div>

        {/* Dashboard Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ExpenseDonutChart
            data={chartExpenseBreakdown}
            isLoading={chartLoading}
            selectedYear={chartYear}
            availableYears={years}
            onYearChange={setChartYear}
          />
          <MonthlyFlowChart data={evolution} isLoading={dashboardLoading} />
        </div>

        {/* Onglets de statut */}
        <TabsNavigation
          tabs={statusTabs}
          defaultTab={filters.status || 'all'}
          onTabChange={handleStatusTabChange}
          className="bg-white rounded-xl border border-slate-200 px-4"
        />

        {/* Filtres */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Recherche */}
            <div className="flex-1 min-w-[200px] max-w-md">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input
                  placeholder="Rechercher par libellé..."
                  className="pl-9"
                  value={searchValue}
                  onChange={e => setSearchValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>

            {/* Filtre année */}
            <select
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              value={filters.year || ''}
              onChange={e =>
                setFilters(prev => ({
                  ...prev,
                  year: e.target.value ? parseInt(e.target.value) : undefined,
                }))
              }
            >
              <option value="">Toutes les années</option>
              {years.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            {/* Filtre catégorie PCG */}
            <select
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              value={filters.category || ''}
              onChange={e =>
                setFilters(prev => ({
                  ...prev,
                  category: e.target.value || undefined,
                }))
              }
            >
              <option value="">Toutes catégories</option>
              {PCG_SUGGESTED_CATEGORIES.map(cat => (
                <option key={cat.code} value={cat.code}>
                  {cat.code} - {cat.label}
                </option>
              ))}
            </select>

            {/* Filtre pièce jointe */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={filters.hasAttachment === true}
                onChange={e =>
                  setFilters(prev => ({
                    ...prev,
                    hasAttachment: e.target.checked ? true : undefined,
                  }))
                }
                className="rounded border-slate-300"
              />
              Avec pièce jointe
            </label>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilters({ status: 'all' });
                setSearchValue('');
              }}
            >
              <Filter size={14} />
              Réinitialiser
            </Button>
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {error ? (
            <div className="p-8 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <p className="text-red-600">{error}</p>
              <Button
                variant="outline"
                onClick={() => refetch()}
                className="mt-4"
              >
                Réessayer
              </Button>
            </div>
          ) : isLoading ? (
            <div className="p-8 text-center">
              <RefreshCw className="mx-auto h-12 w-12 text-blue-500 animate-spin mb-4" />
              <p className="text-slate-600">Chargement des dépenses...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-600">Aucune dépense trouvée</p>
              <p className="text-sm text-slate-500 mt-1">
                Modifiez vos filtres ou lancez une synchronisation Qonto
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Libellé
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(expense => (
                    <ExpenseRow
                      key={expense.id}
                      expense={expense}
                      onClassify={handleClassify}
                      onViewAttachment={handleViewAttachment}
                      onLink={() => refetch()}
                      onViewRule={handleViewRule}
                      onConfirmSuggestion={handleConfirmSuggestion}
                      suggestion={suggestionsMap.get(expense.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        {expenses.length > 0 && (
          <div className="text-sm text-slate-500 text-center">
            Affichage de {expenses.length} dépense(s) sur {stats.total}
          </div>
        )}
      </div>

      {/* Modal de classement V2 - QuickClassificationModal avec design moderne */}
      <QuickClassificationModal
        open={classifyModalOpen}
        onOpenChange={setClassifyModalOpen}
        label={
          selectedExpense?.label ||
          selectedExpense?.transaction_counterparty_name ||
          ''
        }
        amount={selectedExpense?.amount || 0}
        transactionId={selectedExpense?.transaction_id}
        counterpartyName={
          selectedExpense?.transaction_counterparty_name || undefined
        }
        currentCategory={selectedExpense?.category || undefined}
        existingRuleId={
          selectedExpense
            ? suggestionsMap.get(selectedExpense.id)?.matchedRule?.id
            : undefined
        }
        onSuccess={handleClassifySuccess}
      />

      {/* SLICE 3: Modal pour voir/modifier une règle */}
      <RuleModal
        open={ruleModalOpen}
        onOpenChange={setRuleModalOpen}
        rule={selectedRule}
        onUpdate={updateMatchingRule}
        previewApply={previewApply}
        confirmApply={confirmApply}
        onSuccess={handleRuleSuccess}
      />
    </div>
  );
}
