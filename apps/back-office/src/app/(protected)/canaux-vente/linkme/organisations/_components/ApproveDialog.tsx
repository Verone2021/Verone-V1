import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { CheckCircle, Loader2 } from 'lucide-react';

import type { PendingOrganisation } from '../../hooks/use-organisation-approvals';

interface ApproveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organisation: PendingOrganisation | null;
  isPending: boolean;
  onConfirm: () => void;
}

export function ApproveDialog({
  open,
  onOpenChange,
  organisation,
  isPending,
  onConfirm,
}: ApproveDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Approuver l&apos;organisation
          </DialogTitle>
          <DialogDescription>
            Cette organisation sera visible dans le dropdown &quot;Restaurant
            existant&quot; du stepper enseigne.
          </DialogDescription>
        </DialogHeader>
        {organisation && (
          <div className="py-4">
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <p className="font-medium">
                {organisation.trade_name ?? organisation.legal_name}
              </p>
              {organisation.trade_name && (
                <p className="text-sm text-gray-500">
                  {organisation.legal_name}
                </p>
              )}
              {organisation.enseigne_name && (
                <p className="text-sm text-blue-600">
                  Enseigne: {organisation.enseigne_name}
                </p>
              )}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Confirmer l&apos;approbation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
