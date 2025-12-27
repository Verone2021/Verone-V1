'use client';

import { useState, useRef, useEffect, useMemo } from 'react';

import { SupplierCell } from '@verone/finance/components';
import {
  useExpenses,
  useAutoClassification,
  type Expense,
} from '@verone/finance/hooks';
import { Badge, Button, Input, KPICardUnified } from '@verone/ui';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Paperclip,
  RefreshCw,
  Search,
  Upload,
  Eye,
  Clock,
  FileWarning,
} from 'lucide-react';
import toast from 'react-hot-toast';

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

// Composant pour l'upload d'une pièce jointe
function AttachmentUploadCell({
  expense,
  onUploadSuccess,
}: {
  expense: Expense;
  onUploadSuccess: () => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Extraire l'ID Qonto de la transaction depuis raw_data uniquement
    // L'ID Qonto est stocké dans raw_data.id ou raw_data.external_id
    const rawData = expense.raw_data as {
      id?: string;
      external_id?: string;
      transaction_id?: string;
    };
    const qontoTransactionId =
      rawData.id || rawData.external_id || rawData.transaction_id;

    if (!qontoTransactionId) {
      toast.error(
        "Cette transaction n'a pas d'ID Qonto. L'upload de justificatif n'est possible que pour les transactions synchronisées depuis Qonto."
      );
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('transactionId', qontoTransactionId);

    try {
      const response = await fetch('/api/qonto/attachments/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'upload");
      }

      toast.success('Justificatif uploadé avec succès');
      onUploadSuccess();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erreur inconnue';
      toast.error(message);
    } finally {
      setIsUploading(false);
      // Reset l'input pour permettre le re-upload du même fichier
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleViewAttachment = () => {
    const rawData = expense.raw_data as { attachments?: Array<{ id: string }> };
    const attachmentId = rawData.attachments?.[0]?.id;

    if (attachmentId) {
      window.open(`/api/qonto/attachments/${attachmentId}`, '_blank');
    }
  };

  if (expense.has_attachment) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="default" className="gap-1 bg-green-100 text-green-700">
          <CheckCircle2 size={12} />
          Reçu
        </Badge>
        <button
          onClick={handleViewAttachment}
          className="text-blue-600 hover:text-blue-800"
          title="Voir pièce jointe"
        >
          <Eye size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="gap-1"
      >
        {isUploading ? (
          <>
            <RefreshCw size={14} className="animate-spin" />
            Upload...
          </>
        ) : (
          <>
            <Upload size={14} />
            Ajouter
          </>
        )}
      </Button>
    </div>
  );
}

// Ligne de transaction
function TransactionRow({
  expense,
  onUploadSuccess,
  suggestion,
}: {
  expense: Expense;
  onUploadSuccess: () => void;
  suggestion?: {
    organisationId: string | null;
    organisationName: string | null;
    category: string | null;
    confidence: 'high' | 'medium' | 'none';
  };
}) {
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
          {expense.transaction_counterparty_name && (
            <p className="text-xs text-slate-500 truncate">
              {expense.transaction_counterparty_name}
            </p>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-right">
        <span
          className={`text-sm font-semibold ${expense.side === 'debit' ? 'text-red-600' : 'text-green-600'}`}
        >
          {expense.side === 'debit' ? '-' : '+'}
          {formatAmount(expense.amount)}
        </span>
      </td>
      <td className="px-4 py-3 text-sm">
        <SupplierCell
          counterpartyName={expense.transaction_counterparty_name}
          label={expense.label}
          organisationId={expense.organisation_id}
          organisationName={expense.organisation_name}
          transactionId={expense.id}
          onLink={() => onUploadSuccess()}
          suggestedOrganisationId={suggestion?.organisationId}
          suggestedOrganisationName={suggestion?.organisationName}
          suggestedCategory={suggestion?.category}
          confidence={suggestion?.confidence}
          showCategory
        />
      </td>
      <td className="px-4 py-3">
        <AttachmentUploadCell
          expense={expense}
          onUploadSuccess={onUploadSuccess}
        />
      </td>
    </tr>
  );
}

export default function JustificatifsPage() {
  const [searchValue, setSearchValue] = useState('');
  const [showWithAttachment, setShowWithAttachment] = useState(false);
  const [yearFilter, setYearFilter] = useState<number | undefined>(undefined);

  // Utiliser useExpenses pour récupérer toutes les dépenses
  // minYear: 2025 = on ignore les transactions avant 2025 pour les justificatifs
  const { expenses, stats, isLoading, error, refetch, setFilters } =
    useExpenses({
      status: 'all',
      hasAttachment: false, // Par défaut: sans justificatif
      minYear: 2025, // Ignorer transactions avant 2025
    });

  // Mettre à jour les filtres quand les states changent
  useEffect(() => {
    setFilters({
      status: 'all',
      hasAttachment: showWithAttachment ? undefined : false,
      year: yearFilter,
      // Si une année spécifique est sélectionnée, on ne met pas minYear
      // Sinon on filtre à partir de 2025 par défaut
      minYear: yearFilter ? undefined : 2025,
      search: searchValue || undefined,
    });
  }, [searchValue, yearFilter, showWithAttachment, setFilters]);

  // Auto-classification: appliquer les règles de matching
  const { transactionsWithSuggestions } = useAutoClassification(
    expenses as (Expense & Record<string, unknown>)[]
  );

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

  // Stats spécifiques justificatifs
  const withAttachment = expenses.filter(e => e.has_attachment).length;
  const withoutAttachment = expenses.filter(e => !e.has_attachment).length;
  const totalMissingAmount = expenses
    .filter(e => !e.has_attachment)
    .reduce((sum, e) => sum + Math.abs(e.amount), 0);

  // Années disponibles (à partir de 2025)
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 2024 }, // À partir de 2025
    (_, i) => currentYear - i
  ).filter(y => y >= 2025); // Sécurité: uniquement 2025+

  const handleSearch = () => {
    // La recherche est appliquée via le state
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Justificatifs en Attente
            </h1>
            <p className="text-sm text-slate-600">
              Gérez et uploadez les pièces jointes pour vos transactions
              bancaires
            </p>
          </div>
          <div className="flex items-center gap-2">
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
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICardUnified
            variant="elegant"
            title="Total Transactions"
            value={stats.total}
            icon={FileText}
          />
          <KPICardUnified
            variant="elegant"
            title="Sans Justificatif"
            value={withoutAttachment}
            icon={FileWarning}
            onClick={() => setShowWithAttachment(false)}
          />
          <KPICardUnified
            variant="elegant"
            title="Avec Justificatif"
            value={withAttachment}
            icon={Paperclip}
            onClick={() => setShowWithAttachment(true)}
          />
          <KPICardUnified
            variant="elegant"
            title="Montant à Justifier"
            value={formatAmount(totalMissingAmount)}
            icon={Clock}
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
              value={yearFilter || ''}
              onChange={e =>
                setYearFilter(
                  e.target.value ? parseInt(e.target.value) : undefined
                )
              }
            >
              <option value="">Toutes les années</option>
              {years.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            {/* Toggle avec/sans justificatif */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="attachmentFilter"
                  checked={!showWithAttachment}
                  onChange={() => setShowWithAttachment(false)}
                  className="text-blue-600"
                />
                Sans justificatif
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="attachmentFilter"
                  checked={showWithAttachment}
                  onChange={() => setShowWithAttachment(true)}
                  className="text-blue-600"
                />
                Tous
              </label>
            </div>
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
              <p className="text-slate-600">Chargement des transactions...</p>
            </div>
          ) : expenses.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <p className="text-slate-600 font-medium">
                {showWithAttachment
                  ? 'Aucune transaction trouvée'
                  : 'Toutes les transactions ont un justificatif !'}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {showWithAttachment
                  ? 'Modifiez vos filtres ou synchronisez Qonto'
                  : 'Excellent travail, tout est à jour.'}
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
                      Contrepartie
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Justificatif
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(expense => (
                    <TransactionRow
                      key={expense.id}
                      expense={expense}
                      onUploadSuccess={refetch}
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
            Affichage de {expenses.length} transaction(s)
            {!showWithAttachment && ` sans justificatif`}
          </div>
        )}
      </div>
    </div>
  );
}
