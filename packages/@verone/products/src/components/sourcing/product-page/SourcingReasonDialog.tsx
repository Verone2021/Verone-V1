'use client';

import { useEffect, useState } from 'react';

import { ButtonV2 } from '@verone/ui/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui/components/ui/dialog';
import { Textarea } from '@verone/ui/components/ui/textarea';

export interface SourcingReasonDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  onClose: () => void;
  /** Renvoie true si l'action a réussi : la fenêtre se ferme alors. */
  onConfirm: (reason: string) => Promise<boolean>;
}

/**
 * Motif obligatoire avant une action qui sort un produit du parcours
 * (refuser, retirer). Le motif est enregistré dans le journal par la base.
 */
export function SourcingReasonDialog({
  open,
  title,
  description,
  confirmLabel,
  onClose,
  onConfirm,
}: SourcingReasonDialogProps) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  const trimmed = reason.trim();

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const ok = await onConfirm(trimmed);
      if (ok) onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (!next && !saving) onClose();
      }}
    >
      <DialogContent className="md:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={4}
          placeholder="Motif (obligatoire)"
          className="w-full"
          autoFocus
        />

        <DialogFooter className="flex-col gap-2 md:flex-row">
          <ButtonV2
            variant="outline"
            className="w-full md:w-auto"
            onClick={onClose}
            disabled={saving}
          >
            Annuler
          </ButtonV2>
          <ButtonV2
            variant="danger"
            className="w-full md:w-auto"
            disabled={!trimmed || saving}
            loading={saving}
            onClick={() => {
              void handleConfirm().catch(error => {
                console.error('[SourcingReasonDialog] confirm failed:', error);
              });
            }}
          >
            {confirmLabel}
          </ButtonV2>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
