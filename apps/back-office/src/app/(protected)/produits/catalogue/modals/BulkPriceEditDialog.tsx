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

type Mode = 'flat' | 'percent';

interface BulkPriceEditDialogProps {
  open: boolean;
  count: number;
  busy: boolean;
  onClose: () => void;
  onApplyFlat: (price: number) => void;
  onApplyPercent: (percent: number) => void;
}

export function BulkPriceEditDialog({
  open,
  count,
  busy,
  onClose,
  onApplyFlat,
  onApplyPercent,
}: BulkPriceEditDialogProps) {
  const [mode, setMode] = useState<Mode>('flat');
  const [value, setValue] = useState('');

  const numeric = parseFloat(value);
  const valid =
    Number.isFinite(numeric) && (mode === 'flat' ? numeric >= 0 : true);

  const handleApply = () => {
    if (!valid) return;
    if (mode === 'flat') onApplyFlat(numeric);
    else onApplyPercent(numeric);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setValue('');
      setMode('flat');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier le prix en masse</DialogTitle>
          <DialogDescription>
            {count} produit{count > 1 ? 's' : ''} sélectionné
            {count > 1 ? 's' : ''}. Choisissez une méthode.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('flat')}
              className={`flex-1 rounded border px-3 py-2 text-sm ${
                mode === 'flat'
                  ? 'border-black bg-black text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Remplacer par
            </button>
            <button
              type="button"
              onClick={() => setMode('percent')}
              className={`flex-1 rounded border px-3 py-2 text-sm ${
                mode === 'percent'
                  ? 'border-black bg-black text-white'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Ajuster en %
            </button>
          </div>

          {mode === 'flat' ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder="0.00"
                className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                autoFocus
              />
              <span className="text-sm text-gray-500">€ HT</span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  placeholder="ex : 5 ou -10"
                  className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  autoFocus
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
              <p className="text-xs text-gray-500">
                Une valeur positive augmente le prix, négative le diminue. Le
                nouveau prix est arrondi à 2 décimales.
              </p>
            </div>
          )}
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
            onClick={handleApply}
            disabled={busy || !valid}
            className="w-full md:w-auto"
          >
            {busy ? 'Enregistrement…' : 'Appliquer'}
          </ButtonUnified>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
