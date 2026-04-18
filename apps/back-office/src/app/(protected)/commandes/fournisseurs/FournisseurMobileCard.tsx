'use client';

/**
 * FournisseurMobileCard — carte mobile pour ResponsiveDataView
 *
 * T1 : basculement table/cartes selon breakpoint. Cette carte est rendue
 * uniquement sous le breakpoint lg (< 1024px).
 * T3 : delegue les actions a PurchaseOrderActionMenu (dropdown mobile).
 *
 * HOOKS AUDIT : aucun hook dans ce composant — purement props-driven.
 */

import { Badge } from '@verone/ui';
import { formatCurrency, formatDate } from '@verone/utils';
import { cn } from '@verone/utils';
import { getOrganisationDisplayName } from '@verone/utils/utils/organisation-helpers';

import type { PurchaseOrderExtended } from './types';
import { statusColors, statusLabels } from './types';
import { PurchaseOrderActionMenu } from './components/PurchaseOrderActionMenu';

interface FournisseurMobileCardProps {
  order: PurchaseOrderExtended;
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

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      {/* Ligne 1 : N Commande + Statut */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs font-medium break-all leading-tight">
            {order.po_number}
          </p>
          <p className="mt-1 text-sm font-medium leading-tight break-words">
            {order.organisations
              ? getOrganisationDisplayName(order.organisations)
              : 'Non défini'}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge className={cn('text-xs', statusColors[order.status])}>
            {statusLabels[order.status]}
          </Badge>
          {hasSamples && (
            <Badge variant="secondary" className="text-xs">
              Échantillon
            </Badge>
          )}
        </div>
      </div>

      {/* Ligne 2 : Montant + Articles + Date */}
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-lg font-semibold">
          {formatCurrency(order.total_ttc)}
        </p>
        <p className="text-xs text-muted-foreground">
          {items.length} ref. ·{' '}
          {order.order_date
            ? formatDate(order.order_date)
            : formatDate(order.created_at)}
        </p>
      </div>

      {/* Ligne 3 : Actions */}
      <div className="flex justify-end">
        <PurchaseOrderActionMenu
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
      </div>
    </div>
  );
}
