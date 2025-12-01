'use client';

import { useState, useEffect } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Button,
  Badge,
} from '@verone/ui';
import { Euro, Percent, TrendingUp, Save, Loader2 } from 'lucide-react';

import type { LinkMeProductDetail, LinkMePricingUpdate } from '../types';
import { calculateMargin, isMarginValid } from '../types';

interface ProductPricingCardProps {
  product: LinkMeProductDetail;
  onSave: (data: LinkMePricingUpdate) => Promise<void>;
  isSaving?: boolean;
}

export function ProductPricingCard({
  product,
  onSave,
  isSaving = false,
}: ProductPricingCardProps) {
  const [formData, setFormData] = useState<LinkMePricingUpdate>({
    custom_price_ht: product.custom_price_ht,
    min_margin_rate: product.min_margin_rate,
    max_margin_rate: product.max_margin_rate,
    suggested_margin_rate: product.suggested_margin_rate,
    channel_commission_rate: product.channel_commission_rate,
  });

  const [isDirty, setIsDirty] = useState(false);

  // Calcul de la marge actuelle
  const currentMargin = calculateMargin(
    product.cost_price,
    formData.custom_price_ht ?? null
  );

  const marginIsValid =
    currentMargin !== null &&
    isMarginValid(
      currentMargin,
      formData.min_margin_rate ?? 0,
      formData.max_margin_rate ?? 100
    );

  // Reset form when product changes
  useEffect(() => {
    setFormData({
      custom_price_ht: product.custom_price_ht,
      min_margin_rate: product.min_margin_rate,
      max_margin_rate: product.max_margin_rate,
      suggested_margin_rate: product.suggested_margin_rate,
      channel_commission_rate: product.channel_commission_rate,
    });
    setIsDirty(false);
  }, [product]);

  const handleChange = (field: keyof LinkMePricingUpdate, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    setFormData(prev => ({ ...prev, [field]: numValue }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    await onSave(formData);
    setIsDirty(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Euro className="h-5 w-5" />
          Pricing & Marges
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Prix coûtant (READ-ONLY) */}
        <div className="space-y-2">
          <Label className="text-muted-foreground">Prix coûtant (HT)</Label>
          <div className="flex items-center gap-2">
            <Input
              value={product.cost_price.toFixed(2)}
              disabled
              className="bg-muted font-mono"
            />
            <Badge variant="secondary">READ-ONLY</Badge>
          </div>
        </div>

        {/* Prix de vente (EDITABLE) */}
        <div className="space-y-2">
          <Label htmlFor="selling-price">Prix de vente (HT)</Label>
          <div className="relative">
            <Input
              id="selling-price"
              type="number"
              step="0.01"
              min="0"
              value={formData.custom_price_ht ?? ''}
              onChange={e => handleChange('custom_price_ht', e.target.value)}
              placeholder="Définir un prix..."
              className="pr-8 font-mono"
            />
            <Euro className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Marge calculée */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Marge calculée</span>
            </div>
            {currentMargin !== null ? (
              <Badge variant={marginIsValid ? 'default' : 'destructive'}>
                {currentMargin.toFixed(1)}%
              </Badge>
            ) : (
              <Badge variant="outline">Non définie</Badge>
            )}
          </div>
          {currentMargin !== null && !marginIsValid && (
            <p className="text-xs text-destructive mt-2">
              La marge doit être entre {formData.min_margin_rate}% et{' '}
              {formData.max_margin_rate}%
            </p>
          )}
        </div>

        {/* Limites de marge */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="min-margin" className="text-xs">
              Marge min (%)
            </Label>
            <Input
              id="min-margin"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={formData.min_margin_rate ?? ''}
              onChange={e => handleChange('min_margin_rate', e.target.value)}
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="suggested-margin" className="text-xs">
              Marge suggérée (%)
            </Label>
            <Input
              id="suggested-margin"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={formData.suggested_margin_rate ?? ''}
              onChange={e =>
                handleChange('suggested_margin_rate', e.target.value)
              }
              className="font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max-margin" className="text-xs">
              Marge max (%)
            </Label>
            <Input
              id="max-margin"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={formData.max_margin_rate ?? ''}
              onChange={e => handleChange('max_margin_rate', e.target.value)}
              className="font-mono"
            />
          </div>
        </div>

        {/* Commission Vérone */}
        <div className="space-y-2">
          <Label htmlFor="commission" className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Commission Vérone
          </Label>
          <Input
            id="commission"
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={formData.channel_commission_rate ?? ''}
            onChange={e =>
              handleChange('channel_commission_rate', e.target.value)
            }
            placeholder="Commission par défaut du canal"
            className="font-mono"
          />
        </div>

        {/* Bouton sauvegarde */}
        <Button
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Enregistrer les modifications
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
