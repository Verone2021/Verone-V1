'use client';

import { useState } from 'react';

import {
  ButtonUnified,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';

type ProductStatus = 'active' | 'preorder' | 'discontinued' | 'draft';

const STATUS_OPTIONS: Array<{
  value: ProductStatus;
  label: string;
  help: string;
}> = [
  { value: 'active', label: 'Actif', help: 'Produit disponible à la vente.' },
  {
    value: 'draft',
    label: 'Brouillon',
    help: 'Produit en cours de préparation.',
  },
  {
    value: 'preorder',
    label: 'Précommande',
    help: 'Produit commandable, pas encore disponible.',
  },
  {
    value: 'discontinued',
    label: 'Arrêté',
    help: 'Produit retiré (référence conservée).',
  },
];

interface BulkStatusDialogProps {
  open: boolean;
  count: number;
  busy: boolean;
  onClose: () => void;
  onApply: (status: ProductStatus) => void;
}

export function BulkStatusDialog({
  open,
  count,
  busy,
  onClose,
  onApply,
}: BulkStatusDialogProps) {
  const [status, setStatus] = useState<ProductStatus>('active');

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Changer le statut en masse</DialogTitle>
          <DialogDescription>
            {count} produit{count > 1 ? 's' : ''} sélectionné
            {count > 1 ? 's' : ''}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {STATUS_OPTIONS.map(opt => (
            <label
              key={opt.value}
              className={`flex cursor-pointer items-start gap-3 rounded border px-3 py-2 ${
                status === opt.value
                  ? 'border-black bg-gray-50'
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="bulk-status"
                value={opt.value}
                checked={status === opt.value}
                onChange={() => setStatus(opt.value)}
                className="mt-1"
              />
              <div>
                <div className="text-sm font-medium text-black">
                  {opt.label}
                </div>
                <div className="text-xs text-gray-500">{opt.help}</div>
              </div>
            </label>
          ))}
        </div>

        <DialogFooter className="flex-col gap-2 md:flex-row">
          <ButtonUnified
            variant="outline"
            onClick={onClose}
            className="w-full md:w-auto"
            disabled={busy}
          >
            Annuler
          </ButtonUnified>
          <ButtonUnified
            variant="default"
            onClick={() => onApply(status)}
            disabled={busy}
            className="w-full md:w-auto"
          >
            {busy ? 'Enregistrement…' : 'Appliquer'}
          </ButtonUnified>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
