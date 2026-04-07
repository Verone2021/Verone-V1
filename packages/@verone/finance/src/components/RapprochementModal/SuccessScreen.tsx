'use client';

import { Button } from '@verone/ui';
import { CheckCircle2, Plus } from 'lucide-react';

import { formatAmount } from './utils';
import type { LinkSuccessState } from './types';

interface SuccessScreenProps {
  linkSuccess: LinkSuccessState;
  remainingAmount: number;
  onAddAnother: () => void;
  onClose: () => void;
}

export function SuccessScreen({
  linkSuccess,
  remainingAmount,
  onAddAnother,
  onClose,
}: SuccessScreenProps) {
  const afterRemaining = remainingAmount - linkSuccess.amount;

  return (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle2 className="h-8 w-8 text-green-600" />
      </div>
      <div className="text-center space-y-1">
        <h3 className="font-semibold text-lg text-slate-900">
          Rapprochement effectué
        </h3>
        <p className="text-sm text-slate-600">
          {linkSuccess.label} liée à la transaction
        </p>
        <p className="text-sm font-medium text-green-600">
          {formatAmount(linkSuccess.amount)}
        </p>
        {/* Montant restant après ce rapprochement */}
        {afterRemaining > 0.01 && (
          <p className="text-sm text-amber-600 mt-1">
            Reste a rapprocher : {formatAmount(afterRemaining)}
          </p>
        )}
      </div>
      <div className="flex gap-3 mt-4">
        {/* Bouton "Ajouter un autre" si montant restant */}
        {afterRemaining > 0.01 && (
          <Button variant="outline" onClick={onAddAnother}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un autre
          </Button>
        )}
        <Button onClick={onClose}>Fermer</Button>
      </div>
    </div>
  );
}
