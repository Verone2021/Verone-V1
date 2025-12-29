/**
 * Composant PricingGridReadOnly
 * Affiche la grille tarifaire stockage en lecture seule
 * Met en évidence la tranche correspondant au volume actuel
 *
 * @module PricingGridReadOnly
 * @since 2025-12-22
 */

import { Euro, Loader2, Check } from 'lucide-react';

import type { StoragePricingTier } from '../../lib/hooks/use-affiliate-storage';

export interface PricingGridReadOnlyProps {
  tiers: StoragePricingTier[];
  currentVolume?: number;
  isLoading?: boolean;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(price);
}

function isCurrentTier(
  tier: StoragePricingTier,
  currentVolume: number | undefined
): boolean {
  if (currentVolume === undefined || currentVolume === 0) return false;
  return (
    tier.min_volume_m3 <= currentVolume &&
    (tier.max_volume_m3 === null || tier.max_volume_m3 >= currentVolume)
  );
}

export function PricingGridReadOnly({
  tiers,
  currentVolume,
  isLoading = false,
}: PricingGridReadOnlyProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (!tiers || tiers.length === 0) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Euro className="h-5 w-5 text-gray-600" />
          <h3 className="text-base font-semibold text-gray-900">
            Grille tarifaire
          </h3>
        </div>
        <p className="text-sm text-gray-500 text-center py-4">
          Aucune grille tarifaire disponible
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-center gap-2 mb-4">
        <Euro className="h-5 w-5 text-gray-600" />
        <h3 className="text-base font-semibold text-gray-900">
          Grille tarifaire stockage
        </h3>
      </div>

      <div className="space-y-2">
        {tiers.map(tier => {
          const isCurrent = isCurrentTier(tier, currentVolume);

          return (
            <div
              key={tier.id}
              className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                isCurrent
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-gray-50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                {isCurrent && (
                  <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                )}
                <div>
                  <p
                    className={`text-sm font-medium ${isCurrent ? 'text-blue-900' : 'text-gray-700'}`}
                  >
                    {tier.label ??
                      `${tier.min_volume_m3} à ${tier.max_volume_m3 ?? '∞'} m³`}
                  </p>
                  {isCurrent && (
                    <p className="text-xs text-blue-600">Votre tranche</p>
                  )}
                </div>
              </div>
              <p
                className={`text-sm font-bold ${isCurrent ? 'text-blue-700' : 'text-gray-900'}`}
              >
                {formatPrice(tier.price_per_m3)}/m³
              </p>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 mt-3 text-center">
        Tarification mensuelle basee sur le volume total stocke
      </p>
    </div>
  );
}
