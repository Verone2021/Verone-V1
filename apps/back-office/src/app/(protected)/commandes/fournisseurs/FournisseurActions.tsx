'use client';

/**
 * FournisseurActions — ResponsiveActionMenu partage desktop + mobile
 *
 * Technique T3 : dropdown pour >2 actions.
 * Breakpoint lg : boutons separes >= 1024px, dropdown < 1024px.
 *
 * HOOKS AUDIT :
 * - Aucun hook dans ce composant — composant pur base sur props.
 * - Les callbacks de navigation sont passes en props depuis page.tsx.
 */

import { ResponsiveActionMenu } from '@verone/ui';
import type { ResponsiveAction } from '@verone/ui';
import {
  Ban,
  CheckCircle,
  Edit,
  Eye,
  Link2,
  RotateCcw,
  Trash2,
  Truck,
  XCircle,
} from 'lucide-react';

import type { PurchaseOrderExtended } from './types';

export interface FournisseurActionsProps {
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

export function FournisseurActions({
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
}: FournisseurActionsProps) {
  const status = order.status;
  const actions: ResponsiveAction[] = [];

  // Action principale toujours visible
  actions.push({
    label: 'Voir les details',
    icon: Eye,
    onClick: onView,
    alwaysVisible: true,
  });

  // Actions workflow selon statut
  if (status === 'draft') {
    actions.push({
      label: 'Editer',
      icon: Edit,
      onClick: onEdit,
    });
    actions.push({
      label: 'Valider',
      icon: CheckCircle,
      onClick: onValidate,
    });
  }

  if (status === 'validated') {
    actions.push({
      label: 'Receptionner',
      icon: Truck,
      onClick: onReceive,
    });
    actions.push({
      label: 'Devalider',
      icon: RotateCcw,
      onClick: onDevalidate,
    });
  }

  if (status === 'partially_received') {
    actions.push({
      label: 'Receptionner',
      icon: Truck,
      onClick: onReceive,
    });
    actions.push({
      label: 'Annuler le reliquat',
      icon: XCircle,
      onClick: onCancelRemainder,
      variant: 'destructive',
    });
  }

  // Finance : rapprochement si non paye
  if (
    (status === 'validated' ||
      status === 'partially_received' ||
      status === 'received') &&
    order.payment_status_v2 !== 'paid'
  ) {
    actions.push({
      label: 'Paiement / Rapprochement',
      icon: Link2,
      onClick: onLinkTransaction,
      separatorBefore: true,
    });
  }

  // Actions destructives
  if (status === 'draft') {
    actions.push({
      label: 'Annuler',
      icon: Ban,
      onClick: onCancel,
      variant: 'destructive',
      separatorBefore: true,
    });
  }

  if (status === 'cancelled') {
    actions.push({
      label: 'Supprimer',
      icon: Trash2,
      onClick: onDelete,
      variant: 'destructive',
      separatorBefore: true,
    });
  }

  return (
    <ResponsiveActionMenu
      actions={actions}
      breakpoint="lg"
      align="end"
    />
  );
}
