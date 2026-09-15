'use client';

import { SourcingReasonDialog } from '@verone/products';

import type { CatalogueWithdrawTarget } from './use-catalogue-withdraw';

interface CatalogueWithdrawDialogProps {
  target: CatalogueWithdrawTarget | null;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<boolean>;
}

/** Motif obligatoire avant de retirer un ou plusieurs produits du catalogue. */
export function CatalogueWithdrawDialog({
  target,
  onClose,
  onConfirm,
}: CatalogueWithdrawDialogProps) {
  const count = target?.kind === 'bulk' ? target.ids.length : 1;
  return (
    <SourcingReasonDialog
      open={target !== null}
      title={count > 1 ? `Retirer ${count} produits` : 'Retirer ce produit'}
      description="Un produit retiré disparaît des canaux de vente et n'est plus commandable. Son statut ne change pas, le motif est gardé dans le journal et il pourra être restauré."
      confirmLabel="Retirer"
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
