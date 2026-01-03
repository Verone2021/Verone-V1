'use client';

/**
 * RapprochementModal - Modal pour le rapprochement bancaire
 *
 * Permet de lier une transaction bancaire à un document ou une commande.
 * Propose automatiquement des suggestions basées sur:
 * - Montant similaire (tolérance 5%)
 * - Date proche (±30 jours)
 * - Organisation/client correspondant
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Badge,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  ScrollArea,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import {
  FileText,
  Check,
  Search,
  Building2,
  Package,
  RefreshCw,
  Plus,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface RapprochementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionId: string | undefined;
  label: string;
  amount: number;
  counterpartyName?: string | null;
  organisationName?: string | null;
  organisationId?: string | null;
  onSuccess?: () => void;
}

interface FinancialDocument {
  id: string;
  document_type: string;
  document_number: string;
  total_ttc: number;
  amount_paid: number;
  partner_name?: string;
  document_date: string;
}

interface SalesOrder {
  id: string;
  order_number: string;
  total_ht: number;
  total_ttc: number;
  customer_name?: string;
  organisation_id?: string;
  created_at: string;
  status: string;
  // Score de matching (calculé côté client)
  matchScore?: number;
  matchReasons?: string[];
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(Math.abs(amount));
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Calcule un score de matching entre une transaction et une commande
 * Score de 0 à 100, plus c'est élevé meilleur est le match
 */
