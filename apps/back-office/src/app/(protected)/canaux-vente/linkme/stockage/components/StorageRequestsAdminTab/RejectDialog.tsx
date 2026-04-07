'use client';

import { Button } from '@verone/ui';
import { Loader2, XCircle } from 'lucide-react';

interface RejectDialogProps {
  rejectReason: string;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

export function RejectDialog({
  rejectReason,
  onReasonChange,
  onConfirm,
  onCancel,
  isPending,
}: RejectDialogProps): React.ReactElement {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
        onKeyDown={e => {
          if (e.key === 'Escape') onCancel();
        }}
        role="button"
        tabIndex={-1}
        aria-label="Fermer"
      />
      <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-5">
        <h3 className="text-base font-semibold text-gray-900 mb-3">
          Rejeter la demande
        </h3>
        <label
          htmlFor="reject-reason"
          className="block text-sm text-gray-600 mb-1"
        >
          Raison du rejet (optionnel)
        </label>
        <textarea
          id="reject-reason"
          value={rejectReason}
          onChange={e => onReasonChange(e.target.value)}
          rows={3}
          placeholder="Ex: Stock insuffisant, produit non conforme..."
          className="w-full px-3 py-2 border rounded-md text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onCancel}
          >
            Annuler
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="flex-1"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : (
              <XCircle className="h-3.5 w-3.5 mr-1" />
            )}
            Rejeter
          </Button>
        </div>
      </div>
    </div>
  );
}
