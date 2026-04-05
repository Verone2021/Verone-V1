'use client';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import {
  Calendar,
  Truck,
  Package,
  CreditCard,
  Receipt,
  FileText,
  Loader2,
} from 'lucide-react';

import type { PurchaseOrder, OrderPayment } from '@verone/orders/hooks';

import type {
  SupplierInvoice,
  LinkedTransaction,
  ReceptionHistoryItem,
  CancellationItem,
} from './types';
import { paymentTermsLabels } from './types';
import { POHistoryCard } from './POHistoryCard';
import { POPaymentsCard } from './POPaymentsCard';

interface PODetailSidebarProps {
  order: PurchaseOrder;
  orderPayments: OrderPayment[];
  linkedTransactions: LinkedTransaction[];
  invoices: SupplierInvoice[];
  isLoadingFinance: boolean;
  canMarkAsPaid: boolean;
  canReceive: boolean;
  paymentTerms: string | null | undefined;
  receptionHistory: ReceptionHistoryItem[];
  cancellations: CancellationItem[];
  formatDate: (date: string | null) => string;
  getSupplierName: () => string;
  onShowOrgModal: () => void;
  onShowReceivingModal: () => void;
  onOpenPaymentDialog: () => void;
}

export function PODetailSidebar({
  order,
  orderPayments,
  linkedTransactions,
  invoices,
  isLoadingFinance,
  canMarkAsPaid,
  canReceive,
  paymentTerms,
  receptionHistory,
  cancellations,
  formatDate,
  getSupplierName,
  onShowOrgModal,
  onShowReceivingModal,
  onOpenPaymentDialog,
}: PODetailSidebarProps) {
  return (
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
                    onClick={onShowOrgModal}
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
                  order.payment_status_v2 === 'overpaid'
                    ? 'bg-red-100 text-red-800'
                    : order.payment_status_v2 === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : order.payment_status_v2 === 'partially_paid'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-orange-100 text-orange-800'
                }`}
              >
                {order.payment_status_v2 === 'overpaid'
                  ? 'Surpayé'
                  : order.payment_status_v2 === 'paid'
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
                  <span className="font-medium">{inv.document_number}</span>
                  <Badge
                    variant="outline"
                    className={
                      inv.status === 'paid'
                        ? 'bg-green-50 text-green-700 border-green-300'
                        : 'bg-amber-50 text-amber-700 border-amber-300'
                    }
                  >
                    {inv.status === 'paid' ? 'Payée' : 'En attente'}
                  </Badge>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>
                    {new Date(inv.document_date).toLocaleDateString('fr-FR')}
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

      {/* Card Paiements & Rapprochement */}
      <POPaymentsCard
        orderPayments={orderPayments}
        linkedTransactions={linkedTransactions}
        isLoadingFinance={isLoadingFinance}
        canMarkAsPaid={canMarkAsPaid}
        onOpenPaymentDialog={onOpenPaymentDialog}
      />

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
              onClick={onShowReceivingModal}
              size="sm"
              className="w-full"
            >
              <Truck className="h-3 w-3 mr-1" />
              Gérer réception
            </ButtonV2>
          )}
        </CardContent>
      </Card>

      {/* Card Historique Réceptions */}
      <POHistoryCard
        order={order}
        receptionHistory={receptionHistory}
        cancellations={cancellations}
      />

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
  );
}
