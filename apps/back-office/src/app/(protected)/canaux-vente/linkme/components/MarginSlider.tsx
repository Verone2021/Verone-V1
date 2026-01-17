'use client';

import { cn } from '@verone/utils';
import { TrendingUp, AlertTriangle, AlertCircle } from 'lucide-react';

import type { MarginCalculationResult } from '../types';
import { getMarginColor } from '../types';

interface MarginSliderProps {
  /** Résultat du calcul des marges */
  marginResult: MarginCalculationResult;
  /** Valeur actuelle du curseur en décimal (0.15 = 15%) - optionnel si readOnly */
  value?: number;
  /** Callback quand la valeur change - optionnel si readOnly */
  onChange?: (value: number) => void;
  /** Mode lecture seule (affichage uniquement) */
  readOnly?: boolean;
  /** Classes CSS additionnelles */
  className?: string;
}

/**
 * Composant curseur de marge avec zones de couleur (Vert/Orange/Rouge)
 *
 * ZONES:
 * - VERT (compétitif): 0% → suggestedRate
 * - ORANGE (correct): suggestedRate → 2×suggestedRate
 * - ROUGE (proche public): 2×suggestedRate → maxRate
 *
 * Peut être utilisé en mode:
 * - readOnly: affichage des zones seulement (pour CMS/ProductPricingCard)
 * - interactif: avec value/onChange (pour modal sélections)
 */
