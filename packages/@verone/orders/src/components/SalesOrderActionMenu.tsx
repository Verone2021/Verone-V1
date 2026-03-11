'use client';

import React from 'react';

import Link from 'next/link';

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
  ExternalLink,
  Link2,
  MoreHorizontal,
} from 'lucide-react';

import type { SalesOrder } from '../hooks/use-sales-orders';

// =====================================================================
// TYPES
// =====================================================================

interface SalesOrderActionMenuProps {
  order: SalesOrder;
  channelId?: string | null;
  channelRedirectUrl: string | null;
  channelName?: string;
  isEditable: boolean;
  allowEdit: boolean;
  allowValidate: boolean;
  allowShip: boolean;
  allowCancel: boolean;
  allowDelete: boolean;
  onView: () => void;
  onEdit: () => void;
  onValidate: () => void;
  onDevalidate: () => void;
  onShip: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onLinkTransaction: () => void;
}

// =====================================================================
// COMPONENT
// =====================================================================

export function SalesOrderActionMenu({
  order,
  channelId,
  channelRedirectUrl,
  channelName,
  isEditable,
  allowEdit,
  allowValidate,
  allowShip,
  allowCancel,
  allowDelete,
  onView,
  onEdit,
  onValidate,
  onDevalidate,
  onShip,
  onCancel,
  onDelete,
  onLinkTransaction,
}: SalesOrderActionMenuProps): React.ReactNode {
  const status = order.status;

  // Build dropdown menu items based on status and permissions
  const menuItems: React.ReactNode[] = [];

  // Group 1: Navigation
  if (!channelId && channelRedirectUrl) {
    menuItems.push(
      <DropdownMenuItem key="channel-link" asChild>
        <Link href={channelRedirectUrl}>
          <ExternalLink className="h-4 w-4 mr-2" />
          Gérer dans {channelName ?? 'le canal'}
        </Link>
      </DropdownMenuItem>
    );
  }

  // Group 2: Workflow actions
  const workflowItems: React.ReactNode[] = [];

  if (
    allowEdit &&
    (status === 'draft' || status === 'validated') &&
    isEditable
  ) {
    workflowItems.push(
      <DropdownMenuItem key="edit" onClick={onEdit}>
        <Edit className="h-4 w-4 mr-2" />
        Modifier
      </DropdownMenuItem>
    );
  }

  if (allowValidate && status === 'draft') {
    workflowItems.push(
      <DropdownMenuItem key="validate" onClick={onValidate}>
        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
        Valider
      </DropdownMenuItem>
    );
  }

  if (allowValidate && status === 'validated') {
    workflowItems.push(
      <DropdownMenuItem key="devalidate" onClick={onDevalidate}>
        <RotateCcw className="h-4 w-4 mr-2" />
        Dévalider
      </DropdownMenuItem>
    );
  }

  if (allowShip && (status === 'validated' || status === 'partially_shipped')) {
    workflowItems.push(
      <DropdownMenuItem key="ship" onClick={onShip}>
        <Truck className="h-4 w-4 mr-2" />
        Expédier
      </DropdownMenuItem>
    );
  }

  if (workflowItems.length > 0) {
    if (menuItems.length > 0) {
      menuItems.push(<DropdownMenuSeparator key="sep-workflow" />);
    }
    menuItems.push(...workflowItems);
  }

  // Group 3: Finance (link transaction)
  if ((status === 'validated' || status === 'shipped') && !order.is_matched) {
    if (menuItems.length > 0) {
      menuItems.push(<DropdownMenuSeparator key="sep-finance" />);
    }
    menuItems.push(
      <DropdownMenuItem key="link-transaction" onClick={onLinkTransaction}>
        <Link2 className="h-4 w-4 mr-2" />
        Lier transaction
      </DropdownMenuItem>
    );
  }

  // Group 4: Destructive actions
  const destructiveItems: React.ReactNode[] = [];

  if (allowCancel && status === 'draft') {
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

  if (allowDelete && status === 'cancelled') {
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

  return (
    <div className="flex items-center gap-1">
      {/* Primary action: View */}
      <IconButton
        icon={Eye}
        variant="outline"
        size="sm"
        label="Voir détails"
        onClick={onView}
      />

      {/* Badge: Reconciliation indicator (icon only) */}
      {(status === 'validated' || status === 'shipped') && order.is_matched && (
        <Badge
          variant="outline"
          className="px-1.5 py-0.5 bg-green-50 border-green-300 cursor-help"
          title={`Rapprochée: ${order.matched_transaction_label ?? 'Transaction'} (${formatCurrency(Math.abs(order.matched_transaction_amount ?? 0))})`}
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
