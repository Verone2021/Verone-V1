'use client';

import { getMarginColor } from '../../types';

import { MIN_MARGIN_RATE } from './new-selection.types';

interface MarginGaugeProps {
  marginRate: number;
  maxRate: number;
  suggestedRate: number;
  onChange: (rate: number) => void;
}

const COLOR_CLASSES = {
  green: 'text-green-600',
  orange: 'text-orange-600',
  red: 'text-red-600',
} as const;

export function MarginGauge({
  marginRate,
  maxRate,
  suggestedRate,
  onChange,
}: MarginGaugeProps) {
  const greenZoneEnd = suggestedRate;
  const orangeZoneEnd = suggestedRate * 2;

  const greenPct = maxRate > 0 ? (greenZoneEnd / maxRate) * 100 : 33;
  const orangePct = maxRate > 0 ? (orangeZoneEnd / maxRate) * 100 : 66;

  const currentColor = getMarginColor(marginRate, {
    minRate: MIN_MARGIN_RATE,
    maxRate,
    suggestedRate,
    isProductSellable: maxRate > MIN_MARGIN_RATE,
    greenZoneEnd,
    orangeZoneEnd,
  });

  return (
    <div className="space-y-2">
      <div className="relative">
        <input
          type="range"
          min={MIN_MARGIN_RATE * 100}
          max={Math.max(maxRate * 100, MIN_MARGIN_RATE * 100 + 1)}
          step={0.5}
          value={marginRate * 100}
          onChange={e => onChange(parseFloat(e.target.value) / 100)}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right,
              #22c55e 0%, #22c55e ${greenPct}%,
              #f97316 ${greenPct}%, #f97316 ${orangePct}%,
              #ef4444 ${orangePct}%, #ef4444 100%)`,
          }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-500">
        <span>{(MIN_MARGIN_RATE * 100).toFixed(0)}%</span>
        <span className="text-green-600">
          {(greenZoneEnd * 100).toFixed(1)}%
        </span>
        <span className="text-orange-600">
          {(orangeZoneEnd * 100).toFixed(1)}%
        </span>
        <span className="text-red-600">{(maxRate * 100).toFixed(1)}%</span>
      </div>

      <div className={`text-center font-medium ${COLOR_CLASSES[currentColor]}`}>
        Marge: {(marginRate * 100).toFixed(1)}%
      </div>
    </div>
  );
}
