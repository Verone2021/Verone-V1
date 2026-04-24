'use client';

import { ButtonV2 } from '@verone/ui';
import { Label } from '@verone/ui';
import { CheckCircle2, Truck } from 'lucide-react';

interface StepSuccessProps {
  shipmentResult: {
    trackingNumber: string | null;
    labelUrl: string | null;
    carrierName: string | null;
    orderReference: string | null;
    totalPaid: number | null;
  };
  onClose: () => void;
}

export function StepSuccess({ shipmentResult, onClose }: StepSuccessProps) {
  return (
    <div className="text-center space-y-4 py-6">
      <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
      <h3 className="font-bold text-lg">Expedition creee sur Packlink</h3>

      <div className="border rounded-lg p-3 inline-block">
        <Label className="text-xs text-muted-foreground">
          Reference Packlink
        </Label>
        <p className="font-mono font-medium text-sm">
          {shipmentResult.orderReference}
        </p>
      </div>

      <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50 max-w-md mx-auto">
        <p className="text-sm text-blue-800 font-medium">
          Finalisez le paiement sur Packlink PRO
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Montant : {shipmentResult.totalPaid?.toFixed(2)} EUR —{' '}
          {shipmentResult.carrierName}
        </p>
        <ButtonV2
          className="mt-3 bg-blue-600 hover:bg-blue-700 w-full"
          onClick={() =>
            window.open(
              'https://pro.packlink.fr/private/shipments/ready-to-purchase',
              '_blank'
            )
          }
        >
          <Truck className="h-4 w-4 mr-1" />
          Finaliser et payer sur Packlink PRO
        </ButtonV2>
      </div>

      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
        Apres le paiement sur Packlink PRO, le numero de suivi et l etiquette
        seront automatiquement synchronises dans votre back-office via webhook.
      </p>

      <ButtonV2 variant="outline" onClick={onClose}>
        Fermer
      </ButtonV2>
    </div>
  );
}
