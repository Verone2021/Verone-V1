'use client';

/**
 * Dialog d'aperçu du plan d'envoi Welyb (dry-run) [BO-COMPTA-001]
 *
 * Affiche les lots préparés par api/finance/send-to-accountant (mode DRY-RUN).
 * Le bouton "Confirmer l'envoi" est désactivé intentionnellement —
 * activation manuelle par Roméo uniquement (cf. GUARD-FOU serveur).
 */

import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@verone/ui';
import { AlertTriangle, CheckCircle2, Mail, Package } from 'lucide-react';

import type { WelybDryRunResponse } from '../types';

interface WelyBPlanDialogProps {
  data: WelybDryRunResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WelyBPlanDialog({
  data,
  open,
  onOpenChange,
}: WelyBPlanDialogProps) {
  if (!data) return null;

  const scopeLabel = data.scope === 'achats' ? 'Achats' : 'Ventes';

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

        {/* Avertissement garde-fou */}
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-700">
            Il s'agit d'un plan préparatoire uniquement. Aucun email n'a été
            envoyé. L'envoi réel doit être activé manuellement par Roméo dans la
            configuration serveur.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <Button
            disabled
            title="Activation manuelle par Roméo — non disponible depuis l'interface"
          >
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Confirmer l'envoi (désactivé)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
