'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Button,
  Badge,
  Progress,
} from '@verone/ui';
import { cn } from '@verone/utils';
import {
  Euro,
  Percent,
  Save,
  Loader2,
  Check,
  AlertCircle,
  Shield,
} from 'lucide-react';

import type { LinkMeProductDetail, LinkMePricingUpdate } from '../types';

import { PricingMarginSection } from './PricingMarginSection';
import { PricingPublicPriceSection } from './PricingPublicPriceSection';
import { PricingSellingPriceSection } from './PricingSellingPriceSection';
import { useProductPricing } from './use-product-pricing';

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
  const {
    formData,
    isDirty,
    publicPriceTtc,
    marginResult,
    completeness,
    isAffiliateProduct,
    customerPriceHT,
    bufferDisplayValue,
    formattedMinPrice,
    handleChange,
    handlePublicPriceTtcChange,
    handlePublicPriceHtChange,
    handleBufferChange,
    handleSave,
    handleCopyMinPrice,
  } = useProductPricing(product, onSave);

  const isPublicPriceValid =
    formData.public_price_ht !== null &&
    formData.public_price_ht !== undefined &&
    formData.public_price_ht > 0;
  const isPriceValid =
    formData.custom_price_ht !== null &&
    formData.custom_price_ht !== undefined &&
    formData.custom_price_ht > 0;
  const isMinMarginValid =
    formData.min_margin_rate !== null && formData.min_margin_rate !== undefined;
  const isMaxMarginValid =
    formData.max_margin_rate !== null && formData.max_margin_rate !== undefined;
  const isSuggestedMarginValid =
    formData.suggested_margin_rate !== null &&
    formData.suggested_margin_rate !== undefined;
  const isCommissionValid =
    formData.channel_commission_rate !== null &&
    formData.channel_commission_rate !== undefined;
  const isBufferValid =
    formData.buffer_rate !== null &&
    formData.buffer_rate !== undefined &&
    formData.buffer_rate >= 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5" />
            Pricing & Marges
          </CardTitle>
          <Badge
            variant={completeness.percentage === 100 ? 'success' : 'secondary'}
            className="text-sm"
          >
            {completeness.percentage}% complet
          </Badge>
        </div>
        <Progress value={completeness.percentage} className="h-2 mt-2" />
        <p className="text-xs text-muted-foreground mt-1">
          {completeness.completedCount}/{completeness.totalCount} champs validés
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <PricingPublicPriceSection
          publicPriceTtc={publicPriceTtc}
          publicPriceHt={formData.public_price_ht}
          isPublicPriceValid={isPublicPriceValid}
          onTtcChange={handlePublicPriceTtcChange}
          onHtChange={handlePublicPriceHtChange}
        />

        <PricingSellingPriceSection
          customPriceHt={formData.custom_price_ht}
          channelCommissionRate={formData.channel_commission_rate}
          isPriceValid={isPriceValid}
          formattedMinPrice={formattedMinPrice}
          customerPriceHT={customerPriceHT}
          isAffiliateProduct={isAffiliateProduct}
          onSellingPriceChange={v => handleChange('custom_price_ht', v)}
          onCopyMinPrice={handleCopyMinPrice}
        />

        {/* Prix d'achat (READ-ONLY - confidentiel) */}
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs">
            Prix d&apos;achat HT (confidentiel)
          </Label>
          <div className="flex items-center gap-2">
            <Input
              value={product.cost_price?.toFixed(2) ?? '0.00'}
              disabled
              className="bg-muted font-mono text-sm"
            />
            <span className="text-muted-foreground text-sm">€</span>
            <Badge variant="secondary" className="text-xs">
              Confidentiel
            </Badge>
          </div>
        </div>

        <PricingMarginSection
          minMarginRate={formData.min_margin_rate}
          maxMarginRate={formData.max_margin_rate}
          suggestedMarginRate={formData.suggested_margin_rate}
          isMinMarginValid={isMinMarginValid}
          isMaxMarginValid={isMaxMarginValid}
          isSuggestedMarginValid={isSuggestedMarginValid}
          marginResult={marginResult}
        />

        {/* Commission LinkMe */}
        <div className="space-y-2">
          <Label htmlFor="commission" className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Commission LinkMe
            {isCommissionValid ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
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
            className={cn(
              'font-mono',
              !isCommissionValid && 'border-amber-300 focus:border-amber-500'
            )}
          />
          {!isCommissionValid && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Non validé - Saisissez une commission
            </p>
          )}
        </div>

        {/* Marge de sécurité (Buffer Rate) */}
        <div className="space-y-2">
          <Label htmlFor="buffer-rate" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Marge de sécurité
            {isBufferValid ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="buffer-rate"
              type="number"
              step="0.5"
              min="0"
              max="20"
              value={bufferDisplayValue}
              onChange={e => handleBufferChange(e.target.value)}
              placeholder="5"
              className={cn(
                'font-mono',
                !isBufferValid && 'border-amber-300 focus:border-amber-500'
              )}
            />
            <span className="text-muted-foreground">%</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Marge de sécurité sous le prix public (défaut: 5%). Augmentez pour
            plus de protection, diminuez pour plus de marge disponible.
          </p>
        </div>

        <Button
          onClick={() => {
            void handleSave().catch(error => {
              console.error('[ProductPricingCard] handleSave failed:', error);
            });
          }}
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
