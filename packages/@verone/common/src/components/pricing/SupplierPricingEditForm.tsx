'use client';

import { ButtonV2 } from '@verone/ui';
import { cn, formatPrice } from '@verone/utils';
import { DollarSign, Save, X, AlertCircle } from 'lucide-react';

import type { PricingEditData, VariantGroup } from './supplier-pricing-types';

interface SupplierPricingEditFormProps {
  editData: PricingEditData | null;
  isCostPriceManagedByGroup: boolean;
  isEcoTaxManagedByGroup: boolean;
  isSaving: boolean;
  hasChanges: boolean;
  onPriceChange: (field: string, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  editSellingPrice: number;
  editMarginAmount: number;
  error: string | null;
  variantGroup?: VariantGroup | null;
  className?: string;
}

export function SupplierPricingEditForm({
  editData,
  isCostPriceManagedByGroup,
  isEcoTaxManagedByGroup,
  isSaving,
  hasChanges,
  onPriceChange,
  onSave,
  onCancel,
  editSellingPrice,
  editMarginAmount,
  error,
  className,
}: SupplierPricingEditFormProps) {
  return (
    <div className={cn('card-verone p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium text-black flex items-center">
          <DollarSign className="h-5 w-5 mr-2" />
          Tarification Fournisseur vs Vérone
        </h3>
        <div className="flex space-x-1">
          <ButtonV2
            variant="outline"
            size="xs"
            onClick={onCancel}
            disabled={isSaving}
            className="text-xs px-2 py-1"
          >
            <X className="h-3 w-3 mr-1" />
            Annuler
          </ButtonV2>
          <ButtonV2
            variant="secondary"
            size="xs"
            onClick={onSave}
            disabled={!hasChanges || isSaving}
            className="text-xs px-2 py-1"
          >
            <Save className="h-3 w-3 mr-1" />
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </ButtonV2>
        </div>
      </div>

      <div className="space-y-4">
        {/* PRIX D'ACHAT */}
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <h4 className="text-sm font-medium text-red-800 mb-3">
            📦 PRIX D'ACHAT FOURNISSEUR
          </h4>
          <div>
            <label className="block text-sm font-medium text-red-700 mb-1">
              Prix d'achat HT (en euros) *
            </label>
            <input
              type="number"
              value={editData?.cost_price ?? ''}
              onChange={e => onPriceChange('cost_price', e.target.value)}
              className={cn(
                'w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500',
                isCostPriceManagedByGroup && 'bg-gray-100 cursor-not-allowed'
              )}
              step="0.01"
              min="0"
              placeholder="Prix d'achat chez le fournisseur"
              disabled={isCostPriceManagedByGroup}
              required={!isCostPriceManagedByGroup}
            />
            {editData?.cost_price && (
              <div className="text-xs text-red-600 mt-1">
                💰 Coût: {formatPrice(editData.cost_price)}
              </div>
            )}
          </div>
        </div>

        {/* TAXE ÉCO-RESPONSABLE */}
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <h4 className="text-sm font-medium text-orange-800 mb-3">
            🌿 TAXE ÉCO-RESPONSABLE (facultatif)
          </h4>
          <div>
            <label className="block text-sm font-medium text-orange-700 mb-1">
              Éco-participation (en euros)
            </label>
            <input
              type="number"
              value={editData?.eco_tax_default ?? ''}
              onChange={e => onPriceChange('eco_tax_default', e.target.value)}
              className={cn(
                'w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500',
                isEcoTaxManagedByGroup && 'bg-gray-100 cursor-not-allowed'
              )}
              step="0.01"
              min="0"
              placeholder="Montant éco-taxe (ex: 2.50)"
              disabled={isEcoTaxManagedByGroup}
            />
            {isEcoTaxManagedByGroup ? (
              <div className="text-xs text-orange-700 mt-1">
                🔒 Éco-taxe liée au prix d'achat commun du groupe de variantes
              </div>
            ) : (
              <div className="text-xs text-orange-600 mt-1">
                💡 S'additionne au prix d'achat fournisseur
              </div>
            )}
            {editData?.eco_tax_default != null &&
              editData.eco_tax_default > 0 && (
                <div className="text-xs text-orange-600 mt-1">
                  🌿 Éco-taxe: {formatPrice(editData.eco_tax_default)}
                </div>
              )}
          </div>
        </div>

        {/* TAUX DE MARGE */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="text-sm font-medium text-blue-800 mb-3">
            📈 TAUX DE MARGE
          </h4>
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-1">
              Taux de marge (%)
            </label>
            <input
              type="number"
              value={editData?.margin_percentage ?? ''}
              onChange={e => onPriceChange('margin_percentage', e.target.value)}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              step="1"
              min="0"
              max="500"
              placeholder="Taux de marge en %"
            />
            <div className="text-xs text-blue-600 mt-1">
              Exemple: 25% = prix de vente 25% supérieur au prix d'achat
            </div>
          </div>
        </div>

        {/* PRIX DE VENTE CALCULÉ */}
        {editData?.cost_price && editData?.margin_percentage && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="text-sm font-medium text-green-800 mb-3">
              💰 PRIX MINIMUM DE VENTE (calculé)
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-green-700 font-medium">Prix HT:</span>
                <span className="text-xl font-bold text-green-800">
                  {formatPrice(editSellingPrice)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-green-700">Marge brute:</span>
                <span className="font-semibold text-green-700">
                  {formatPrice(editMarginAmount)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Alertes */}
        {editData?.margin_percentage != null &&
          editData.margin_percentage < 5 && (
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <div className="flex items-center text-black text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                ⚠️ Marge très faible (moins de 5%)
              </div>
            </div>
          )}
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="mt-3 text-sm text-red-600 bg-red-50 p-2 rounded">
          ❌ {error}
        </div>
      )}
    </div>
  );
}
