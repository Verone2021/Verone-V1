'use client';

/**
 * MarginConfigSection - Jauge de configuration de marge interactive
 *
 * @module MarginConfigSection
 * @since 2026-04-14
 */

import { Info, TrendingUp } from 'lucide-react';

interface MarginLimits {
  min: number;
  max: number;
  greenEnd: number;
  orangeEnd: number;
}

interface Calculations {
  gain: number;
  finalPrice: number;
}

interface MarginConfigSectionProps {
  marginRate: number;
  marginLimits: MarginLimits;
  calculations: Calculations;
  currentZone: 'green' | 'orange' | 'red';
  zoneWidths: { greenWidth: number; orangeWidth: number };
  onMarginChange: (rate: number) => void;
}

export function MarginConfigSection({
  marginRate,
  marginLimits,
  calculations,
  currentZone,
  zoneWidths,
  onMarginChange,
}: MarginConfigSectionProps) {
  return (
    <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-blue-600" />
        <h3 className="font-medium text-gray-900">Votre marge</h3>
      </div>

      {/* Slider avec jauge tricolore */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">{marginLimits.min}%</span>
          <div className="flex items-center gap-1">
            <input
              type="number"
              min={marginLimits.min}
              max={marginLimits.max}
              step={0.01}
              value={marginRate.toFixed(2)}
              onChange={e => {
                const val = parseFloat(e.target.value);
                if (
                  !isNaN(val) &&
                  val >= marginLimits.min &&
                  val <= marginLimits.max
                ) {
                  onMarginChange(Math.round(val * 100) / 100);
                }
              }}
              className="w-20 text-right text-lg font-bold text-gray-900 border border-gray-300 rounded-md px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-lg font-bold text-gray-900">%</span>
          </div>
          <span className="text-sm text-gray-600">
            {marginLimits.max.toFixed(2)}%
          </span>
        </div>

        {/* Barre tricolore */}
        <div className="flex h-3 w-full overflow-hidden rounded-full">
          <div
            className="bg-green-400 transition-all"
            style={{ width: `${zoneWidths.greenWidth}%` }}
          />
          <div
            className="bg-orange-400 transition-all"
            style={{ width: `${zoneWidths.orangeWidth}%` }}
          />
          <div className="flex-1 bg-red-400 transition-all" />
        </div>

        {/* Range input */}
        <input
          type="range"
          min={marginLimits.min}
          max={marginLimits.max}
          step={0.01}
          value={marginRate}
          onChange={e =>
            onMarginChange(Math.round(parseFloat(e.target.value) * 100) / 100)
          }
          className="w-full mt-2 appearance-none h-2 bg-transparent cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-blue-600
            [&::-webkit-slider-thumb]:shadow-md
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-white
            [&::-moz-range-thumb]:border-2
            [&::-moz-range-thumb]:border-blue-600
            [&::-moz-range-thumb]:shadow-md
            [&::-moz-range-thumb]:cursor-pointer"
        />

        {/* Légende zones */}
        <div className="flex justify-between mt-2 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-gray-500">Compétitif</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-400" />
            <span className="text-gray-500">Correct</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-gray-500">Proche public</span>
          </div>
        </div>

        {/* Jonctions */}
        <div className="flex justify-between mt-2 text-xs font-medium">
          <span className="text-gray-500">{marginLimits.min}%</span>
          <span className="text-green-600">
            {marginLimits.greenEnd.toFixed(2)}%
          </span>
          <span className="text-orange-500">
            {marginLimits.orangeEnd.toFixed(2)}%
          </span>
          <span className="text-gray-500">{marginLimits.max.toFixed(2)}%</span>
        </div>

        <div className="mt-1 text-center text-xs text-gray-400">
          Vert: 0-{marginLimits.greenEnd.toFixed(2)}% | Orange:{' '}
          {marginLimits.greenEnd.toFixed(2)}-{marginLimits.orangeEnd.toFixed(2)}
          % | Rouge: {marginLimits.orangeEnd.toFixed(2)}-
          {marginLimits.max.toFixed(2)}%
        </div>
      </div>

      {/* Calculs */}
      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-blue-100">
        <div>
          <p className="text-xs text-gray-500">Votre gain</p>
          <p className="text-lg font-bold text-green-600">
            +{calculations.gain.toFixed(2)} €
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Prix de vente final</p>
          <p className="text-lg font-bold text-gray-900">
            {calculations.finalPrice.toFixed(2)} € HT
          </p>
        </div>
      </div>

      {/* Zone actuelle */}
      <div
        className={`mt-3 p-2 rounded-lg text-sm ${
          currentZone === 'green'
            ? 'bg-green-100 text-green-800'
            : currentZone === 'orange'
              ? 'bg-orange-100 text-orange-800'
              : 'bg-red-100 text-red-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 flex-shrink-0" />
          <span>
            {currentZone === 'green' &&
              'Prix très compétitif, favorise les ventes'}
            {currentZone === 'orange' &&
              'Prix correct, bon équilibre marge/compétitivité'}
            {currentZone === 'red' &&
              'Prix proche du tarif public, marge élevée'}
          </span>
        </div>
      </div>
    </div>
  );
}
