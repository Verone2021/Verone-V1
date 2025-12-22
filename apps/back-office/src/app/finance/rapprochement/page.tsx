'use client';

import { useState, useMemo } from 'react';

import { useBankReconciliation } from '@verone/finance';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
  ScrollArea,
} from '@verone/ui';
import {
  Money,
  StatusPill,
  KpiCard,
  KpiGrid,
  ConfidenceMeter,
  ConfidenceBadge,
  SyncButton,
  DataTableToolbar,
} from '@verone/ui-business';
import { featureFlags } from '@verone/utils/feature-flags';
import {
  ArrowLeftRight,
  Check,
  X,
  AlertCircle,
  Lock,
  Link2,
  Unlink,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  Clock,
  TrendingUp,
  CreditCard,
  FileText,
} from 'lucide-react';

// =====================================================================
// TYPES
// =====================================================================

interface MatchSuggestion {
  invoice_id: string;
  invoice_number: string;
  customer_name: string;
  invoice_amount: number;
  confidence: number;
  match_reason: string;
}

// =====================================================================
// COMPOSANT: CARTE TRANSACTION
// =====================================================================

function TransactionCard({
  transaction,
  suggestions,
  onMatch,
  onIgnore,
  selected,
  onSelect,
}: {
  transaction: {
    id: string;
    label?: string | null;
    amount: number;
    side: 'credit' | 'debit';
    settled_at?: string | null;
    counterparty_name?: string | null;
    operation_type?: string | null;
  };
  suggestions: MatchSuggestion[];
  onMatch: (transactionId: string, invoiceId: string) => void;
  onIgnore: (transactionId: string) => void;
  selected: boolean;
  onSelect: () => void;
}) {
  const isCredit = transaction.side === 'credit';

  return (
    <Card
      className={`cursor-pointer transition-all ${
        selected ? 'ring-2 ring-primary' : 'hover:border-primary/50'
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge variant={isCredit ? 'default' : 'secondary'}>
                {isCredit ? 'Entrée' : 'Sortie'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {transaction.operation_type || 'Transaction'}
              </span>
            </div>
            <p className="font-medium mt-1 line-clamp-1">
              {transaction.label || 'Sans libellé'}
            </p>
            {transaction.counterparty_name && (
              <p className="text-sm text-muted-foreground">
                {transaction.counterparty_name}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {transaction.settled_at
                ? new Date(transaction.settled_at).toLocaleDateString('fr-FR')
                : 'Non réglée'}
            </p>
          </div>
          <div className="text-right">
            <Money amount={transaction.amount} colorize showPositiveSign bold />
          </div>
        </div>

        {/* Suggestions de matching */}
        {suggestions.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Suggestions ({suggestions.length})
            </p>
            <div className="space-y-2">
              {suggestions.slice(0, 2).map(suggestion => (
                <div
                  key={suggestion.invoice_id}
                  className="flex items-center justify-between bg-muted/50 rounded p-2"
                >
                  <div className="flex items-center gap-2">
                    <ConfidenceBadge score={suggestion.confidence} />
                    <div>
                      <p className="text-sm font-medium">
                        {suggestion.invoice_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {suggestion.customer_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Money amount={suggestion.invoice_amount} size="sm" />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={e => {
                        e.stopPropagation();
                        onMatch(transaction.id, suggestion.invoice_id);
                      }}
                    >
                      <Check className="h-4 w-4 text-green-600" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t">
          <Button
            size="sm"
            variant="ghost"
            onClick={e => {
              e.stopPropagation();
              onIgnore(transaction.id);
            }}
          >
            <X className="h-4 w-4 mr-1" />
            Ignorer
          </Button>
          <Button size="sm" variant="outline">
            <Link2 className="h-4 w-4 mr-1" />
            Matcher
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// =====================================================================
// COMPOSANT: CARTE FACTURE IMPAYÉE
// =====================================================================

function UnpaidInvoiceCard({
  invoice,
  selected,
  onSelect,
}: {
  invoice: {
    id: string;
    invoice_number: string;
    customer_name: string;
    amount_remaining: number;
    due_date: string;
    days_overdue: number | null;
    status: string;
  };
  selected: boolean;
  onSelect: () => void;
}) {
  const isOverdue = invoice.days_overdue && invoice.days_overdue > 0;

  return (
    <Card
      className={`cursor-pointer transition-all ${
        selected ? 'ring-2 ring-primary' : 'hover:border-primary/50'
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{invoice.invoice_number}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {invoice.customer_name}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <StatusPill status={invoice.status} size="sm" />
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  {invoice.days_overdue}j de retard
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right">
            <Money
              amount={invoice.amount_remaining}
              bold
              className={isOverdue ? 'text-red-600' : ''}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Éch. {new Date(invoice.due_date).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =====================================================================
// PAGE COMPONENT
// =====================================================================

export default function RapprochementPage() {
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(
    null
  );
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [searchTransactions, setSearchTransactions] = useState('');
  const [searchInvoices, setSearchInvoices] = useState('');

  // Hook de rapprochement bancaire
  const {
    unmatchedTransactions,
    unpaidInvoices,
    stats,
    loading,
    matchTransaction,
    generateMatchSuggestions,
    refresh,
  } = useBankReconciliation();

  // Générer les suggestions pour chaque transaction
  const transactionsWithSuggestions = useMemo(() => {
    return unmatchedTransactions.map(tx => ({
      ...tx,
      suggestions: generateMatchSuggestions(tx, unpaidInvoices),
    }));
  }, [unmatchedTransactions, unpaidInvoices, generateMatchSuggestions]);

  // Filtrer les transactions
  const filteredTransactions = useMemo(() => {
    if (!searchTransactions) return transactionsWithSuggestions;
    const search = searchTransactions.toLowerCase();
    return transactionsWithSuggestions.filter(
      tx =>
        tx.label?.toLowerCase().includes(search) ||
        tx.counterparty_name?.toLowerCase().includes(search)
    );
  }, [transactionsWithSuggestions, searchTransactions]);

  // Filtrer les factures
  const filteredInvoices = useMemo(() => {
    if (!searchInvoices) return unpaidInvoices;
    const search = searchInvoices.toLowerCase();
    return unpaidInvoices.filter(
      inv =>
        inv.invoice_number.toLowerCase().includes(search) ||
        inv.customer_name.toLowerCase().includes(search)
    );
  }, [unpaidInvoices, searchInvoices]);

  // Handler pour matcher
  const handleMatch = async (transactionId: string, invoiceId: string) => {
    const transaction = unmatchedTransactions.find(t => t.id === transactionId);
    const invoice = unpaidInvoices.find(i => i.id === invoiceId);

    if (transaction && invoice) {
      const result = await matchTransaction(
        transactionId,
        invoiceId,
        Math.min(Math.abs(transaction.amount), invoice.amount_remaining)
      );

      if (result.success) {
        setSelectedTransaction(null);
        setSelectedInvoice(null);
      }
    }
  };

  // Handler pour ignorer
  const handleIgnore = async (transactionId: string) => {
    // TODO: Implémenter l'ignorance de transaction
    console.log('Ignorer transaction:', transactionId);
  };

  // Handler sync
  const handleSync = async () => {
    await refresh();
  };

  // FEATURE FLAG: Finance module disabled for Phase 1
  if (!featureFlags.financeEnabled) {
    return (
      <div className="w-full py-8">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lock className="h-6 w-6 text-orange-600" />
              <div>
                <CardTitle className="text-orange-900">
                  Module Rapprochement Bancaire - Phase 2
                </CardTitle>
                <CardDescription className="text-orange-700">
                  Ce module sera disponible après le déploiement Phase 1
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-orange-900">
                    Fonctionnalités Phase 2
                  </p>
                  <ul className="text-sm text-orange-700 list-disc list-inside mt-1">
                    <li>
                      Rapprochement automatique transactions Qonto / factures
                    </li>
                    <li>Suggestions intelligentes avec score de confiance</li>
                    <li>Validation manuelle transactions non rapprochées</li>
                    <li>Export CSV pour comptabilité</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rapprochement Bancaire</h1>
          <p className="text-muted-foreground">
            Associez les transactions bancaires aux factures
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SyncButton onSync={handleSync} label="Sync Qonto" showLastSync />
        </div>
      </div>

      {/* KPIs */}
      <KpiGrid columns={4}>
        <KpiCard
          title="Non rapprochées"
          value={stats.total_unmatched}
          valueType="number"
          icon={<Unlink className="h-4 w-4" />}
          description="transactions"
          variant="warning"
        />
        <KpiCard
          title="Montant en attente"
          value={stats.total_amount_pending}
          valueType="money"
          icon={<Clock className="h-4 w-4" />}
        />
        <KpiCard
          title="Taux auto-match"
          value={stats.auto_match_rate}
          valueType="percent"
          icon={<TrendingUp className="h-4 w-4" />}
          variant="success"
        />
        <KpiCard
          title="À vérifier manuellement"
          value={stats.manual_review_count}
          valueType="number"
          icon={<AlertCircle className="h-4 w-4" />}
          variant="danger"
        />
      </KpiGrid>

      {/* Split View */}
      <div className="grid grid-cols-2 gap-6">
        {/* Colonne Gauche: Transactions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                <CardTitle className="text-lg">
                  Transactions non rapprochées
                </CardTitle>
              </div>
              <Badge variant="secondary">{filteredTransactions.length}</Badge>
            </div>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchTransactions}
                onChange={e => setSearchTransactions(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className="h-32 bg-muted animate-pulse rounded"
                    />
                  ))}
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Toutes les transactions sont rapprochées</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTransactions.map(tx => (
                    <TransactionCard
                      key={tx.id}
                      transaction={tx}
                      suggestions={tx.suggestions || []}
                      onMatch={handleMatch}
                      onIgnore={handleIgnore}
                      selected={selectedTransaction === tx.id}
                      onSelect={() =>
                        setSelectedTransaction(
                          selectedTransaction === tx.id ? null : tx.id
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Colonne Droite: Factures impayées */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <CardTitle className="text-lg">Factures impayées</CardTitle>
              </div>
              <Badge variant="secondary">{filteredInvoices.length}</Badge>
            </div>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchInvoices}
                onChange={e => setSearchInvoices(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px] pr-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className="h-24 bg-muted animate-pulse rounded"
                    />
                  ))}
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Toutes les factures sont payées</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredInvoices.map(inv => (
                    <UnpaidInvoiceCard
                      key={inv.id}
                      invoice={inv}
                      selected={selectedInvoice === inv.id}
                      onSelect={() =>
                        setSelectedInvoice(
                          selectedInvoice === inv.id ? null : inv.id
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Action de matching manuel */}
      {selectedTransaction && selectedInvoice && (
        <Card className="border-primary">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <ArrowLeftRight className="h-5 w-5 text-primary" />
                <span>
                  Matcher la transaction avec la facture sélectionnée ?
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedTransaction(null);
                    setSelectedInvoice(null);
                  }}
                >
                  Annuler
                </Button>
                <Button
                  onClick={() =>
                    handleMatch(selectedTransaction, selectedInvoice)
                  }
                >
                  <Check className="h-4 w-4 mr-2" />
                  Confirmer le rapprochement
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
