'use client';

/**
 * FournisseurMobileCard — Carte mobile pour une commande fournisseur
 *
 * Affiche les infos principales d'un PO sous forme de carte
 * pour les ecrans < lg (< 1024px). Inclut toutes les actions via FournisseurActions.
 *
 * HOOKS AUDIT :
 * - Aucun hook interne — composant pur base sur props.
 * - Aucun hook dans ce composant ni dans FournisseurActions. Composants purs.
 */

import { Badge, Card, CardContent, CardFooter } from '@verone/ui';
import { formatCurrency, formatDate } from '@verone/utils';
import { getOrganisationDisplayName } from '@verone/utils/utils/organisation-helpers';
import { Package } from 'lucide-react';

import type { SortColumn } from './types';
import { statusLabels, statusColors } from './types';
import type { PurchaseOrderExtended } from './types';
import { FournisseurActions } from './FournisseurActions';

export interface FournisseurMobileCardProps {
  order: PurchaseOrderExtended;
  isExpanded: boolean;
  sortColumn: SortColumn;
  onToggle: () => void;
  onView: () => void;
  onEdit: () => void;
  onValidate: () => void;
  onDevalidate: () => void;
  onReceive: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onCancelRemainder: () => void;
  onLinkTransaction: () => void;
}

export function FournisseurMobileCard({
  order,
  onView,
  onEdit,
  onValidate,
  onDevalidate,
  onReceive,
  onCancel,
  onDelete,
  onCancelRemainder,
  onLinkTransaction,
}: FournisseurMobileCardProps) {
  const items = order.purchase_order_items ?? [];
  const hasSamples = items.some(item => item.sample_type);

  const supplierName = order.organisations
    ? getOrganisationDisplayName(order.organisations)
    : 'Non défini';

  const paymentStatusV2 = order.payment_status_v2;

  return (
    <Card className="w-full">
      <CardContent className="pt-4 pb-2">
        {/* Ligne 1 : N° commande + statut */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="font-mono text-xs font-medium truncate">
              {order.po_number}
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              <Badge className={`text-xs ${statusColors[order.status]}`}>
                {statusLabels[order.status]}
              </Badge>
              {hasSamples && (
                <Badge variant="secondary" className="text-xs">
                  Echantillon
                </Badge>
              )}
            </div>
          </div>

          {/* Montant TTC */}
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="font-semibold text-sm">
              {formatCurrency(order.total_ttc)}
            </span>
            {/* Badge paiement */}
            {paymentStatusV2 === 'paid' && (
              <Badge className="text-xs bg-green-100 text-green-800">
                Paye
              </Badge>
            )}
            {paymentStatusV2 === 'partially_paid' && (
              <Badge className="text-xs bg-amber-100 text-amber-800">
                Partiel
              </Badge>
            )}
            {paymentStatusV2 === 'overpaid' && (
              <Badge className="text-xs bg-red-100 text-red-800">
                Surpaye
              </Badge>
            )}
            {(paymentStatusV2 !== 'paid' &&
              paymentStatusV2 !== 'partially_paid' &&
              paymentStatusV2 !== 'overpaid') && (
              <Badge className="text-xs bg-orange-100 text-orange-800">
                En attente
              </Badge>
            )}
          </div>
        </div>

        {/* Ligne 2 : Fournisseur */}
        <div className="mb-2">
          <p className="text-sm font-medium truncate">{supplierName}</p>
        </div>

        {/* Ligne 3 : Dates + articles */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
          <span>
            <span className="font-medium">Cmde :</span>{' '}
            {formatDate(order.order_date ?? order.created_at)}
          </span>
          {order.expected_delivery_date && (
            <span>
              <span className="font-medium">Livraison :</span>{' '}
              {['received', 'partially_received'].includes(order.status) &&
              order.received_at ? (
                <span className="text-green-700">
                  {formatDate(order.received_at)}
                </span>
              ) : (
                formatDate(order.expected_delivery_date)
              )}
            </span>
          )}
          <span className="flex items-center gap-0.5">
            <Package className="h-3 w-3" />
            {items.length}
            <span className="text-[10px] ml-0.5">ref.</span>
          </span>
        </div>
      </CardContent>

      <CardFooter className="pt-0 pb-3 flex justify-end">
        <FournisseurActions
          order={order}
          onView={onView}
          onEdit={onEdit}
          onValidate={onValidate}
          onDevalidate={onDevalidate}
          onReceive={onReceive}
          onCancel={onCancel}
          onDelete={onDelete}
          onCancelRemainder={onCancelRemainder}
          onLinkTransaction={onLinkTransaction}
        />
      </CardFooter>
    </Card>
  );
}
