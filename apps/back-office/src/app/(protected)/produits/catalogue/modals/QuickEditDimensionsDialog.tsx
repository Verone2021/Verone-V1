'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  ButtonUnified,
} from '@verone/ui';
import { Ruler } from 'lucide-react';

interface Dimensions {
  length: string;
  width: string;
  height: string;
}

interface QuickEditDimensionsDialogProps {
  open: boolean;
  productName: string | null | undefined;
  saving: boolean;
  dimensions: Dimensions;
  onClose: () => void;
  onDimensionsChange: (dimensions: Dimensions) => void;
  onSave: () => void;
}

export function QuickEditDimensionsDialog({
  open,
  productName,
  saving,
  dimensions,
  onClose,
  onDimensionsChange,
  onSave,
}: QuickEditDimensionsDialogProps) {
  const l = parseFloat(dimensions.length);
  const w = parseFloat(dimensions.width);
  const h = parseFloat(dimensions.height);
  const hasAllDimensions =
    dimensions.length && dimensions.width && dimensions.height;
  const volume =
    hasAllDimensions && !isNaN(l) && !isNaN(w) && !isNaN(h)
      ? ((l * w * h) / 1_000_000).toFixed(4)
      : null;

  const isDisabled =
    saving ||
    !dimensions.length ||
    !dimensions.width ||
    !dimensions.height ||
    isNaN(l) ||
    isNaN(w) ||
    isNaN(h) ||
    l <= 0 ||
    w <= 0 ||
    h <= 0;

  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Dimensions du produit
          </DialogTitle>
          <DialogDescription>{productName}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Longueur
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={dimensions.length}
                  onChange={e =>
                    onDimensionsChange({
                      ...dimensions,
                      length: e.target.value,
                    })
                  }
                  placeholder="0"
                  className="w-full border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  autoFocus
                />
                <span className="text-xs text-gray-400">cm</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Largeur
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={dimensions.width}
                  onChange={e =>
                    onDimensionsChange({ ...dimensions, width: e.target.value })
                  }
                  placeholder="0"
                  className="w-full border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
                <span className="text-xs text-gray-400">cm</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Hauteur
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={dimensions.height}
                  onChange={e =>
                    onDimensionsChange({
                      ...dimensions,
                      height: e.target.value,
                    })
                  }
                  placeholder="0"
                  className="w-full border border-gray-300 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      void onSave();
                    }
                  }}
                />
                <span className="text-xs text-gray-400">cm</span>
              </div>
            </div>
          </div>
          {volume && (
            <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm text-gray-700 text-center">
              Volume : <span className="font-semibold">{volume}</span> m³
            </div>
          )}
        </div>
        <ButtonUnified
          onClick={() => {
            void onSave();
          }}
          disabled={isDisabled}
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
