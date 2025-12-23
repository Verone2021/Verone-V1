'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';

import { useSearchParams } from 'next/navigation';

import {
  useBankReconciliation,
  type BankTransaction,
  type OrderWithoutInvoice,
} from '@verone/finance';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Input,
  ScrollArea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Checkbox,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Separator,
} from '@verone/ui';
import {
  Money,
  KpiCard,
  KpiGrid,
  ConfidenceBadge,
  SyncButton,
} from '@verone/ui-business';
import { featureFlags } from '@verone/utils/feature-flags';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  AlertCircle,
  Lock,
  Search,
  CheckCircle,
  Clock,
  FileText,
  ExternalLink,
  Eye,
  Paperclip,
  Building2,
  X,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  matchTransactionToOrder,
  matchTransactionToMultipleOrders,
  ignoreTransaction,
} from '@/app/actions/bank-matching';

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

function formatAddress(address: unknown): string | null {
  if (!address || typeof address !== 'object') return null;
  const addr = address as Record<string, unknown>;
  const parts = [
    addr.street || addr.line1 || addr.address,
    addr.postal_code || addr.zip,
    addr.city,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

// =====================================================================
// COMPOSANT: LIGNE TRANSACTION (Relevé bancaire style)
// =====================================================================

function TransactionRow({
  transaction,
  onClick,
  isSelected,
}: {
  transaction: BankTransaction;
  onClick: () => void;
  isSelected: boolean;
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
        {transaction.counterparty_name && (
          <p className="text-sm text-muted-foreground truncate">
            {transaction.counterparty_name}
          </p>
        )}
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2">
        {hasAttachments && (
          <Badge variant="outline" className="gap-1">
            <Paperclip className="h-3 w-3" />
          </Badge>
        )}
        {transaction.matching_status === 'unmatched' ? (
          <Badge variant="destructive" className="text-xs">
            Non rapproché
          </Badge>
        ) : (
          <Badge variant="default" className="text-xs bg-green-600">
            Rapproché
          </Badge>
        )}
      </div>

      {/* Montant */}
      <div className="w-28 text-right">
        <Money
          amount={
            isCredit
              ? Math.abs(transaction.amount)
              : -Math.abs(transaction.amount)
          }
          colorize
          showPositiveSign
          bold
        />
      </div>
    </div>
  );
}

// =====================================================================
// COMPOSANT: PANNEAU LATERAL CREDIT (Matcher à commandes)
// =====================================================================

function CreditSidePanel({
  transaction,
  orders,
  onClose,
  onMultiMatch,
  generateSuggestions,
  preselectedOrderId,
}: {
  transaction: BankTransaction;
  orders: OrderWithoutInvoice[];
  onClose: () => void;
  onMultiMatch: (transactionId: string, orderIds: string[]) => Promise<void>;
  generateSuggestions: (
    tx: BankTransaction,
    orders: OrderWithoutInvoice[]
  ) => Array<{
    order_id: string;
    order_number: string;
    customer_name: string | null;
    customer_address: string | null;
    order_amount: number;
    confidence: number;
    match_reason: string;
  }>;
  preselectedOrderId?: string | null;
}) {
  // Initialiser avec la commande présélectionnée si disponible
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(
    () => new Set(preselectedOrderId ? [preselectedOrderId] : [])
  );
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');

  const hasAttachments =
    transaction.attachment_ids && transaction.attachment_ids.length > 0;

  // Générer les suggestions
  const suggestions = useMemo(
    () => generateSuggestions(transaction, orders),
    [transaction, orders, generateSuggestions]
  );

  // Filtrer les commandes
  const filteredOrders = useMemo(() => {
    if (!search) return orders;
    const s = search.toLowerCase();
    return orders.filter(
      o =>
        o.order_number.toLowerCase().includes(s) ||
        o.customer_name?.toLowerCase().includes(s)
    );
  }, [orders, search]);

  // Trouver le score de confiance pour une commande
  const getConfidence = (orderId: string): number | null => {
    const suggestion = suggestions.find(s => s.order_id === orderId);
    return suggestion?.confidence ?? null;
  };

  // Toggle sélection
  const toggleOrder = (orderId: string) => {
    const newSet = new Set(selectedOrders);
    if (newSet.has(orderId)) {
      newSet.delete(orderId);
    } else {
      newSet.add(orderId);
    }
    setSelectedOrders(newSet);
  };

  // Valider le matching (multi-match)
  const handleValidate = () => {
    if (selectedOrders.size === 0) {
      toast.warning('Sélectionnez au moins une commande');
      return;
    }

    startTransition(async () => {
      const orderIds = Array.from(selectedOrders);
      await onMultiMatch(transaction.id, orderIds);
      onClose();
    });
  };

  // Voir le PDF
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
          <ArrowDownLeft className="h-5 w-5 text-green-600" />
          Entrée d'argent
        </SheetTitle>
      </SheetHeader>

      <div className="space-y-6 mt-6">
        {/* Infos transaction */}
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Montant reçu</p>
                <Money
                  amount={Math.abs(transaction.amount)}
                  className="text-2xl font-bold text-green-600"
                  showPositiveSign
                />
              </div>
              <Badge variant="outline">
                {transaction.operation_type || 'Virement'}
              </Badge>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium">
                  {formatDate(transaction.settled_at || transaction.emitted_at)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">De</p>
                <p className="font-medium">
                  {transaction.counterparty_name || 'Inconnu'}
                </p>
              </div>
            </div>

            {transaction.reference && (
              <div className="text-sm">
                <p className="text-muted-foreground">Référence</p>
                <p className="font-medium font-mono">{transaction.reference}</p>
              </div>
            )}

            {/* Bouton voir justificatif */}
            {hasAttachments && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewPdf}
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                Voir la pièce jointe
                <ExternalLink className="h-3 w-3 ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Suggestions automatiques */}
        {suggestions.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Correspondances suggérées
            </h4>
            <div className="space-y-2">
              {suggestions.slice(0, 3).map(s => (
                <div
                  key={s.order_id}
                  className={`
                    p-3 border rounded-lg cursor-pointer transition-colors
                    ${selectedOrders.has(s.order_id) ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}
                  `}
                  onClick={() => toggleOrder(s.order_id)}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedOrders.has(s.order_id)}
                      onCheckedChange={() => toggleOrder(s.order_id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{s.order_number}</span>
                        <ConfidenceBadge score={s.confidence} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {s.customer_name || 'Client inconnu'} • {s.match_reason}
                      </p>
                    </div>
                    <Money amount={s.order_amount} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recherche manuelle */}
        <div>
          <h4 className="font-medium mb-2">Toutes les commandes</h4>
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par numéro, client..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>

          <ScrollArea className="h-[250px]">
            <div className="space-y-1">
              {filteredOrders.map(order => {
                const confidence = getConfidence(order.id);
                return (
                  <div
                    key={order.id}
                    className={`
                      p-2 border rounded cursor-pointer transition-colors
                      ${selectedOrders.has(order.id) ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}
                    `}
                    onClick={() => toggleOrder(order.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedOrders.has(order.id)}
                        onCheckedChange={() => toggleOrder(order.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {order.order_number}
                          </span>
                          {confidence !== null && (
                            <ConfidenceBadge score={confidence} />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {order.customer_name || 'Client inconnu'}
                        </p>
                      </div>
                      <Money amount={order.total_ttc} size="sm" />
                    </div>
                  </div>
                );
              })}
              {filteredOrders.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  Aucune commande trouvée
                </p>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button
            onClick={handleValidate}
            disabled={selectedOrders.size === 0 || isPending}
            className="flex-1"
          >
            {isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Valider ({selectedOrders.size})
          </Button>
        </div>
      </div>
    </>
  );
}

// =====================================================================
// COMPOSANT: PANNEAU LATERAL DEBIT (Fournisseur/Dépense)
// =====================================================================

type DebitMode = 'select' | 'supplier' | 'expense';

// Catégories de dépenses courantes
const EXPENSE_CATEGORIES = [
  { id: 'bank_fees', label: 'Frais bancaires', icon: '🏦' },
  { id: 'subscription', label: 'Abonnement', icon: '📅' },
  { id: 'supplies', label: 'Fournitures', icon: '📦' },
  { id: 'transport', label: 'Transport', icon: '🚚' },
  { id: 'marketing', label: 'Marketing', icon: '📢' },
  { id: 'taxes', label: 'Taxes & impôts', icon: '📋' },
  { id: 'other', label: 'Autre', icon: '📄' },
];

function DebitSidePanel({
  transaction,
  onClose,
  onIgnore,
}: {
  transaction: BankTransaction;
  onClose: () => void;
  onIgnore: (transactionId: string, reason: string) => Promise<void>;
}) {
  const [mode, setMode] = useState<DebitMode>('select');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasAttachments =
    transaction.attachment_ids && transaction.attachment_ids.length > 0;

  const handleViewPdf = () => {
    if (hasAttachments && transaction.attachment_ids) {
      window.open(
        `/api/qonto/attachments/${transaction.attachment_ids[0]}`,
        '_blank'
      );
    }
  };

  const handleIgnore = () => {
    startTransition(async () => {
      const reason = selectedCategory
        ? `Catégorisé: ${EXPENSE_CATEGORIES.find(c => c.id === selectedCategory)?.label}`
        : 'Ignoré manuellement';
      await onIgnore(transaction.id, reason);
      onClose();
    });
  };

  // Mode sélection initiale
  if (mode === 'select') {
    return (
      <>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-red-600" />
            Sortie d'argent
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Infos transaction */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">Montant payé</p>
                  <Money
                    amount={-Math.abs(transaction.amount)}
                    className="text-2xl font-bold text-red-600"
                  />
                </div>
                <Badge variant="outline">
                  {transaction.operation_type || 'Virement'}
                </Badge>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {formatDate(
                      transaction.settled_at || transaction.emitted_at
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Vers</p>
                  <p className="font-medium">
                    {transaction.counterparty_name || 'Inconnu'}
                  </p>
                </div>
              </div>

              {transaction.reference && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Référence</p>
                  <p className="font-medium font-mono">
                    {transaction.reference}
                  </p>
                </div>
              )}

              {hasAttachments && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewPdf}
                  className="w-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Voir la pièce jointe
                  <ExternalLink className="h-3 w-3 ml-2" />
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Options de catégorisation */}
          <div className="space-y-3">
            <h4 className="font-medium">Catégoriser cette sortie</h4>

            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setMode('supplier')}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">Facture fournisseur</p>
                  <p className="text-sm text-muted-foreground">
                    Associer à un fournisseur existant
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setMode('expense')}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">Dépense simple</p>
                  <p className="text-sm text-muted-foreground">
                    Frais bancaires, abonnements, etc.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

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

  // Mode dépense simple
  if (mode === 'expense') {
    return (
      <>
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            Catégoriser la dépense
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Résumé */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm">
                {transaction.counterparty_name || 'Dépense'}
              </span>
              <Money amount={-Math.abs(transaction.amount)} colorize />
            </div>
          </div>

          {/* Catégories */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Choisir une catégorie</h4>
            <div className="grid grid-cols-2 gap-2">
              {EXPENSE_CATEGORIES.map(cat => (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`
                    p-3 border rounded-lg cursor-pointer transition-colors text-center
                    ${selectedCategory === cat.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}
                  `}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <p className="text-sm mt-1">{cat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setMode('select')}
              className="flex-1"
            >
              Retour
            </Button>
            <Button
              onClick={handleIgnore}
              disabled={!selectedCategory || isPending}
              className="flex-1"
            >
              {isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Valider
            </Button>
          </div>
        </div>
      </>
    );
  }

  // Mode facture fournisseur
  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          Facture fournisseur
        </SheetTitle>
      </SheetHeader>

      <div className="space-y-6 mt-6">
        {/* Résumé */}
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm">
              {transaction.counterparty_name || 'Fournisseur'}
            </span>
            <Money amount={-Math.abs(transaction.amount)} colorize />
          </div>
        </div>

        <p className="text-sm text-muted-foreground text-center py-8">
          La gestion des factures fournisseurs est disponible dans
          <br />
          <strong>Commandes → Fournisseurs</strong>
        </p>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setMode('select')}
            className="flex-1"
          >
            Retour
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
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

export default function RapprochementPage() {
  const searchParams = useSearchParams();
  const preselectedOrderId = searchParams.get('orderId');
  const preselectedAmount = searchParams.get('amount');

  const [activeTab, setActiveTab] = useState<'credits' | 'debits'>('credits');
  const [selectedTransaction, setSelectedTransaction] =
    useState<BankTransaction | null>(null);
  const [search, setSearch] = useState('');
  const [showOrderBanner, setShowOrderBanner] = useState(!!preselectedOrderId);

  // Trouver la commande présélectionnée
  const preselectedOrder = useMemo(() => {
    if (!preselectedOrderId) return null;
    return {
      id: preselectedOrderId,
      amount: preselectedAmount ? parseFloat(preselectedAmount) : null,
    };
  }, [preselectedOrderId, preselectedAmount]);

  // Hook de rapprochement bancaire
  const {
    creditTransactions,
    debitTransactions,
    ordersWithoutInvoice,
    stats,
    loading,
    error,
    generateMatchSuggestions,
    refresh,
  } = useBankReconciliation();

  // Filtrer les transactions
  const filteredCredits = useMemo(() => {
    let filtered = creditTransactions;

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

    // Si on vient d'une commande, trier par proximité de montant
    if (preselectedOrder?.amount) {
      const targetAmount = preselectedOrder.amount;
      return [...filtered].sort((a, b) => {
        const diffA = Math.abs(a.amount - targetAmount);
        const diffB = Math.abs(b.amount - targetAmount);
        // Priorité aux non-rapprochées avec montant correspondant
        if (
          a.matching_status === 'unmatched' &&
          b.matching_status !== 'unmatched'
        )
          return -1;
        if (
          a.matching_status !== 'unmatched' &&
          b.matching_status === 'unmatched'
        )
          return 1;
        return diffA - diffB;
      });
    }

    return filtered;
  }, [creditTransactions, search, preselectedOrder]);

  const filteredDebits = useMemo(() => {
    if (!search) return debitTransactions;
    const s = search.toLowerCase();
    return debitTransactions.filter(
      tx =>
        tx.label?.toLowerCase().includes(s) ||
        tx.counterparty_name?.toLowerCase().includes(s) ||
        tx.reference?.toLowerCase().includes(s)
    );
  }, [debitTransactions, search]);

  // Handler sync
  const handleSync = async () => {
    try {
      const response = await fetch('/api/qonto/sync', { method: 'POST' });
      const result = await response.json();
      console.log('[Qonto Sync]', result);
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

  // Handler match simple (1 transaction → 1 commande)
  const handleMatch = async (transactionId: string, orderId: string) => {
    const result = await matchTransactionToOrder(transactionId, orderId);
    if (result.success) {
      toast.success('Rapprochement effectué', {
        description: `Facture créée et paiement enregistré`,
      });
      await refresh();
    } else {
      toast.error('Erreur de rapprochement', {
        description: result.error,
      });
    }
  };

  // Handler multi-match (1 transaction → N commandes)
  const handleMultiMatch = async (
    transactionId: string,
    orderIds: string[]
  ) => {
    const result = await matchTransactionToMultipleOrders(
      transactionId,
      orderIds.map(id => ({ orderId: id }))
    );

    if (result.success) {
      toast.success('Rapprochement effectué', {
        description: `${result.matchedOrders} commande(s) associée(s), ${result.createdDocuments.length} facture(s) créée(s)`,
      });
      if (result.errors.length > 0) {
        toast.warning('Attention', {
          description: result.errors.join(', '),
        });
      }
      await refresh();
    } else {
      toast.error('Erreur de rapprochement', {
        description: result.errors.join(', ') || 'Erreur inconnue',
      });
    }
  };

  // Handler ignorer (catégoriser comme dépense)
  const handleIgnore = async (transactionId: string, reason: string) => {
    const result = await ignoreTransaction(transactionId, reason);
    if (result.success) {
      toast.success('Transaction catégorisée', {
        description: reason,
      });
      await refresh();
    } else {
      toast.error('Erreur', {
        description: result.error,
      });
    }
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
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const currentTransactions =
    activeTab === 'credits' ? filteredCredits : filteredDebits;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rapprochement Bancaire</h1>
          <p className="text-muted-foreground">
            Relevé bancaire Qonto - Associez les transactions à vos documents
          </p>
        </div>
        <SyncButton onSync={handleSync} label="Sync Qonto" showLastSync />
      </div>

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

      {/* KPIs - Transaction focused (best practice) */}
      <KpiGrid columns={4}>
        <KpiCard
          title="Total à rapprocher"
          value={
            creditTransactions.filter(t => t.matching_status === 'unmatched')
              .length +
            debitTransactions.filter(t => t.matching_status === 'unmatched')
              .length
          }
          valueType="number"
          icon={<Clock className="h-4 w-4" />}
          variant="warning"
        />
        <KpiCard
          title="Entrées (crédits)"
          value={creditTransactions.reduce(
            (sum, t) =>
              t.matching_status === 'unmatched'
                ? sum + Math.abs(t.amount)
                : sum,
            0
          )}
          valueType="money"
          icon={<ArrowDownLeft className="h-4 w-4" />}
          variant="success"
        />
        <KpiCard
          title="Sorties (débits)"
          value={debitTransactions.reduce(
            (sum, t) =>
              t.matching_status === 'unmatched'
                ? sum + Math.abs(t.amount)
                : sum,
            0
          )}
          valueType="money"
          icon={<ArrowUpRight className="h-4 w-4" />}
          color="danger"
        />
        <KpiCard
          title="Transactions rapprochées"
          value={
            creditTransactions.filter(t => t.matching_status !== 'unmatched')
              .length +
            debitTransactions.filter(t => t.matching_status !== 'unmatched')
              .length
          }
          valueType="number"
          icon={<CheckCircle className="h-4 w-4" />}
        />
      </KpiGrid>

      {/* Banner quand on vient d'une commande */}
      {showOrderBanner && preselectedOrder && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">
                    Associer un paiement à une commande
                  </p>
                  <p className="text-sm text-blue-700">
                    Sélectionnez une transaction crédit pour l'associer à la
                    commande (montant attendu :{' '}
                    <strong>{preselectedOrder.amount?.toFixed(2)} €</strong>)
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOrderBanner(false)}
              >
                Fermer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs Entrées / Sorties */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Tabs
              value={activeTab}
              onValueChange={v => {
                setActiveTab(v as 'credits' | 'debits');
                setSelectedTransaction(null);
              }}
            >
              <TabsList>
                <TabsTrigger value="credits" className="gap-2">
                  <ArrowDownLeft className="h-4 w-4 text-green-600" />
                  Entrées
                  <Badge variant="secondary" className="ml-1">
                    {creditTransactions.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="debits" className="gap-2">
                  <ArrowUpRight className="h-4 w-4 text-red-600" />
                  Sorties
                  <Badge variant="secondary" className="ml-1">
                    {debitTransactions.length}
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
            <div className="w-32" />
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
            ) : currentTransactions.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">
                  {activeTab === 'credits'
                    ? "Aucune entrée d'argent"
                    : "Aucune sortie d'argent"}
                </p>
                <p className="text-sm mt-2">
                  Cliquez sur "Sync Qonto" pour récupérer les transactions
                </p>
              </div>
            ) : (
              <div>
                {currentTransactions.map(tx => (
                  <TransactionRow
                    key={tx.id}
                    transaction={tx}
                    onClick={() => setSelectedTransaction(tx)}
                    isSelected={selectedTransaction?.id === tx.id}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Sheet latéral pour matching */}
      <Sheet
        open={selectedTransaction !== null}
        onOpenChange={open => {
          if (!open) setSelectedTransaction(null);
        }}
      >
        <SheetContent className="w-[450px] sm:max-w-[450px]">
          {selectedTransaction?.side === 'credit' ? (
            <CreditSidePanel
              transaction={selectedTransaction}
              orders={ordersWithoutInvoice}
              onClose={() => setSelectedTransaction(null)}
              onMultiMatch={handleMultiMatch}
              generateSuggestions={generateMatchSuggestions}
              preselectedOrderId={preselectedOrderId}
            />
          ) : selectedTransaction ? (
            <DebitSidePanel
              transaction={selectedTransaction}
              onClose={() => setSelectedTransaction(null)}
              onIgnore={handleIgnore}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
