'use client';

import { Loader2, XCircle } from 'lucide-react';

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

interface RejectOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rejectReason: string;
  onRejectReasonChange: (reason: string) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function RejectOrderDialog({
  open,
  onOpenChange,
  rejectReason,
  onRejectReasonChange,
  onConfirm,
  isPending,
}: RejectOrderDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            Rejeter la commande
          </DialogTitle>
          <DialogDescription>
            Indiquez le motif du rejet. Le demandeur sera notifie.
          </DialogDescription>
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
            onClick={() => onConfirm()}
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
