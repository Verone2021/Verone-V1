'use client';

/**
 * Pastilles de signalement calculées pour une ligne de clôture [BO-COMPTA-001]
 */

import { AlertCircle, CheckCircle2, EyeOff } from 'lucide-react';

import { Badge } from '@verone/ui';

import type { ClotureSignals } from '../types';

interface ClotureRowSignalsProps {
  signals: ClotureSignals;
}

export function ClotureRowSignals({ signals }: ClotureRowSignalsProps) {
  const badges: React.ReactNode[] = [];

  if (signals.ignored) {
    badges.push(
      <Badge
        key="ignored"
        variant="secondary"
        className="gap-1 text-[10px] py-0"
      >
        <EyeOff className="h-2.5 w-2.5" />
        Ignoré
      </Badge>
    );
    return <div className="flex flex-wrap gap-1">{badges}</div>;
  }

  if (signals.missingPiece) {
    badges.push(
      <Badge key="missing" variant="warning" className="gap-1 text-[10px] py-0">
        <AlertCircle className="h-2.5 w-2.5" />
        Pièce manquante
      </Badge>
    );
  }

  if (signals.vatMissing) {
    badges.push(
      <Badge
        key="vat"
        className="gap-1 text-[10px] py-0 bg-orange-100 text-orange-700 border-orange-200"
        variant="outline"
      >
        <AlertCircle className="h-2.5 w-2.5" />
        TVA à vérifier
      </Badge>
    );
  }

  if (signals.pcgMissing) {
    badges.push(
      <Badge
        key="pcg"
        className="gap-1 text-[10px] py-0 bg-red-50 text-red-700 border-red-200"
        variant="outline"
      >
        <AlertCircle className="h-2.5 w-2.5" />
        PCG manquant
      </Badge>
    );
  }

  if (signals.transferredAt) {
    const date = new Date(signals.transferredAt).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
    badges.push(
      <Badge
        key="transferred"
        className="gap-1 text-[10px] py-0 bg-green-50 text-green-700 border-green-200"
        variant="outline"
      >
        <CheckCircle2 className="h-2.5 w-2.5" />
        Transféré le {date}
      </Badge>
    );
  }

  if (badges.length === 0) {
    return (
      <Badge
        variant="outline"
        className="gap-1 text-[10px] py-0 text-green-600 border-green-200"
      >
        <CheckCircle2 className="h-2.5 w-2.5" />
        OK
      </Badge>
    );
  }

  return <div className="flex flex-wrap gap-1">{badges}</div>;
}
