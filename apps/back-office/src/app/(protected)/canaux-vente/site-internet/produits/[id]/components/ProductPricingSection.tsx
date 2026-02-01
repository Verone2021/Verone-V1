'use client';

/**
 * Composant: ProductPricingSection (CORRIGÉ)
 * Section tarification canal du produit (éditable inline)
 * UI conforme besoins: Prix HT + Checkbox Réduction optionnelle
 */

import { useState } from 'react';

import { Badge, ButtonV2, Input, Label, Checkbox } from '@verone/ui';
import { Edit2, Save, X } from 'lucide-react';

import { useUpdatePricing } from '../../../hooks/use-update-pricing';
import type { SiteInternetProduct } from '../../../types';

interface ProductPricingSectionProps {
  product: SiteInternetProduct;
  channelId: string; // ✅ Passé depuis page parent
}

export default function ProductPricingSection({
  product,
  channelId,
}: ProductPricingSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [hasDiscount, setHasDiscount] = useState(
    product.price_source === 'channel_pricing' &&
      product.discount_rate != null &&
      product.discount_rate > 0
  );
  const [formData, setFormData] = useState({
    custom_price_ht: product.price_ht ?? 0,
    discount_rate: (product.discount_rate ?? 0) * 100, // Convertir 0.30 → 30
  });

  const updatePricing = useUpdatePricing();

  // Calculs prix affichage
  const priceTTC = formData.custom_price_ht * 1.2;
  const finalPriceHT = hasDiscount
    ? formData.custom_price_ht * (1 - formData.discount_rate / 100)
    : formData.custom_price_ht;
  const finalPriceTTC = finalPriceHT * 1.2;

  const handleSave = () => {
    updatePricing.mutate(
      {
        product_id: product.product_id,
        channel_id: channelId,
        custom_price_ht: formData.custom_price_ht,
        discount_rate: hasDiscount ? formData.discount_rate / 100 : null, // ✅ Conditionnel
      },
      {
        onSuccess: () => setIsEditing(false),
      }
    );
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset aux valeurs initiales
    setFormData({
      custom_price_ht: product.price_ht ?? 0,
      discount_rate: (product.discount_rate ?? 0) * 100,
    });
    setHasDiscount(
      product.price_source === 'channel_pricing' &&
        product.discount_rate != null &&
        product.discount_rate > 0
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Tarification Canal
        </h2>
        {!isEditing ? (
          <ButtonV2
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Modifier
          </ButtonV2>
        ) : (
          <div className="flex items-center gap-2">
            <ButtonV2 variant="outline" size="sm" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              Annuler
            </ButtonV2>
            <ButtonV2
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={updatePricing.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {updatePricing.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </ButtonV2>
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="space-y-4">
        {/* Source prix */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Source</span>
          <Badge
            variant={
              product.price_source === 'channel_pricing' ? 'default' : 'outline'
            }
          >
            {product.price_source === 'channel_pricing'
              ? 'Prix canal custom'
              : 'Prix base hérité'}
          </Badge>
        </div>

        {/* Prix HT de base */}
        <div>
          <Label htmlFor="custom_price_ht">Prix HT de base (€)</Label>
          {isEditing ? (
            <Input
              id="custom_price_ht"
              type="number"
              step="0.01"
              min="0"
              value={formData.custom_price_ht}
              onChange={e =>
                setFormData({
                  ...formData,
                  custom_price_ht: parseFloat(e.target.value) || 0,
                })
              }
              className="mt-1"
            />
          ) : (
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {product.price_ht.toFixed(2)} €
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            TTC: {priceTTC.toFixed(2)} € (TVA 20%)
          </p>
        </div>

        {/* ✅ NOUVEAUTÉ: Checkbox Activer Réduction */}
        {isEditing && (
          <div className="flex items-center space-x-2 pt-2 border-t border-gray-200">
            <Checkbox
              id="has_discount"
              checked={hasDiscount}
              onCheckedChange={checked => {
                setHasDiscount(checked as boolean);
                if (!checked) {
                  // Réinitialiser taux si décoché
                  setFormData({ ...formData, discount_rate: 0 });
                }
              }}
            />
            <Label
              htmlFor="has_discount"
              className="text-sm font-medium cursor-pointer"
            >
              Activer une réduction (prix barré affiché sur le site)
            </Label>
          </div>
        )}

        {/* Taux Réduction (conditionnel - seulement si checkbox cochée) */}
        {isEditing && hasDiscount && (
          <div>
            <Label htmlFor="discount_rate">Taux de réduction (%)</Label>
            <Input
              id="discount_rate"
              type="number"
              step="1"
              min="0"
              max="100"
              value={formData.discount_rate}
              onChange={e =>
                setFormData({
                  ...formData,
                  discount_rate: parseFloat(e.target.value) || 0,
                })
              }
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              Réduction appliquée: -{formData.discount_rate}% (max 100%)
            </p>
          </div>
        )}

        {/* Affichage réduction si active (mode lecture) */}
        {!isEditing &&
          hasDiscount &&
          product.discount_rate &&
          product.discount_rate > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-orange-900">
                  Réduction active
                </span>
                <Badge variant="destructive">
                  -{(product.discount_rate * 100).toFixed(0)}%
                </Badge>
              </div>
              <div className="mt-2">
                <p className="text-xs text-orange-700">
                  Prix barré affiché:{' '}
                  <span className="line-through">
                    {product.price_ht.toFixed(2)} €
                  </span>
                </p>
                <p className="text-sm font-semibold text-orange-900 mt-1">
                  Prix réduit:{' '}
                  {(product.price_ht * (1 - product.discount_rate)).toFixed(2)}{' '}
                  € HT
                </p>
              </div>
            </div>
          )}

        {/* Prix TTC Final (calculé) */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Prix TTC {hasDiscount ? 'réduit' : 'final'}
            </span>
            <span className="text-2xl font-bold text-blue-600">
              {isEditing
                ? finalPriceTTC.toFixed(2)
                : product.price_ttc.toFixed(2)}{' '}
              €
            </span>
          </div>
          {hasDiscount && isEditing && (
            <p className="text-xs text-gray-500 mt-1 text-right">
              Économie client: {(priceTTC - finalPriceTTC).toFixed(2)} € TTC
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
