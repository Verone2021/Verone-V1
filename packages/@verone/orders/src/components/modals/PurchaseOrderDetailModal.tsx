'use client';

import { useState, useMemo, useEffect } from 'react';

import { RapprochementContent } from '@verone/finance/components';
import { OrganisationQuickViewModal } from '@verone/organisations';
import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';
import { Separator } from '@verone/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@verone/ui';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { formatCurrency, formatDate as formatDateUtil } from '@verone/utils';
import {
  X,
  Package,
  CreditCard,
  Banknote,
  Truck,
  Calendar,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
  Link2,
  Receipt,
  Loader2,
} from 'lucide-react';

import { createClient } from '@verone/utils/supabase/client';

import type { PurchaseOrder, ManualPaymentType } from '@verone/orders/hooks';
import { usePurchaseOrders, usePurchaseReceptions } from '@verone/orders/hooks';

import { PurchaseOrderReceptionModal } from './PurchaseOrderReceptionModal';

// ✅ Type Safety: Interface ProductImage stricte (IDENTIQUE à OrderDetailModal)
interface ProductImage {
  id?: string;
  public_url: string;
  is_primary: boolean;
  display_order?: number;
}

interface PurchaseOrderDetailModalProps {
  order: PurchaseOrder | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

// ✅ Status Labels Achats (ALIGNÉS avec workflow purchase orders)
const orderStatusLabels: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  confirmed: 'Confirmée',
  partially_received: 'Partiellement reçue',
  received: 'Reçue',
  cancelled: 'Annulée',
};

const orderStatusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  sent: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-purple-100 text-purple-800',
  partially_received: 'bg-yellow-100 text-yellow-800',
  received: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

// ✅ Payment Terms Labels (ENUM mapping - aligné avec CommercialEditSection)
const paymentTermsLabels: Record<string, string> = {
  PREPAID: 'Prépaiement obligatoire',
  NET_30: '30 jours net',
  NET_60: '60 jours net',
  NET_90: '90 jours net',
};

// Types for invoices and linked transactions
interface SupplierInvoice {
  id: string;
  document_number: string;
  workflow_status: string;
  status: string;
  total_ttc: number;
  amount_paid: number;
  document_date: string;
  due_date: string | null;
}

interface LinkedTransaction {
  id: string;
  allocated_amount: number;
  bank_transactions: {
    label: string;
    amount: number;
    settled_at: string | null;
    emitted_at: string;
  } | null;
}

