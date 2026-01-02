'use client';

/**
 * RapprochementModal - Modal pour le rapprochement bancaire multi-docs
 *
 * SLICE 4: Support many-to-many entre transactions et documents/commandes.
 *
 * Features:
 * - Lier une transaction à plusieurs documents
 * - Lier une transaction à plusieurs commandes
 * - Paiements partiels avec montants alloués
 * - Affichage des liens existants
 * - Suppression de liens individuels
 */

import { useState, useEffect, useCallback } from 'react';

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
  Separator,
} from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import {
  FileText,
  Upload,
  Link2,
  Check,
  Search,
  Building2,
  Package,
  RefreshCw,
  Trash2,
  Plus,
  AlertCircle,
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
  customer_name?: string;
  created_at: string;
  status: string;
}

interface TransactionLink {
  link_id: string;
  link_type: string;
  document_id: string | null;
  document_number: string | null;
  document_amount: number | null;
  sales_order_id: string | null;
  sales_order_number: string | null;
  purchase_order_id: string | null;
  purchase_order_number: string | null;
  allocated_amount: number | null;
  organisation_name: string | null;
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
  const [activeTab, setActiveTab] = useState<'links' | 'documents' | 'orders'>(
    'links'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<FinancialDocument[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [existingLinks, setExistingLinks] = useState<TransactionLink[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null
  );
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [allocatedAmount, setAllocatedAmount] = useState<string>('');

  // Calculer le montant restant à allouer
  const allocatedTotal = existingLinks.reduce(
    (sum, link) => sum + (link.allocated_amount || 0),
    0
  );
  const remainingAmount = Math.abs(amount) - allocatedTotal;

  // Charger les liens existants
  const fetchExistingLinks = useCallback(async () => {
    if (!transactionId) return;

    try {
      const supabase = createClient();
      const { data, error } = await (supabase.rpc as CallableFunction)(
        'get_transaction_links',
        { p_transaction_id: transactionId }
      );

      if (error) {
        console.error('[RapprochementModal] Error fetching links:', error);
        return;
      }

      setExistingLinks((data || []) as TransactionLink[]);
    } catch (err) {
      console.error('[RapprochementModal] Error:', err);
    }
  }, [transactionId]);

  // Charger les documents et commandes disponibles
  const fetchAvailableItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();

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

      // Récupérer les commandes validées/livrées
      const { data: ordersData, error: ordersError } = await supabase
        .from('sales_orders')
        .select(
          `
          id,
          order_number,
          total_ht,
          created_at,
          status
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
          created_at: string;
          status: string;
        };
        setOrders(
          (ordersData as OrderRow[]).map(o => ({
            id: o.id,
            order_number: o.order_number,
            total_ht: o.total_ht,
            created_at: o.created_at,
            status: o.status,
            customer_name: undefined,
          }))
        );
      }
    } catch (err) {
      console.error('[RapprochementModal] Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Charger les données au mount
  useEffect(() => {
    if (!open) return;

    fetchExistingLinks();
    fetchAvailableItems();

    // Reset des sélections
    setSelectedDocumentId(null);
    setSelectedOrderId(null);
    setAllocatedAmount('');
  }, [open, fetchExistingLinks, fetchAvailableItems]);

  // Filtrer les documents
  const filteredDocuments = documents.filter(
    d =>
      !existingLinks.some(link => link.document_id === d.id) &&
      (d.document_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.partner_name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Filtrer les commandes
  const filteredOrders = orders.filter(
    o =>
      !existingLinks.some(link => link.sales_order_id === o.id) &&
      (o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()))
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
      await fetchExistingLinks();
      setActiveTab('links');
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
      await fetchExistingLinks();
      setActiveTab('links');
    } catch (err) {
      console.error('[RapprochementModal] Link order error:', err);
      toast.error('Erreur lors du rapprochement');
    } finally {
      setIsLinking(false);
    }
  };

  // Supprimer un lien
  const handleUnlink = async (linkId: string) => {
    try {
      const supabase = createClient();

      const { error } = await (supabase.rpc as CallableFunction)(
        'unlink_transaction_document',
        { p_link_id: linkId }
      );

      if (error) throw error;

      toast.success('Lien supprimé');
      await fetchExistingLinks();
    } catch (err) {
      console.error('[RapprochementModal] Unlink error:', err);
      toast.error('Erreur lors de la suppression');
    }
  };

  // Terminer et fermer
  const handleFinish = () => {
    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5 text-blue-600" />
            Rapprochement Bancaire
          </DialogTitle>
          <DialogDescription>
            Liez cette transaction à un ou plusieurs documents/commandes
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
              {existingLinks.length > 0 && (
                <p className="text-sm text-slate-500">
                  Alloué: {formatAmount(allocatedTotal)}
                </p>
              )}
            </div>
          </div>

          {/* Barre de progression allocation */}
          {existingLinks.length > 0 && (
            <div className="pt-2">
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>Allocation</span>
                <span>
                  {Math.round((allocatedTotal / Math.abs(amount)) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    allocatedTotal >= Math.abs(amount)
                      ? 'bg-green-500'
                      : 'bg-blue-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (allocatedTotal / Math.abs(amount)) * 100)}%`,
                  }}
                />
              </div>
              {remainingAmount > 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  <AlertCircle className="inline h-3 w-3 mr-1" />
                  Reste à allouer: {formatAmount(remainingAmount)}
                </p>
              )}
            </div>
          )}

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

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={v =>
            setActiveTab(v as 'links' | 'documents' | 'orders')
          }
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="links" className="gap-2">
              <Link2 className="h-4 w-4" />
              Liens ({existingLinks.length})
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <Package className="h-4 w-4" />
              Commandes
            </TabsTrigger>
          </TabsList>

          {/* Tab: Liens existants */}
          <TabsContent value="links" className="flex-1 min-h-0 mt-4">
            {existingLinks.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Link2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>Aucun document lié</p>
                <p className="text-sm mt-1">
                  Utilisez les onglets Documents ou Commandes pour en ajouter
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[280px]">
                <div className="space-y-2">
                  {existingLinks.map(link => (
                    <div
                      key={link.link_id}
                      className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                          {link.link_type === 'document' ? (
                            <FileText className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Package className="h-4 w-4 text-emerald-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {link.document_number ||
                              link.sales_order_number ||
                              link.purchase_order_number ||
                              'Document'}
                          </p>
                          <p className="text-xs text-slate-600">
                            {link.organisation_name || link.link_type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-sm">
                          {link.allocated_amount
                            ? formatAmount(link.allocated_amount)
                            : '-'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnlink(link.link_id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            <div className="pt-4 border-t mt-4">
              <Button className="w-full" onClick={handleFinish}>
                <Check className="h-4 w-4 mr-2" />
                Terminer
              </Button>
            </div>
          </TabsContent>

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
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {selectedOrderId === order.id ? (
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <Check className="h-4 w-4 text-blue-600" />
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
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-sm">
                            {formatAmount(order.total_ht)}
                          </span>
                          <Badge variant="outline" className="ml-2 text-xs">
                            {order.status}
                          </Badge>
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
