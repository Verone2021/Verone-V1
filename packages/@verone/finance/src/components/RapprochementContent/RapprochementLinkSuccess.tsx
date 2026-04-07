'use client';

import { Button } from '@verone/ui';
import { formatCurrency } from '@verone/utils';
import { CheckCircle2 } from 'lucide-react';

interface RapprochementLinkSuccessProps {
  orderNumber: string;
  transactionLabel: string;
  transactionAmount: number;
  onClose: () => void;
}

export function RapprochementLinkSuccess({
  orderNumber,
  transactionLabel,
  transactionAmount,
  onClose,
}: RapprochementLinkSuccessProps) {
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
          Commande #{orderNumber} liée à {transactionLabel}
        </p>
        <p className="text-sm font-medium text-green-600">
          {formatCurrency(transactionAmount)}
        </p>
      </div>
      <Button onClick={onClose} className="mt-4">
        Fermer
      </Button>
    </div>
  );
}
