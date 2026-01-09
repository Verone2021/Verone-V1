'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { InvoiceCreateFromOrderModal } from '@verone/finance/components';
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
import { formatCurrency } from '@verone/utils';
import {
  X,
  Package,
  CreditCard,
  Truck,
  Calendar,
  MapPin,
  FileText,
  Store,
  ExternalLink,
  Link2,
} from 'lucide-react';

// NOTE: SalesOrderShipmentModal supprimé - sera recréé ultérieurement
import { useSalesOrders } from '@verone/orders/hooks';
import type { SalesOrder } from '@verone/orders/hooks';

// ✅ Type Safety: Interface ProductImage stricte (IDENTIQUE à PurchaseOrderDetailModal)
interface ProductImage {
  id?: string;
  public_url: string;
  is_primary: boolean;
  display_order?: number;
}

interface OrderDetailModalProps {
  order: SalesOrder | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
  readOnly?: boolean; // Mode lecture seule pour commandes d'autres canaux
  channelRedirectUrl?: string | null; // URL de redirection vers CMS du canal
}

const paymentStatusLabels: Record<string, string> = {
  pending: 'En attente',
  partial: 'Partiel',
  paid: 'Payé',
  refunded: 'Remboursé',
  overdue: 'En retard',
};

const paymentStatusColors: Record<string, string> = {
  pending: 'bg-orange-100 text-orange-800',
  partial: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  refunded: 'bg-gray-100 text-gray-800',
  overdue: 'bg-red-100 text-red-800',
};

