'use client';

/**
 * Pastille de statut unique (dominante) pour une vignette de la Bibliothèque [BO-COMPTA-001]
 *
 * Contrairement à `ClotureRowSignals` (qui empile tous les badges dans le tableau
 * de la Clôture), ce composant n'affiche qu'UNE pastille — la plus prioritaire —
 * pour rester lisible en overlay sur une carte étroite.
 *
 * Ordre de priorité : ignoré > pièce manquante > transféré (« Envoyé le X »)
 * > PCG manquant > TVA à vérifier > OK.
 *
 * « Envoyé » passe avant PCG/TVA : une fois la pièce transmise au comptable,
 * c'est le statut que Roméo veut voir en premier sur la vignette.
 */

import { AlertCircle, CheckCircle2, EyeOff } from 'lucide-react';

import { Badge } from '@verone/ui';

import type { ClotureSignals } from './types';

type DominantKind =
  | 'ignored'
  | 'missingPiece'
  | 'pcgMissing'
  | 'vatMissing'
  | 'transferred'
  | 'ok';

/** Renvoie le signal dominant à afficher sur la vignette. */
export function getDominantSignal(signals: ClotureSignals): DominantKind {
  if (signals.ignored) return 'ignored';
  if (signals.missingPiece) return 'missingPiece';
  if (signals.transferredAt) return 'transferred';
  if (signals.pcgMissing) return 'pcgMissing';
  if (signals.vatMissing) return 'vatMissing';
  return 'ok';
}

interface CardSignalBadgeProps {
  signals: ClotureSignals;
}

export function CardSignalBadge({ signals }: CardSignalBadgeProps) {
  const kind = getDominantSignal(signals);

  switch (kind) {
    case 'ignored':
      return (
        <Badge variant="secondary" className="gap-1 text-[10px] py-0 shadow-sm">
          <EyeOff className="h-2.5 w-2.5" />
          Ignoré
        </Badge>
      );
    case 'missingPiece':
      return (
        <Badge variant="warning" className="gap-1 text-[10px] py-0 shadow-sm">
          <AlertCircle className="h-2.5 w-2.5" />
          Pièce manquante
        </Badge>
      );
    case 'pcgMissing':
      return (
        <Badge
          variant="outline"
          className="gap-1 text-[10px] py-0 shadow-sm bg-red-50 text-red-700 border-red-200"
        >
          <AlertCircle className="h-2.5 w-2.5" />
          PCG manquant
        </Badge>
      );
    case 'vatMissing':
      return (
        <Badge
          variant="outline"
          className="gap-1 text-[10px] py-0 shadow-sm bg-orange-100 text-orange-700 border-orange-200"
        >
          <AlertCircle className="h-2.5 w-2.5" />
          TVA à vérifier
        </Badge>
      );
    case 'transferred': {
      const date = signals.transferredAt
        ? new Date(signals.transferredAt).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
          })
        : '';
      return (
        <Badge
          variant="outline"
          className="gap-1 text-[10px] py-0 shadow-sm bg-green-50 text-green-700 border-green-200"
        >
          <CheckCircle2 className="h-2.5 w-2.5" />
          Envoyé le {date}
        </Badge>
      );
    }
    case 'ok':
    default:
      return (
        <Badge
          variant="outline"
          className="gap-1 text-[10px] py-0 shadow-sm text-green-600 border-green-200 bg-white/90"
        >
          <CheckCircle2 className="h-2.5 w-2.5" />
          OK
        </Badge>
      );
  }
}
