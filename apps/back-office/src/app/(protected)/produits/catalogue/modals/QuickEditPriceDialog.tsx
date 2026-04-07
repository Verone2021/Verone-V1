'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  ButtonUnified,
} from '@verone/ui';

interface QuickEditPriceDialogProps {
  open: boolean;
  productName: string | null | undefined;
  costPriceCount: number | null | undefined;
  costPrice: number | null | undefined;
  saving: boolean;
  price: string;
  onClose: () => void;
  onPriceChange: (value: string) => void;
  onSave: () => void;
}

export function QuickEditPriceDialog({
  open,
  productName,
  costPriceCount,
  costPrice,
  saving,
  price,
  onClose,
  onPriceChange,
  onSave,
}: QuickEditPriceDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Prix d&apos;achat HT</DialogTitle>
          <DialogDescription>{productName}</DialogDescription>
        </DialogHeader>
        {(costPriceCount ?? 0) > 0 ? (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded px-3 py-2 text-sm text-blue-800">
              Prix calculé automatiquement depuis {costPriceCount} commande
              {(costPriceCount ?? 0) > 1 ? 's' : ''} fournisseur (PMP).
            </div>
            {costPrice != null && (
              <div className="text-center text-lg font-semibold text-black">
                {costPrice.toFixed(2)} € HT
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={e => onPriceChange(e.target.value)}
                placeholder="0.00"
                className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                autoFocus
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    void onSave();
                  }
                }}
              />
              <span className="text-sm text-gray-500">€ HT</span>
            </div>
            <ButtonUnified
              onClick={() => {
                void onSave();
              }}
              disabled={saving || !price || isNaN(parseFloat(price))}
              variant="default"
              size="sm"
              className="w-full"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </ButtonUnified>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
