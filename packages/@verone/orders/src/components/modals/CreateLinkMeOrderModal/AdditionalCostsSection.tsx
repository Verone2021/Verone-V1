'use client';

import { cn } from '@verone/utils';

const TVA_OPTIONS = [
  { value: 0.2, label: '20%' },
  { value: 0.1, label: '10%' },
  { value: 0.055, label: '5,5%' },
  { value: 0, label: '0%' },
] as const;

interface AdditionalCostsSectionProps {
  shippingCostHt: number;
  onShippingCostHtChange: (v: number) => void;
  handlingCostHt: number;
  onHandlingCostHtChange: (v: number) => void;
  insuranceCostHt: number;
  onInsuranceCostHtChange: (v: number) => void;
  fraisTaxRate: number;
  onFraisTaxRateChange: (v: number) => void;
}

export function AdditionalCostsSection({
  shippingCostHt,
  onShippingCostHtChange,
  handlingCostHt,
  onHandlingCostHtChange,
  insuranceCostHt,
  onInsuranceCostHtChange,
  fraisTaxRate,
  onFraisTaxRateChange,
}: AdditionalCostsSectionProps) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Frais additionnels (HT)
      </label>
      <div className="grid grid-cols-3 gap-3">
        {/* Livraison */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Livraison</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.01"
              value={shippingCostHt ?? ''}
              onChange={e =>
                onShippingCostHtChange(
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

        {/* Manutention */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Manutention
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.01"
              value={handlingCostHt ?? ''}
              onChange={e =>
                onHandlingCostHtChange(
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

        {/* Assurance */}
        <div>
          <label className="block text-xs text-gray-500 mb-1">Assurance</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.01"
              value={insuranceCostHt ?? ''}
              onChange={e =>
                onInsuranceCostHtChange(
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
      </div>

      <div className="mt-3">
        <label className="block text-xs text-gray-500 mb-2">
          Taux de TVA sur les frais
        </label>
        <div className="grid grid-cols-4 gap-2">
          {TVA_OPTIONS.map(opt => (
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
