'use client';

// =============================================================================
// Onglet Tarification — Prix HT, Réduction, Aperçu, Switch actif
// =============================================================================

import { useMemo } from 'react';

import { Badge } from '@verone/ui';
import { Input } from '@verone/ui';
import { Label } from '@verone/ui';
import { Switch } from '@verone/ui';

import type { TabSharedProps } from './types';

export function TabPricing({
  product,
  formData,
  setFormData,
  getError,
}: TabSharedProps) {
  const basePriceHT = formData.custom_price_ht ?? product.price_ht ?? 0;
  const hasDiscount = (formData.discount_rate ?? 0) > 0;
  const discountedPriceHT = basePriceHT * (1 - (formData.discount_rate ?? 0));
  const finalPriceTTC = useMemo(
    () => discountedPriceHT * 1.2,
    [discountedPriceHT]
  );

  return (
    <div className="space-y-6">
      {/* Prix et Promotion */}
      <div className="bg-white border rounded-lg p-4 space-y-4">
        {/* Badge Promo */}
        {(formData.discount_rate ?? 0) > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="bg-red-500">
              🏷️ PROMO -{Math.round((formData.discount_rate ?? 0) * 100)}%
            </Badge>
            <span className="text-sm text-gray-500">
              Affiché sur le site internet
            </span>
          </div>
        )}

        {/* Prix HT custom */}
        <div>
          <Label>Prix HT custom canal</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.custom_price_ht ?? ''}
            onChange={e =>
              setFormData({
                ...formData,
                custom_price_ht: parseFloat(e.target.value),
              })
            }
            placeholder="0.00"
          />
          {getError('custom_price_ht') && (
            <p className="text-sm text-red-600 mt-1">
              {getError('custom_price_ht')?.message}
            </p>
          )}
          <div className="text-sm text-gray-500 mt-1 flex items-center gap-2">
            <span>Source actuelle:</span>
            <Badge
              variant={
                product.price_source === 'channel_pricing'
                  ? 'default'
                  : 'outline'
              }
            >
              {product.price_source === 'channel_pricing'
                ? 'Prix canal'
                : 'Prix base'}
            </Badge>
          </div>
        </div>

        {/* Taux de réduction */}
        <div>
          <Label>Taux de réduction (%)</Label>
          <Input
            type="number"
            step="1"
            min="0"
            max="100"
            value={
              formData.discount_rate != null ? formData.discount_rate * 100 : ''
            }
            onChange={e => {
              const val =
                e.target.value === ''
                  ? undefined
                  : parseFloat(e.target.value) / 100;
              if (val === undefined || !isNaN(val)) {
                setFormData({
                  ...formData,
                  discount_rate: val,
                });
              }
            }}
            placeholder="0"
          />
          {getError('discount_rate') && (
            <p className="text-sm text-red-600 mt-1">
              {getError('discount_rate')?.message}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            Taux de réduction applicable (0-100%)
          </p>
        </div>

        {/* Aperçu Prix Final */}
        <div className="bg-gray-50 border rounded p-4">
          <div className="text-sm font-medium text-gray-700 mb-3">
            Aperçu prix site internet
          </div>
          {basePriceHT === 0 ? (
            <div className="text-sm text-gray-500 italic">
              Aucun prix défini pour ce produit
            </div>
          ) : (
            <div className="space-y-2">
              {hasDiscount ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      Prix original HT:
                    </span>
                    <span className="text-sm text-gray-500 line-through">
                      {basePriceHT.toFixed(2)} €
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Prix réduit HT:</span>
                    <span className="text-xl font-bold text-red-600">
                      {discountedPriceHT.toFixed(2)} €
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Prix TTC final:</span>
                    <span className="text-lg font-semibold text-red-600">
                      {finalPriceTTC.toFixed(2)} €
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Prix HT:</span>
                    <span className="text-xl font-bold">
                      {basePriceHT.toFixed(2)} €
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Prix TTC:</span>
                    <span className="text-lg font-semibold">
                      {finalPriceTTC.toFixed(2)} €
                    </span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Active */}
      <div className="flex items-center justify-between">
        <div>
          <Label>Tarification active</Label>
          <p className="text-sm text-gray-500">Appliquer ce prix sur le site</p>
        </div>
        <Switch
          checked={formData.is_active}
          onCheckedChange={checked =>
            setFormData({ ...formData, is_active: checked })
          }
        />
      </div>
    </div>
  );
}
