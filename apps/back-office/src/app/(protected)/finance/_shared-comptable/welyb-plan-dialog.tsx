'use client';

/**
 * Dialog d'aperçu du plan d'envoi Welyb [BO-COMPTA-001 / BO-COMPTA-003]
 *
 * Affiche les lots préparés par api/finance/send-to-accountant (mode DRY-RUN).
 * Si l'envoi réel est autorisé côté serveur (`data.sendAllowed`, piloté par
 * ACCOUNTANT_SEND_ENABLED), une case à cocher déverrouille le bouton « Confirmer
 * l'envoi » qui déclenche l'envoi réel via `onConfirmSend`. Sinon le bouton reste
 * désactivé (garde-fou serveur).
 */

import { useEffect, useState } from 'react';

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Mail,
  Package,
} from 'lucide-react';

import type { WelybDryRunResponse } from './types';

interface WelyBPlanDialogProps {
  data: WelybDryRunResponse | null;
  open: boolean;
  sending: boolean;
  onConfirmSend: () => void;
  onOpenChange: (open: boolean) => void;
}

export function WelyBPlanDialog({
  data,
  open,
  sending,
  onConfirmSend,
  onOpenChange,
}: WelyBPlanDialogProps) {
  const [confirmChecked, setConfirmChecked] = useState(false);

  // Réinitialiser la case de confirmation à chaque ouverture/fermeture.
  useEffect(() => {
    if (!open) setConfirmChecked(false);
  }, [open]);

  if (!data) return null;

  const scopeLabel = data.scope === 'achats' ? 'Achats' : 'Ventes';
  const canSend = data.sendAllowed === true && data.totalPieces > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Plan d'envoi Welyb — {scopeLabel} {data.year}
          </DialogTitle>
        </DialogHeader>

        {/* Résumé */}
        <div className="rounded-lg border bg-blue-50 border-blue-200 px-4 py-3 flex items-start gap-3">
          <Package className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold text-blue-800">
              {data.totalPieces} pièce{data.totalPieces > 1 ? 's' : ''} à
              envoyer en {data.batches.length} lot
              {data.batches.length > 1 ? 's' : ''}
            </p>
            <p className="text-blue-600 text-xs mt-0.5">
              {data.batches.length > 0 && (
                <>Destinataire : {data.batches[0]?.recipient}</>
              )}
            </p>
          </div>
        </div>

        {/* Liste des lots */}
        <div className="flex-1 overflow-y-auto space-y-2 py-1">
          {data.batches.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {data.message ?? 'Aucune pièce éligible à envoyer'}
            </p>
          ) : (
            data.batches.map(batch => (
              <div
                key={batch.index}
                className="border rounded-lg px-4 py-3 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Lot {batch.index}</p>
                  <Badge variant="secondary" className="text-xs">
                    {batch.attachmentCount} pièce
                    {batch.attachmentCount > 1 ? 's' : ''}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  Sujet : {batch.subject}
                </p>
                <p className="text-xs text-muted-foreground">
                  Expéditeur : {batch.from}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Zone confirmation / garde-fou */}
        {canSend ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">
                Envoi réel activé. En confirmant, ces {data.totalPieces} pièce
                {data.totalPieces > 1 ? 's' : ''} partiront vraiment au cabinet
                comptable. Action non annulable.
              </p>
            </div>
            <label className="flex items-center gap-2 text-red-800 font-medium cursor-pointer">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={confirmChecked}
                onChange={e => setConfirmChecked(e.target.checked)}
                disabled={sending}
              />
              Je confirme l'envoi réel au comptable
            </label>
          </div>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-amber-700">
              Plan préparatoire uniquement. Aucun email n'a été envoyé. L'envoi
              réel doit être activé côté serveur (ACCOUNTANT_SEND_ENABLED) avant
              de pouvoir confirmer depuis cet écran.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={sending}
          >
            Fermer
          </Button>
          <Button
            disabled={!canSend || !confirmChecked || sending}
            title={
              canSend
                ? undefined
                : 'Activation manuelle par Roméo — non disponible depuis l’interface'
            }
            onClick={onConfirmSend}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-1" />
            )}
            {canSend
              ? `Confirmer l'envoi (${data.totalPieces})`
              : "Confirmer l'envoi (désactivé)"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
