import { Input, Label } from '@verone/ui';
import { Check, AlertCircle } from 'lucide-react';

import type { MarginCalculationResult } from '../types';
import { MarginSlider } from './MarginSlider';

interface PricingMarginSectionProps {
  minMarginRate: number | null | undefined;
  maxMarginRate: number | null | undefined;
  suggestedMarginRate: number | null | undefined;
  isMinMarginValid: boolean;
  isMaxMarginValid: boolean;
  isSuggestedMarginValid: boolean;
  marginResult: MarginCalculationResult | null | undefined;
}

export function PricingMarginSection({
  minMarginRate,
  maxMarginRate,
  suggestedMarginRate,
  isMinMarginValid,
  isMaxMarginValid,
  isSuggestedMarginValid,
  marginResult,
}: PricingMarginSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">
          Paramètres de marge affiliés
        </Label>
        {isMinMarginValid && isMaxMarginValid && isSuggestedMarginValid ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <AlertCircle className="h-4 w-4 text-amber-500" />
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label
            htmlFor="min-margin"
            className="text-xs flex items-center gap-1"
          >
            Marge min (%)
            {isMinMarginValid && <Check className="h-3 w-3 text-green-600" />}
          </Label>
          <Input
            id="min-margin"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={minMarginRate ?? ''}
            disabled
            className="font-mono bg-muted cursor-not-allowed"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="suggested-margin"
            className="text-xs flex items-center gap-1"
          >
            Marge suggérée (%)
            {isSuggestedMarginValid && (
              <Check className="h-3 w-3 text-green-600" />
            )}
          </Label>
          <Input
            id="suggested-margin"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={suggestedMarginRate ?? ''}
            disabled
            className="font-mono bg-muted cursor-not-allowed"
          />
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="max-margin"
            className="text-xs flex items-center gap-1"
          >
            Marge max (%)
            {isMaxMarginValid && <Check className="h-3 w-3 text-green-600" />}
          </Label>
          <Input
            id="max-margin"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={maxMarginRate ?? ''}
            disabled
            className="font-mono bg-muted cursor-not-allowed"
          />
        </div>
      </div>

      {(!isMinMarginValid || !isMaxMarginValid || !isSuggestedMarginValid) && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          Renseignez les 3 taux de marge pour valider cette section
        </p>
      )}

      {marginResult?.isProductSellable && (
        <div className="pt-3 border-t">
          <Label className="text-xs text-muted-foreground mb-2 block">
            Zones de marge (calculées automatiquement)
          </Label>
          <MarginSlider marginResult={marginResult} readOnly className="mt-2" />
        </div>
      )}

      {marginResult && !marginResult.isProductSellable && (
        <div className="pt-3 border-t">
          <p className="text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Marge insuffisante - Vérifiez le tarif public et la commission
          </p>
        </div>
      )}
    </div>
  );
}
