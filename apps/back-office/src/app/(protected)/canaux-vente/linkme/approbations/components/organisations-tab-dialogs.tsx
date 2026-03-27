'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
} from '@verone/ui';
import { Loader2, XCircle, Trash2 } from 'lucide-react';

import { type PendingOrganisation } from '../../hooks/use-organisation-approvals';

// ============================================================================
// DETAIL DIALOG
// ============================================================================

interface OrgDetailDialogProps {
  org: PendingOrganisation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrgDetailDialog({
  org,
  open,
  onOpenChange,
}: OrgDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Details de l&apos;organisation</DialogTitle>
        </DialogHeader>
        {org && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">
                {org.trade_name ?? org.legal_name}
              </h3>
              {org.trade_name && (
                <p className="text-sm text-gray-600">
                  Raison sociale: {org.legal_name}
                </p>
              )}
              {org.siret && (
                <p className="text-sm text-gray-600">SIRET: {org.siret}</p>
              )}
            </div>
            {org.enseigne_name && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Enseigne</p>
                <p className="font-medium">{org.enseigne_name}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Email</p>
                <p className="font-medium">{org.email ?? '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Telephone</p>
                <p className="font-medium">{org.phone ?? '-'}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Adresse</p>
              <div className="text-gray-700">
                {org.address_line1 && <p>{org.address_line1}</p>}
                {org.address_line2 && <p>{org.address_line2}</p>}
                <p>
                  {org.postal_code} {org.city}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Cree le</p>
              <p className="font-medium">
                {new Date(org.created_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// REJECT DIALOG
// ============================================================================

interface OrgRejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rejectReason: string;
  onRejectReasonChange: (value: string) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function OrgRejectDialog({
  open,
  onOpenChange,
  rejectReason,
  onRejectReasonChange,
  onConfirm,
  isPending,
}: OrgRejectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Rejeter l&apos;organisation
          </DialogTitle>
          <DialogDescription>Indiquez le motif du rejet.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            value={rejectReason}
            onChange={e => onRejectReasonChange(e.target.value)}
            placeholder="Motif du rejet..."
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!rejectReason.trim() || isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Confirmer le rejet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// DELETE DIALOG
// ============================================================================

interface OrgDeleteDialogProps {
  target: PendingOrganisation | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function OrgDeleteDialog({
  target,
  isDeleting,
  onCancel,
  onConfirm,
}: OrgDeleteDialogProps) {
  return (
    <Dialog
      open={target !== null}
      onOpenChange={open => {
        if (!open) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-500" />
            Supprimer l&apos;organisation
          </DialogTitle>
          <DialogDescription>
            Etes-vous sur de vouloir supprimer definitivement{' '}
            <strong>{target?.trade_name ?? target?.legal_name}</strong> ? Cette
            action est irreversible. Les contacts associes seront egalement
            supprimes.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            disabled={isDeleting}
            onClick={onConfirm}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Supprimer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
