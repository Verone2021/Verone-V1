'use client';

import { useState, useMemo } from 'react';

import Link from 'next/link';

import {
  useBankReconciliation,
  type BankTransaction,
  getPcgCategory,
  getPcgColor,
} from '@verone/finance';
import {
  RapprochementModal,
  InvoiceUploadModal,
  SupplierCell,
  QuickClassificationModal,
  OrganisationLinkingModal,
  RuleModal,
  type TransactionForUpload,
} from '@verone/finance/components';
import { useMatchingRules, type MatchingRule } from '@verone/finance/hooks';
import {
  useExpenses,
  useAutoClassification,
  useUnifiedTransactions,
  useTransactionActions,
  useUnreconciledOrders,
  type UnifiedTransaction,
  type UnifiedStatus,
} from '@verone/finance/hooks';
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  Badge,
  Input,
  ScrollArea,
  Tabs,
  TabsList,
  TabsTrigger,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Separator,
  KPICardUnified,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { SyncButton } from '@verone/ui-business';
import { createClient } from '@verone/utils/supabase/client';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  AlertCircle,
  Search,
  Clock,
  FileText,
  ExternalLink,
  Eye,
  Paperclip,
  Building2,
  Settings,
  Tag,
  Upload,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Lock,
  FileX,
  FileCheck,
  CheckCircle,
  ShoppingCart,
  Zap,
  Trash2,
  Percent,
} from 'lucide-react';
import { toast } from 'sonner';

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

// =====================================================================
// INDICATEUR ÉLÉMENTS MANQUANTS (Pattern dépenses)
// =====================================================================

