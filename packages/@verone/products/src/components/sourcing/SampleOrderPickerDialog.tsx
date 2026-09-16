'use client';

import { useState } from 'react';

import { ButtonV2 } from '@verone/ui/components/ui/button';
import { Checkbox } from '@verone/ui/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui/components/ui/dialog';

import type { SampleCandidateProduct } from '../../hooks/sourcing/use-sample-draft-order';

export interface SampleOrderPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierName: string;
  candidates: SampleCandidateProduct[];
  loading?: boolean;
  busy?: boolean;
  /** Numéro de la commande brouillon quand elle existe déjà. */
  poNumber?: string;
  onConfirm: (productIds: string[]) => Promise<void>;
}

function euros(value: number): string {
  return value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
}

/**
 * Choix des produits à ajouter à la commande d'échantillons du fournisseur
 * — [BO-SOURCING-SAMPLE-002]
 *
 * Ne sont proposés que des produits que la base acceptera : même fournisseur,
 * prix d'achat renseigné, sans échantillon déjà en cours.
 */
export function SampleOrderPickerDialog({
  open,
  onOpenChange,
  supplierName,
  candidates,
  loading = false,
  busy = false,
  poNumber,
  onConfirm,
}: SampleOrderPickerDialogProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (productId: string) => {
    setSelected(previous =>
      previous.includes(productId)
        ? previous.filter(id => id !== productId)
        : [...previous, productId]
    );
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setSelected([]);
    onOpenChange(nextOpen);
  };

  const handleConfirm = () => {
    void onConfirm(selected)
      .then(() => {
        setSelected([]);
        onOpenChange(false);
      })
      .catch((error: unknown) => {
        console.error('[SampleOrderPickerDialog] confirm failed:', error);
      });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="h-screen md:h-auto md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Ajouter des échantillons</DialogTitle>
          <DialogDescription>
            Produits de {supplierName} qui peuvent partir dans{' '}
            {poNumber
              ? `la commande ${poNumber}`
              : 'une commande d’échantillons'}
            . Tant qu’elle reste en brouillon, ils voyagent ensemble.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto md:max-h-[50vh]">
          {loading ? (
            <p className="py-6 text-center text-sm text-gray-500">
              Chargement…
            </p>
          ) : candidates.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-500">
              Aucun autre produit de ce fournisseur n’est prêt : il faut un prix
              d’achat, et pas d’échantillon déjà commandé.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {candidates.map(candidate => (
                <li key={candidate.id}>
                  <label className="flex min-h-11 cursor-pointer items-center gap-3 px-1 py-2 hover:bg-gray-50">
                    <Checkbox
                      checked={selected.includes(candidate.id)}
                      onCheckedChange={() => toggle(candidate.id)}
                      disabled={busy}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-black">
                        {candidate.name}
                      </span>
                      <span className="block text-xs text-gray-500">
                        {candidate.sku} · {euros(candidate.costPrice)}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 md:flex-row">
          <ButtonV2
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={busy}
            className="w-full md:w-auto"
          >
            Annuler
          </ButtonV2>
          <ButtonV2
            variant="primary"
            onClick={handleConfirm}
            disabled={busy || selected.length === 0}
            className="w-full md:w-auto"
          >
            Commander {selected.length > 0 ? `(${selected.length})` : ''}
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
