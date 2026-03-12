'use client';

import React from 'react';

import type { PurchaseOrder } from '@verone/orders';
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IconButton,
} from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import {
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  RotateCcw,
  Ban,
  Truck,
  XCircle,
  Link2,
  MoreHorizontal,
} from 'lucide-react';

// =====================================================================
// TYPES
// =====================================================================

type PurchaseOrderExtended = PurchaseOrder & {
  payment_status_v2?:
    | 'paid'
    | 'pending'
    | 'partially_paid'
    | 'overpaid'
    | 'failed'
    | null;
  manual_payment_type?: string | null;
  is_matched?: boolean | null;
  matched_transaction_label?: string | null;
  matched_transaction_amount?: number | null;
};

interface PurchaseOrderActionMenuProps {
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

// =====================================================================
// COMPONENT
// =====================================================================

export function PurchaseOrderActionMenu({
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
}: PurchaseOrderActionMenuProps): React.ReactNode {
  const status = order.status;
  const menuItems: React.ReactNode[] = [];

  // Group 1: Workflow actions
  if (status === 'draft') {
    menuItems.push(
      <DropdownMenuItem key="edit" onClick={onEdit}>
        <Edit className="h-4 w-4 mr-2" />
        Editer
      </DropdownMenuItem>
    );
    menuItems.push(
      <DropdownMenuItem key="validate" onClick={onValidate}>
        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
        Valider
      </DropdownMenuItem>
    );
  }

  if (status === 'validated') {
    menuItems.push(
      <DropdownMenuItem key="receive" onClick={onReceive}>
        <Truck className="h-4 w-4 mr-2 text-green-600" />
        Receptionner
      </DropdownMenuItem>
    );
    menuItems.push(
      <DropdownMenuItem key="devalidate" onClick={onDevalidate}>
        <RotateCcw className="h-4 w-4 mr-2" />
        Devalider
      </DropdownMenuItem>
    );
  }

  if (status === 'partially_received') {
    menuItems.push(
      <DropdownMenuItem key="receive" onClick={onReceive}>
        <Truck className="h-4 w-4 mr-2" />
        Receptionner
      </DropdownMenuItem>
    );
    menuItems.push(
      <DropdownMenuItem
        key="cancel-remainder"
        onClick={onCancelRemainder}
        className="text-orange-600 focus:text-orange-600"
      >
        <XCircle className="h-4 w-4 mr-2" />
        Annuler le reliquat
      </DropdownMenuItem>
    );
  }

  // Group 2: Finance (link transaction) — aligned with SalesOrderActionMenu
  if (
    (status === 'validated' ||
      status === 'partially_received' ||
      status === 'received') &&
    order.payment_status_v2 !== 'paid'
  ) {
    if (menuItems.length > 0) {
      menuItems.push(<DropdownMenuSeparator key="sep-finance" />);
    }
    menuItems.push(
      <DropdownMenuItem key="link-transaction" onClick={onLinkTransaction}>
        <Link2 className="h-4 w-4 mr-2" />
        Paiement / Rapprochement
      </DropdownMenuItem>
    );
  }

  // Group 3: Destructive actions
  const destructiveItems: React.ReactNode[] = [];

  if (status === 'draft') {
    destructiveItems.push(
      <DropdownMenuItem
        key="cancel"
        onClick={onCancel}
        className="text-red-600 focus:text-red-600"
      >
        <Ban className="h-4 w-4 mr-2" />
        Annuler
      </DropdownMenuItem>
    );
  }

  if (status === 'cancelled') {
    destructiveItems.push(
      <DropdownMenuItem
        key="delete"
        onClick={onDelete}
        className="text-red-600 focus:text-red-600"
      >
        <Trash2 className="h-4 w-4 mr-2" />
        Supprimer
      </DropdownMenuItem>
    );
  }

  if (destructiveItems.length > 0) {
    if (menuItems.length > 0) {
      menuItems.push(<DropdownMenuSeparator key="sep-destructive" />);
    }
    menuItems.push(...destructiveItems);
  }

  // Reconciliation badge states
  const showReconciliation =
    status === 'validated' ||
    status === 'partially_received' ||
    status === 'received';

  return (
    <div className="flex items-center gap-1">
      {/* Primary action: View */}
      <IconButton
        icon={Eye}
        variant="outline"
        size="sm"
        label="Voir les details"
        onClick={onView}
      />

      {/* Badge: Payment/Reconciliation indicator */}
      {showReconciliation &&
        (order.is_matched === true || order.payment_status_v2 === 'paid') && (
          <Badge
            variant="outline"
            className="px-1.5 py-0.5 bg-green-50 border-green-300 cursor-help"
            title={
              order.is_matched
                ? `Rapprochée: ${order.matched_transaction_label ?? 'Transaction'} (${formatCurrency(Math.abs(order.matched_transaction_amount ?? 0))})`
                : 'Payée'
            }
          >
            <Link2 className="h-3 w-3 text-green-600" />
          </Badge>
        )}

      {/* Overflow menu */}
      {menuItems.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Plus d'actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">{menuItems}</DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
