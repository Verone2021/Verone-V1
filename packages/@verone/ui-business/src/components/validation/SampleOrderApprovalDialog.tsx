'use client';

import {
  ButtonV2,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Textarea,
} from '@verone/ui';

import type { SampleOrder } from './sample-order-validation.types';

interface SampleOrderApprovalDialogProps {
  selectedOrder: SampleOrder | null;
  validationNotes: string;
  onValidationNotesChange: (value: string) => void;
  onClose: () => void;
  onConfirm: (orderId: string, notes: string) => void;
}

export function SampleOrderApprovalDialog({
  selectedOrder,
  validationNotes,
  onValidationNotesChange,
  onClose,
  onConfirm,
}: SampleOrderApprovalDialogProps) {
  if (!selectedOrder) return null;

  return (
    <Dialog open={!!selectedOrder} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Approuver la commande</DialogTitle>
          <DialogDescription>
            Commande d&apos;échantillons pour {selectedOrder.supplier.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-2">
              Résumé de la commande:
            </div>
            <div className="space-y-1">
              <div>• {selectedOrder.sample_order_items.length} produit(s)</div>
              <div>• Coût estimé: {selectedOrder.estimated_total_cost}€</div>
              <div>• Délai: {selectedOrder.expected_delivery_days} jours</div>
            </div>
          </div>
          <Textarea
            placeholder="Notes d'approbation (optionnel)..."
            value={validationNotes}
            onChange={e => onValidationNotesChange(e.target.value)}
            className="border-black focus:ring-black"
          />
        </div>
        <DialogFooter>
          <ButtonV2
            variant="outline"
            onClick={() => {
              onClose();
              onValidationNotesChange('');
            }}
          >
            Annuler
          </ButtonV2>
          <ButtonV2
            onClick={() => onConfirm(selectedOrder.id, validationNotes)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            Confirmer Approbation
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
