'use client';

import { useState, useMemo, useEffect } from 'react';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@verone/ui';
import { Separator } from '@verone/ui';
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
  Truck,
  Calendar,
  User,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  History,
} from 'lucide-react';

import type { PurchaseOrder } from '@verone/orders/hooks';
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

export function PurchaseOrderDetailModal({
  order,
  open,
  onClose,
  onUpdate,
}: PurchaseOrderDetailModalProps) {
  const [showReceivingModal, setShowReceivingModal] = useState(false);
  const [receptionHistory, setReceptionHistory] = useState<any[]>([]);
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

  // Hook pour charger historique
  const { loadReceptionHistory, loadCancellationHistory } =
    usePurchaseReceptions();

  // Charger historique quand modal ouvert
  useEffect(() => {
    if (open && order?.id) {
      loadReceptionHistory(order.id).then(setReceptionHistory);
      loadCancellationHistory(order.id).then(setCancellations);
    }
  }, [open, order?.id, loadReceptionHistory, loadCancellationHistory]);

  // ✅ Calcul éco-taxe totale en useMemo (performance)
  const totalEcoTax = useMemo(() => {
    return (
      order?.purchase_order_items?.reduce(
        (sum, item) => sum + (item.eco_tax || 0),
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

  // ✅ Workflow Achats: Permettre réception pour validated + partially_received
  const canReceive = ['validated', 'partially_received'].includes(order.status);

  // ✅ Récupérer payment_terms depuis organisation si non défini sur commande
  const paymentTerms =
    order.payment_terms || order.organisations?.payment_terms || null;

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
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
                  {/* TABLE RESPONSIVE avec scroll horizontal mobile */}
                  <div className="overflow-x-auto">
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
                          const totalHT =
                            item.quantity *
                              item.unit_price_ht *
                              (1 - (item.discount_percentage || 0) / 100) +
                            (item.eco_tax || 0);

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
                      <span className="text-gray-600">Total HT :</span>
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

                    <div className="flex justify-between text-sm text-gray-600">
                      <span>TVA (20%) :</span>
                      <span>
                        {formatCurrency(
                          (order.total_ttc || 0) - (order.total_ht || 0)
                        )}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-base font-bold">
                      <span>Total TTC :</span>
                      <span className="text-primary">
                        {formatCurrency(order.total_ttc || 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* SIDEBAR (30%) - Informations contextuelles */}
            <div className="w-full lg:w-80 space-y-3 order-1 lg:order-2">
              {/* Card Fournisseur CONDENSÉE */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {getSupplierName()}
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

              {/* Card Conditions Paiement */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CreditCard className="h-3 w-3" />
                    Paiement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {paymentTerms ? (
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
                  ) : (
                    <p className="text-xs text-gray-500 text-center py-2">
                      Non spécifié
                    </p>
                  )}
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
                  <CardContent className="space-y-2 max-h-64 overflow-y-auto">
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
    </>
  );
}