function calculateMatchScore(
  transactionAmount: number,
  transactionDate: string | undefined,
  transactionOrgId: string | undefined,
  order: {
    total_ttc: number;
    created_at: string;
    organisation_id?: string;
    customer_name?: string;
  },
  counterpartyName?: string | null
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const absAmount = Math.abs(transactionAmount);

  // 1. Matching par montant (max 50 points)
  const amountDiff = Math.abs(absAmount - order.total_ttc);
  const amountTolerance = absAmount * 0.05; // 5% de tolérance

  if (amountDiff === 0) {
    score += 50;
    reasons.push('Montant exact');
  } else if (amountDiff <= amountTolerance) {
    score += 40;
    reasons.push('Montant proche (±5%)');
  } else if (amountDiff <= absAmount * 0.1) {
    score += 20;
    reasons.push('Montant similaire (±10%)');
  }

  // 2. Matching par date (max 30 points)
  if (transactionDate) {
    const txDate = new Date(transactionDate);
    const orderDate = new Date(order.created_at);
    const daysDiff = Math.abs(
      (txDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff <= 3) {
      score += 30;
      reasons.push('Date très proche');
    } else if (daysDiff <= 7) {
      score += 25;
      reasons.push('Date proche (±7j)');
    } else if (daysDiff <= 30) {
      score += 15;
      reasons.push('Date dans le mois');
    }
  }

  // 3. Matching par organisation (max 20 points)
  if (transactionOrgId && order.organisation_id === transactionOrgId) {
    score += 20;
    reasons.push('Même organisation');
  } else if (
    counterpartyName &&
    order.customer_name?.toLowerCase().includes(counterpartyName.toLowerCase())
  ) {
    score += 15;
    reasons.push('Nom client similaire');
  }

  return { score, reasons };
}

export function RapprochementModal({
  open,
  onOpenChange,
  transactionId,
  label,
  amount,
  counterpartyName,
  organisationName,
  organisationId,
  onSuccess,
}: RapprochementModalProps) {
  // Simplification: 2 onglets seulement (Documents, Commandes)
  const [activeTab, setActiveTab] = useState<'documents' | 'orders'>('orders');
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<FinancialDocument[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null
  );
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [allocatedAmount, setAllocatedAmount] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string | undefined>();

  const remainingAmount = Math.abs(amount);

  // Charger les documents et commandes disponibles
  const fetchAvailableItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();

      // Récupérer la date de la transaction pour le scoring
      if (transactionId) {
        const { data: txData } = await supabase
          .from('bank_transactions')
          .select('emitted_at')
          .eq('id', transactionId)
          .single();
        if (txData) {
          setTransactionDate(txData.emitted_at);
        }
      }

      // Récupérer les documents non payés ou partiellement payés
      const { data: docs, error: docsError } = await supabase
        .from('financial_documents')
        .select(
          `
          id,
          document_type,
          document_number,
          total_ttc,
          amount_paid,
          document_date,
          partner_id,
          organisations!partner_id(legal_name)
        `
        )
        .in('status', ['sent', 'received', 'partially_paid'])
        .order('document_date', { ascending: false })
        .limit(100);

      if (!docsError && docs) {
        type DocRow = {
          id: string;
          document_type: string;
          document_number: string;
          total_ttc: number;
          amount_paid: number;
          document_date: string;
          partner_id: string;
          organisations: { legal_name: string } | null;
        };
        setDocuments(
          (docs as DocRow[]).map(d => ({
            id: d.id,
            document_type: d.document_type,
            document_number: d.document_number,
            total_ttc: d.total_ttc,
            amount_paid: d.amount_paid || 0,
            partner_name: d.organisations?.legal_name,
            document_date: d.document_date,
          }))
        );
      }

      // Récupérer les commandes validées/livrées avec plus de détails
      // Note: customer_id peut pointer vers organisations ou individual_customers selon customer_type
      const { data: ordersData, error: ordersError } = await supabase
        .from('sales_orders')
        .select(
          `
          id,
          order_number,
          total_ht,
          total_ttc,
          created_at,
          status,
          customer_id,
          customer_type
        `
        )
        .in('status', ['validated', 'delivered', 'shipped'])
        .order('created_at', { ascending: false })
        .limit(100);

      if (!ordersError && ordersData) {
        type OrderRow = {
          id: string;
          order_number: string;
          total_ht: number;
          total_ttc: number;
          created_at: string;
          status: string;
          customer_id: string;
          customer_type: string;
        };

        // Récupérer les noms des organisations pour les commandes B2B
        const orgOrders = (ordersData as OrderRow[]).filter(
          o => o.customer_type === 'organisation'
        );
        const orgIds = orgOrders.map(o => o.customer_id);

        let orgNames: Record<string, string> = {};
        if (orgIds.length > 0) {
          const { data: orgs } = await supabase
            .from('organisations')
            .select('id, legal_name')
            .in('id', orgIds);
          if (orgs) {
            orgNames = Object.fromEntries(orgs.map(o => [o.id, o.legal_name]));
          }
        }

        setOrders(
          (ordersData as OrderRow[]).map(o => ({
            id: o.id,
            order_number: o.order_number,
            total_ht: o.total_ht,
            total_ttc: o.total_ttc || o.total_ht * 1.2, // Fallback si pas de TTC
            created_at: o.created_at,
            status: o.status,
            organisation_id:
              o.customer_type === 'organisation' ? o.customer_id : undefined,
            customer_name:
              o.customer_type === 'organisation'
                ? orgNames[o.customer_id]
                : 'Client particulier',
          }))
        );
      }
    } catch (err) {
      console.error('[RapprochementModal] Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [transactionId]);

  // Calculer les scores de matching pour les commandes
  const ordersWithScores = useMemo(() => {
    return orders
      .map(order => {
        const { score, reasons } = calculateMatchScore(
          amount,
          transactionDate,
          organisationId || undefined,
          order,
          counterpartyName
        );
        return {
          ...order,
          matchScore: score,
          matchReasons: reasons,
        };
      })
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }, [orders, amount, transactionDate, organisationId, counterpartyName]);

  // Top suggestions (score >= 40)
  const suggestions = useMemo(() => {
    return ordersWithScores.filter(o => (o.matchScore || 0) >= 40).slice(0, 3);
  }, [ordersWithScores]);

  // Charger les données au mount
  useEffect(() => {
    if (!open) return;

    fetchAvailableItems();

    // Reset des sélections
    setSelectedDocumentId(null);
    setSelectedOrderId(null);
    setAllocatedAmount('');
  }, [open, fetchAvailableItems]);

  // Filtrer les documents
  const filteredDocuments = documents.filter(
    d =>
      d.document_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.partner_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtrer les commandes (avec scores)
  const filteredOrders = ordersWithScores.filter(
    o =>
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Lier à un document
  const handleLinkDocument = async () => {
    if (!transactionId || !selectedDocumentId) return;

    setIsLinking(true);
    try {
      const supabase = createClient();
      const amountToAllocate = allocatedAmount
        ? parseFloat(allocatedAmount)
        : remainingAmount;

      const { error } = await (supabase.rpc as CallableFunction)(
        'link_transaction_to_document',
        {
          p_transaction_id: transactionId,
          p_document_id: selectedDocumentId,
          p_allocated_amount: amountToAllocate,
        }
      );

      if (error) throw error;

      toast.success('Document lié');
      setSelectedDocumentId(null);
      setAllocatedAmount('');
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      console.error('[RapprochementModal] Link error:', err);
      toast.error('Erreur lors du rapprochement');
    } finally {
      setIsLinking(false);
    }
  };

  // Lier à une commande
  const handleLinkOrder = async () => {
    if (!transactionId || !selectedOrderId) return;

    setIsLinking(true);
    try {
      const supabase = createClient();
      const amountToAllocate = allocatedAmount
        ? parseFloat(allocatedAmount)
        : remainingAmount;

      const { error } = await (supabase.rpc as CallableFunction)(
        'link_transaction_to_document',
        {
          p_transaction_id: transactionId,
          p_sales_order_id: selectedOrderId,
          p_allocated_amount: amountToAllocate,
        }
      );

      if (error) throw error;

      toast.success('Commande liée');
      setSelectedOrderId(null);
      setAllocatedAmount('');
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      console.error('[RapprochementModal] Link order error:', err);
      toast.error('Erreur lors du rapprochement');
    } finally {
      setIsLinking(false);
    }
  };

  // Lier directement via suggestion (raccourci)
  const handleQuickLink = async (orderId: string) => {
    setSelectedOrderId(orderId);
    // Le montant par défaut est le montant restant de la transaction
    setAllocatedAmount(String(remainingAmount.toFixed(2)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Rapprocher Commande
          </DialogTitle>
          <DialogDescription>
            Liez cette transaction à une commande ou un document
          </DialogDescription>
        </DialogHeader>

        {/* Info transaction */}
        <div className="p-4 bg-slate-50 rounded-lg space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-slate-900">{label}</p>
              {counterpartyName && (
                <p className="text-sm text-slate-600">{counterpartyName}</p>
              )}
            </div>
            <div className="text-right">
              <span
                className={`text-lg font-bold ${amount < 0 ? 'text-red-600' : 'text-green-600'}`}
              >
                {amount < 0 ? '' : '+'}
                {formatAmount(amount)}
              </span>
            </div>
          </div>

          {/* Organisation liée */}
          {organisationName && (
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200 mt-2">
              <Building2 className="h-4 w-4 text-emerald-600" />
              <span className="text-sm text-emerald-700 font-medium">
                {organisationName}
              </span>
              <Badge variant="outline" className="text-xs">
                Organisation liée
              </Badge>
            </div>
          )}
        </div>

        {/* Suggestions automatiques */}
        {suggestions.length > 0 && !selectedOrderId && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                Suggestions de rapprochement
              </span>
            </div>
            <div className="space-y-2">
              {suggestions.map(order => (
                <button
                  key={order.id}
                  onClick={() => handleQuickLink(order.id)}
                  className="w-full flex items-center justify-between p-2 bg-white rounded border border-amber-200 hover:border-amber-400 transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-slate-500" />
                    <div>
                      <span className="font-medium text-sm">
                        #{order.order_number}
                      </span>
                      {order.customer_name && (
                        <span className="text-xs text-slate-500 ml-2">
                          {order.customer_name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      {formatAmount(order.total_ttc)}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        (order.matchScore || 0) >= 60
                          ? 'border-green-500 text-green-700'
                          : 'border-amber-500 text-amber-700'
                      }`}
                    >
                      {order.matchScore}%
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                </button>
              ))}
            </div>
            {suggestions[0]?.matchReasons && (
              <p className="text-xs text-amber-600 mt-2">
                Critères: {suggestions[0].matchReasons.join(', ')}
              </p>
            )}
          </div>
        )}

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={v => setActiveTab(v as 'documents' | 'orders')}
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="orders" className="gap-2">
              <Package className="h-4 w-4" />
              Commandes
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
          </TabsList>

          {/* Tab: Documents */}
          <TabsContent value="documents" className="flex-1 min-h-0 mt-4">
            {/* Recherche */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher par référence, organisation..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[220px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Aucun document disponible</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDocuments.map(doc => {
                    const remaining = doc.total_ttc - doc.amount_paid;
                    return (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedDocumentId(doc.id)}
                        className={`
                          p-3 rounded-lg border cursor-pointer transition-colors
                          ${selectedDocumentId === doc.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {selectedDocumentId === doc.id ? (
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <Check className="h-4 w-4 text-blue-600" />
                              </div>
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                                <FileText className="h-4 w-4 text-slate-500" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-sm">
                                {doc.document_number}
                              </p>
                              <p className="text-xs text-slate-500">
                                {doc.partner_name || 'Sans partenaire'} -{' '}
                                {formatDate(doc.document_date)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-sm">
                              {formatAmount(doc.total_ttc)}
                            </span>
                            {doc.amount_paid > 0 && (
                              <p className="text-xs text-slate-500">
                                Reste: {formatAmount(remaining)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {selectedDocumentId && (
              <div className="pt-4 border-t mt-4 space-y-3">
                <div>
                  <label className="text-sm text-slate-600">
                    Montant à allouer (€)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={String(remainingAmount.toFixed(2))}
                    value={allocatedAmount}
                    onChange={e => setAllocatedAmount(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleLinkDocument}
                  disabled={isLinking}
                >
                  {isLinking ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Liaison...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter ce document
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Tab: Commandes */}
          <TabsContent value="orders" className="flex-1 min-h-0 mt-4">
            {/* Recherche */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher par numéro de commande..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[220px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Aucune commande trouvée</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredOrders.map(order => (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`
                        p-3 rounded-lg border cursor-pointer transition-colors
                        ${selectedOrderId === order.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}
                        ${(order.matchScore || 0) >= 40 ? 'border-l-4 border-l-amber-400' : ''}
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {selectedOrderId === order.id ? (
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <Check className="h-4 w-4 text-blue-600" />
                            </div>
                          ) : (order.matchScore || 0) >= 40 ? (
                            <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                              <Sparkles className="h-4 w-4 text-amber-600" />
                            </div>
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                              <Package className="h-4 w-4 text-slate-500" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-sm">
                              #{order.order_number}
                            </p>
                            <p className="text-xs text-slate-500">
                              {order.customer_name || 'Client'} -{' '}
                              {formatDate(order.created_at)}
                            </p>
                            {order.matchReasons &&
                              order.matchReasons.length > 0 && (
                                <p className="text-xs text-amber-600 mt-0.5">
                                  {order.matchReasons.join(' • ')}
                                </p>
                              )}
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <div>
                            <span className="font-semibold text-sm">
                              {formatAmount(order.total_ttc)}
                            </span>
                            {(order.matchScore || 0) > 0 && (
                              <Badge
                                variant="outline"
                                className={`ml-2 text-xs ${
                                  (order.matchScore || 0) >= 60
                                    ? 'border-green-500 text-green-700'
                                    : (order.matchScore || 0) >= 40
                                      ? 'border-amber-500 text-amber-700'
                                      : 'border-slate-300 text-slate-500'
                                }`}
                              >
                                {order.matchScore}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {selectedOrderId && (
              <div className="pt-4 border-t mt-4 space-y-3">
                <div>
                  <label className="text-sm text-slate-600">
                    Montant à allouer (€)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={String(remainingAmount.toFixed(2))}
                    value={allocatedAmount}
                    onChange={e => setAllocatedAmount(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <Button
                  className="w-full"
                  onClick={handleLinkOrder}
                  disabled={isLinking}
                >
                  {isLinking ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Liaison...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter cette commande
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
