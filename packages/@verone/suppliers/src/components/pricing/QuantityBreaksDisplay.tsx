'use client';

import { memo } from 'react';

import { Package, TrendingDown, Info } from 'lucide-react';

import { Badge } from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@verone/ui';
import { cn } from '@verone/utils';
import { formatPrice } from '@verone/finance/hooks';

interface QuantityBreak {
  min_quantity: number;
  max_quantity: number | null;
  price_ht: number;
  discount_rate: number | null;
  price_list_name: string;
  savings_amount: number;
  savings_percent: number;
}

interface QuantityBreaksDisplayProps {
  breaks: QuantityBreak[];
  currentQuantity?: number;
  className?: string;
  variant?: 'compact' | 'detailed';
}

/**
 * Composant QuantityBreaksDisplay - Affichage paliers quantités avec économies
 *
 * Affiche les différents paliers de prix selon les quantités commandées.
 * Calcule et affiche les économies potentielles par palier.
 *
 * @param breaks - Array de paliers quantités (de get_quantity_breaks())
 * @param currentQuantity - Quantité actuellement sélectionnée (pour highlighting)
 * @param className - Classes CSS additionnelles
 * @param variant - Mode affichage: compact (badge) ou detailed (tableau)
 */
export const QuantityBreaksDisplay = memo(function QuantityBreaksDisplay({
  breaks,
  currentQuantity = 1,
  className,
  variant = 'compact',
}: QuantityBreaksDisplayProps) {
  if (!breaks || breaks.length === 0) {
    return null;
  }

  // Trier paliers par min_quantity croissant
  const sortedBreaks = [...breaks].sort(
    (a, b) => a.min_quantity - b.min_quantity
  );

  // Trouver le palier actif selon currentQuantity
  const activeBreak = sortedBreaks.find(
    b =>
      b.min_quantity <= currentQuantity &&
      (b.max_quantity === null || b.max_quantity >= currentQuantity)
  );

  // Trouver le meilleur palier (plus grosse économie)
  const bestBreak = sortedBreaks.reduce((best, current) =>
    current.savings_percent > best.savings_percent ? current : best
  );

  if (variant === 'compact') {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <ButtonV2
            variant="secondary"
            size="sm"
            className={cn(
              'h-6 text-[10px] px-2 gap-1 border-blue-200 text-blue-700 hover:bg-blue-50',
              className
            )}
          >
            <Package className="h-3 w-3" />
            <span>{sortedBreaks.length} paliers dispo</span>
            {bestBreak.savings_percent > 0 && (
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 border-green-200 text-[9px] px-1 py-0 ml-1"
              >
                Jusqu'à -{bestBreak.savings_percent.toFixed(0)}%
              </Badge>
            )}
          </ButtonV2>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-gray-600" />
              <h4 className="font-semibold text-sm text-black">
                Paliers de prix
              </h4>
            </div>
            <p className="text-xs text-gray-600 mt-0.5">
              Économisez en commandant en plus grande quantité
            </p>
          </div>

          <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
            {sortedBreaks.map((breakItem, index) => {
              const isActive = breakItem === activeBreak;
              const isBest = breakItem === bestBreak;

              return (
                <div
                  key={index}
                  className={cn(
                    'rounded-md p-2 border transition-all',
                    isActive
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    {/* Quantité */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                        <span className="text-xs font-medium text-black">
                          {breakItem.min_quantity === breakItem.max_quantity
                            ? `${breakItem.min_quantity} unité${breakItem.min_quantity > 1 ? 's' : ''}`
                            : breakItem.max_quantity === null
                              ? `${breakItem.min_quantity}+ unités`
                              : `${breakItem.min_quantity}-${breakItem.max_quantity} unités`}
                        </span>
                        {isActive && (
                          <Badge
                            variant="outline"
                            className="bg-blue-100 text-blue-800 border-blue-200 text-[8px] px-1 py-0"
                          >
                            actuel
                          </Badge>
                        )}
                        {isBest && breakItem.savings_percent > 0 && (
                          <Badge
                            variant="outline"
                            className="bg-green-100 text-green-800 border-green-200 text-[8px] px-1 py-0"
                          >
                            meilleur prix
                          </Badge>
                        )}
                      </div>

                      {/* Liste de prix source */}
                      <div className="text-[10px] text-gray-500 mt-0.5 truncate">
                        {breakItem.price_list_name}
                      </div>
                    </div>

                    {/* Prix et économies */}
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-semibold text-black">
                        {formatPrice(breakItem.price_ht)}
                      </div>
                      {breakItem.savings_percent > 0 && (
                        <div className="flex items-center gap-1 justify-end mt-0.5">
                          <TrendingDown className="h-3 w-3 text-green-600" />
                          <span className="text-[10px] text-green-700 font-medium">
                            -{breakItem.savings_percent.toFixed(0)}%
                          </span>
                        </div>
                      )}
                      {breakItem.savings_amount > 0 && (
                        <div className="text-[9px] text-gray-500 mt-0.5">
                          Économie: {formatPrice(breakItem.savings_amount)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer avec résumé */}
          <div className="border-t border-gray-200 bg-gray-50 px-4 py-2">
            <div className="text-[10px] text-gray-600">
              💡 <strong>Astuce:</strong> Commandez {bestBreak.min_quantity}+
              unités pour bénéficier du meilleur prix
              {bestBreak.savings_percent > 0 &&
                ` (-${bestBreak.savings_percent.toFixed(0)}%)`}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  // Variant "detailed" - Affichage tableau complet
  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 text-gray-600" />
        <h4 className="font-semibold text-sm text-black">
          Paliers de prix disponibles
        </h4>
      </div>

      <div className="border border-gray-200 rounded-md overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-700">
                Quantité
              </th>
              <th className="px-3 py-2 text-right font-medium text-gray-700">
                Prix unitaire
              </th>
              <th className="px-3 py-2 text-right font-medium text-gray-700">
                Économie
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedBreaks.map((breakItem, index) => {
              const isActive = breakItem === activeBreak;
              const isBest = breakItem === bestBreak;

              return (
                <tr
                  key={index}
                  className={cn(
                    'transition-colors',
                    isActive ? 'bg-blue-50' : 'hover:bg-gray-50'
                  )}
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      <Package className="h-3 w-3 text-gray-500" />
                      <span className="font-medium">
                        {breakItem.min_quantity === breakItem.max_quantity
                          ? `${breakItem.min_quantity}`
                          : breakItem.max_quantity === null
                            ? `${breakItem.min_quantity}+`
                            : `${breakItem.min_quantity}-${breakItem.max_quantity}`}
                      </span>
                      {isActive && (
                        <Badge
                          variant="outline"
                          className="bg-blue-100 text-blue-800 text-[8px] px-1 py-0"
                        >
                          actuel
                        </Badge>
                      )}
                      {isBest && (
                        <Badge
                          variant="outline"
                          className="bg-green-100 text-green-800 text-[8px] px-1 py-0"
                        >
                          meilleur
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {formatPrice(breakItem.price_ht)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {breakItem.savings_percent > 0 ? (
                      <div className="flex flex-col items-end">
                        <span className="text-green-700 font-medium">
                          -{breakItem.savings_percent.toFixed(0)}%
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {formatPrice(breakItem.savings_amount)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Résumé */}
      <div className="bg-green-50 border border-green-200 rounded-md p-2">
        <div className="flex items-start gap-2">
          <TrendingDown className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-green-900">
              Meilleur prix: {formatPrice(bestBreak.price_ht)} /unité
            </div>
            <div className="text-[10px] text-green-700 mt-0.5">
              En commandant {bestBreak.min_quantity}+ unités, vous économisez{' '}
              {formatPrice(bestBreak.savings_amount)} par rapport au prix de
              base
              {bestBreak.savings_percent > 0 &&
                ` (-${bestBreak.savings_percent.toFixed(0)}%)`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
