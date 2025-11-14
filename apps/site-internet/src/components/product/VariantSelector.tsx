'use client';

import { useState } from 'react';

import { cn } from '@/lib/utils';
import type { SiteInternetProductDetail } from '@/types/cms';

/**
 * VariantSelector - Sélecteur variantes style WestWing
 *
 * Design :
 * - Un groupe = une ligne de sélection (ex: Couleur)
 * - Variantes en puces circulaires (si couleur) ou boutons (si taille)
 * - Stock + prix différentiel affichés
 * - Désactivé si stock = 0
 *
 * Props :
 * - variants : Groupes de variantes depuis RPC
 * - onSelectVariant : Callback quand variante sélectionnée
 */

interface VariantSelectorProps {
  variants: SiteInternetProductDetail['variants'];
  onSelectVariant?: (variantId: string, groupId: string) => void;
}

export function VariantSelector({
  variants,
  onSelectVariant,
}: VariantSelectorProps) {
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({});

  if (!variants || variants.length === 0) {
    return null;
  }

  const handleSelectVariant = (groupId: string, variantId: string) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [groupId]: variantId,
    }));
    onSelectVariant?.(variantId, groupId);
  };

  return (
    <div className="space-y-6">
      {variants.map((group) => {
        // Protection contre variants undefined
        if (!group.variants || group.variants.length === 0) return null;

        const activeVariants = group.variants
          .filter((v) => v.is_active)
          .sort((a, b) => a.display_order - b.display_order);

        if (activeVariants.length === 0) return null;

        const selectedVariantId = selectedVariants[group.variant_group_id];

        return (
          <div key={group.variant_group_id} className="space-y-3">
            {/* Label groupe */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-900">
                {group.group_name}
              </label>
              {selectedVariantId && (
                <span className="text-sm text-gray-600">
                  {
                    activeVariants.find((v) => v.id === selectedVariantId)
                      ?.option_value
                  }
                </span>
              )}
            </div>

            {/* Options variantes */}
            <div className="flex flex-wrap gap-2">
              {activeVariants.map((variant) => {
                const isSelected = selectedVariantId === variant.id;
                const isOutOfStock = variant.stock_quantity <= 0;
                const hasDifferentPrice =
                  variant.price_ht !== null && variant.price_ht > 0;

                // Style WestWing : puces circulaires pour couleurs, boutons pour autres
                const isColorGroup = group.group_type
                  .toLowerCase()
                  .includes('color');

                if (isColorGroup) {
                  // Variante couleur : puce circulaire
                  return (
                    <button
                      key={variant.id}
                      onClick={() =>
                        !isOutOfStock &&
                        handleSelectVariant(group.variant_group_id, variant.id)
                      }
                      disabled={isOutOfStock}
                      className={cn(
                        'relative w-12 h-12 rounded-full border-2 transition-all',
                        isSelected
                          ? 'border-black ring-2 ring-black ring-offset-2'
                          : 'border-gray-300 hover:border-gray-500',
                        isOutOfStock &&
                          'opacity-40 cursor-not-allowed hover:border-gray-300'
                      )}
                      title={`${variant.option_value}${
                        isOutOfStock ? ' (Rupture)' : ''
                      }${
                        hasDifferentPrice
                          ? ` (+${(variant.price_ht! * 1.2).toFixed(2)}€)`
                          : ''
                      }`}
                      aria-label={variant.option_value}
                    >
                      {/* Indicateur couleur (peut être amélioré avec vraie couleur hex) */}
                      <div
                        className="w-full h-full rounded-full"
                        style={{
                          background: `linear-gradient(135deg, ${getColorFromName(
                            variant.option_value
                          )}, ${getColorFromName(variant.option_value, true)})`,
                        }}
                      />
                      {isOutOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-0.5 bg-red-500 rotate-45" />
                        </div>
                      )}
                    </button>
                  );
                } else {
                  // Variante standard : bouton texte
                  return (
                    <button
                      key={variant.id}
                      onClick={() =>
                        !isOutOfStock &&
                        handleSelectVariant(group.variant_group_id, variant.id)
                      }
                      disabled={isOutOfStock}
                      className={cn(
                        'px-4 py-2 border-2 rounded-md text-sm font-medium transition-all',
                        isSelected
                          ? 'border-black bg-black text-white'
                          : 'border-gray-300 hover:border-gray-500 bg-white text-gray-900',
                        isOutOfStock &&
                          'opacity-40 cursor-not-allowed line-through hover:border-gray-300'
                      )}
                    >
                      {variant.option_value}
                      {hasDifferentPrice && !isOutOfStock && (
                        <span className="ml-2 text-xs opacity-75">
                          +{(variant.price_ht! * 1.2).toFixed(2)}€
                        </span>
                      )}
                    </button>
                  );
                }
              })}
            </div>

            {/* Stock warning si < 5 */}
            {selectedVariantId &&
              activeVariants.find((v) => v.id === selectedVariantId)
                ?.stock_quantity! < 5 &&
              activeVariants.find((v) => v.id === selectedVariantId)
                ?.stock_quantity! > 0 && (
                <p className="text-xs text-orange-600">
                  Plus que{' '}
                  {
                    activeVariants.find((v) => v.id === selectedVariantId)
                      ?.stock_quantity
                  }{' '}
                  en stock
                </p>
              )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Helper : Mapper nom couleur → code hex
 * À améliorer avec vraie table de mapping ou attribut metadata
 */
function getColorFromName(colorName: string, darken = false): string {
  const colors: Record<string, string> = {
    blanc: '#FFFFFF',
    noir: '#000000',
    gris: '#9CA3AF',
    beige: '#F5F5DC',
    bleu: '#3B82F6',
    vert: '#10B981',
    rouge: '#EF4444',
    rose: '#EC4899',
    jaune: '#FBBF24',
    orange: '#F97316',
    violet: '#8B5CF6',
    marron: '#92400E',
  };

  const normalized = colorName.toLowerCase().trim();
  const baseColor = Object.keys(colors).find((key) =>
    normalized.includes(key)
  );

  if (!baseColor) return darken ? '#6B7280' : '#9CA3AF'; // Fallback gray

  return darken ? adjustColorBrightness(colors[baseColor], -20) : colors[baseColor];
}

/**
 * Helper : Ajuster luminosité couleur hex
 */
function adjustColorBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;

  return `#${(
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  )
    .toString(16)
    .slice(1)
    .toUpperCase()}`;
}