const orderStatusLabels: Record<string, string> = {
  draft: 'Brouillon',
  confirmed: 'Validée',
  partially_shipped: 'Partiellement expédiée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

const orderStatusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  confirmed: 'bg-blue-100 text-blue-800',
  partially_shipped: 'bg-purple-100 text-purple-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function OrderDetailModal({
  order,
  open,
  onClose,
  onUpdate,
  readOnly = false,
  channelRedirectUrl,
}: OrderDetailModalProps) {
  // NOTE: showShippingModal supprimé - modal sera recréé ultérieurement
  const { markAsPaid } = useSalesOrders();
  const router = useRouter();
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  if (!order) return null;

  const formatDate = (date: string | null) => {
    if (!date) return 'Non définie';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getCustomerName = () => {
    if (order.customer_type === 'organization' && order.organisations) {
      return order.organisations.trade_name || order.organisations.legal_name;
    } else if (
      order.customer_type === 'individual' &&
      order.individual_customers
    ) {
      const customer = order.individual_customers;
      return `${customer.first_name} ${customer.last_name}`;
    }
    return 'Client inconnu';
  };

  const getCustomerType = () => {
    return order.customer_type === 'organization'
      ? 'Professionnel'
      : 'Particulier';
  };

  const handleMarkAsPaid = async () => {
    await markAsPaid(order.id);
    onUpdate?.();
  };

  const canMarkAsPaid =
    ['validated', 'partially_shipped', 'shipped'].includes(order.status) &&
    (order.payment_status === 'pending' || order.payment_status === 'partial');

  // Workflow Odoo-inspired: Permettre expédition pour validated + partially_shipped
  const canShip = ['validated', 'partially_shipped'].includes(order.status);

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
                  Commande {order.order_number}
                </DialogTitle>
                <Badge className={orderStatusColors[order.status]}>
                  {orderStatusLabels[order.status]}
                </Badge>
                {order.sales_channel?.name && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Store className="h-3 w-3" />
                    {order.sales_channel.name}
                  </Badge>
                )}
              </div>
              <ButtonV2 variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </ButtonV2>
            </div>
          </DialogHeader>

          {/* LAYOUT IDENTIQUE À PurchaseOrderDetailModal : Flex avec colonne principale + sidebar */}
          <div className="flex flex-col lg:flex-row gap-4 mt-3">
            {/* COLONNE PRINCIPALE (70%) - Produits DataTable UNIQUEMENT */}
            <div className="flex-1 order-2 lg:order-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Produits ({order.sales_order_items?.length || 0} article
                    {(order.sales_order_items?.length || 0) > 1 ? 's' : ''})
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
                          <TableHead className="w-24 text-center">
                            Expédié
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {order.sales_order_items?.map(item => {
                          // ✅ BR-TECH-002: Récupérer image via product_images
                          const productImages = (item.products as any)
                            ?.product_images as ProductImage[] | undefined;
                          const primaryImageUrl =
                            productImages?.find(img => img.is_primary)
                              ?.public_url ||
                            productImages?.[0]?.public_url ||
                            null;

                          // Calcul total HT avec remise
                          const totalHT =
                            item.quantity *
                            item.unit_price_ht *
                            (1 - (item.discount_percentage || 0) / 100);

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
                              </TableCell>

                              {/* TOTAL HT */}
                              <TableCell className="text-right font-semibold">
                                {formatCurrency(totalHT)}
                              </TableCell>

                              {/* EXPÉDITION */}
                              <TableCell className="text-center">
                                {(item as any).quantity_shipped > 0 ? (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs bg-blue-100 text-blue-800 border-blue-200"
                                  >
                                    {(item as any).quantity_shipped}/
                                    {item.quantity}
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
                  {(() => {
                    // === CALCUL TVA PAR LIGNE DE PRODUIT ===
                    // Grouper les lignes par taux de TVA
                    const tvaByRate: Record<
                      number,
                      { ht: number; tva: number }
                    > = {};
                    let productsHT = 0;

                    order.sales_order_items?.forEach(item => {
                      const lineHT =
                        item.quantity *
                        item.unit_price_ht *
                        (1 - (item.discount_percentage || 0) / 100);
                      const lineTaxRate = item.tax_rate || 0.2;
                      const lineTVA = lineHT * lineTaxRate;

                      productsHT += lineHT;

                      if (!tvaByRate[lineTaxRate]) {
                        tvaByRate[lineTaxRate] = { ht: 0, tva: 0 };
                      }
                      tvaByRate[lineTaxRate].ht += lineHT;
                      tvaByRate[lineTaxRate].tva += lineTVA;
                    });

                    // Trier les taux de TVA (du plus élevé au plus bas)
                    const sortedRates = Object.keys(tvaByRate)
                      .map(Number)
                      .sort((a, b) => b - a);

                    // TVA totale produits
                    const totalProductsTVA = Object.values(tvaByRate).reduce(
                      (sum, v) => sum + v.tva,
                      0
                    );

                    // === FRAIS (toujours affichés, même à 0) ===
                    const shippingHT = order.shipping_cost_ht || 0;
                    const insuranceHT = order.insurance_cost_ht || 0;
                    const handlingHT = order.handling_cost_ht || 0;
                    const totalFeesHT = shippingHT + insuranceHT + handlingHT;

                    // TVA des frais (taux unique pour tous les frais)
                    const feesVatRate = order.fees_vat_rate || 0.2;
                    const feesTVA = totalFeesHT * feesVatRate;

                    // === TOTAUX GLOBAUX ===
                    const totalHT = productsHT + totalFeesHT;
                    const totalTVA = totalProductsTVA + feesTVA;
                    const totalTTC = totalHT + totalTVA;

                    return (
                      <div className="space-y-2 text-right">
                        {/* Total HT Produits */}
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            Total HT produits :
                          </span>
                          <span className="font-semibold">
                            {formatCurrency(productsHT)}
                          </span>
                        </div>

                        {/* Frais additionnels - TOUJOURS affichés */}
                        <div className="pt-2 mt-2 border-t border-dashed space-y-1">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Frais de livraison HT :</span>
                            <span>{formatCurrency(shippingHT)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Frais d'assurance HT :</span>
                            <span>{formatCurrency(insuranceHT)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Frais de manutention HT :</span>
                            <span>{formatCurrency(handlingHT)}</span>
                          </div>
                        </div>

                        {/* Total HT global */}
                        <div className="flex justify-between text-sm font-medium pt-2 border-t">
                          <span className="text-gray-700">Total HT :</span>
                          <span>{formatCurrency(totalHT)}</span>
                        </div>

                        {/* TVA par taux (produits) */}
                        <div className="pt-2 border-t border-dashed space-y-1">
                          {sortedRates.map(rate => (
                            <div
                              key={rate}
                              className="flex justify-between text-sm text-gray-600"
                            >
                              <span>
                                TVA{' '}
                                {(rate * 100).toFixed(rate === 0.055 ? 1 : 0)}%
                                (produits) :
                              </span>
                              <span>{formatCurrency(tvaByRate[rate].tva)}</span>
                            </div>
                          ))}
                          {/* TVA frais (si frais > 0) */}
                          {totalFeesHT > 0 && (
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>
                                TVA {(feesVatRate * 100).toFixed(0)}% (frais) :
                              </span>
                              <span>{formatCurrency(feesTVA)}</span>
                            </div>
                          )}
                        </div>

                        {/* Total TTC */}
                        <Separator />
                        <div className="flex justify-between text-base font-bold">
                          <span>Total TTC :</span>
                          <span className="text-primary">
                            {formatCurrency(totalTTC)}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>

            {/* SIDEBAR (35%) - Informations contextuelles - IDENTIQUE À PurchaseOrderDetailModal */}
            <div className="w-full lg:w-[420px] space-y-3 order-1 lg:order-2">
              {/* Card Client CONDENSÉE (comme Fournisseur dans PurchaseOrderDetailModal) */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {getCustomerName()}
                      </CardTitle>
                      <Badge variant="outline" className="mt-1 text-xs">
                        {getCustomerType()}
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
                  {order.shipped_at && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Package className="h-3 w-3" />
                      <span>Expédiée : {formatDate(order.shipped_at)}</span>
                    </div>
                  )}
                  {order.delivered_at && (
                    <div className="flex items-center gap-2 text-green-600">
                      <Package className="h-3 w-3" />
                      <span>Livrée : {formatDate(order.delivered_at)}</span>
                    </div>
                  )}
                  {/* Adresses condensées */}
                  {order.shipping_address && (
                    <div className="flex items-start gap-2 text-gray-600 pt-1 border-t mt-2">
                      <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span className="text-xs">
                        {typeof order.shipping_address === 'string'
                          ? order.shipping_address
                          : order.shipping_address.address}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Card Paiement (comme PurchaseOrderDetailModal) */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CreditCard className="h-3 w-3" />
                    Paiement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {order.payment_status && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Statut :</span>
                      <Badge
                        className={`text-xs ${paymentStatusColors[order.payment_status]}`}
                      >
                        {paymentStatusLabels[order.payment_status]}
                      </Badge>
                    </div>
                  )}

                  {order.payment_terms && (
                    <div className="bg-green-50 p-2 rounded border border-green-200">
                      <p className="text-xs font-medium text-green-800">
                        {order.payment_terms}
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

                  {!readOnly && canMarkAsPaid && (
                    <ButtonV2
                      onClick={handleMarkAsPaid}
                      size="sm"
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <CreditCard className="h-3 w-3 mr-1" />
                      Marquer comme payé
                    </ButtonV2>
                  )}
                </CardContent>
              </Card>

              {/* Card Rapprochement Bancaire */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Link2 className="h-3 w-3" />
                    Rapprochement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {order.is_matched ? (
                    <div className="bg-green-50 p-3 rounded border border-green-200 space-y-2">
                      <div className="flex items-center gap-2">
                        <Link2 className="h-3 w-3 text-green-600" />
                        <p className="text-sm font-medium text-green-800">
                          Transaction liée
                        </p>
                      </div>
                      <p className="text-xs text-gray-700">
                        {order.matched_transaction_label || 'Transaction'}
                      </p>
                      <p className="text-sm font-bold text-green-700">
                        {formatCurrency(
                          Math.abs(order.matched_transaction_amount || 0)
                        )}
                      </p>
                      {order.matched_transaction_emitted_at && (
                        <p className="text-xs text-gray-600">
                          Payé le{' '}
                          {formatDate(order.matched_transaction_emitted_at)}
                        </p>
                      )}
                      {order.matched_transaction_attachment_ids?.[0] && (
                        <a
                          href={`https://app.qonto.com/transactions/${order.matched_transaction_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Voir sur Qonto
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-xs text-gray-500 py-2">
                      Non rapprochée
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Card Facturation */}
              {!readOnly &&
                order.status !== 'draft' &&
                order.status !== 'cancelled' && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <FileText className="h-3 w-3" />
                        Facturation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ButtonV2
                        size="sm"
                        className="w-full"
                        onClick={() => setShowInvoiceModal(true)}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        Générer facture
                      </ButtonV2>
                    </CardContent>
                  </Card>
                )}

              {/* Card Expédition (comme Réception dans PurchaseOrderDetailModal) */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Truck className="h-3 w-3" />
                    Expédition
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {order.delivered_at ? (
                    <Badge
                      variant="secondary"
                      className="w-full justify-center bg-green-100 text-green-800 border-green-200"
                    >
                      Livrée le {formatDate(order.delivered_at)}
                    </Badge>
                  ) : order.shipped_at ? (
                    <Badge
                      variant="secondary"
                      className="w-full justify-center bg-blue-100 text-blue-800 border-blue-200"
                    >
                      Expédiée le {formatDate(order.shipped_at)}
                    </Badge>
                  ) : order.status === 'partially_shipped' ? (
                    <Badge
                      variant="secondary"
                      className="w-full justify-center bg-yellow-100 text-yellow-800 border-yellow-200"
                    >
                      Partiellement expédiée
                    </Badge>
                  ) : (
                    <p className="text-center text-xs text-gray-500">
                      Pas encore expédiée
                    </p>
                  )}

                  {!readOnly && canShip && (
                    <ButtonV2
                      size="sm"
                      className="w-full"
                      disabled
                      title="Fonctionnalité en cours de développement"
                    >
                      <Truck className="h-3 w-3 mr-1" />
                      Gérer expédition
                    </ButtonV2>
                  )}
                </CardContent>
              </Card>

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
                  {/* Bouton de redirection vers CMS du canal (si commande d'un autre canal) */}
                  {channelRedirectUrl && (
                    <ButtonV2
                      variant="default"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => router.push(channelRedirectUrl)}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Gérer dans {order.sales_channel?.name || 'CMS'}
                    </ButtonV2>
                  )}

                  {/* Actions de gestion (masquées si readOnly) */}
                  {!readOnly && (
                    <>
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
                        Générer facture
                      </ButtonV2>
                    </>
                  )}

                  {/* Message mode lecture seule */}
                  {readOnly && !channelRedirectUrl && (
                    <p className="text-xs text-gray-500 text-center py-2">
                      Mode lecture seule
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* NOTE: Modal Gestion Expédition supprimé - sera recréé ultérieurement */}

      {/* Modal Création Facture */}
      <InvoiceCreateFromOrderModal
        order={
          order
            ? {
                id: order.id,
                order_number: order.order_number,
                total_ht: order.total_ht,
                total_ttc: order.total_ttc,
                tax_rate: order.tax_rate,
                currency: order.currency,
                payment_terms: order.payment_terms || 'net_30',
                organisations: order.organisations,
                individual_customers: order.individual_customers,
                sales_order_items: order.sales_order_items,
              }
            : null
        }
        open={showInvoiceModal}
        onOpenChange={setShowInvoiceModal}
        onSuccess={() => {
          onUpdate?.();
        }}
      />
    </>
  );
}
