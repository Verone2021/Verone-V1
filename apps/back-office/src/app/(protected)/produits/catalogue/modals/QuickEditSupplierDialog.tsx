'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@verone/ui';
import { SupplierSelector } from '@verone/organisations/components/suppliers';

interface QuickEditSupplierDialogProps {
  open: boolean;
  productName: string | null | undefined;
  saving: boolean;
  onClose: () => void;
  onSupplierChange: (supplierId: string | null) => void;
}

export function QuickEditSupplierDialog({
  open,
  productName,
  saving,
  onClose,
  onSupplierChange,
}: QuickEditSupplierDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={isOpen => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assigner un fournisseur</DialogTitle>
          <DialogDescription>{productName}</DialogDescription>
        </DialogHeader>
        <SupplierSelector
          selectedSupplierId={null}
          onSupplierChange={supplierId => {
            void onSupplierChange(supplierId);
          }}
          disabled={saving}
          label="Fournisseur"
          placeholder="Sélectionner un fournisseur..."
        />
        {saving && <p className="text-sm text-gray-500">Enregistrement...</p>}
      </DialogContent>
    </Dialog>
  );
}
