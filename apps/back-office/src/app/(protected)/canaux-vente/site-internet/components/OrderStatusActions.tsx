'use client';

import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@verone/ui';
import { Badge } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';

// ── Valid Transitions (unidirectional workflow) ──────────────
// pending → paid: ONLY by Stripe webhook (never by admin)
// paid → shipped/cancelled: by admin
// shipped → delivered: by admin
// delivered/cancelled: final states (no transitions)

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['cancelled'],
  paid: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  paid: 'Payee',
  shipped: 'Expediee',
  delivered: 'Livree',
  cancelled: 'Annulee',
};

const STATUS_COLORS: Record<string, string> = {
  pending:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  paid: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  shipped:
    'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  delivered:
    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const CONFIRMATION_MESSAGES: Record<
  string,
  { title: string; description: string }
> = {
  shipped: {
    title: 'Confirmer expedition',
    description:
      'Cette commande sera marquee comme expediee. Un email de notification sera envoye au client.',
  },
  delivered: {
    title: 'Confirmer livraison',
    description:
      'Cette commande sera marquee comme livree. Un email de confirmation sera envoye au client.',
  },
  cancelled: {
    title: 'Annuler la commande',
    description:
      'Cette commande sera annulee. Cette action est irreversible. Le remboursement devra etre effectue depuis le dashboard Stripe.',
  },
};

export function isValidTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  const valid = VALID_TRANSITIONS[currentStatus];
  if (!valid) return false;
  return valid.includes(newStatus);
}

function StatusConfirmDialog({
  pendingStatus,
  onConfirm,
  onCancel,
}: {
  pendingStatus: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const confirmInfo = pendingStatus
    ? CONFIRMATION_MESSAGES[pendingStatus]
    : null;
  const isCancelling = pendingStatus === 'cancelled';
  return (
    <AlertDialog
      open={pendingStatus !== null}
      onOpenChange={open => {
        if (!open) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {confirmInfo?.title ?? 'Confirmer le changement'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {confirmInfo?.description ??
              'Etes-vous sur de vouloir changer le statut de cette commande ?'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={
              isCancelling
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : undefined
            }
          >
            {isCancelling ? 'Oui, annuler la commande' : 'Confirmer'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface OrderStatusActionsProps {
  status: string;
  onStatusChange: (newStatus: string) => void;
  isUpdating: boolean;
  size?: 'sm' | 'default';
}

export function OrderStatusActions({
  status,
  onStatusChange,
  isUpdating,
  size = 'default',
}: OrderStatusActionsProps) {
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);

  const validTransitions = VALID_TRANSITIONS[status] ?? [];
  const isFinalState = validTransitions.length === 0;

  const handleSelectChange = (newStatus: string) => {
    if (!isValidTransition(status, newStatus)) return;
    setPendingStatus(newStatus);
  };

  const handleConfirm = () => {
    if (pendingStatus) {
      onStatusChange(pendingStatus);
      setPendingStatus(null);
    }
  };

  const triggerWidth = size === 'sm' ? 'w-[140px] h-8' : 'w-[160px] h-8';

  // Final states: display static badge only
  if (isFinalState) {
    return (
      <Badge className={STATUS_COLORS[status] ?? ''}>
        {STATUS_LABELS[status] ?? status}
      </Badge>
    );
  }

  return (
    <>
      <Select
        value={status}
        onValueChange={handleSelectChange}
        disabled={isUpdating}
      >
        <SelectTrigger className={triggerWidth}>
          <SelectValue>
            <Badge className={STATUS_COLORS[status] ?? ''}>
              {STATUS_LABELS[status] ?? status}
            </Badge>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {validTransitions.map(s => (
            <SelectItem key={s} value={s}>
              {STATUS_LABELS[s] ?? s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <StatusConfirmDialog
        pendingStatus={pendingStatus}
        onConfirm={handleConfirm}
        onCancel={() => setPendingStatus(null)}
      />
    </>
  );
}
