'use client';

import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@verone/ui';
import { Info } from 'lucide-react';

interface EcoTaxVatInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  defaultTaxRate?: number;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function EcoTaxVatInput({
  value,
  onChange,
  defaultTaxRate = 20,
  disabled = false,
  label = 'TVA Éco-taxe',
  className = '',
}: EcoTaxVatInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || val === null) {
      onChange(null);
    } else {
      const numericValue = parseFloat(val);
      if (!isNaN(numericValue) && numericValue >= 0 && numericValue <= 100) {
        onChange(numericValue);
      }
    }
  };

  const displayValue = value !== null ? value : '';

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <Label htmlFor="eco-tax-vat-rate" className="text-sm font-medium">
          {label}
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-gray-400 cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">
                Taux de TVA spécifique pour l'éco-taxe (DEEE).
                <br />
                Si vide, utilise la TVA de la commande ({defaultTaxRate}%).
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="relative">
        <Input
          id="eco-tax-vat-rate"
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={displayValue}
          onChange={handleChange}
          placeholder={`TVA par défaut (${defaultTaxRate}%)`}
          disabled={disabled}
          className="pr-8"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
          %
        </span>
      </div>

      {value !== null && (
        <p className="text-xs text-gray-500 mt-1">
          TVA éco-taxe : {value}% (différente de la TVA commande{' '}
          {defaultTaxRate}%)
        </p>
      )}
      {value === null && (
        <p className="text-xs text-gray-400 mt-1">
          Utilise la TVA commande par défaut ({defaultTaxRate}%)
        </p>
      )}
    </div>
  );
}
