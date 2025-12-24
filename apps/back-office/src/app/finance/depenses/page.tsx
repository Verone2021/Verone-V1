'use client';

import { useState } from 'react';

import Link from 'next/link';

import { useToast } from '@verone/common/hooks';
import {
  ExpenseClassificationModal,
  type ClassificationData,
} from '@verone/finance/components';
import {
  EXPENSE_CATEGORIES,
  useExpenses,
  type Expense,
  type ExpenseFilters,
} from '@verone/finance/hooks';
import { Badge, Button, Input, KPICardUnified } from '@verone/ui';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
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
}: {
  expense: Expense;
  onClassify: (expense: Expense) => void;
  onViewAttachment: (expense: Expense) => void;
}) {
  const categoryLabel =
    EXPENSE_CATEGORIES.find(c => c.id === expense.category)?.label ||
    expense.category;

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50">
      <td className="px-4 py-3 text-sm text-slate-600">
        {formatDate(expense.emitted_at)}
      </td>
      <td className="px-4 py-3">
        <div className="max-w-xs">
          <p className="text-sm font-medium text-slate-900 truncate">
            {expense.label}
          </p>
          <p className="text-xs text-slate-500 truncate">
            {expense.transaction_counterparty_name || 'Inconnu'}
          </p>
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
        {expense.counterparty_display_name || expense.organisation_name || '-'}
      </td>
      <td className="px-4 py-3 text-sm text-slate-600">
        {categoryLabel || '-'}
      </td>
      <td className="px-4 py-3 text-center">
        {expense.has_attachment ? (
          <button
            onClick={() => onViewAttachment(expense)}
            className="text-blue-600 hover:text-blue-800"
            title="Voir pièce jointe"
          >
            <Paperclip size={16} />
          </button>
        ) : (
          <span className="text-slate-300">-</span>
        )}
      </td>
      <td className="px-4 py-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onClassify(expense)}
          className="gap-1"
        >
          <FileText size={14} />
          Classer
        </Button>
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

  // État du modal de classement
  const [classifyModalOpen, setClassifyModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // Années disponibles (2022 à aujourd'hui)
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 2021 },
    (_, i) => currentYear - i
  );

  // Handlers
  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchValue }));
  };

  const handleClassify = (expense: Expense) => {
    setSelectedExpense(expense);
    setClassifyModalOpen(true);
  };

  const handleClassifySubmit = async (data: ClassificationData) => {
    try {
      const response = await fetch('/api/expenses/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors du classement');
      }

      const result = await response.json();

      toast({
        title: 'Dépense classée',
        description: result.message,
      });

      // Rafraîchir la liste
      await refetch();
    } catch (error) {
      console.error('[DepensesPage] Classification error:', error);
      throw error;
    }
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
                  placeholder="Rechercher par libellé ou fournisseur..."
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

            {/* Filtre statut */}
            <select
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
              value={filters.status || 'all'}
              onChange={e =>
                setFilters(prev => ({
                  ...prev,
                  status: e.target.value as ExpenseFilters['status'],
                }))
              }
            >
              <option value="all">Tous les statuts</option>
              <option value="unclassified">Non classées</option>
              <option value="classified">Classées</option>
              <option value="needs_review">À revoir</option>
              <option value="ignored">Ignorées</option>
            </select>

            {/* Filtre catégorie */}
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
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
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
                      Fournisseur
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                      <Paperclip size={14} className="inline" />
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

      {/* Modal de classement */}
      <ExpenseClassificationModal
        expense={selectedExpense}
        open={classifyModalOpen}
        onOpenChange={setClassifyModalOpen}
        onClassify={handleClassifySubmit}
      />
    </div>
  );
}
