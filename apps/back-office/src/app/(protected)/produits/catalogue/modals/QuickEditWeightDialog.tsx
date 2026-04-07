'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  ButtonUnified,
} from '@verone/ui';
import { Weight } from 'lucide-react';

interface QuickEditWeightDialogProps {
  open: boolean;
  productName: string | null | undefined;
  saving: boolean;
  weight: string;
  onClose: () => void;
  onWeightChange: (value: string) => void;
  onSave: () => void;
}

export function QuickEditWeightDialog({
  open,
  productName,
  saving,
  weight,
  onClose,
  onWeightChange,
  onSave,
}: QuickEditWeightDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Weight className="h-5 w-5" />
            Poids du produit
          </DialogTitle>
          <DialogDescription>{productName}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0"
            step="0.01"
            value={weight}
            onChange={e => onWeightChange(e.target.value)}
            placeholder="0.00"
            className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') {
                void onSave();
              }
            }}
          />
          <span className="text-sm text-gray-500">kg</span>
        </div>
        <ButtonUnified
          onClick={() => {
            void onSave();
          }}
          disabled={
            saving ||
            !weight ||
            isNaN(parseFloat(weight)) ||
            parseFloat(weight) <= 0
          }
          variant="default"
          size="sm"
          className="w-full"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </ButtonUnified>
      </DialogContent>
    </Dialog>
  );
}
