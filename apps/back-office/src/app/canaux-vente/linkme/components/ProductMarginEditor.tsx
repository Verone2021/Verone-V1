'use client';

/**
 * ProductMarginEditor - Éditeur de marge pour produit dans une sélection
 *
 * Affiche:
 * - Slider de marge avec zones couleur (vert/orange/rouge)
 * - Prix de base HT
 * - Prix de vente affilié HT (base + marge)
 * - Prix client LinkMe final (base + commission + marge)
 *
 * FORMULE (source: Calcul-marge-linkme.md):
 * P_vente_final = basePriceHT × (1 + commission + marge)
 *
 * @module ProductMarginEditor
 * @since 2025-12-04
 */

import { useMemo } from 'react';

import { ButtonV2 as Button } from '@verone/ui';
import { Trash2 } from 'lucide-react';

import { MarginSlider } from './MarginSlider';
import type { MarginCalculationResult } from '../types';
import { calculateFinalClientPrice } from '../types';

interface SelectedProduct {
  product_id: string;
  product_name: string;
  base_price_ht: number;
  margin_rate: number;
  min_margin_rate: number;
  max_margin_rate: number;
  suggested_margin_rate: number;
  linkme_commission_rate: number;
}

interface ProductMarginEditorProps {
  /** Produit sélectionné avec ses données de marge */
  product: SelectedProduct;
  /** Callback quand la marge change */
  onMarginChange: (productId: string, marginRate: number) => void;
  /** Callback pour supprimer le produit */
  onRemove: (productId: string) => void;
  /** Mode compact pour liste */
  compact?: boolean;
}

/**
 * Convertit les taux de marge du produit (en %) vers MarginCalculationResult (en décimal)
 */
function buildMarginResult(product: SelectedProduct): MarginCalculationResult {
  // Conversion % → décimal
  const minRate = (product.min_margin_rate || 1) / 100;
  const maxRate = (product.max_margin_rate || 50) / 100;
  const suggestedRate =
    (product.suggested_margin_rate || (maxRate / 3) * 100) / 100;

  return {
    minRate,
    maxRate,
    suggestedRate,
    isProductSellable: maxRate > minRate,
    greenZoneEnd: suggestedRate,
    orangeZoneEnd: suggestedRate * 2,
  };
}

export function ProductMarginEditor({
  product,
  onMarginChange,
  onRemove,
  compact = false,
}: ProductMarginEditorProps) {
  // Construire le marginResult à partir des données produit
  const marginResult = useMemo(() => buildMarginResult(product), [product]);

  // Valeur actuelle en décimal pour le slider
  const currentValueDecimal = product.margin_rate / 100;

  // Commission en décimal
  const commissionDecimal = product.linkme_commission_rate / 100;

  // Calcul des prix
  // Prix affilié = base × (1 + marge)
  const affiliatePrice = product.base_price_ht * (1 + currentValueDecimal);

  // Prix client LinkMe = base × (1 + commission + marge)
  const finalClientPrice = calculateFinalClientPrice(
    product.base_price_ht,
    commissionDecimal,
    currentValueDecimal
  );

  // Handler pour le changement de marge (slider retourne décimal, on stocke en %)
  const handleSliderChange = (decimalValue: number) => {
    const percentValue = Math.round(decimalValue * 100 * 10) / 10; // 1 décimale
    onMarginChange(product.product_id, percentValue);
  };

  if (compact) {
    return (
      <div className="flex items-center justify-between bg-white p-3 rounded-lg border gap-4">
        {/* Info produit */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{product.product_name}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <span>Base: {product.base_price_ht.toFixed(2)}€</span>
            <span>•</span>
            <span className="font-medium text-blue-600">
              Client: {finalClientPrice.toFixed(2)}€
            </span>
          </div>
        </div>

        {/* Slider compact */}
        <div className="w-48">
          <MarginSlider
            marginResult={marginResult}
            value={currentValueDecimal}
            onChange={handleSliderChange}
          />
        </div>

        {/* Supprimer */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(product.product_id)}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-4 space-y-4">
      {/* Header avec nom et bouton supprimer */}
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium text-gray-900">{product.product_name}</h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Commission LinkMe: {product.linkme_commission_rate}%
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(product.product_id)}
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Slider de marge */}
      <MarginSlider
        marginResult={marginResult}
        value={currentValueDecimal}
        onChange={handleSliderChange}
      />

      {/* Affichage des prix */}
      <div className="grid grid-cols-3 gap-3 text-center">
        {/* Prix de base */}
        <div className="bg-gray-50 rounded-lg p-2">
          <p className="text-xs text-muted-foreground">Prix base HT</p>
          <p className="text-sm font-semibold text-gray-900">
            {product.base_price_ht.toFixed(2)} €
          </p>
        </div>

        {/* Prix affilié */}
        <div className="bg-blue-50 rounded-lg p-2">
          <p className="text-xs text-blue-600">Prix affilié HT</p>
          <p className="text-sm font-semibold text-blue-700">
            {affiliatePrice.toFixed(2)} €
          </p>
          <p className="text-xs text-blue-500">+{product.margin_rate}%</p>
        </div>

        {/* Prix client final */}
        <div className="bg-green-50 rounded-lg p-2">
          <p className="text-xs text-green-600">Prix client LinkMe</p>
          <p className="text-sm font-bold text-green-700">
            {finalClientPrice.toFixed(2)} €
          </p>
          <p className="text-xs text-green-500">
            +{(product.margin_rate + product.linkme_commission_rate).toFixed(1)}
            %
          </p>
        </div>
      </div>

      {/* Indicateur de marge */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Min: {product.min_margin_rate}% | Max: {product.max_margin_rate}%
        </span>
        <span>Suggéré: {product.suggested_margin_rate}%</span>
      </div>
    </div>
  );
}
