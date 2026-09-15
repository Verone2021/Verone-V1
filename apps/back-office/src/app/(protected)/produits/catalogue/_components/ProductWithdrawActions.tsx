'use client';

import { useState } from 'react';

import { SourcingReasonDialog, useSourcingLifecycle } from '@verone/products';
import { ButtonUnified } from '@verone/ui';
import { Archive, ArchiveRestore } from 'lucide-react';

interface ProductWithdrawActionsProps {
  productId: string;
  isWithdrawn: boolean;
  /** Recharge la fiche après un retrait ou une restauration réussis */
  onChanged: () => Promise<unknown>;
}

/**
 * Retirer (motif obligatoire) / Restaurer un produit depuis sa fiche catalogue
 * (BO-PRODUCTS-P8-001) : fonction unique du cycle de vie, statut inchangé,
 * journal écrit ; la restauration remet exactement le produit.
 */
export function ProductWithdrawActions({
  productId,
  isWithdrawn,
  onChanged,
}: ProductWithdrawActionsProps) {
  const [reasonOpen, setReasonOpen] = useState(false);
  const { applyAction, pendingAction } = useSourcingLifecycle(
    productId,
    onChanged
  );
  const busy = pendingAction !== null;

  return (
    <>
      {isWithdrawn ? (
        <ButtonUnified
          variant="outline"
          size="sm"
          icon={ArchiveRestore}
          iconPosition="left"
          disabled={busy}
          onClick={() => {
            void applyAction({ action: 'restore' }).catch(error => {
              console.error('[ProductWithdrawActions] restore failed:', error);
            });
          }}
        >
          Restaurer
        </ButtonUnified>
      ) : (
        <ButtonUnified
          variant="outline"
          size="sm"
          icon={Archive}
          iconPosition="left"
          disabled={busy}
          onClick={() => setReasonOpen(true)}
        >
          Retirer
        </ButtonUnified>
      )}

      <SourcingReasonDialog
        open={reasonOpen}
        title="Retirer ce produit"
        description="Le produit disparaît des canaux de vente et n'est plus commandable. Son statut ne change pas, le motif est gardé dans le journal et il pourra être restauré."
        confirmLabel="Retirer"
        onClose={() => setReasonOpen(false)}
        onConfirm={reason => applyAction({ action: 'withdraw', reason })}
      />
    </>
  );
}
