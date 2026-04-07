'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';

interface AdditionalCostsCardProps {
  isBlocked: boolean;
  shippingCostHt: number;
  customsCostHt: number;
  insuranceCostHt: number;
  onShippingCostChange: (value: number) => void;
  onCustomsCostChange: (value: number) => void;
  onInsuranceCostChange: (value: number) => void;
}

export function AdditionalCostsCard({
  isBlocked,
  shippingCostHt,
  customsCostHt,
  insuranceCostHt,
  onShippingCostChange,
  onCustomsCostChange,
  onInsuranceCostChange,
}: AdditionalCostsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Frais additionnels</CardTitle>
        <CardDescription>
          Frais de transport, douane et assurance (optionnels)
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="shippingCostHt">Frais de livraison HT (€)</Label>
          <Input
            id="shippingCostHt"
            type="number"
            min="0"
            step="0.01"
            value={shippingCostHt || ''}
            onChange={e =>
              onShippingCostChange(parseFloat(e.target.value) || 0)
            }
            placeholder="0.00"
            disabled={isBlocked}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customsCostHt">Frais de douane HT (€)</Label>
          <Input
            id="customsCostHt"
            type="number"
            min="0"
            step="0.01"
            value={customsCostHt || ''}
            onChange={e => onCustomsCostChange(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            disabled={isBlocked}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="insuranceCostHt">Frais d'assurance HT (€)</Label>
          <Input
            id="insuranceCostHt"
            type="number"
            min="0"
            step="0.01"
            value={insuranceCostHt || ''}
            onChange={e =>
              onInsuranceCostChange(parseFloat(e.target.value) || 0)
            }
            placeholder="0.00"
            disabled={isBlocked}
          />
        </div>
      </CardContent>
    </Card>
  );
}
