'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';

import Link from 'next/link';

import { useToast } from '@verone/common/hooks';
import {
  getPcgCategory,
  getPcgCategoriesByType,
  getPcgColor,
} from '@verone/finance';
import {
  QuickClassificationModal,
  RuleModal,
  SupplierCell,
  ExpenseDonutChart,
  MonthlyFlowChart,
  OrganisationLinkingModal,
} from '@verone/finance/components';
import {
  useExpenses,
  useAutoClassification,
  useTreasuryStats,
  useMatchingRules,
  useUniqueLabels,
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
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Edit2,
  Eye,
  FileText,
  Filter,
  Link as LinkIcon,
  Paperclip,
  Percent,
  RefreshCw,
  Search,
  Settings,
  Tag,
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

// Indicateur de complétude - affiche ce qui manque sur la transaction
function CompletenessIndicator({ expense }: { expense: Expense }) {
  const missingItems: { key: string; label: string; icon: typeof Tag }[] = [];

  // Catégorie manquante
  if (!expense.category) {
    missingItems.push({ key: 'category', label: 'Catégorie', icon: Tag });
  }

  // TVA manquante (seulement si catégorisé)
  if (
    expense.category &&
    expense.vat_rate == null &&
    (!expense.vat_breakdown ||
      !Array.isArray(expense.vat_breakdown) ||
      expense.vat_breakdown.length === 0)
  ) {
    missingItems.push({ key: 'vat', label: 'TVA', icon: Percent });
  }

  // Justificatif manquant (sauf si facultatif)
  if (!expense.has_attachment && !expense.justification_optional) {
    missingItems.push({
      key: 'attachment',
      label: 'Justificatif',
      icon: Paperclip,
    });
  }

  if (missingItems.length === 0) {
    return (
      <Badge
        variant="default"
        className="gap-1 text-xs bg-green-100 text-green-700"
      >
        <CheckCircle2 size={10} />
        Complet
      </Badge>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {missingItems.map(item => (
        <Badge
          key={item.key}
          variant="outline"
          className="gap-1 text-xs px-1.5 border-orange-300 bg-orange-50 text-orange-700"
        >
          <item.icon size={10} />
          {item.label}
        </Badge>
      ))}
    </div>
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
  // Peut-on modifier individuellement malgré la règle ?
  const canModifyIndividually = expense.rule_allow_multiple_categories === true;

  return (
    <tr
      className={cn(
        'border-b border-slate-100 hover:bg-slate-50',
        isClassified && 'bg-green-50/30'
      )}
    >
      <td className="px-3 py-2 text-xs text-slate-600">
        {formatDate(expense.emitted_at)}
      </td>
      <td className="px-3 py-2">
        <div className="max-w-xs">
          <p className="text-xs font-medium text-slate-900 truncate">
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
      <td className="px-3 py-2 text-right">
        <div className="flex items-center justify-end gap-1">
          {expense.has_attachment && (
            <span title="Justificatif disponible">
              <Paperclip size={12} className="text-blue-500" />
            </span>
          )}
          <span
            className={cn(
              'text-xs font-semibold',
              expense.side === 'credit' ? 'text-green-600' : 'text-red-600'
            )}
          >
            {expense.side === 'credit' ? '+' : '-'}
            {formatAmount(expense.amount)}
          </span>
        </div>
      </td>
      {/* Colonne Complétude - affiche ce qui manque */}
      <td className="px-3 py-2">
        <CompletenessIndicator expense={expense} />
      </td>
      <td className="px-3 py-2">
        <StatusBadge status={expense.status} />
      </td>
      <td className="px-3 py-2 text-xs text-slate-600">
        {expense.category ? (
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: getPcgColor(expense.category) }}
            />
            <span className="truncate">
              {categoryLabel ?? expense.category}
            </span>
          </div>
        ) : (
          <span className="text-slate-300">-</span>
        )}
      </td>
      {/* Actions (incluant le bouton pièce jointe) */}
      <td className="px-3 py-2">
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
              {/* Modification individuelle - seulement si allow_multiple_categories */}
              {canModifyIndividually && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onClassify(expense)}
                  className="gap-1 text-slate-600 hover:text-slate-800"
                  title="Modifier cette ligne uniquement"
                >
                  <Edit2 size={14} />
                </Button>
              )}
              {/* Modification de la règle */}
              {onViewRule && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onViewRule(expense.applied_rule_id!)}
                  className="gap-1 text-blue-600 hover:text-blue-800"
                  title={`Règle: ${expense.rule_display_label ?? expense.rule_match_value}`}
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
  const [searchValue, setSearchValue] = useState('');
  // Utiliser les filtres du hook (pas un état local séparé)
  const { expenses, stats, isLoading, error, refetch, filters, setFilters } =
    useExpenses({ status: 'all' });

  // Debounce: Recherche automatique après 400ms de pause de frappe
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => {
        const newSearch = searchValue.trim() ?? undefined;
        // Ne mettre à jour que si la valeur a réellement changé
        if (prev.search === newSearch) return prev;
        return { ...prev, search: newSearch };
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [searchValue, setFilters]);
  const { toast } = useToast();

  // Dashboard stats pour les graphiques
  const {
    evolution,
    expenseBreakdown: _expenseBreakdown,
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
    autoClassifyAll,
    refetch: refetchRules,
  } = useMatchingRules();

  // Hook pour les libellés groupés (onglet "Non classées")
  const {
    labels: uniqueLabels,
    isLoading: labelsLoading,
    refetch: refetchLabels,
  } = useUniqueLabels();

  // État pour le libellé étendu (voir les transactions détaillées)
  const [expandedLabel, setExpandedLabel] = useState<string | null>(null);

  // État pour le modal de liaison d'organisation
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [selectedLabelForLink, setSelectedLabelForLink] = useState<{
    label: string;
    transactionCount: number;
    totalAmount: number;
  } | null>(null);

  // Auto-classification au chargement de la page
  useEffect(() => {
    const runAutoClassify = async () => {
      try {
        const count = await autoClassifyAll();
        if (count > 0) {
          console.warn(
            `[DepensesPage] ${count} transaction(s) classée(s) automatiquement`
          );
          // Rafraîchir la liste des dépenses si des transactions ont été classées
          await refetch();
        }
      } catch (err) {
        console.error('[DepensesPage] Auto-classify error:', err);
      }
    };
    void runAutoClassify().catch(error => {
      console.error('[DepensesPage] Auto-classify init failed:', error);
    });
  }, [autoClassifyAll, refetch]);

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
    () => rules.find(r => r.id === selectedRuleId) ?? null,
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
          const cat = exp.category ?? 'other';
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
        .map(([code, catData]) => ({
          category_name: getPcgCategory(code)?.label ?? code,
          category_code: code,
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
    void fetchChartData().catch(error => {
      console.error('[DepensesPage] Fetch chart data failed:', error);
    });
  }, [fetchChartData]);

  // Onglets de statut avec compteurs (simplifié: 3 onglets)
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
    // Rafraîchir les listes (dépenses ET libellés groupés)
    await Promise.all([refetch(), refetchLabels()]);
  };

  const handleViewAttachment = (expense: Expense) => {
    // Extraire l'ID de l'attachment depuis raw_data
    // Qonto utilise "attachment_ids" (tableau d'UUIDs)
    const rawData = expense.raw_data as { attachment_ids?: string[] };
    const attachmentId = rawData.attachment_ids?.[0];

    if (attachmentId) {
      window.open(`/api/qonto/attachments/${attachmentId}`, '_blank');
    } else {
      toast({
        title: 'Aucune pièce jointe',
        description: "Cette transaction n'a pas de justificatif attaché.",
        variant: 'destructive',
      });
    }
  };

  // Handler pour ouvrir le modal de liaison depuis un libellé groupé
  const handleLinkLabel = (
    label: string,
    transactionCount: number,
    totalAmount: number
  ) => {
    setSelectedLabelForLink({ label, transactionCount, totalAmount });
    setLinkModalOpen(true);
  };

  // Handler pour classifier un libellé depuis la vue groupée
  const handleClassifyLabel = (
    label: string,
    transactionCount: number,
    totalAmount: number
  ) => {
    // On crée un "faux" expense pour réutiliser le modal existant
    setSelectedExpense({
      id: '',
      transaction_id: '', // Pas de transaction_id = mode label
      label,
      amount: totalAmount,
      status: 'unclassified',
      emitted_at: new Date().toISOString(),
    } as Expense);
    setClassifyModalOpen(true);
  };

  // Succès de la liaison depuis la vue groupée
  const handleLinkSuccess = async () => {
    toast({
      title: 'Tiers associé',
      description: 'Le libellé a été associé avec succès.',
    });
    await Promise.all([refetch(), refetchLabels()]);
  };

  // Toggle l'expansion d'un libellé
  const handleToggleLabel = (label: string) => {
    setExpandedLabel(prev => (prev === label ? null : label));
  };

  // Filtrer les transactions par libellé pour l'expansion
  const getExpensesByLabel = useCallback(
    (label: string) => {
      return expenses.filter(
        e => e.label === label && (e.status === 'unclassified' || !e.category)
      );
    },
    [expenses]
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Catégorisation</h1>
            <p className="text-sm text-slate-600">
              Classez vos transactions bancaires (dépenses et revenus)
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
              onClick={() => {
                void refetch().catch(error => {
                  console.error('[DepensesPage] Refetch failed:', error);
                });
              }}
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
            title="Total Transactions"
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
          defaultTab={filters.status ?? 'all'}
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
                  placeholder="Rechercher par libellé ou organisation..."
                  className="pl-9"
                  value={searchValue}
                  onChange={e => setSearchValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>

            {/* Filtre Dépenses/Entrées */}
            <select
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium"
              value={filters.side ?? 'all'}
              onChange={e =>
                setFilters(prev => ({
                  ...prev,
                  side: e.target.value as 'debit' | 'credit' | 'all',
                  category: undefined, // Reset category when changing side
                }))
              }
            >
              <option value="all">📊 Toutes transactions</option>
              <option value="debit">📤 Dépenses (sorties)</option>
              <option value="credit">📥 Entrées (recettes)</option>
            </select>

            {/* Filtre année */}
            <select
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              value={filters.year ?? ''}
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

            {/* Filtre catégorie PCG (adapté selon le side) */}
            <select
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              value={filters.category ?? ''}
              onChange={e =>
                setFilters(prev => ({
                  ...prev,
                  category: e.target.value ?? undefined,
                }))
              }
            >
              <option value="">Toutes catégories</option>
              {getPcgCategoriesByType(filters.side ?? 'all').map(cat => (
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
                setFilters({ status: 'all', side: 'all' });
                setSearchValue('');
              }}
            >
              <Filter size={14} />
              Réinitialiser
            </Button>
          </div>
        </div>

        {/* Contenu principal - Vue groupée OU tableau selon l'onglet */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {error ? (
            <div className="p-8 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <p className="text-red-600">{error}</p>
              <Button
                variant="outline"
                onClick={() => {
                  void refetch().catch(error => {
                    console.error('[DepensesPage] Refetch failed:', error);
                  });
                }}
                className="mt-4"
              >
                Réessayer
              </Button>
            </div>
          ) : filters.status === 'unclassified' ? (
            /* VUE GROUPÉE PAR LIBELLÉ pour "Non classées" */
            labelsLoading ? (
              <div className="p-8 text-center">
                <RefreshCw className="mx-auto h-12 w-12 text-blue-500 animate-spin mb-4" />
                <p className="text-slate-600">Chargement des libellés...</p>
              </div>
            ) : uniqueLabels.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
                <p className="text-slate-600">
                  Toutes les dépenses sont classées !
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {uniqueLabels.map(labelItem => {
                  const isExpanded = expandedLabel === labelItem.label;
                  const labelExpenses = isExpanded
                    ? getExpensesByLabel(labelItem.label)
                    : [];

                  return (
                    <div key={labelItem.label}>
                      {/* En-tête du libellé groupé */}
                      <div
                        className="flex items-center justify-between p-4 hover:bg-slate-50 cursor-pointer"
                        onClick={() => handleToggleLabel(labelItem.label)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <button
                            type="button"
                            className="p-1 hover:bg-slate-200 rounded"
                          >
                            {isExpanded ? (
                              <ChevronDown
                                size={18}
                                className="text-slate-500"
                              />
                            ) : (
                              <ChevronRight
                                size={18}
                                className="text-slate-500"
                              />
                            )}
                          </button>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-900 truncate">
                              {labelItem.label}
                            </p>
                            <p className="text-sm text-slate-500">
                              {labelItem.transaction_count} transaction(s) •{' '}
                              {formatAmount(labelItem.total_amount)}
                            </p>
                          </div>
                        </div>
                        <div
                          className="flex items-center gap-2"
                          onClick={e => e.stopPropagation()}
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleClassifyLabel(
                                labelItem.label,
                                labelItem.transaction_count,
                                labelItem.total_amount
                              )
                            }
                          >
                            <Tag size={14} className="mr-1" />
                            Classer
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() =>
                              handleLinkLabel(
                                labelItem.label,
                                labelItem.transaction_count,
                                labelItem.total_amount
                              )
                            }
                          >
                            <LinkIcon size={14} className="mr-1" />
                            Lier
                          </Button>
                        </div>
                      </div>

                      {/* Transactions détaillées (si étendu) */}
                      {isExpanded && labelExpenses.length > 0 && (
                        <div className="bg-slate-50 border-t border-slate-100">
                          <table className="w-full">
                            <thead>
                              <tr className="bg-slate-100">
                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">
                                  Date
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">
                                  Détail
                                </th>
                                <th className="px-4 py-2 text-right text-xs font-medium text-slate-500 uppercase">
                                  Montant
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {labelExpenses.map(expense => (
                                <tr
                                  key={expense.id}
                                  className="border-t border-slate-100 hover:bg-slate-100"
                                >
                                  <td className="px-4 py-2 text-sm text-slate-600">
                                    {formatDate(expense.emitted_at)}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-slate-700">
                                    {expense.transaction_counterparty_name ??
                                      expense.label}
                                  </td>
                                  <td className="px-4 py-2 text-sm text-right font-medium text-red-600">
                                    -{formatAmount(expense.amount)}
                                  </td>
                                  <td className="px-4 py-2">
                                    <div className="flex items-center gap-1">
                                      {expense.has_attachment && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            handleViewAttachment(expense)
                                          }
                                          className="text-blue-600"
                                        >
                                          <Eye size={14} />
                                        </Button>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleClassify(expense)}
                                      >
                                        <Edit2 size={14} />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          ) : isLoading ? (
            <div className="p-8 text-center">
              <RefreshCw className="mx-auto h-12 w-12 text-blue-500 animate-spin mb-4" />
              <p className="text-slate-600">Chargement des transactions...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-600">Aucune transaction trouvée</p>
              <p className="text-sm text-slate-500 mt-1">
                Modifiez vos filtres ou lancez une synchronisation Qonto
              </p>
            </div>
          ) : (
            /* TABLEAU CLASSIQUE pour les autres onglets */
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Libellé
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      À compléter
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
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
                      onLink={() => {
                        void refetch().catch(error => {
                          console.error(
                            '[DepensesPage] Refetch after link failed:',
                            error
                          );
                        });
                      }}
                      onViewRule={handleViewRule}
                      onConfirmSuggestion={(ruleId, organisationId) => {
                        void handleConfirmSuggestion(
                          ruleId,
                          organisationId
                        ).catch(error => {
                          console.error(
                            '[DepensesPage] Confirm suggestion failed:',
                            error
                          );
                        });
                      }}
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
          selectedExpense?.label ??
          selectedExpense?.transaction_counterparty_name ??
          ''
        }
        amount={selectedExpense?.amount ?? 0}
        transactionId={selectedExpense?.transaction_id}
        counterpartyName={
          selectedExpense?.transaction_counterparty_name ?? undefined
        }
        currentCategory={selectedExpense?.category ?? undefined}
        existingRuleId={
          selectedExpense
            ? suggestionsMap.get(selectedExpense.id)?.matchedRule?.id
            : undefined
        }
        transactionSide={selectedExpense?.side ?? 'debit'}
        // TVA Qonto OCR - pré-remplit le formulaire si disponible
        currentVatRate={selectedExpense?.vat_rate ?? undefined}
        currentVatSource={selectedExpense?.vat_source ?? undefined}
        currentVatBreakdown={selectedExpense?.vat_breakdown ?? undefined}
        onSuccess={() => {
          void handleClassifySuccess().catch(error => {
            console.error(
              '[DepensesPage] Classify success callback failed:',
              error
            );
          });
        }}
      />

      {/* SLICE 3: Modal pour voir/modifier une règle */}
      <RuleModal
        open={ruleModalOpen}
        onOpenChange={setRuleModalOpen}
        rule={selectedRule}
        onUpdate={updateMatchingRule}
        previewApply={previewApply}
        confirmApply={confirmApply}
        onSuccess={() => {
          void handleRuleSuccess().catch(error => {
            console.error(
              '[DepensesPage] Rule success callback failed:',
              error
            );
          });
        }}
      />

      {/* Modal de liaison d'organisation (depuis la vue groupée) */}
      {selectedLabelForLink && (
        <OrganisationLinkingModal
          open={linkModalOpen}
          onOpenChange={setLinkModalOpen}
          label={selectedLabelForLink.label}
          transactionCount={selectedLabelForLink.transactionCount}
          totalAmount={selectedLabelForLink.totalAmount}
          onSuccess={() => {
            void handleLinkSuccess().catch(error => {
              console.error(
                '[DepensesPage] Link success callback failed:',
                error
              );
            });
          }}
        />
      )}
    </div>
  );
}
