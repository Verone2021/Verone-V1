import { Check, ArrowRightLeft, XCircle } from 'lucide-react';
import type { StatusAction } from './types';

export function getStatusActions(status: string): StatusAction[] {
  const actions: StatusAction[] = [];

  if (status === 'draft') {
    actions.push({
      label: 'Finaliser',
      action: 'finalize',
      variant: 'default',
      icon: <Check className="mr-2 h-4 w-4" />,
      confirmTitle: 'Finaliser le devis ?',
      confirmDescription:
        'Le devis sera finalise et envoye. Il ne pourra plus etre modifie.',
    });
  }

  if (status === 'finalized' || status === 'pending_approval') {
    actions.push({
      label: 'Marquer accepte',
      action: 'accept',
      variant: 'default',
      icon: <Check className="mr-2 h-4 w-4" />,
      confirmTitle: 'Marquer comme accepte ?',
      confirmDescription: 'Le devis sera marque comme accepte par le client.',
    });
    actions.push({
      label: 'Marquer refuse',
      action: 'decline',
      variant: 'destructive',
      icon: <XCircle className="mr-2 h-4 w-4" />,
      confirmTitle: 'Marquer comme refuse ?',
      confirmDescription:
        'Le devis sera marque comme refuse. Cette action est irreversible.',
    });
  }

  if (status === 'accepted') {
    actions.push({
      label: 'Convertir en facture',
      action: 'convert',
      variant: 'default',
      icon: <ArrowRightLeft className="mr-2 h-4 w-4" />,
      confirmTitle: 'Convertir en facture ?',
      confirmDescription:
        'Une facture brouillon sera creee depuis ce devis. Cette action est irreversible.',
    });
  }

  return actions;
}
