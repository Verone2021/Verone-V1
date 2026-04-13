'use client';

/**
 * ProductPricingSection
 * Section tarification canal — prix de vente, prix d'achat, marge, variantes
 */

import { useState } from 'react';

import { Badge, ButtonV2, Checkbox, Input, Label } from '@verone/ui';
import { createClient } from '@verone/utils/supabase/client';
import { Edit2, Save, X, TrendingUp, TrendingDown } from 'lucide-react';

import { useUpdatePricing } from '../../../hooks/use-update-pricing';
import type { SiteInternetProduct } from '../../../types';

interface ProductPricingSectionProps {
  product: SiteInternetProduct;
  channelId: string;
}

export default function ProductPricingSection({
  product,
  channelId,
}: ProductPricingSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [applyToVariants, setApplyToVariants] = useState(false);
  const [hasDiscount, setHasDiscount] = useState(
    product.price_source === 'channel_pricing' &&
      product.discount_rate != null &&
      product.discount_rate > 0
  );
  const [formData, setFormData] = useState({
    custom_price_ht: product.price_ht ?? 0,
    discount_rate: (product.discount_rate ?? 0) * 100,
  });

  const updatePricing = useUpdatePricing();

  // Calculs
  const costPrice = product.cost_price ?? 0;
  const sellingPriceHT = isEditing
    ? formData.custom_price_ht
    : product.price_ht;
  const priceTTC = sellingPriceHT * 1.2;
  const margin = sellingPriceHT - costPrice;
  const marginRate = sellingPriceHT > 0 ? (margin / sellingPriceHT) * 100 : 0;
  const markup = costPrice > 0 ? (margin / costPrice) * 100 : 0;

  // Discount
  const finalPriceHT = hasDiscount
    ? formData.custom_price_ht * (1 - formData.discount_rate / 100)
    : formData.custom_price_ht;
  const finalPriceTTC = finalPriceHT * 1.2;

  const handleSave = () => {
    void updatePricing
      .mutateAsync({
        product_id: product.product_id,
        channel_id: channelId,
        custom_price_ht: formData.custom_price_ht,
        discount_rate: hasDiscount ? formData.discount_rate / 100 : null,
      })
      .then(async () => {
        // Si checkbox variantes cochee, appliquer a toutes les variantes
        if (applyToVariants && product.variant_group_id) {
          const supabase = createClient();
          const { data: variants } = await supabase
            .from('products')
            .select('id')
            .eq('variant_group_id', product.variant_group_id)
            .neq('id', product.product_id);

          if (variants && variants.length > 0) {
            const rows = variants.map(v => ({
              product_id: v.id,
              channel_id: channelId,
              custom_price_ht: formData.custom_price_ht,
              discount_rate: hasDiscount ? formData.discount_rate / 100 : null,
              markup_rate: null,
              min_quantity: 1,
              is_active: true,
            }));
            await supabase.from('channel_pricing').upsert(rows, {
              onConflict: 'product_id,channel_id,min_quantity',
            });
          }
        }
        setIsEditing(false);
        setApplyToVariants(false);
      })
      .catch((err: unknown) => {
        console.error('[ProductPricing] Save failed:', err);
      });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setApplyToVariants(false);
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
            variant="default"
            size="sm"
            onClick={() => setIsEditing(true)}
          >
            <Edit2 className="h-4 w-4 mr-2" />
            Modifier le prix
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
              : 'Prix base herite'}
          </Badge>
        </div>

        {/* Prix d'achat (toujours visible, en orange) */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-orange-800">
              Prix d&apos;achat HT
            </span>
            <span className="text-lg font-bold text-orange-700">
              {costPrice.toFixed(2)} EUR
            </span>
          </div>
        </div>

        {/* Prix de vente HT */}
        <div>
          <Label htmlFor="custom_price_ht">Prix de vente HT (EUR)</Label>
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
              {product.price_ht.toFixed(2)} EUR
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            TTC: {priceTTC.toFixed(2)} EUR (TVA 20%)
          </p>
        </div>

        {/* Marge */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">Marge</span>
            <div className="flex items-center gap-1">
              {margin > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span
                className={`text-lg font-bold ${margin > 0 ? 'text-green-700' : 'text-red-700'}`}
              >
                {margin.toFixed(2)} EUR
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Taux de marge : {marginRate.toFixed(1)}%</span>
            <span>Coefficient : x{(markup / 100 + 1).toFixed(2)}</span>
          </div>
        </div>

        {/* Checkbox variantes */}
        {isEditing && product.has_variants && product.variants_count > 1 && (
          <div className="flex items-center space-x-2 pt-2 border-t border-gray-200">
            <Checkbox
              id="apply_variants"
              checked={applyToVariants}
              onCheckedChange={checked =>
                setApplyToVariants(checked as boolean)
              }
            />
            <Label
              htmlFor="apply_variants"
              className="text-sm font-medium cursor-pointer"
            >
              Appliquer ce prix a toutes les variantes ({product.variants_count}{' '}
              variantes)
            </Label>
          </div>
        )}

        {/* Checkbox reduction */}
        {isEditing && (
          <div className="flex items-center space-x-2 pt-2 border-t border-gray-200">
            <Checkbox
              id="has_discount"
              checked={hasDiscount}
              onCheckedChange={checked => {
                setHasDiscount(checked as boolean);
                if (!checked) {
                  setFormData({ ...formData, discount_rate: 0 });
                }
              }}
            />
            <Label
              htmlFor="has_discount"
              className="text-sm font-medium cursor-pointer"
            >
              Activer une reduction (prix barre affiche sur le site)
            </Label>
          </div>
        )}

        {/* Taux reduction */}
        {isEditing && hasDiscount && (
          <div>
            <Label htmlFor="discount_rate">Taux de reduction (%)</Label>
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
          </div>
        )}

        {/* Affichage reduction mode lecture */}
        {!isEditing &&
          hasDiscount &&
          product.discount_rate != null &&
          product.discount_rate > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-orange-900">
                  Reduction active
                </span>
                <Badge variant="destructive">
                  -{(product.discount_rate * 100).toFixed(0)}%
                </Badge>
              </div>
              <p className="text-xs text-orange-700 mt-1">
                Prix barre:{' '}
                <span className="line-through">
                  {product.price_ht.toFixed(2)} EUR
                </span>{' '}
                → Prix reduit:{' '}
                {(product.price_ht * (1 - product.discount_rate)).toFixed(2)}{' '}
                EUR HT
              </p>
            </div>
          )}

        {/* Prix TTC Final */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Prix TTC {hasDiscount ? 'reduit' : 'final'}
            </span>
            <span className="text-2xl font-bold text-blue-600">
              {isEditing
                ? finalPriceTTC.toFixed(2)
                : product.price_ttc.toFixed(2)}{' '}
              EUR
            </span>
          </div>
          {hasDiscount && isEditing && (
            <p className="text-xs text-gray-500 mt-1 text-right">
              Economie client: {(priceTTC - finalPriceTTC).toFixed(2)} EUR TTC
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
