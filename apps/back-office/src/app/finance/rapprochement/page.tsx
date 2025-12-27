'use client';

import { useState, useMemo, useTransition, useEffect } from 'react';

import { useSearchParams } from 'next/navigation';

import {
  useBankReconciliation,
  type BankTransaction,
  type OrderWithoutInvoice,
} from '@verone/finance';
import {
  InvoiceUploadModal,
  SupplierCell,
  type TransactionForUpload,
} from '@verone/finance/components';
import { useAutoClassification } from '@verone/finance/hooks';
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
  Upload,
  AlertTriangle,
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
            showCategory
          />
        </div>
      </div>

      {/* Badges - Approche Pennylane: pièce jointe = justifié */}
      <div className="flex items-center gap-2">
        {hasAttachments ? (
          <Badge
            variant="default"
            className="text-xs bg-emerald-600 hover:bg-emerald-700 gap-1"
          >
            <Paperclip className="h-3 w-3" />
            Justifie
          </Badge>
        ) : transaction.matching_status === 'unmatched' ? (
          <Badge variant="warning" className="text-xs gap-1">
            <Clock className="h-3 w-3" />A justifier
          </Badge>
        ) : (
          <Badge variant="default" className="text-xs bg-blue-600 gap-1">
            <Check className="h-3 w-3" />
            Rapproche
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
  onOpenUploadModal,
  onLink,
  suggestion,
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
  onOpenUploadModal: () => void;
  onLink: () => void;
  suggestion?: {
    organisationId: string | null;
    organisationName: string | null;
    category: string | null;
    confidence: 'high' | 'medium' | 'none';
  };
}) {
  // Initialiser avec la commande présélectionnée si disponible
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(
    () => new Set(preselectedOrderId ? [preselectedOrderId] : [])
  );
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState('');
  const [showMissingPdfWarning, setShowMissingPdfWarning] = useState(false);

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

    // Si pas de pièce jointe, afficher avertissement
    if (!hasAttachments && !showMissingPdfWarning) {
      setShowMissingPdfWarning(true);
      return;
    }

    // Procéder au matching
    proceedWithMatch();
  };

  const proceedWithMatch = () => {
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
                    showCategory
                  />
                </div>
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

        {/* Avertissement si pas de pièce jointe */}
        {showMissingPdfWarning && !hasAttachments && (
          <Card className="border-amber-300 bg-amber-50">
            <CardContent className="py-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-900">
                    Facture manquante
                  </p>
                  <p className="text-sm text-amber-700 mt-1">
                    Cette transaction n'a pas de pièce jointe. Vous pouvez
                    uploader une facture maintenant ou rapprocher sans facture.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenUploadModal}
                  className="flex-1"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Uploader facture
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={proceedWithMatch}
                  disabled={isPending}
                  className="flex-1 text-amber-700"
                >
                  Continuer sans facture
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
// COMPOSANT: PANNEAU LATERAL DEBIT (Catégorisation directe PCG)
// Interface simplifiée style Abby/Pennylane
// =====================================================================

// Catégories PCG les plus courantes pour les dépenses
// Conforme au Plan Comptable Général français
const PCG_EXPENSE_CATEGORIES = [
  { code: '627', label: 'Frais bancaires', icon: '🏦' },
  { code: '651', label: 'Abonnements/SaaS', icon: '📅' },
  { code: '606', label: 'Fournitures', icon: '📦' },
  { code: '624', label: 'Transports', icon: '🚚' },
  { code: '623', label: 'Marketing/Pub', icon: '📢' },
  { code: '635', label: 'Taxes & impôts', icon: '📋' },
  { code: '625', label: 'Repas/Déplacements', icon: '🍽️' },
  { code: '626', label: 'Télécoms', icon: '📱' },
  { code: '658', label: 'Autre', icon: '📄' },
];

// Taux de TVA disponibles (conformes à la réglementation française)
const TVA_RATES = [
  { value: 20, label: '20%', desc: 'Taux normal' },
  { value: 10, label: '10%', desc: 'Intermédiaire' },
  { value: 5.5, label: '5,5%', desc: 'Réduit' },
  { value: 0, label: '0%', desc: 'Exonéré' },
];

// Modes de paiement
const PAYMENT_METHODS = [
  { value: 'virement', label: 'Virement', icon: '🏦' },
  { value: 'cb', label: 'Carte', icon: '💳' },
  { value: 'prelevement', label: 'Prélèvement', icon: '📤' },
  { value: 'cheque', label: 'Chèque', icon: '📝' },
];

function DebitSidePanel({
  transaction,
  onClose,
  onIgnore,
  onOpenUploadModal,
  onLink,
  suggestion,
}: {
  transaction: BankTransaction;
  onClose: () => void;
  onIgnore: (transactionId: string, reason: string) => Promise<void>;
  onOpenUploadModal?: () => void;
  onLink: () => void;
  suggestion?: {
    organisationId: string | null;
    organisationName: string | null;
    category: string | null;
    confidence: 'high' | 'medium' | 'none';
  };
}) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTva, setSelectedTva] = useState<number | null>(20);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [showOrgSearch, setShowOrgSearch] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hasAttachments =
    transaction.attachment_ids && transaction.attachment_ids.length > 0;

  // Détection automatique du mode de paiement à partir du libellé
  useEffect(() => {
    const label = (transaction.label || '').toLowerCase();
    if (label.includes('virement') || label.includes('vir ')) {
      setSelectedPayment('virement');
    } else if (
      label.includes('carte') ||
      label.includes('cb ') ||
      label.includes('visa')
    ) {
      setSelectedPayment('cb');
    } else if (
      label.includes('prelevement') ||
      label.includes('prlv') ||
      label.includes('sepa')
    ) {
      setSelectedPayment('prelevement');
    } else if (label.includes('cheque') || label.includes('chq')) {
      setSelectedPayment('cheque');
    }
  }, [transaction.label]);

  const handleViewPdf = () => {
    if (hasAttachments && transaction.attachment_ids) {
      window.open(
        `/api/qonto/attachments/${transaction.attachment_ids[0]}`,
        '_blank'
      );
    }
  };

  const handleSubmit = () => {
    if (!selectedCategory) return;

    startTransition(async () => {
      const category = PCG_EXPENSE_CATEGORIES.find(
        c => c.code === selectedCategory
      );
      const tvaLabel = selectedTva !== null ? ` (TVA ${selectedTva}%)` : '';
      const reason = `PCG ${selectedCategory}: ${category?.label || 'Non classé'}${tvaLabel}`;
      await onIgnore(transaction.id, reason);
      onClose();
    });
  };

  // Calcul HT/TVA
  const ttc = Math.abs(transaction.amount);
  const tvaRate = selectedTva || 0;
  const ht = Math.round((ttc / (1 + tvaRate / 100)) * 100) / 100;
  const tvaAmount = Math.round((ttc - ht) * 100) / 100;

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex items-center gap-2">
          <ArrowUpRight className="h-5 w-5 text-red-600" />
          Catégoriser la dépense
        </SheetTitle>
      </SheetHeader>

      <div className="space-y-5 mt-6">
        {/* Résumé transaction */}
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">Montant TTC</p>
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
                  {formatDate(transaction.settled_at || transaction.emitted_at)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Libellé</p>
                <div className="font-medium truncate">
                  <SupplierCell
                    counterpartyName={transaction.counterparty_name}
                    label={transaction.label}
                    transactionId={transaction.id}
                    onLink={onLink}
                    suggestedOrganisationId={suggestion?.organisationId}
                    suggestedOrganisationName={suggestion?.organisationName}
                    suggestedCategory={suggestion?.category}
                    confidence={suggestion?.confidence}
                    showCategory
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 1: Catégorie PCG (obligatoire) */}
        <div>
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white text-xs">
              1
            </span>
            Catégorie comptable
            <span className="text-red-500">*</span>
          </h4>
          <div className="grid grid-cols-3 gap-2">
            {PCG_EXPENSE_CATEGORIES.map(cat => (
              <div
                key={cat.code}
                onClick={() => setSelectedCategory(cat.code)}
                className={`
                  p-2 border rounded-lg cursor-pointer transition-colors text-center
                  ${selectedCategory === cat.code ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'}
                `}
              >
                <span className="text-lg">{cat.icon}</span>
                <p className="text-xs mt-1 font-medium">{cat.label}</p>
                <p className="text-[10px] text-muted-foreground">{cat.code}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: TVA */}
        <div>
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white text-xs">
              2
            </span>
            Taux de TVA
          </h4>
          <div className="grid grid-cols-4 gap-2">
            {TVA_RATES.map(rate => (
              <div
                key={rate.value}
                onClick={() => setSelectedTva(rate.value)}
                className={`
                  p-2 border rounded-lg cursor-pointer transition-colors text-center
                  ${selectedTva === rate.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'}
                `}
              >
                <p className="font-medium text-sm">{rate.label}</p>
                <p className="text-[10px] text-muted-foreground">{rate.desc}</p>
              </div>
            ))}
          </div>
          {/* Affichage HT/TVA calculés */}
          {selectedTva !== null && selectedTva > 0 && (
            <div className="mt-2 p-2 bg-muted rounded-lg text-xs grid grid-cols-2 gap-2">
              <div>
                <span className="text-muted-foreground">Montant HT: </span>
                <span className="font-medium">{ht.toFixed(2)} €</span>
              </div>
              <div>
                <span className="text-muted-foreground">TVA: </span>
                <span className="font-medium">{tvaAmount.toFixed(2)} €</span>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Mode de paiement */}
        <div>
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white text-xs">
              3
            </span>
            Mode de paiement
          </h4>
          <div className="grid grid-cols-4 gap-2">
            {PAYMENT_METHODS.map(method => (
              <div
                key={method.value}
                onClick={() => setSelectedPayment(method.value)}
                className={`
                  p-2 border rounded-lg cursor-pointer transition-colors text-center
                  ${selectedPayment === method.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'}
                `}
              >
                <span className="text-lg">{method.icon}</span>
                <p className="text-xs mt-1">{method.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Organisation (facultatif) */}
        <div className="border-t pt-4">
          <button
            type="button"
            onClick={() => setShowOrgSearch(!showOrgSearch)}
            className="flex w-full items-center justify-between text-sm text-muted-foreground hover:text-foreground"
          >
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Lier à une organisation (facultatif)
            </span>
            <span className="text-xs">{showOrgSearch ? '−' : '+'}</span>
          </button>
          {showOrgSearch && (
            <div className="mt-2 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                La liaison à une organisation sera disponible prochainement.
              </p>
            </div>
          )}
        </div>

        {/* Justificatif */}
        <div className="border-t pt-4">
          {hasAttachments ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewPdf}
              className="w-full gap-2"
            >
              <Eye className="h-4 w-4" />
              Voir la pièce jointe
              <ExternalLink className="h-3 w-3" />
            </Button>
          ) : onOpenUploadModal ? (
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenUploadModal}
              className="w-full gap-2"
            >
              <Upload className="h-4 w-4" />
              Ajouter un justificatif
            </Button>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
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

// =====================================================================
// PAGE COMPONENT
// =====================================================================

export default function RapprochementPage() {
  const searchParams = useSearchParams();
  const preselectedOrderId = searchParams.get('orderId');
  const preselectedAmount = searchParams.get('amount');

  const [activeTab, setActiveTab] = useState<'a_justifier' | 'justifies'>(
    'a_justifier'
  );
  const [selectedTransaction, setSelectedTransaction] =
    useState<BankTransaction | null>(null);
  const [search, setSearch] = useState('');
  const [showOrderBanner, setShowOrderBanner] = useState(!!preselectedOrderId);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Convertir BankTransaction en TransactionForUpload pour le modal
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

  // Combiner toutes les transactions pour le nouveau système d'onglets
  const allTransactions = useMemo(() => {
    return [...creditTransactions, ...debitTransactions];
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

  // Helper: Vérifier si une transaction est de 2025
  const isTransaction2025 = (tx: BankTransaction): boolean => {
    const date = tx.settled_at || tx.emitted_at || '';
    return date.startsWith('2025');
  };

  // Filtrer les transactions selon l'onglet actif (approche Pennylane)
  // RÈGLE MÉTIER: Seules les transactions 2025 sans pièce jointe sont "À justifier"
  // Les transactions 2023-2024 sont automatiquement considérées comme justifiées
  const filteredTransactions = useMemo(() => {
    let filtered = allTransactions;

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

    // Filtre par onglet (logique Pennylane + règle 2025)
    if (activeTab === 'a_justifier') {
      // À justifier : transactions 2025 UNIQUEMENT, sans justificatif, non marquées facultatif
      filtered = filtered.filter(tx => {
        const hasAttachment = tx.attachment_ids && tx.attachment_ids.length > 0;
        const isOptional = (tx as any).justification_optional === true;
        const is2025 = isTransaction2025(tx);
        // Seules les transactions 2025 sans pièce jointe sont à justifier
        return is2025 && !hasAttachment && !isOptional;
      });
    } else if (activeTab === 'justifies') {
      // Justifiés : a un justificatif OU marqué facultatif OU transaction avant 2025
      filtered = filtered.filter(tx => {
        const hasAttachment = tx.attachment_ids && tx.attachment_ids.length > 0;
        const isOptional = (tx as any).justification_optional === true;
        const is2025 = isTransaction2025(tx);
        // Justifié si : pièce jointe OU facultatif OU année < 2025
        return hasAttachment || isOptional || !is2025;
      });
    }

    // Trier par date décroissante
    return filtered.sort((a, b) => {
      const dateA = a.settled_at || a.emitted_at || '';
      const dateB = b.settled_at || b.emitted_at || '';
      return dateB.localeCompare(dateA);
    });
  }, [allTransactions, search, activeTab]);

  // Compteurs pour les badges des onglets
  // RÈGLE MÉTIER: Seules les transactions 2025 sans pièce jointe sont "À justifier"
  // Les transactions 2023-2024 sont automatiquement considérées comme justifiées
  const counts = useMemo(() => {
    let aJustifier = 0;
    let justifies = 0;

    allTransactions.forEach(tx => {
      const hasAttachment = tx.attachment_ids && tx.attachment_ids.length > 0;
      const isOptional = (tx as any).justification_optional === true;
      const is2025 = isTransaction2025(tx);

      // À justifier : 2025 uniquement + pas de pièce jointe + pas facultatif
      // Justifié : a une pièce jointe OU facultatif OU avant 2025
      if (is2025 && !hasAttachment && !isOptional) {
        aJustifier++;
      } else {
        justifies++;
      }
    });

    return { aJustifier, justifies, total: allTransactions.length };
  }, [allTransactions]);

  // Montants pour les KPIs
  // RÈGLE MÉTIER: Seules les transactions 2025 sans pièce jointe sont "À justifier"
  // Les transactions 2023-2024 sont automatiquement considérées comme justifiées
  const amounts = useMemo(() => {
    let aJustifierAmount = 0;
    let justifiesAmount = 0;

    allTransactions.forEach(tx => {
      const hasAttachment = tx.attachment_ids && tx.attachment_ids.length > 0;
      const isOptional = (tx as any).justification_optional === true;
      const is2025 = isTransaction2025(tx);
      const amount = Math.abs(tx.amount);

      // À justifier : 2025 uniquement + pas de pièce jointe + pas facultatif
      // Justifié : a une pièce jointe OU facultatif OU avant 2025
      if (is2025 && !hasAttachment && !isOptional) {
        aJustifierAmount += amount;
      } else {
        justifiesAmount += amount;
      }
    });

    return { aJustifier: aJustifierAmount, justifies: justifiesAmount };
  }, [allTransactions]);

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

  // Utiliser les transactions filtrées par le nouvel onglet
  const currentTransactions = filteredTransactions;

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

      {/* KPIs dynamiques - Approche Pennylane */}
      <KpiGrid columns={4}>
        <KpiCard
          title="À justifier"
          value={counts.aJustifier}
          valueType="number"
          icon={<Clock className="h-4 w-4" />}
          variant="warning"
        />
        <KpiCard
          title="Justifiés"
          value={counts.justifies}
          valueType="number"
          icon={<Paperclip className="h-4 w-4" />}
          variant="success"
        />
        <KpiCard
          title="Montant à justifier"
          value={amounts.aJustifier}
          valueType="money"
          icon={<AlertCircle className="h-4 w-4" />}
          color="danger"
        />
        <KpiCard
          title="Montant justifié"
          value={amounts.justifies}
          valueType="money"
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

      {/* Tabs À justifier / Justifiés (approche Pennylane) */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Tabs
              value={activeTab}
              onValueChange={v => {
                setActiveTab(v as 'a_justifier' | 'justifies');
                setSelectedTransaction(null);
              }}
            >
              <TabsList>
                <TabsTrigger value="a_justifier" className="gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />À justifier
                  <Badge variant="warning" className="ml-1">
                    {counts.aJustifier}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="justifies" className="gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Justifiés
                  <Badge variant="default" className="ml-1 bg-green-600">
                    {counts.justifies}
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
                  {activeTab === 'a_justifier'
                    ? 'Toutes les transactions sont justifiées !'
                    : 'Aucune transaction justifiée'}
                </p>
                <p className="text-sm mt-2">
                  {activeTab === 'a_justifier'
                    ? 'Félicitations, votre comptabilité est à jour.'
                    : 'Ajoutez des justificatifs à vos transactions.'}
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
                    onLink={() => refresh()}
                    suggestion={suggestionsMap.get(tx.id)}
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
              onOpenUploadModal={() => setShowUploadModal(true)}
              onLink={() => refresh()}
              suggestion={suggestionsMap.get(selectedTransaction.id)}
            />
          ) : selectedTransaction ? (
            <DebitSidePanel
              transaction={selectedTransaction}
              onClose={() => setSelectedTransaction(null)}
              onIgnore={handleIgnore}
              onOpenUploadModal={() => setShowUploadModal(true)}
              onLink={() => refresh()}
              suggestion={suggestionsMap.get(selectedTransaction.id)}
            />
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Modal upload facture */}
      <InvoiceUploadModal
        transaction={transactionForUpload}
        open={showUploadModal}
        onOpenChange={setShowUploadModal}
        onUploadComplete={() => {
          refresh();
          setShowUploadModal(false);
        }}
      />
    </div>
  );
}
