'use client';

import { cn } from '@verone/utils';

interface AdditionalCostsSectionProps {
  shippingCostHt: number;
  onShippingChange: (value: number) => void;
  handlingCostHt: number;
  onHandlingChange: (value: number) => void;
  insuranceCostHt: number;
  onInsuranceChange: (value: number) => void;
  fraisTaxRate: number;
  onFraisTaxRateChange: (value: number) => void;
}

export function AdditionalCostsSection({
  shippingCostHt,
  onShippingChange,
  handlingCostHt,
  onHandlingChange,
  insuranceCostHt,
  onInsuranceChange,
  fraisTaxRate,
  onFraisTaxRateChange,
}: AdditionalCostsSectionProps) {
  const costFields = [
    { label: 'Livraison', value: shippingCostHt, onChange: onShippingChange },
    { label: 'Manutention', value: handlingCostHt, onChange: onHandlingChange },
    { label: 'Assurance', value: insuranceCostHt, onChange: onInsuranceChange },
  ];

  const taxRateOptions = [
    { value: 0.2, label: '20%' },
    { value: 0.1, label: '10%' },
    { value: 0.055, label: '5,5%' },
    { value: 0, label: '0%' },
  ];

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Frais additionnels (HT)
      </label>
      <div className="grid grid-cols-3 gap-3">
        {costFields.map(field => (
          <div key={field.label}>
            <label className="block text-xs text-gray-500 mb-1">
              {field.label}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={field.value ?? ''}
                onChange={e =>
                  field.onChange(
                    e.target.value ? parseFloat(e.target.value) : 0
                  )
                }
                placeholder="0.00"
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                EUR
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3">
        <label className="block text-xs text-gray-500 mb-2">
          Taux de TVA sur les frais
        </label>
        <div className="grid grid-cols-4 gap-2">
          {taxRateOptions.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onFraisTaxRateChange(opt.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg border text-sm transition-all',
                fraisTaxRate === opt.value
                  ? 'border-purple-500 bg-purple-50 text-purple-700 font-medium'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