export function MarginSlider({
  marginResult,
  value,
  onChange,
  readOnly = false,
  className,
}: MarginSliderProps) {
  const { minRate, maxRate, suggestedRate, orangeZoneEnd, isProductSellable } =
    marginResult;

  // Conversion en pourcentages pour affichage
  const minPercent = Math.round(minRate * 100 * 10) / 10;
  const maxPercent = Math.round(maxRate * 100 * 10) / 10;
  const suggestedPercent = Math.round(suggestedRate * 100 * 10) / 10;
  const orangeEndPercent =
    Math.round((orangeZoneEnd || suggestedRate * 2) * 100 * 10) / 10;
  const valuePercent = value ? Math.round(value * 100 * 10) / 10 : null;

  // Calcul des positions des zones (en % de la barre)
  const greenWidth = maxRate > 0 ? (suggestedRate / maxRate) * 100 : 33.33;
  const orangeWidth = maxRate > 0 ? (suggestedRate / maxRate) * 100 : 33.33;

  // Couleur actuelle si valeur fournie
  const currentColor = value ? getMarginColor(value, marginResult) : null;

  if (!isProductSellable) {
    return (
      <div
        className={cn(
          'rounded-lg border border-red-200 bg-red-50 p-4',
          className
        )}
      >
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">Produit non vendable</span>
        </div>
        <p className="mt-1 text-sm text-red-500">
          Le prix public est trop proche du prix d&apos;achat pour permettre une
          marge.
        </p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Légende des zones */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <TrendingUp className="h-3 w-3 text-green-600" />
          <span>Compétitif</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 text-orange-500" />
          <span>Correct</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertCircle className="h-3 w-3 text-red-500" />
          <span>Proche public</span>
        </div>
      </div>

      {/* Barre de gradient avec zones */}
      <div className="relative">
        {/* Barre de fond avec gradient */}
        <div className="flex h-3 w-full overflow-hidden rounded-full">
          <div
            className="bg-green-500 transition-all"
            style={{ width: `${greenWidth}%` }}
          />
          <div
            className="bg-orange-500 transition-all"
            style={{ width: `${orangeWidth}%` }}
          />
          <div className="flex-1 bg-red-500 transition-all" />
        </div>

        {/* Marqueur de valeur actuelle (si fournie) */}
        {valuePercent !== null && maxRate > 0 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 transition-all"
            style={{ left: `${Math.min((value! / maxRate) * 100, 100)}%` }}
          >
            <div
              className={cn(
                'h-5 w-5 -ml-2.5 rounded-full border-2 border-white shadow-md',
                currentColor === 'green' && 'bg-green-600',
                currentColor === 'orange' && 'bg-orange-600',
                currentColor === 'red' && 'bg-red-600'
              )}
            />
          </div>
        )}

        {/* Marqueur jonction vert/orange (suggéré) */}
        {suggestedRate > 0 && maxRate > 0 && (
          <div
            className="absolute top-0 h-3 border-l-2 border-dashed border-green-800/50"
            style={{ left: `${(suggestedRate / maxRate) * 100}%` }}
            title={`Suggéré: ${suggestedPercent}%`}
          />
        )}

        {/* Marqueur jonction orange/rouge */}
        {orangeZoneEnd && orangeZoneEnd > 0 && maxRate > 0 && (
          <div
            className="absolute top-0 h-3 border-l-2 border-dashed border-orange-700/50"
            style={{ left: `${(orangeZoneEnd / maxRate) * 100}%` }}
            title={`Orange/Rouge: ${orangeEndPercent}%`}
          />
        )}
      </div>

      {/* Labels des zones avec pourcentages aux jonctions */}
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{minPercent}%</span>
        <span className="font-medium text-green-600">{suggestedPercent}%</span>
        <span className="font-medium text-orange-500">{orangeEndPercent}%</span>
        <span className="text-muted-foreground">{maxPercent}%</span>
      </div>

      {/* Légende pourcentages */}
      <div className="text-xs text-center text-muted-foreground">
        Vert: 0-{suggestedPercent}% | Orange: {suggestedPercent}-
        {orangeEndPercent}% | Rouge: {orangeEndPercent}-{maxPercent}%
      </div>

      {/* Affichage de la valeur actuelle */}
      {valuePercent !== null && (
        <div
          className={cn(
            'flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium',
            currentColor === 'green' && 'bg-green-50 text-green-700',
            currentColor === 'orange' && 'bg-orange-50 text-orange-700',
            currentColor === 'red' && 'bg-red-50 text-red-700'
          )}
        >
          {currentColor === 'green' && <TrendingUp className="h-4 w-4" />}
          {currentColor === 'orange' && <AlertTriangle className="h-4 w-4" />}
          {currentColor === 'red' && <AlertCircle className="h-4 w-4" />}
          <span>Marge actuelle: {valuePercent}%</span>
        </div>
      )}

      {/* Slider interactif (si pas readOnly) */}
      {!readOnly && onChange && (
        <input
          type="range"
          min={minPercent}
          max={maxPercent}
          step={0.1}
          value={valuePercent ?? suggestedPercent}
          onChange={e => onChange(parseFloat(e.target.value) / 100)}
          className="w-full cursor-pointer accent-purple-600"
        />
      )}
    </div>
  );
}

/**
 * Version compacte du MarginSlider pour les cartes catalogue
 * Affiche juste la barre de couleur sans les labels détaillés
 */
export function MarginSliderCompact({
  marginResult,
  className,
}: {
  marginResult: MarginCalculationResult;
  className?: string;
}) {
  const { maxRate, suggestedRate, isProductSellable } = marginResult;

  if (!isProductSellable) {
    return (
      <div
        className={cn('h-2 w-full rounded-full bg-red-200', className)}
        title="Produit non vendable"
      />
    );
  }

  const greenWidth = maxRate > 0 ? (suggestedRate / maxRate) * 100 : 33.33;
  const orangeWidth = greenWidth;

  return (
    <div
      className={cn('flex h-2 w-full overflow-hidden rounded-full', className)}
      title={`Max: ${Math.round(maxRate * 100)}% | Suggéré: ${Math.round(suggestedRate * 100)}%`}
    >
      <div className="bg-green-500" style={{ width: `${greenWidth}%` }} />
      <div className="bg-orange-500" style={{ width: `${orangeWidth}%` }} />
      <div className="flex-1 bg-red-500" />
    </div>
  );
}