export function PurchaseOrderDetailModal({
  order,
  open,
  onClose,
  onUpdate,
}: PurchaseOrderDetailModalProps) {
  const [showReceivingModal, setShowReceivingModal] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [manualPaymentType, setManualPaymentType] =
    useState<ManualPaymentType>('transfer_other');
  const [manualPaymentAmount, setManualPaymentAmount] = useState('');
  const [manualPaymentDate, setManualPaymentDate] = useState('');
  const [manualPaymentRef, setManualPaymentRef] = useState('');
  const [manualPaymentNote, setManualPaymentNote] = useState('');
  const [receptionHistory, setReceptionHistory] = useState<
    Array<{
      received_at: string;
      items?: Array<{
        product_name: string;
        product_sku: string;
        quantity_received: number;
      }>;
    }>
  >([]);
  const [cancellations, setCancellations] = useState<
    Array<{
      id: string;
      performed_at: string;
      notes: string | null;
      quantity_cancelled: number;
      product_name: string;
      product_sku: string;
    }>
  >([]);

  // Invoices & transactions state
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [linkedTransactions, setLinkedTransactions] = useState<
    LinkedTransaction[]
  >([]);
  const [isLoadingFinance, setIsLoadingFinance] = useState(false);

  const supabase = createClient();

  const { markAsManuallyPaid } = usePurchaseOrders();

  // Hook pour charger historique
  const { loadReceptionHistory, loadCancellationHistory } =
    usePurchaseReceptions();

  // Charger historique quand modal ouvert
  useEffect(() => {
    if (open && order?.id) {
      void loadReceptionHistory(order.id)
        .then(setReceptionHistory)
        .catch((err: unknown) => {
          console.error(
            '[PurchaseOrderDetailModal] Load reception history failed:',
            err
          );
        });
      void loadCancellationHistory(order.id)
        .then(setCancellations)
        .catch((err: unknown) => {
          console.error(
            '[PurchaseOrderDetailModal] Load cancellation history failed:',
            err
          );
        });
    }
  }, [open, order?.id, loadReceptionHistory, loadCancellationHistory]);

  // Charger factures fournisseur et transactions liées
  useEffect(() => {
    if (!open || !order?.id) return;

    const loadFinanceData = async () => {
      setIsLoadingFinance(true);
      try {
        // Fetch supplier invoices via API
        const invoiceRes = await fetch(
          `/api/qonto/invoices/by-order/${order.id}`
        );
        if (invoiceRes.ok) {
          const invoiceData = (await invoiceRes.json()) as {
            success: boolean;
            invoices?: SupplierInvoice[];
          };
          if (invoiceData.success && invoiceData.invoices) {
            setInvoices(invoiceData.invoices);
          }
        }

        // Fetch linked transactions
        const { data: links } = await supabase
          .from('transaction_document_links')
          .select(
            `
            id,
            allocated_amount,
            bank_transactions (label, amount, settled_at, emitted_at)
          `
          )
          .eq('purchase_order_id', order.id);

        if (links) {
          setLinkedTransactions(links as unknown as LinkedTransaction[]);
        }
      } catch (err) {
        console.error(
          '[PurchaseOrderDetailModal] Finance data fetch failed:',
          err
        );
      } finally {
        setIsLoadingFinance(false);
      }
    };

    void loadFinanceData();
  }, [open, order?.id, supabase]);

  // ✅ Calcul éco-taxe totale en useMemo (performance)
  // L'écotaxe est TOUJOURS par unité, donc on multiplie par la quantité
  const totalEcoTax = useMemo(() => {
    return (
      order?.purchase_order_items?.reduce(
        (sum, item) => sum + (item.eco_tax || 0) * item.quantity,
        0
      ) || 0
    );
  }, [order?.purchase_order_items]);

  if (!order) return null;

  const formatDate = (date: string | null) => {
    if (!date) return 'Non définie';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getSupplierName = () => {
    if (order.organisations) {
      return order.organisations.trade_name || order.organisations.legal_name;
    }
    return 'Fournisseur inconnu';
  };

  // Payment calculations
  const remainingAmount = Math.max(
    0,
    (order.total_ttc || 0) - (order.paid_amount || 0)
  );
  const canMarkAsPaid =
    order.status !== 'draft' && order.payment_status_v2 !== 'paid';

  const openPaymentDialog = () => {
    setManualPaymentType('transfer_other');
    setManualPaymentAmount(remainingAmount.toFixed(2));
    setManualPaymentDate(new Date().toISOString().split('T')[0]);
    setManualPaymentRef('');
    setManualPaymentNote('');
    setShowPaymentDialog(true);
  };

  const handleManualPaymentSubmit = () => {
    const amount = parseFloat(manualPaymentAmount);
    if (isNaN(amount) || amount <= 0) return;

    // Reject if amount exceeds remaining
    if (amount > remainingAmount + 0.01) return;

    setPaymentSubmitting(true);
    void markAsManuallyPaid(order.id, manualPaymentType, amount, {
      reference: manualPaymentRef || undefined,
      note: manualPaymentNote || undefined,
      date: manualPaymentDate ? new Date(manualPaymentDate) : undefined,
    })
      .then(() => {
        setShowPaymentDialog(false);
        onUpdate?.();
      })
      .catch((err: unknown) => {
        console.error('[PurchaseOrderDetailModal] Manual payment failed:', err);
      })
      .finally(() => {
        setPaymentSubmitting(false);
      });
  };

  // ✅ Workflow Achats: Permettre réception pour validated + partially_received
  const canReceive = ['validated', 'partially_received'].includes(order.status);

  // ✅ Récupérer payment_terms depuis organisation si non défini sur commande
  const paymentTerms =
    order.payment_terms || order.organisations?.payment_terms || null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          className="max-w-7xl max-h-[90vh] overflow-y-auto"
          hideCloseButton
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <DialogTitle className="text-xl">
                  Commande {order.po_number}
                </DialogTitle>
                <Badge className={orderStatusColors[order.status]}>
                  {orderStatusLabels[order.status]}
                </Badge>
              </div>
              <ButtonV2 variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </ButtonV2>
            </div>
          </DialogHeader>

          {/* NOUVEAU LAYOUT : Flex avec colonne principale + sidebar */}
          <div className="flex flex-col lg:flex-row gap-4 mt-3">
            {/* COLONNE PRINCIPALE (70%) - Produits DataTable */}
            <div className="flex-1 order-2 lg:order-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Produits ({order.purchase_order_items?.length || 0} article
                    {(order.purchase_order_items?.length || 0) > 1 ? 's' : ''})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* TABLE RESPONSIVE avec scroll horizontal mobile + hauteur limitée */}
                  <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
                    <Table className="min-w-[700px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20">Image</TableHead>
                          <TableHead>Produit</TableHead>
                          <TableHead className="w-20 text-right">Qté</TableHead>
                          <TableHead className="w-28 text-right">
                            Prix HT
                          </TableHead>
                          <TableHead className="w-28 text-right">
                            Total HT
                          </TableHead>
                          <TableHead className="w-28 text-right">
                            Revient Net
                          </TableHead>
                          <TableHead className="w-24 text-center">
                            Réception
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.purchase_order_items?.map(item => {
                          // ✅ BR-TECH-002: Récupérer image via product_images
                          const productImages = (item.products as any)
                            ?.product_images as ProductImage[] | undefined;
                          const primaryImageUrl =
                            productImages?.find(img => img.is_primary)
                              ?.public_url ||
                            productImages?.[0]?.public_url ||
                            null;

                          // Calcul total HT avec remise et éco-taxe
                          // L'écotaxe est par unité, donc on multiplie par la quantité
                          const totalHT =
                            item.quantity *
                              item.unit_price_ht *
                              (1 - (item.discount_percentage || 0) / 100) +
                            (item.eco_tax || 0) * item.quantity;

                          return (
                            <TableRow
                              key={item.id}
                              className="hover:bg-gray-50"
                            >
                              {/* IMAGE PRODUIT */}
                              <TableCell>
                                {primaryImageUrl ? (
                                  <img
                                    src={primaryImageUrl}
                                    alt={item?.products?.name ?? 'Produit'}
                                    className="w-12 h-12 object-cover rounded border"
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                                    <Package className="h-5 w-5 text-gray-400" />
                                  </div>
                                )}
                              </TableCell>

                              {/* NOM + SKU + BADGES */}
                              <TableCell>
                                <p className="font-medium text-sm">
                                  {item.products?.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                  SKU: {item.products?.sku}
                                </p>
                                {/* Badges inline (remise) */}
                                {item.discount_percentage > 0 && (
                                  <Badge
                                    variant="secondary"
                                    className="mt-1 text-xs bg-green-100 text-green-800 border-green-200"
                                  >
                                    -{item.discount_percentage.toFixed(1)}%
                                  </Badge>
                                )}
                              </TableCell>

                              {/* QUANTITÉ */}
                              <TableCell className="text-right font-medium">
                                {item.quantity}
                              </TableCell>

                              {/* PRIX UNITAIRE HT */}
                              <TableCell className="text-right">
                                {formatCurrency(item.unit_price_ht)}
                                {item.eco_tax > 0 && (
                                  <span className="block text-xs text-gray-500">
                                    + éco-taxe {formatCurrency(item.eco_tax)}
                                  </span>
                                )}
                              </TableCell>

                              {/* TOTAL HT */}
                              <TableCell className="text-right font-semibold">
                                {formatCurrency(totalHT)}
                              </TableCell>

                              {/* PRIX DE REVIENT NET */}
                              <TableCell className="text-right text-sm">
                                {item.unit_cost_net ? (
                                  formatCurrency(item.unit_cost_net)
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>

                              {/* RÉCEPTION */}
                              <TableCell className="text-center">
                                {item.quantity_received > 0 ? (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs bg-blue-100 text-blue-800 border-blue-200"
                                  >
                                    {item.quantity_received}/{item.quantity}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400 text-sm">
                                    -
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* TOTAUX (bas de table) */}
                  <Separator className="my-4" />
                  <div className="space-y-2 text-right">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total HT produits :</span>
                      <span className="font-semibold">
                        {formatCurrency(order.total_ht || 0)}
                      </span>
                    </div>

                    {/* Éco-taxe si > 0 */}
                    {totalEcoTax > 0 && (
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>🌿 Dont éco-taxe :</span>
                        <span>{formatCurrency(totalEcoTax)}</span>
                      </div>
                    )}

                    {/* Frais additionnels fournisseurs */}
                    {((order as any).shipping_cost_ht > 0 ||
                      (order as any).customs_cost_ht > 0 ||
                      (order as any).insurance_cost_ht > 0) && (
                      <>
                        {(order as any).shipping_cost_ht > 0 && (
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Frais de livraison HT :</span>
                            <span>
                              {formatCurrency((order as any).shipping_cost_ht)}
                            </span>
                          </div>
                        )}
                        {(order as any).customs_cost_ht > 0 && (
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Frais de douane HT :</span>
                            <span>
                              {formatCurrency((order as any).customs_cost_ht)}
                            </span>
                          </div>
                        )}
                        {(order as any).insurance_cost_ht > 0 && (
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Frais d'assurance HT :</span>
                            <span>
                              {formatCurrency((order as any).insurance_cost_ht)}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    <div className="flex justify-between text-sm text-gray-600">
                      <span>
                        TVA ({((order as any).tax_rate || 0.2) * 100}%) :
                      </span>
                      <span>
                        {formatCurrency(
                          (order.total_ht || 0) *
                            ((order as any).tax_rate || 0.2)
                        )}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-base font-bold">
                      <span>Total TTC :</span>
                      <span className="text-primary">
                        {formatCurrency(
                          (order.total_ht || 0) *
                            (1 + ((order as any).tax_rate || 0.2))
                        )}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* SIDEBAR (35%) - Informations contextuelles - Élargie pour meilleure lisibilité */}
            <div className="w-full lg:w-[420px] space-y-3 order-1 lg:order-2">
              {/* Card Fournisseur CONDENSÉE */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {order.supplier_id ? (
                          <button
                            type="button"
                            onClick={() => setShowOrgModal(true)}
                            className="text-left text-primary hover:underline cursor-pointer"
                          >
                            {getSupplierName()}
                          </button>
                        ) : (
                          getSupplierName()
                        )}
                      </CardTitle>
                      <Badge variant="outline" className="mt-1 text-xs">
                        Fournisseur
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-3 w-3" />
                    <span>Créée : {formatDate(order.created_at)}</span>
                  </div>
                  {order.expected_delivery_date && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Truck className="h-3 w-3" />
                      <span>
                        Livraison : {formatDate(order.expected_delivery_date)}
                      </span>
                    </div>
                  )}
                  {order.received_at && (
                    <div className="flex items-center gap-2 text-green-600">
                      <Package className="h-3 w-3" />
                      <span>Reçue : {formatDate(order.received_at)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Card Paiement (enrichie — alignée avec OrderDetailModal) */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CreditCard className="h-3 w-3" />
                    Paiement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {order.payment_status_v2 && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Statut :</span>
                      <Badge
                        className={`text-xs ${
                          order.payment_status_v2 === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : order.payment_status_v2 === 'partially_paid'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {order.payment_status_v2 === 'paid'
                          ? 'Payé'
                          : order.payment_status_v2 === 'partially_paid'
                            ? 'Partiellement payé'
                            : 'En attente'}
                      </Badge>
                    </div>
                  )}

                  {paymentTerms && (
                    <div className="bg-green-50 p-2 rounded border border-green-200">
                      <p className="text-xs font-medium text-green-800">
                        {paymentTermsLabels[paymentTerms] || paymentTerms}
                      </p>
                      <p className="text-xs text-green-600 mt-1">
                        {order.payment_terms
                          ? 'Défini sur commande'
                          : 'Hérité du fournisseur'}
                      </p>
                    </div>
                  )}

                  {order.paid_amount !== undefined && order.paid_amount > 0 && (
                    <div className="bg-green-50 p-2 rounded border border-green-200">
                      <p className="text-xs text-gray-600">Montant payé</p>
                      <p className="text-sm font-bold text-green-700">
                        {formatCurrency(order.paid_amount)} /{' '}
                        {formatCurrency(order.total_ttc || 0)}
                      </p>
                      {order.paid_at && (
                        <p className="text-xs text-gray-600 mt-1">
                          Le {formatDate(order.paid_at)}
                        </p>
                      )}
                    </div>
                  )}

                  {canMarkAsPaid && (
                    <ButtonV2
                      onClick={openPaymentDialog}
                      size="sm"
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <Banknote className="h-3 w-3 mr-1" />
                      Enregistrer un paiement
                    </ButtonV2>
                  )}
                </CardContent>
              </Card>

              {/* Card Factures Fournisseur */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Receipt className="h-3 w-3" />
                    Factures fournisseur
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {isLoadingFinance ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    </div>
                  ) : invoices.length > 0 ? (
                    invoices.map(inv => (
                      <div
                        key={inv.id}
                        className="bg-slate-50 p-2 rounded border text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {inv.document_number}
                          </span>
                          <Badge
                            variant="outline"
                            className={
                              inv.workflow_status === 'paid'
                                ? 'bg-green-50 text-green-700 border-green-300'
                                : 'bg-amber-50 text-amber-700 border-amber-300'
                            }
                          >
                            {inv.workflow_status === 'paid'
                              ? 'Payée'
                              : 'En attente'}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-gray-500">
                          <span>
                            {new Date(inv.document_date).toLocaleDateString(
                              'fr-FR'
                            )}
                          </span>
                          <span className="font-semibold text-red-600">
                            -{formatCurrency(inv.total_ttc)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 text-center py-2">
                      Aucune facture liée
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Card Rapprochement bancaire */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Link2 className="h-3 w-3" />
                    Rapprochement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {isLoadingFinance ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                    </div>
                  ) : linkedTransactions.length > 0 ? (
                    <>
                      {linkedTransactions.map(link => (
                        <div
                          key={link.id}
                          className="bg-green-50 p-2 rounded border border-green-200 text-xs space-y-1"
                        >
                          <div className="flex items-center gap-1">
                            <Link2 className="h-3 w-3 text-green-600" />
                            <span className="font-medium text-green-800">
                              Transaction liée
                            </span>
                          </div>
                          <p className="text-gray-700 truncate">
                            {link.bank_transactions?.label || 'Transaction'}
                          </p>
                          <div className="flex justify-between">
                            <span className="text-gray-500">
                              {link.bank_transactions?.settled_at
                                ? new Date(
                                    link.bank_transactions.settled_at
                                  ).toLocaleDateString('fr-FR')
                                : link.bank_transactions?.emitted_at
                                  ? new Date(
                                      link.bank_transactions.emitted_at
                                    ).toLocaleDateString('fr-FR')
                                  : ''}
                            </span>
                            <span className="font-semibold text-red-600">
                              -{formatCurrency(Math.abs(link.allocated_amount))}
                            </span>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <p className="text-center text-xs text-gray-500 py-2">
                      Non rapprochée
                    </p>
                  )}

                  {/* Bouton rapprochement — ouvre Dialog paiement onglet rapprochement */}
                  <ButtonV2
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setShowPaymentDialog(true);
                    }}
                  >
                    <Link2 className="h-3 w-3 mr-1" />
                    Rapprocher une transaction
                  </ButtonV2>
                </CardContent>
              </Card>

              {/* Card Réception */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Truck className="h-3 w-3" />
                    Réception
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {order.received_at ? (
                    <Badge
                      variant="secondary"
                      className="w-full justify-center bg-green-100 text-green-800 border-green-200"
                    >
                      Reçue le {formatDate(order.received_at)}
                    </Badge>
                  ) : order.status === 'partially_received' ? (
                    <Badge
                      variant="secondary"
                      className="w-full justify-center bg-yellow-100 text-yellow-800 border-yellow-200"
                    >
                      Partiellement reçue
                    </Badge>
                  ) : (
                    <p className="text-center text-xs text-gray-500">
                      Pas encore reçue
                    </p>
                  )}

                  {canReceive && (
                    <ButtonV2
                      onClick={() => setShowReceivingModal(true)}
                      size="sm"
                      className="w-full"
                    >
                      <Truck className="h-3 w-3 mr-1" />
                      Gérer réception
                    </ButtonV2>
                  )}
                </CardContent>
              </Card>

              {/* Card Historique Réceptions (si existe) */}
              {(receptionHistory.length > 0 || cancellations.length > 0) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <History className="h-3 w-3" />
                      Historique (
                      {receptionHistory.length + cancellations.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-[320px] overflow-y-auto">
                    {/* Réceptions */}
                    {receptionHistory.map((h, idx) => (
                      <div
                        key={`reception-${idx}`}
                        className="border rounded p-2 bg-gray-50 text-xs"
                      >
                        <div className="flex items-center gap-1 mb-1">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          <span className="font-semibold text-gray-800">
                            Réception #{idx + 1}
                          </span>
                          <span className="text-gray-400">—</span>
                          <span className="text-gray-600">
                            {formatDateUtil(h.received_at)}
                          </span>
                        </div>
                        <div className="ml-4 space-y-0.5">
                          {h.items?.map((item: any, itemIdx: number) => {
                            const orderItem = order.purchase_order_items?.find(
                              i => i.products?.sku === item.product_sku
                            );
                            const qtyOrdered = orderItem?.quantity || '?';
                            return (
                              <div
                                key={itemIdx}
                                className="flex items-center justify-between"
                              >
                                <span className="text-gray-600 truncate max-w-[120px]">
                                  {item.product_name || item.product_sku}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1 py-0"
                                >
                                  {item.quantity_received}/{qtyOrdered}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Annulations */}
                    {cancellations.map((c, idx) => {
                      const motifMatch = c.notes?.match(/unités\.\s*(.+)$/);
                      const motif = motifMatch?.[1]?.trim() || null;

                      return (
                        <div
                          key={`cancel-${idx}`}
                          className="border rounded p-2 bg-red-50 border-red-200 text-xs"
                        >
                          <div className="flex items-center gap-1 mb-1">
                            <XCircle className="h-3 w-3 text-red-600" />
                            <span className="font-semibold text-red-800">
                              Reliquat annulé
                            </span>
                            <span className="text-red-400">—</span>
                            <span className="text-red-600">
                              {formatDateUtil(c.performed_at)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center justify-between">
                              <span className="text-red-700 truncate max-w-[120px]">
                                {c.product_name}
                              </span>
                              <Badge className="text-[10px] px-1 py-0 bg-red-100 text-red-800 border-red-300">
                                -{c.quantity_cancelled}
                              </Badge>
                            </div>
                            {motif && (
                              <p className="text-red-600 italic mt-0.5">
                                {motif}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Message clôture partielle */}
                    {order.status === 'received' &&
                      cancellations.length > 0 && (
                        <div className="flex items-center gap-1 p-2 bg-amber-50 rounded border border-amber-200">
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                          <span className="text-xs text-amber-700">
                            Clôturée avec réception partielle
                          </span>
                        </div>
                      )}
                  </CardContent>
                </Card>
              )}

              {/* Card Notes (si existe) */}
              {order.notes && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-3 w-3" />
                      Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-700 whitespace-pre-wrap">
                      {order.notes}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Card Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <ButtonV2
                    variant="outline"
                    size="sm"
                    className="w-full justify-start opacity-50 text-xs"
                    disabled
                    title="Fonctionnalité disponible en Phase 2"
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Télécharger BC
                  </ButtonV2>
                  <ButtonV2
                    variant="outline"
                    size="sm"
                    className="w-full justify-start opacity-50 text-xs"
                    disabled
                    title="Fonctionnalité disponible en Phase 2"
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Exporter PDF
                  </ButtonV2>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Quick View Organisation (fournisseur) */}
      {order.supplier_id && (
        <OrganisationQuickViewModal
          organisationId={order.supplier_id}
          open={showOrgModal}
          onOpenChange={setShowOrgModal}
        />
      )}

      {/* ✅ Modal Gestion Réception */}
      <PurchaseOrderReceptionModal
        order={order}
        open={showReceivingModal}
        onClose={() => setShowReceivingModal(false)}
        onSuccess={() => {
          setShowReceivingModal(false);
          onUpdate?.();
        }}
      />

      {/* Dialog Enregistrer un paiement (2 onglets — aligné avec OrderDetailModal) */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enregistrer un paiement</DialogTitle>
            <p className="text-sm text-gray-500">
              Commande {order.po_number} — Total :{' '}
              {formatCurrency(order.total_ttc || 0)}
            </p>
            {(order.paid_amount || 0) > 0 && (
              <p className="text-sm text-gray-500">
                Déjà payé : {formatCurrency(order.paid_amount || 0)} — Reste :{' '}
                {formatCurrency(remainingAmount)}
              </p>
            )}
          </DialogHeader>

          <Tabs defaultValue="manual" className="mt-2">
            <TabsList className="w-full">
              <TabsTrigger value="rapprochement" className="flex-1">
                Rapprochement bancaire
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex-1">
                Paiement manuel
              </TabsTrigger>
            </TabsList>

            <TabsContent value="rapprochement" className="mt-4">
              <RapprochementContent
                order={{
                  id: order.id,
                  order_number: order.po_number,
                  customer_name: getSupplierName(),
                  customer_name_alt:
                    order.organisations?.trade_name &&
                    order.organisations?.legal_name !==
                      order.organisations?.trade_name
                      ? order.organisations.legal_name
                      : null,
                  total_ttc:
                    order.total_ttc ||
                    (order.total_ht || 0) * (1 + (order.tax_rate || 0.2)),
                  created_at: order.created_at,
                  order_date: order.order_date ?? null,
                  shipped_at: null,
                }}
                orderType="purchase_order"
                onSuccess={() => {
                  setShowPaymentDialog(false);
                  onUpdate?.();
                }}
              />
            </TabsContent>

            <TabsContent value="manual" className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="po-payment-type">Type de paiement</Label>
                <Select
                  value={manualPaymentType}
                  onValueChange={v =>
                    setManualPaymentType(v as ManualPaymentType)
                  }
                >
                  <SelectTrigger id="po-payment-type">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="transfer_other">
                      Virement bancaire
                    </SelectItem>
                    <SelectItem value="cash">Espèces</SelectItem>
                    <SelectItem value="check">Chèque</SelectItem>
                    <SelectItem value="card">Carte bancaire</SelectItem>
                    <SelectItem value="compensation">Compensation</SelectItem>
                    <SelectItem value="verified_bubble">
                      Vérifié Bubble (legacy)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="po-payment-amount">
                  Montant (€)
                  {remainingAmount > 0 && (
                    <span className="text-muted-foreground font-normal ml-1">
                      — Reste à payer : {remainingAmount.toFixed(2)} €
                    </span>
                  )}
                </Label>
                <Input
                  id="po-payment-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={remainingAmount}
                  value={manualPaymentAmount}
                  onChange={e => setManualPaymentAmount(e.target.value)}
                />
                {parseFloat(manualPaymentAmount) > remainingAmount + 0.01 && (
                  <p className="text-sm text-destructive">
                    Le montant dépasse le reste à payer (
                    {remainingAmount.toFixed(2)} €)
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="po-payment-date">Date du paiement</Label>
                <Input
                  id="po-payment-date"
                  type="date"
                  value={manualPaymentDate}
                  onChange={e => setManualPaymentDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="po-payment-ref">
                  Référence{' '}
                  <span className="text-gray-400 font-normal">(optionnel)</span>
                </Label>
                <Input
                  id="po-payment-ref"
                  placeholder="N° chèque, réf. virement..."
                  value={manualPaymentRef}
                  onChange={e => setManualPaymentRef(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="po-payment-note">
                  Note{' '}
                  <span className="text-gray-400 font-normal">(optionnel)</span>
                </Label>
                <Input
                  id="po-payment-note"
                  placeholder="Commentaire..."
                  value={manualPaymentNote}
                  onChange={e => setManualPaymentNote(e.target.value)}
                />
              </div>

              <ButtonV2
                onClick={handleManualPaymentSubmit}
                disabled={
                  paymentSubmitting ||
                  !manualPaymentAmount ||
                  parseFloat(manualPaymentAmount) <= 0 ||
                  parseFloat(manualPaymentAmount) > remainingAmount + 0.01 ||
                  remainingAmount <= 0
                }
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {paymentSubmitting
                  ? 'Enregistrement...'
                  : 'Enregistrer le paiement'}
              </ButtonV2>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