function TransactionCompletenessIndicator({ tx }: { tx: UnifiedTransaction }) {
  const missingItems: { key: string; label: string; icon: typeof Tag }[] = [];

  // Catégorie manquante
  if (!tx.category_pcg) {
    missingItems.push({ key: 'category', label: 'Catégorie', icon: Tag });
  }

  // Justificatif manquant (sauf si facultatif)
  const hasAttachment = (tx.attachment_ids?.length ?? 0) > 0;
  if (!hasAttachment && !tx.justification_optional) {
    missingItems.push({
      key: 'attachment',
      label: 'Justificatif',
      icon: Paperclip,
    });
  }

  // TVA manquante (seulement si catégorisé et pas de TVA)
  if (
    tx.category_pcg &&
    tx.vat_rate == null &&
    (!tx.vat_breakdown || tx.vat_breakdown.length === 0)
  ) {
    missingItems.push({ key: 'vat', label: 'TVA', icon: Percent });
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

// =====================================================================
// BADGE ORGANISATION (Best practice Pennylane/Qonto)
// =====================================================================

function OrganisationBadge({ transaction }: { transaction: BankTransaction }) {
  // TODO: Récupérer l'organisation liée depuis la transaction
  // Pour l'instant, simuler le statut basé sur matching_status
  const hasOrganisation =
    transaction.matching_status === 'manual_matched' ||
    transaction.matching_status === 'auto_matched';
  const isIgnored = transaction.matching_status === 'ignored';

  if (hasOrganisation) {
    return (
      <Badge
        variant="default"
        className="gap-1 bg-emerald-600 hover:bg-emerald-700"
      >
        <Building2 className="h-3 w-3" />
        Lié
      </Badge>
    );
  }

  if (isIgnored) {
    return (
      <Badge variant="secondary" className="gap-1">
        <XCircle className="h-3 w-3" />
        Ignoré
      </Badge>
    );
  }

  return (
    <Badge variant="warning" className="gap-1">
      <Clock className="h-3 w-3" />À classifier
    </Badge>
  );
}

// =====================================================================
// COMPOSANT: LIGNE TRANSACTION UNIFIÉE
// =====================================================================

function TransactionRow({
  transaction,
  onClick,
  isSelected,
  onLink,
  suggestion,
}: {
  transaction: BankTransaction;
  onClick: () => void;
  isSelected: boolean;
  onLink: () => void;
  suggestion?: {
    organisationId: string | null;
    organisationName: string | null;
    category: string | null;
    confidence: 'high' | 'medium' | 'none';
    matchType?: 'exact' | 'similar' | 'none';
  };
}) {
  const hasAttachments =
    transaction.attachment_ids && transaction.attachment_ids.length > 0;
  const isCredit = transaction.side === 'credit';

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-4 p-3 border-b cursor-pointer transition-colors
        ${isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}
      `}
    >
      {/* Indicateur type */}
      <div
        className={`
          flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
          ${isCredit ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
        `}
      >
        {isCredit ? (
          <ArrowDownLeft className="h-4 w-4" />
        ) : (
          <ArrowUpRight className="h-4 w-4" />
        )}
      </div>

      {/* Date */}
      <div className="w-24 text-sm text-muted-foreground">
        {formatDate(transaction.settled_at || transaction.emitted_at)}
      </div>

      {/* Libellé & Contrepartie */}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">
          {transaction.label || transaction.note || 'Sans libellé'}
        </p>
        <div className="text-sm text-muted-foreground truncate">
          <SupplierCell
            counterpartyName={transaction.counterparty_name}
            label={transaction.label}
            transactionId={transaction.id}
            onLink={onLink}
            suggestedOrganisationId={suggestion?.organisationId}
            suggestedOrganisationName={suggestion?.organisationName}
            suggestedCategory={suggestion?.category}
            confidence={suggestion?.confidence}
            matchType={suggestion?.matchType}
            showCategory
          />
        </div>
      </div>

      {/* Badge Organisation */}
      <div className="w-28">
        <OrganisationBadge transaction={transaction} />
      </div>

      {/* Badge pièce jointe */}
      <div className="w-24 flex justify-center">
        {hasAttachments ? (
          <Badge
            variant="default"
            className="text-xs bg-blue-600 hover:bg-blue-700 gap-1"
          >
            <Paperclip className="h-3 w-3" />
            PDF
          </Badge>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </div>

      {/* Montant */}
      <div className="w-28 text-right">
        <span
          className={`font-semibold ${isCredit ? 'text-green-600' : 'text-red-600'}`}
        >
          {isCredit ? '+' : ''}
          {formatAmount(
            isCredit
              ? Math.abs(transaction.amount)
              : -Math.abs(transaction.amount)
          )}
        </span>
      </div>
    </div>
  );
}

// =====================================================================
// COMPOSANT: PANNEAU DÉTAIL TRANSACTION
// =====================================================================

function TransactionDetailPanel({
  transaction,
  onClose,
  onOpenRapprochementModal,
  onOpenUploadModal,
  onLink,
  suggestion,
}: {
  transaction: BankTransaction;
  onClose: () => void;
  onOpenRapprochementModal: () => void;
  onOpenUploadModal: () => void;
  onLink: () => void;
  suggestion?: {
    organisationId: string | null;
    organisationName: string | null;
    category: string | null;
    confidence: 'high' | 'medium' | 'none';
    matchType?: 'exact' | 'similar' | 'none';
  };
}) {
  const hasAttachments =
    transaction.attachment_ids && transaction.attachment_ids.length > 0;
  const isCredit = transaction.side === 'credit';

  const handleViewPdf = () => {
    if (hasAttachments && transaction.attachment_ids) {
      window.open(
        `/api/qonto/attachments/${transaction.attachment_ids[0]}`,
        '_blank'
      );
    }
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          {isCredit ? (
            <ArrowDownLeft className="h-5 w-5 text-green-600" />
          ) : (
            <ArrowUpRight className="h-5 w-5 text-red-600" />
          )}
          Détail de la transaction
        </SheetTitle>
      </SheetHeader>

      <div className="space-y-6 mt-6">
        {/* Montant principal */}
        <div className="text-center py-4">
          <p className="text-4xl font-bold">
            <span className={isCredit ? 'text-green-600' : 'text-red-600'}>
              {isCredit ? '+' : ''}
              {formatAmount(
                isCredit
                  ? Math.abs(transaction.amount)
                  : -Math.abs(transaction.amount)
              )}
            </span>
          </p>
          <p className="text-muted-foreground mt-1">
            {formatDate(transaction.settled_at || transaction.emitted_at)}
          </p>
        </div>

        {/* Infos transaction */}
        <Card>
          <CardContent className="pt-4 space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Libellé</p>
              <p className="font-medium">
                {transaction.label || transaction.note || 'Sans libellé'}
              </p>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Contrepartie</p>
                <div className="font-medium">
                  <SupplierCell
                    counterpartyName={transaction.counterparty_name}
                    label={transaction.label}
                    transactionId={transaction.id}
                    onLink={onLink}
                    suggestedOrganisationId={suggestion?.organisationId}
                    suggestedOrganisationName={suggestion?.organisationName}
                    suggestedCategory={suggestion?.category}
                    confidence={suggestion?.confidence}
                    matchType={suggestion?.matchType}
                    showCategory
                  />
                </div>
              </div>
              <div>
                <p className="text-muted-foreground">Type</p>
                <p className="font-medium">
                  {transaction.operation_type || 'Virement'}
                </p>
              </div>
            </div>

            {transaction.reference && (
              <>
                <Separator />
                <div className="text-sm">
                  <p className="text-muted-foreground">Référence</p>
                  <p className="font-medium font-mono text-xs">
                    {transaction.reference}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Section Rapprochement */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Tag className="h-4 w-4" />
              Rapprochement
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {transaction.matched_document_id ? (
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-emerald-900">
                    Document rapproché
                  </p>
                  <p className="text-sm text-emerald-700">
                    Cette transaction est liée à un document
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenRapprochementModal}
                >
                  Modifier
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={onOpenRapprochementModal}
              >
                <FileText className="h-4 w-4" />
                Rapprocher (document/commande)
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Section Justificatif */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Paperclip className="h-4 w-4" />
              Justificatif
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {hasAttachments ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">
                      Pièce jointe disponible
                    </p>
                    <p className="text-sm text-blue-700">
                      Document attaché depuis Qonto
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewPdf}
                    className="flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Voir
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={onOpenUploadModal}
              >
                <Upload className="h-4 w-4" />
                Uploader un justificatif
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="w-full">
            Fermer
          </Button>
        </div>
      </div>
    </>
  );
}

// =====================================================================
// PAGE COMPONENT
// =====================================================================

type TabFilter = 'all' | 'credits' | 'debits' | 'unclassified';

// =====================================================================
// PAGE LEGACY (V1)
// =====================================================================

function TransactionsPageLegacy() {
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [selectedTransaction, setSelectedTransaction] =
    useState<BankTransaction | null>(null);
  const [search, setSearch] = useState('');
  const [showRapprochementModal, setShowRapprochementModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Hook de transactions bancaires
  const { creditTransactions, debitTransactions, loading, error, refresh } =
    useBankReconciliation();

  // Hook dépenses pour les stats
  const { stats: expenseStats } = useExpenses({ status: 'all' });

  // Toutes les transactions combinées
  const allTransactions = useMemo(() => {
    return [...creditTransactions, ...debitTransactions].sort((a, b) => {
      const dateA = new Date(a.emitted_at || '').getTime();
      const dateB = new Date(b.emitted_at || '').getTime();
      return dateB - dateA;
    });
  }, [creditTransactions, debitTransactions]);

  // Auto-classification: appliquer les règles de matching
  const { transactionsWithSuggestions } = useAutoClassification(
    allTransactions as (BankTransaction & Record<string, unknown>)[]
  );

  // Map pour accès rapide aux suggestions par ID
  const suggestionsMap = useMemo(() => {
    const map = new Map<
      string,
      (typeof transactionsWithSuggestions)[0]['suggestion']
    >();
    transactionsWithSuggestions.forEach(({ original, suggestion }) => {
      const tx = original as BankTransaction;
      map.set(tx.id, suggestion);
    });
    return map;
  }, [transactionsWithSuggestions]);

  // Filtrer selon l'onglet actif
  const filteredTransactions = useMemo(() => {
    let filtered = allTransactions;

    // Filtre par onglet
    switch (activeTab) {
      case 'credits':
        filtered = creditTransactions;
        break;
      case 'debits':
        filtered = debitTransactions;
        break;
      case 'unclassified':
        filtered = allTransactions.filter(
          tx => tx.matching_status === 'unmatched'
        );
        break;
    }

    // Filtre par recherche
    if (search) {
      const s = search.toLowerCase();
      filtered = filtered.filter(
        tx =>
          tx.label?.toLowerCase().includes(s) ||
          tx.counterparty_name?.toLowerCase().includes(s) ||
          tx.reference?.toLowerCase().includes(s)
      );
    }

    return filtered;
  }, [
    allTransactions,
    creditTransactions,
    debitTransactions,
    activeTab,
    search,
  ]);

  // Stats
  const stats = useMemo(() => {
    const unclassified = allTransactions.filter(
      tx => tx.matching_status === 'unmatched'
    );
    const classified = allTransactions.filter(
      tx =>
        tx.matching_status === 'manual_matched' ||
        tx.matching_status === 'auto_matched'
    );
    const withAttachment = allTransactions.filter(
      tx => tx.attachment_ids && tx.attachment_ids.length > 0
    );

    return {
      total: allTransactions.length,
      unclassified: unclassified.length,
      classified: classified.length,
      withAttachment: withAttachment.length,
      credits: creditTransactions.length,
      debits: debitTransactions.length,
    };
  }, [allTransactions, creditTransactions, debitTransactions]);

  // Convertir pour le modal upload
  const transactionForUpload: TransactionForUpload | null = useMemo(() => {
    if (!selectedTransaction) return null;
    return {
      id: selectedTransaction.id,
      transaction_id: selectedTransaction.transaction_id,
      label: selectedTransaction.label || '',
      counterparty_name: selectedTransaction.counterparty_name,
      amount: selectedTransaction.amount,
      currency: selectedTransaction.currency || 'EUR',
      emitted_at: selectedTransaction.emitted_at || '',
      has_attachment: Boolean(
        selectedTransaction.attachment_ids &&
          selectedTransaction.attachment_ids.length > 0
      ),
      matched_document_id: null,
      order_number: null,
    };
  }, [selectedTransaction]);

  // Handler sync
  const handleSync = async () => {
    try {
      const response = await fetch('/api/qonto/sync', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        toast.success('Synchronisation terminée', {
          description: `${result.itemsCreated} nouvelles, ${result.itemsUpdated} mises à jour`,
        });
      }
      await refresh();
    } catch (err) {
      console.error('[Qonto Sync] Error:', err);
      toast.error('Erreur de synchronisation');
      await refresh();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Rapprochement Bancaire
            </h1>
            <p className="text-sm text-slate-600">
              Liez vos transactions Qonto à des documents ou commandes
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/finance/depenses/regles">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Règles auto
              </Button>
            </Link>
            <SyncButton onSync={handleSync} label="Sync Qonto" showLastSync />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Erreur */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICardUnified
            variant="elegant"
            title="Total"
            value={stats.total}
            icon={FileText}
          />
          <KPICardUnified
            variant="elegant"
            title="À classifier"
            value={stats.unclassified}
            icon={Clock}
            onClick={() => setActiveTab('unclassified')}
          />
          <KPICardUnified
            variant="elegant"
            title="Classées"
            value={stats.classified}
            icon={CheckCircle2}
          />
          <KPICardUnified
            variant="elegant"
            title="Avec justificatif"
            value={stats.withAttachment}
            icon={Paperclip}
          />
          <KPICardUnified
            variant="elegant"
            title="Entrées"
            value={stats.credits}
            icon={ArrowDownLeft}
            onClick={() => setActiveTab('credits')}
          />
        </div>

        {/* Tabs et Recherche */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Tabs
                value={activeTab}
                onValueChange={v => {
                  setActiveTab(v as TabFilter);
                  setSelectedTransaction(null);
                }}
              >
                <TabsList>
                  <TabsTrigger value="all" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Toutes
                    <Badge variant="secondary" className="ml-1">
                      {stats.total}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="credits" className="gap-2">
                    <ArrowDownLeft className="h-4 w-4 text-green-600" />
                    Entrées
                    <Badge variant="secondary" className="ml-1">
                      {stats.credits}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="debits" className="gap-2">
                    <ArrowUpRight className="h-4 w-4 text-red-600" />
                    Sorties
                    <Badge variant="secondary" className="ml-1">
                      {stats.debits}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="unclassified" className="gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />À classifier
                    <Badge variant="warning" className="ml-1">
                      {stats.unclassified}
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* En-tête tableau */}
            <div className="flex items-center gap-4 px-3 py-2 bg-muted/50 text-sm font-medium text-muted-foreground border-b">
              <div className="w-8" />
              <div className="w-24">Date</div>
              <div className="flex-1">Libellé</div>
              <div className="w-28">Organisation</div>
              <div className="w-24 text-center">Justif.</div>
              <div className="w-28 text-right">Montant</div>
            </div>

            {/* Liste des transactions */}
            <ScrollArea className="h-[500px]">
              {loading ? (
                <div className="space-y-0">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div
                      key={i}
                      className="h-16 border-b animate-pulse bg-muted/30"
                    />
                  ))}
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Aucune transaction trouvée</p>
                  <p className="text-sm mt-2">
                    {search
                      ? 'Modifiez votre recherche'
                      : 'Cliquez sur "Sync Qonto" pour récupérer les transactions'}
                  </p>
                </div>
              ) : (
                <div>
                  {filteredTransactions.map(tx => (
                    <TransactionRow
                      key={tx.id}
                      transaction={tx}
                      onClick={() => setSelectedTransaction(tx)}
                      isSelected={selectedTransaction?.id === tx.id}
                      onLink={() => refresh()}
                      suggestion={suggestionsMap.get(tx.id)}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Footer */}
        {filteredTransactions.length > 0 && (
          <div className="text-sm text-slate-500 text-center">
            Affichage de {filteredTransactions.length} transaction(s)
          </div>
        )}
      </div>

      {/* Sheet latéral détail */}
      <Sheet
        open={selectedTransaction !== null}
        onOpenChange={open => {
          if (!open) setSelectedTransaction(null);
        }}
      >
        <SheetContent className="w-[450px] sm:max-w-[450px]">
          {selectedTransaction && (
            <TransactionDetailPanel
              transaction={selectedTransaction}
              onClose={() => setSelectedTransaction(null)}
              onOpenRapprochementModal={() => setShowRapprochementModal(true)}
              onOpenUploadModal={() => setShowUploadModal(true)}
              onLink={() => refresh()}
              suggestion={suggestionsMap.get(selectedTransaction.id)}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Modal rapprochement - lier à un document ou une commande */}
      <RapprochementModal
        open={showRapprochementModal}
        onOpenChange={setShowRapprochementModal}
        transactionId={selectedTransaction?.id}
        label={
          selectedTransaction?.label ||
          selectedTransaction?.counterparty_name ||
          ''
        }
        amount={selectedTransaction?.amount || 0}
        counterpartyName={selectedTransaction?.counterparty_name}
        onSuccess={() => {
          toast.success('Transaction rapprochée');
          refresh();
          setShowRapprochementModal(false);
        }}
      />

      {/* Modal upload facture */}
      <InvoiceUploadModal
        transaction={transactionForUpload}
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        onUploadComplete={() => {
          toast.success('Justificatif uploadé');
          refresh();
          setShowUploadModal(false);
        }}
      />
    </div>
  );
}

// =====================================================================
// PAGE V2 (FINANCE V2 - Unified)
// =====================================================================

type TabFilterV2 =
  | 'all'
  | 'to_process'
  | 'classified'
  | 'matched'
  | 'cca'
  | 'ignored';

type SideFilter = 'all' | 'credit' | 'debit';

function TransactionsPageV2() {
  const [activeTab, setActiveTab] = useState<TabFilterV2>('all');
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
  const [yearFilter, setYearFilter] = useState<number>(currentYear);

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
      status: activeTab === 'all' ? 'all' : activeTab,
      side: sideFilter === 'all' ? 'all' : sideFilter,
      search: search || undefined,
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
    ignore,
    unignore,
    toggleIgnore,
    markCCA,
  } = useTransactionActions();

  // Commandes non rapprochées (pour KPI)
  const { count: unreconciledOrdersCount } = useUnreconciledOrders();

  // Handle tab change
  const handleTabChange = (tab: TabFilterV2) => {
    setActiveTab(tab);
    setSelectedTransaction(null);
    setFilters({
      status: tab === 'all' ? 'all' : tab,
      side: sideFilter === 'all' ? 'all' : sideFilter,
      search: search || undefined,
      year: yearFilter,
    });
  };

  // Handle side filter change
  const handleSideChange = (side: SideFilter) => {
    setSideFilter(side);
    setSelectedTransaction(null);
    setFilters({
      status: activeTab === 'all' ? 'all' : activeTab,
      side: side === 'all' ? 'all' : side,
      search: search || undefined,
      year: yearFilter,
    });
  };

  // Handle year filter change
  const handleYearChange = (year: number) => {
    setYearFilter(year);
    setSelectedTransaction(null);
    setFilters({
      status: activeTab === 'all' ? 'all' : activeTab,
      side: sideFilter === 'all' ? 'all' : sideFilter,
      search: search || undefined,
      year,
    });
  };

  // Handle search
  const handleSearch = (value: string) => {
    setSearch(value);
    setFilters({
      status: activeTab === 'all' ? 'all' : activeTab,
      side: sideFilter === 'all' ? 'all' : sideFilter,
      search: value || undefined,
      year: yearFilter,
    });
  };

  // Sync handler
  const handleSync = async () => {
    try {
      const response = await fetch('/api/qonto/sync', { method: 'POST' });
      const result = await response.json();
      if (result.success) {
        toast.success('Synchronisation terminee', {
          description: `${result.itemsCreated} nouvelles, ${result.itemsUpdated} mises a jour`,
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

      const eligibleIds = txs?.map(t => t.id) || [];

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
      refresh();
    } catch (err) {
      toast.error('Erreur lors de la catégorisation');
      console.error('[AutoCategorize] Error:', err);
    } finally {
      setIsAutoCategorizing(false);
    }
  };

  // Classification handler
  const handleClassify = async (categoryPcg: string) => {
    if (!selectedTransaction) return;
    const result = await classify(selectedTransaction.id, categoryPcg);
    if (result.success) {
      toast.success('Transaction classee');
      await refresh();
      setShowClassificationModal(false);
    } else {
      toast.error(result.error || 'Erreur');
    }
  };

  // Link organisation handler
  const handleLinkOrganisation = async (organisationId: string) => {
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
      toast.error(result.error || 'Erreur');
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
        toast.error(result.error || 'Erreur');
      }
    }
  };

  // Legacy ignore handler (for backward compatibility)
  const handleIgnore = async () => handleToggleIgnore(true);
  const handleUnignore = async () => handleToggleIgnore(false);

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
    } catch (err) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  // CCA handler
  const handleMarkCCA = async () => {
    if (!selectedTransaction) return;
    const result = await markCCA(selectedTransaction.id);
    if (result.success) {
      toast.success('Marque comme Compte Courant Associe (455)');
      await refresh();
      setSelectedTransaction(null);
    } else {
      toast.error(result.error || 'Erreur');
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
    const tx = uploadTransaction || selectedTransaction;
    if (!tx) return null;
    return {
      id: tx.id,
      transaction_id: tx.transaction_id,
      label: tx.label || '',
      counterparty_name: tx.counterparty_name,
      amount: tx.amount,
      currency: 'EUR',
      emitted_at: tx.emitted_at || '',
      has_attachment: tx.has_attachment,
      matched_document_id: tx.matched_document_id,
      order_number: null,
    };
  }, [uploadTransaction, selectedTransaction]);

  // Progress percentage
  const progressPercent = stats
    ? Math.round(
        ((stats.total_count - stats.to_process_count) / stats.total_count) * 100
      ) || 0
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Transactions</h1>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-slate-600">
                {progressPercent}% traite
              </p>
              <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAutoCategorizeCredits}
              disabled={isAutoCategorizing}
              title="Catégoriser toutes les entrées non classées en 707 (Ventes)"
            >
              <Zap className="h-4 w-4 mr-2" />
              {isAutoCategorizing ? 'En cours...' : 'Entrées → 707'}
            </Button>
            <Link href="/finance/depenses/regles">
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Regles
              </Button>
            </Link>
            <SyncButton onSync={handleSync} label="Sync Qonto" showLastSync />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
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

        {/* KPIs */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KPICardUnified
              variant="elegant"
              title="A traiter"
              value={stats.to_process_count}
              icon={Clock}
              onClick={() => handleTabChange('to_process')}
            />
            <KPICardUnified
              variant="elegant"
              title="Commandes à rapprocher"
              value={unreconciledOrdersCount}
              icon={ShoppingCart}
              description="Commandes sans transaction liée"
            />
            <KPICardUnified
              variant="elegant"
              title="Rapprochees"
              value={stats.matched_count}
              icon={CheckCircle2}
              onClick={() => handleTabChange('matched')}
            />
            <KPICardUnified
              variant="elegant"
              title="CCA"
              value={stats.cca_count}
              icon={Building2}
              onClick={() => handleTabChange('cca')}
            />
            <KPICardUnified
              variant="elegant"
              title="Avec justif"
              value={stats.with_attachment_count}
              icon={Paperclip}
            />
            <KPICardUnified
              variant="elegant"
              title="Ignorees"
              value={stats.ignored_count}
              icon={XCircle}
              onClick={() => handleTabChange('ignored')}
            />
          </div>
        )}

        {/* Tabs et Recherche */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <Tabs
                value={activeTab}
                onValueChange={v => handleTabChange(v as TabFilterV2)}
              >
                <TabsList>
                  <TabsTrigger value="all" className="gap-2">
                    Toutes
                    <Badge variant="secondary" className="ml-1">
                      {stats?.total_count || 0}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="to_process" className="gap-2">
                    <Clock className="h-4 w-4 text-amber-600" />A traiter
                    <Badge variant="warning" className="ml-1">
                      {stats?.to_process_count || 0}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger value="matched" className="gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Rapprochees
                  </TabsTrigger>
                  <TabsTrigger value="cca" className="gap-2">
                    <Building2 className="h-4 w-4 text-purple-600" />
                    CCA
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>

          {/* Filtres */}
          <div className="px-6 pb-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Recherche */}
              <div className="flex-1 min-w-[200px] max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par libellé..."
                    className="pl-9"
                    value={search}
                    onChange={e => handleSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Filtre Entrées/Sorties */}
              <select
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium"
                value={sideFilter}
                onChange={e =>
                  handleSideChange(e.target.value as 'all' | 'credit' | 'debit')
                }
              >
                <option value="all">📊 Toutes transactions</option>
                <option value="debit">📤 Sorties (dépenses)</option>
                <option value="credit">📥 Entrées (recettes)</option>
              </select>

              {/* Filtre Année */}
              <select
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm"
                value={yearFilter}
                onChange={e => handleYearChange(parseInt(e.target.value))}
              >
                {years.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <CardContent className="p-0">
            {/* Header tableau */}
            <div className="flex items-center gap-3 px-3 py-2 bg-muted/50 text-sm font-medium text-muted-foreground border-b">
              <div className="w-8" />
              <div className="w-20">Date</div>
              <div className="flex-1 min-w-0">Libellé</div>
              <div className="w-44">Catégorie</div>
              <div className="w-32">À compléter</div>
              <div className="w-36">Justificatif</div>
              <div className="w-24 text-right">Montant</div>
            </div>

            {/* Liste des transactions */}
            <div>
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
                  {transactions.map(tx => (
                    <div
                      key={tx.id}
                      data-testid={`tx-row-${tx.id}`}
                      onClick={() => setSelectedTransaction(tx)}
                      className={`
                        flex items-center gap-3 p-3 border-b cursor-pointer transition-colors
                        ${selectedTransaction?.id === tx.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}
                        ${tx.unified_status === 'ignored' ? 'opacity-50' : ''}
                      `}
                    >
                      {/* Type */}
                      <div
                        className={`
                        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                        ${tx.side === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}
                      `}
                      >
                        {tx.side === 'credit' ? (
                          <ArrowDownLeft className="h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" />
                        )}
                      </div>

                      {/* Date */}
                      <div className="w-20 text-sm text-muted-foreground">
                        {formatDate(tx.settled_at || tx.emitted_at)}
                      </div>

                      {/* Libellé + Organisation en bleu */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {tx.label || 'Sans libellé'}
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground truncate">
                            {tx.counterparty_name || '-'}
                          </span>
                          {tx.organisation_name && (
                            <span className="text-blue-600 truncate">
                              • {tx.organisation_name}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Catégorie avec badge couleur + code PCG */}
                      <div className="w-44 flex items-center gap-2 text-sm">
                        {tx.category_pcg ? (
                          <>
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: getPcgColor(tx.category_pcg),
                              }}
                            />
                            <div className="min-w-0">
                              <p className="text-slate-700 truncate">
                                {getPcgCategory(tx.category_pcg)?.label ||
                                  tx.category_pcg}
                              </p>
                              <p className="text-xs text-slate-400">
                                {tx.category_pcg}
                              </p>
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </div>

                      {/* Colonne À compléter - Badges éléments manquants */}
                      <div className="w-32">
                        <TransactionCompletenessIndicator tx={tx} />
                      </div>

                      {/* Justificatif: PJ présente / Facultatif (vert) / Upload (rouge) */}
                      <div className="w-36">
                        {(() => {
                          // SOURCE UNIQUE: tx.attachment_ids (colonne directe)
                          const hasAttachment =
                            (tx.attachment_ids?.length ?? 0) > 0;
                          const attachmentId = tx.attachment_ids?.[0];

                          if (hasAttachment && attachmentId) {
                            // AVEC pièce jointe : Icône + nom cliquable (bleu)
                            return (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  window.open(
                                    `/api/qonto/attachments/${attachmentId}`,
                                    '_blank'
                                  );
                                }}
                                className="flex items-center gap-1.5 text-blue-500 hover:text-blue-700 transition-colors max-w-full"
                                title="Voir le justificatif"
                              >
                                <Paperclip className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="text-xs truncate">
                                  Justificatif
                                </span>
                              </button>
                            );
                          } else if (tx.justification_optional) {
                            // Justificatif facultatif : Texte vert (pas d'upload)
                            return (
                              <span className="flex items-center gap-1.5 text-green-600">
                                <FileCheck className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="text-xs">Facultatif</span>
                              </span>
                            );
                          } else {
                            // SANS pièce jointe + requis : Upload en rouge
                            return (
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  setUploadTransaction(tx);
                                  setShowUploadModal(true);
                                }}
                                className="flex items-center gap-1.5 text-red-500 hover:text-red-700 transition-colors"
                                title="Déposer un justificatif (requis)"
                              >
                                <Upload className="h-3.5 w-3.5 flex-shrink-0" />
                                <span className="text-xs">Upload</span>
                              </button>
                            );
                          }
                        })()}
                      </div>

                      {/* Montant */}
                      <div className="w-24 text-right">
                        <span
                          className={`font-semibold ${tx.side === 'credit' ? 'text-green-600' : 'text-red-600'}`}
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
              )}
            </div>

            {/* Pagination */}
            {!isLoading && transactions.length > 0 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                {/* Page size selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Afficher
                  </span>
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
                  <span className="text-sm text-muted-foreground">
                    par page
                  </span>
                </div>

                {/* Page info */}
                <span className="text-sm text-muted-foreground">
                  {(currentPage - 1) * pageSize + 1}-
                  {Math.min(currentPage * pageSize, totalCount)} sur{' '}
                  {totalCount}
                </span>

                {/* Navigation */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevPage}
                    disabled={currentPage <= 1 || isLoading}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
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
      </div>

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
                      selectedTransaction.settled_at ||
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
                        {selectedTransaction.label || '-'}
                      </p>
                    </div>
                    {(() => {
                      const rawData = selectedTransaction.raw_data as Record<
                        string,
                        unknown
                      > | null;
                      const reference =
                        rawData && typeof rawData.reference === 'string'
                          ? rawData.reference
                          : null;
                      const note =
                        rawData && typeof rawData.note === 'string'
                          ? rawData.note
                          : null;
                      if (!reference && !note) return null;
                      return (
                        <>
                          {reference && (
                            <div className="mt-1">
                              <p className="text-muted-foreground text-[10px]">
                                Référence
                              </p>
                              <p className="font-medium text-xs">{reference}</p>
                            </div>
                          )}
                          {note && (
                            <div className="mt-1">
                              <p className="text-muted-foreground text-[10px]">
                                Note
                              </p>
                              <p className="font-medium text-xs text-blue-600">
                                {note}
                              </p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                    <Separator className="my-0.5" />
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Contrepartie
                        </p>
                        <p className="text-xs font-medium">
                          {selectedTransaction.counterparty_name || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Type</p>
                        <p className="text-xs font-medium">
                          {selectedTransaction.operation_type || 'Virement'}
                        </p>
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
                                ?.label || selectedTransaction.category_pcg}
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
                                    {(
                                      selectedTransaction as unknown as {
                                        vat_source?: string;
                                      }
                                    ).vat_source === 'qonto_ocr' ? (
                                      <Badge
                                        variant="secondary"
                                        className="bg-green-100 text-green-700 text-[8px] px-0.5 py-0"
                                      >
                                        OCR
                                      </Badge>
                                    ) : (
                                        selectedTransaction as unknown as {
                                          vat_source?: string;
                                        }
                                      ).vat_source === 'manual' ? (
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
                                  selectedTransaction.vat_rate?.toString() ||
                                  'none'
                                }
                                onValueChange={async value => {
                                  const newRate =
                                    value === 'none' ? null : parseFloat(value);
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
                                    if (res.ok) refresh();
                                  } catch (err) {
                                    console.error('[TVA update] Error:', err);
                                  }
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
                          selectedTransaction.attachment_ids || [];
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
                                const err = await res.json();
                                throw new Error(
                                  err.error || 'Erreur lors de la suppression'
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
                                  key={att.id || idx}
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
                                    onClick={() =>
                                      handleDeleteAttachment(att.id)
                                    }
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
                      onClick={() => handleToggleJustificationOptional(false)}
                    >
                      <FileCheck className="h-3 w-3" />
                      Justificatif requis
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-1.5 h-7 text-xs text-muted-foreground"
                      onClick={() => handleToggleJustificationOptional(true)}
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
          selectedTransaction?.label ||
          selectedTransaction?.counterparty_name ||
          ''
        }
        amount={selectedTransaction?.amount}
        transactionId={selectedTransaction?.id}
        counterpartyName={selectedTransaction?.counterparty_name || undefined}
        currentCategory={selectedTransaction?.category_pcg || undefined}
        existingRuleId={
          selectedTransaction
            ? suggestionsMap.get(selectedTransaction.id)?.matchedRule?.id
            : undefined
        }
        onSuccess={refresh}
      />

      {/* Modal Organisation */}
      <OrganisationLinkingModal
        open={showOrganisationModal}
        onOpenChange={setShowOrganisationModal}
        label={
          selectedTransaction?.counterparty_name ||
          selectedTransaction?.label ||
          ''
        }
        transactionCount={1}
        totalAmount={selectedTransaction?.amount}
        onSuccess={refresh}
        transactionSide={selectedTransaction?.side}
      />

      {/* Modal Rapprochement */}
      <RapprochementModal
        open={showRapprochementModal}
        onOpenChange={setShowRapprochementModal}
        transactionId={selectedTransaction?.id}
        label={
          selectedTransaction?.label ||
          selectedTransaction?.counterparty_name ||
          ''
        }
        amount={selectedTransaction?.amount || 0}
        counterpartyName={selectedTransaction?.counterparty_name}
        onSuccess={() => {
          toast.success('Transaction rapprochee');
          refresh();
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
          refresh();
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
          refetchRules();
          refresh();
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
