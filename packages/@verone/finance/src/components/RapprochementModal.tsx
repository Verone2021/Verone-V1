'use client';

/**
 * RapprochementModal - Modal pour le rapprochement bancaire
 *
 * Mission: Lier une transaction à un document (facture, avoir) ou une commande.
 * Ce N'EST PAS pour la classification PCG (voir ClassificationModal).
 *
 * Actions possibles:
 * 1. Lier à un document existant (facture fournisseur)
 * 2. Uploader un nouveau document
 * 3. Lier à une commande (optionnel)
 * 4. Afficher l'organisation (lecture seule si déjà liée)
 */

import { useState, useEffect } from 'react';

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
  Upload,
  Link2,
  Check,
  Search,
  Building2,
  Package,
  RefreshCw,
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
  const [activeTab, setActiveTab] = useState<'documents' | 'orders' | 'upload'>(
    'documents'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [documents, setDocuments] = useState<FinancialDocument[]>([]);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    null
  );
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Charger les documents non rapprochés
  useEffect(() => {
    if (!open) return;

    async function fetchDocuments() {
      setIsLoading(true);
      try {
        const supabase = createClient();

        // Récupérer les documents financiers récents
        // Note: financial_documents n'a pas de matched_transaction_id,
        // on utilise les documents récents non liés
        const { data: docs, error: docsError } = await supabase
          .from('financial_documents')
          .select(
            `
            id,
            document_type,
            document_number,
            total_ttc,
            document_date,
            partner_id,
            organisations:partner_id(legal_name)
          `
          )
          .order('document_date', { ascending: false })
          .limit(50);

        if (!docsError && docs) {
          type DocRow = {
            id: string;
            document_type: string;
            document_number: string;
            total_ttc: number;
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
              partner_name: d.organisations?.legal_name,
              document_date: d.document_date,
            }))
          );
        }

        // Récupérer les commandes récentes (pour rapprochement crédits)
        // Note: On simplifie en ne joignant pas les customers pour l'instant
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
          .limit(50);

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
              customer_name: undefined, // Will be enhanced later
            }))
          );
        }
      } catch (err) {
        console.error('[RapprochementModal] Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDocuments();
  }, [open]);

  // Filtrer les résultats par recherche
  const filteredDocuments = documents.filter(
    d =>
      d.document_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.partner_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = orders.filter(
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

      // Mettre à jour la transaction bancaire
      const { error: txError } = await supabase
        .from('bank_transactions')
        .update({
          matched_document_id: selectedDocumentId,
          matching_status: 'manual_matched',
          updated_at: new Date().toISOString(),
        })
        .eq('id', transactionId);

      if (txError) throw txError;

      // Mettre à jour le document
      const { error: docError } = await supabase
        .from('financial_documents')
        .update({
          matched_transaction_id: transactionId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedDocumentId);

      if (docError) throw docError;

      toast.success('Transaction rapprochée avec le document');
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

      // Mettre à jour la transaction bancaire
      // Note: On stocke la référence de la commande dans le champ reference
      const selectedOrder = orders.find(o => o.id === selectedOrderId);
      const { error: txError } = await supabase
        .from('bank_transactions')
        .update({
          reference: selectedOrder?.order_number,
          matching_status: 'manual_matched',
          match_reason: `Lié à la commande ${selectedOrder?.order_number}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', transactionId);

      if (txError) throw txError;

      toast.success('Transaction rapprochée avec la commande');
      onSuccess?.();
      onOpenChange(false);
    } catch (err) {
      console.error('[RapprochementModal] Link order error:', err);
      toast.error('Erreur lors du rapprochement');
    } finally {
      setIsLinking(false);
    }
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
            Liez cette transaction à un document ou une commande existante
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
            <span
              className={`text-lg font-bold ${amount < 0 ? 'text-red-600' : 'text-green-600'}`}
            >
              {amount < 0 ? '' : '+'}
              {formatAmount(amount)}
            </span>
          </div>

          {/* Organisation liée (lecture seule) */}
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
            setActiveTab(v as 'documents' | 'orders' | 'upload')
          }
          className="flex-1 flex flex-col min-h-0"
        >
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="h-4 w-4" />
              Documents
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <Package className="h-4 w-4" />
              Commandes
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
          </TabsList>

          {/* Recherche */}
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Rechercher par référence, organisation..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Contenu des tabs */}
          <TabsContent value="documents" className="flex-1 min-h-0 mt-4">
            <ScrollArea className="h-[300px]">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : filteredDocuments.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Aucun document non rapproché trouvé</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDocuments.map(doc => (
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
                        <span className="font-semibold">
                          {formatAmount(doc.total_ttc)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {selectedDocumentId && (
              <div className="pt-4 border-t mt-4">
                <Button
                  className="w-full"
                  onClick={handleLinkDocument}
                  disabled={isLinking}
                >
                  {isLinking ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Rapprochement...
                    </>
                  ) : (
                    <>
                      <Link2 className="h-4 w-4 mr-2" />
                      Rapprocher avec ce document
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="flex-1 min-h-0 mt-4">
            <ScrollArea className="h-[300px]">
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
                          <span className="font-semibold">
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
              <div className="pt-4 border-t mt-4">
                <Button
                  className="w-full"
                  onClick={handleLinkOrder}
                  disabled={isLinking}
                >
                  {isLinking ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Rapprochement...
                    </>
                  ) : (
                    <>
                      <Link2 className="h-4 w-4 mr-2" />
                      Rapprocher avec cette commande
                    </>
                  )}
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="upload" className="flex-1 min-h-0 mt-4">
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
              <Upload className="h-10 w-10 mx-auto mb-4 text-slate-400" />
              <p className="text-sm text-slate-600 mb-2">
                Uploadez un justificatif pour cette transaction
              </p>
              <p className="text-xs text-slate-400 mb-4">
                PDF, JPG ou PNG - Max 10 MB
              </p>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Choisir un fichier
              </Button>
              <p className="text-xs text-slate-400 mt-4">
                Pour uploader directement vers Qonto, utilisez la page
                Justificatifs
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
