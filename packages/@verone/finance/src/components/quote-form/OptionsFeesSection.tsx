'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@verone/ui';

// =====================================================================
// PROPS
// =====================================================================

export interface OptionsFeesSectionProps {
  validityDays: string;
  onValidityDaysChange: (value: string) => void;
  reference: string;
  onReferenceChange: (value: string) => void;
  shippingCostHt: number;
  onShippingCostHtChange: (value: number) => void;
  handlingCostHt: number;
  onHandlingCostHtChange: (value: number) => void;
  insuranceCostHt: number;
  onInsuranceCostHtChange: (value: number) => void;
  feesVatRate: number;
  onFeesVatRateChange: (value: number) => void;
}

// =====================================================================
// COMPONENT
// =====================================================================

export function OptionsFeesSection({
  validityDays,
  onValidityDaysChange,
  reference,
  onReferenceChange,
  shippingCostHt,
  onShippingCostHtChange,
  handlingCostHt,
  onHandlingCostHtChange,
  insuranceCostHt,
  onInsuranceCostHtChange,
  feesVatRate,
  onFeesVatRateChange,
}: OptionsFeesSectionProps): React.ReactNode {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Options */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Validité</Label>
            <Select value={validityDays} onValueChange={onValidityDaysChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">15 jours</SelectItem>
                <SelectItem value="30">30 jours</SelectItem>
                <SelectItem value="60">60 jours</SelectItem>
                <SelectItem value="90">90 jours</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Référence (optionnel)</Label>
            <Input
              placeholder="REF-..."
              value={reference}
              onChange={e => onReferenceChange(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Fees */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Frais additionnels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Livraison HT</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={shippingCostHt}
                onChange={e => onShippingCostHtChange(Number(e.target.value))}
              />
            </div>
            <div>
              <Label className="text-xs">Manutention HT</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={handlingCostHt}
                onChange={e => onHandlingCostHtChange(Number(e.target.value))}
              />
            </div>
            <div>
              <Label className="text-xs">Assurance HT</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={insuranceCostHt}
                onChange={e => onInsuranceCostHtChange(Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">TVA frais</Label>
            <Select
              value={String(feesVatRate)}
              onValueChange={v => onFeesVatRateChange(Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0%</SelectItem>
                <SelectItem value="0.055">5,5%</SelectItem>
                <SelectItem value="0.1">10%</SelectItem>
                <SelectItem value="0.2">20%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
