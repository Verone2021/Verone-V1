'use client';

import { SourcingReasonDialog } from '@verone/products';
import { ConfirmDialog } from '@verone/ui';

export type SourcingReasonAction = 'refuse' | 'withdraw';

const REASON_DIALOGS: Record<
  SourcingReasonAction,
  { title: string; description: string; confirmLabel: string }
> = {
  refuse: {
    title: 'Refuser ce produit',
    description:
      'Le produit sort du parcours sourcing. Le motif est gardé dans le journal ; le produit pourra être rouvert.',
    confirmLabel: 'Refuser',
  },
  withdraw: {
    title: 'Retirer ce produit',
    description:
      'Le produit quitte la liste active. Le motif est gardé dans le journal ; le produit pourra être restauré.',
    confirmLabel: 'Retirer',
  },
};

interface SourcingLifecycleDialogsProps {
  reasonAction: SourcingReasonAction | null;
  onReasonClose: () => void;
  onReasonConfirm: (
    action: SourcingReasonAction,
    reason: string
  ) => Promise<boolean>;
  validateOpen: boolean;
  onValidateOpenChange: (open: boolean) => void;
  onValidateConfirm: () => Promise<void>;
}

/**
 * Fenêtres de confirmation du cycle de vie de la fiche sourcing : motif
 * obligatoire (refuser, retirer) et validation au catalogue.
 */
export function SourcingLifecycleDialogs({
  reasonAction,
  onReasonClose,
  onReasonConfirm,
  validateOpen,
  onValidateOpenChange,
  onValidateConfirm,
}: SourcingLifecycleDialogsProps) {
  return (
    <>
      <SourcingReasonDialog
        open={reasonAction !== null}
        {...REASON_DIALOGS[reasonAction ?? 'refuse']}
        onClose={onReasonClose}
        onConfirm={reason =>
          reasonAction
            ? onReasonConfirm(reasonAction, reason)
            : Promise.resolve(false)
        }
      />

      <ConfirmDialog
        open={validateOpen}
        onOpenChange={onValidateOpenChange}
        title="Valider au catalogue"
        description="Le produit quitte le sourcing et rejoint le catalogue en brouillon, non publié. Le stock n'est pas modifié."
        confirmText="Valider au catalogue"
        onConfirm={onValidateConfirm}
      />
    </>
  );
}
