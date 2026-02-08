'use client';

import { useState, useEffect, useMemo } from 'react';

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
  Tag,
  Copy,
  Check,
  AlertCircle,
  Shield,
  Users,
} from 'lucide-react';

import {
  useCalculateLinkMeMargins,
  LINKME_MARGIN_DEFAULTS,
} from '../hooks/use-linkme-margin-calculator';
import type { LinkMeProductDetail, LinkMePricingUpdate } from '../types';
import { MarginSlider } from './MarginSlider';

// ============================================
// CONSTANTES TVA ET FONCTIONS DE CONVERSION
// ============================================

/**
 * Taux de TVA par défaut (20% France)
 */
const TVA_RATE = 0.2;

/**
 * Convertit un prix TTC en HT
 * Formule : HT = TTC / (1 + TVA) = TTC / 1.20
 */
const ttcToHt = (ttc: number): number => ttc / (1 + TVA_RATE);

/**
 * Convertit un prix HT en TTC
 * Formule : TTC = HT × (1 + TVA) = HT × 1.20
 */
const htToTtc = (ht: number): number => ht * (1 + TVA_RATE);

interface ProductPricingCardProps {
  product: LinkMeProductDetail;
  onSave: (data: LinkMePricingUpdate) => Promise<void>;
  isSaving?: boolean;
}

/**
 * Calcule la complétude de la section Pricing
 * Champs: tarif public, prix de vente, marge min, marge max, marge suggérée, commission
 */
function calculatePricingCompleteness(formData: LinkMePricingUpdate): {
  percentage: number;
  completedCount: number;
  totalCount: number;
} {
  const fields = [
    formData.public_price_ht !== null &&
      formData.public_price_ht !== undefined &&
      formData.public_price_ht > 0,
    formData.custom_price_ht !== null &&
      formData.custom_price_ht !== undefined &&
      formData.custom_price_ht > 0,
    formData.min_margin_rate !== null && formData.min_margin_rate !== undefined,
    formData.max_margin_rate !== null && formData.max_margin_rate !== undefined,
    formData.suggested_margin_rate !== null &&
      formData.suggested_margin_rate !== undefined,
    formData.channel_commission_rate !== null &&
      formData.channel_commission_rate !== undefined,
  ];

  const completedCount = fields.filter(Boolean).length;
  const totalCount = fields.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  return { percentage, completedCount, totalCount };
}

export function ProductPricingCard({
  product,
  onSave,
  isSaving = false,
}: ProductPricingCardProps) {
  const [formData, setFormData] = useState<LinkMePricingUpdate>({
    min_margin_rate: product.min_margin_rate,
    max_margin_rate: product.max_margin_rate,
    suggested_margin_rate: product.suggested_margin_rate,
    channel_commission_rate: product.linkme_commission_rate,
    custom_price_ht: product.selling_price_ht,
    public_price_ht: product.public_price_ht,
    buffer_rate: product.buffer_rate ?? LINKME_MARGIN_DEFAULTS.bufferRate,
  });

  const [isDirty, setIsDirty] = useState(false);

  // État pour la valeur TTC (dérivée du HT stocké)
  const [publicPriceTtc, setPublicPriceTtc] = useState<number | null>(() => {
    const ht = product.public_price_ht;
    return ht !== null && ht !== undefined ? htToTtc(ht) : null;
  });

  // Calcul automatique des marges en temps réel
  // FORMULE CORRECTE: basePriceHT = selling_price_ht (PAS cost_price!)
  // Utilise custom_price_ht du formulaire car il peut être modifié par l'utilisateur
  const marginResult = useCalculateLinkMeMargins(
    formData.custom_price_ht ?? product.selling_price_ht,
    formData.public_price_ht,
    formData.channel_commission_rate,
    formData.buffer_rate ?? LINKME_MARGIN_DEFAULTS.bufferRate
  );

  // Auto-remplissage des marges quand le calcul change
  useEffect(() => {
    if (marginResult?.isProductSellable) {
      // Convertir les taux décimaux en pourcentages pour l'affichage
      const minMarginPercent = Math.round(marginResult.minRate * 100 * 10) / 10;
      const maxMarginPercent = Math.round(marginResult.maxRate * 100 * 10) / 10;
      const suggestedMarginPercent =
        Math.round(marginResult.suggestedRate * 100 * 10) / 10;

      setFormData(prev => ({
        ...prev,
        min_margin_rate: minMarginPercent,
        max_margin_rate: maxMarginPercent,
        suggested_margin_rate: suggestedMarginPercent,
      }));
      setIsDirty(true);
    }
  }, [marginResult]);

  // Reset form when product changes
  useEffect(() => {
    setFormData({
      min_margin_rate: product.min_margin_rate,
      max_margin_rate: product.max_margin_rate,
      suggested_margin_rate: product.suggested_margin_rate,
      channel_commission_rate: product.linkme_commission_rate,
      custom_price_ht: product.selling_price_ht,
      public_price_ht: product.public_price_ht,
      buffer_rate: product.buffer_rate ?? LINKME_MARGIN_DEFAULTS.bufferRate,
    });
    // Mettre à jour TTC depuis le HT du produit
    setPublicPriceTtc(
      product.public_price_ht !== null && product.public_price_ht !== undefined
        ? htToTtc(product.public_price_ht)
        : null
    );
    setIsDirty(false);
  }, [product]);

  // Calcul de la complétude
  const completeness = useMemo(() => {
    return calculatePricingCompleteness(formData);
  }, [formData]);

  // =====================================================
  // PRIX CLIENT LINKME (calculé automatiquement)
  // Prix que le client final paie = prix vente × (1 + commission%)
  // Se met à jour en temps réel quand prix ou commission change
  // =====================================================
  const customerPriceHT = useMemo(() => {
    const sellingPrice = formData.custom_price_ht;
    const commissionRate = formData.channel_commission_rate;

    if (!sellingPrice || sellingPrice <= 0) return null;

    // Commission en % (ex: 5 pour 5%) → convertir en décimal
    const commissionDecimal =
      commissionRate !== null && commissionRate !== undefined
        ? commissionRate / 100
        : 0;

    // Prix client = prix vente × (1 + commission)
    return sellingPrice * (1 + commissionDecimal);
  }, [formData.custom_price_ht, formData.channel_commission_rate]);

  const handleChange = (field: keyof LinkMePricingUpdate, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    setFormData(prev => ({ ...prev, [field]: numValue }));
    setIsDirty(true);
  };

  // Handler modification TTC → met à jour HT automatiquement
  const handlePublicPriceTtcChange = (ttcValue: string) => {
    const ttc = ttcValue === '' ? null : parseFloat(ttcValue);
    setPublicPriceTtc(ttc);

    // Convertir TTC → HT et stocker dans formData
    const htValue = ttc !== null && !isNaN(ttc) ? ttcToHt(ttc) : null;
    setFormData(prev => ({ ...prev, public_price_ht: htValue }));
    setIsDirty(true);
  };

  // Handler modification HT → met à jour TTC automatiquement
  const handlePublicPriceHtChange = (htValue: string) => {
    const ht = htValue === '' ? null : parseFloat(htValue);
    setFormData(prev => ({ ...prev, public_price_ht: ht }));

    // Convertir HT → TTC pour affichage
    setPublicPriceTtc(ht !== null && !isNaN(ht) ? htToTtc(ht) : null);
    setIsDirty(true);
  };

  // Handler spécial pour buffer_rate (conversion % → décimal)
  // L'utilisateur entre 5 pour 5%, on stocke 0.05
  const handleBufferChange = (value: string) => {
    const numValue = value === '' ? null : parseFloat(value) / 100;
    setFormData(prev => ({ ...prev, buffer_rate: numValue }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    await onSave(formData);
    setIsDirty(false);
  };

  // Handler pour copier le prix minimum
  const handleCopyMinPrice = () => {
    if (product.min_selling_price_ht !== null) {
      setFormData(prev => ({
        ...prev,
        custom_price_ht: product.min_selling_price_ht,
      }));
      setIsDirty(true);
    }
  };

  // Vérifications de validation
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

  // Conversion du buffer pour affichage (décimal → pourcentage)
  const bufferDisplayValue =
    formData.buffer_rate !== null && formData.buffer_rate !== undefined
      ? Math.round(formData.buffer_rate * 100 * 10) / 10
      : '';

  // Formater le prix minimum pour affichage
  const formattedMinPrice =
    product.min_selling_price_ht !== null
      ? product.min_selling_price_ht.toFixed(2)
      : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Euro className="h-5 w-5" />
            Pricing & Marges
          </CardTitle>
          {/* Badge de complétude */}
          <Badge
            variant={completeness.percentage === 100 ? 'success' : 'secondary'}
            className="text-sm"
          >
            {completeness.percentage}% complet
          </Badge>
        </div>
        {/* Barre de progression */}
        <Progress value={completeness.percentage} className="h-2 mt-2" />
        <p className="text-xs text-muted-foreground mt-1">
          {completeness.completedCount}/{completeness.totalCount} champs validés
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tarif Public - TTC et HT avec conversion automatique */}
        <div className="space-y-2">
          <Label className="font-medium flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Tarif Public
            {isPublicPriceValid ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
          </Label>

          <div className="grid grid-cols-2 gap-3">
            {/* Champ TTC */}
            <div className="space-y-1">
              <Label
                htmlFor="public-price-ttc"
                className="text-xs text-muted-foreground"
              >
                TTC
              </Label>
              <div className="relative">
                <Input
                  id="public-price-ttc"
                  type="number"
                  step="0.01"
                  min="0"
                  value={
                    publicPriceTtc !== null ? publicPriceTtc.toFixed(2) : ''
                  }
                  onChange={e => handlePublicPriceTtcChange(e.target.value)}
                  className={cn(
                    'font-mono text-lg font-semibold pr-8',
                    !isPublicPriceValid &&
                      'border-amber-300 focus:border-amber-500'
                  )}
                  placeholder="TTC..."
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  €
                </span>
              </div>
            </div>

            {/* Champ HT */}
            <div className="space-y-1">
              <Label
                htmlFor="public-price-ht"
                className="text-xs text-muted-foreground"
              >
                HT
              </Label>
              <div className="relative">
                <Input
                  id="public-price-ht"
                  type="number"
                  step="0.01"
                  min="0"
                  value={
                    formData.public_price_ht !== null &&
                    formData.public_price_ht !== undefined
                      ? formData.public_price_ht.toFixed(2)
                      : ''
                  }
                  onChange={e => handlePublicPriceHtChange(e.target.value)}
                  className={cn(
                    'font-mono text-lg font-semibold pr-8',
                    !isPublicPriceValid &&
                      'border-amber-300 focus:border-amber-500'
                  )}
                  placeholder="HT..."
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  €
                </span>
              </div>
            </div>
          </div>

          {!isPublicPriceValid ? (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Non validé - Saisissez un tarif public
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Prix public conseillé (TVA 20%). Modifiez TTC ou HT, l&apos;autre
              se met à jour.
            </p>
          )}
        </div>

        {/* Prix de vente HT LinkMe - ÉDITABLE avec système de validation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="selling-price"
              className="font-medium flex items-center gap-2"
            >
              Prix de vente HT (LinkMe)
              {isPriceValid ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-amber-500" />
              )}
            </Label>
            {!isPriceValid && formattedMinPrice && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyMinPrice}
                className="h-7 text-xs text-purple-600 hover:text-purple-700"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copier prix minimum ({formattedMinPrice}€)
              </Button>
            )}
          </div>

          {/* Aperçu du prix minimum si non validé */}
          {!isPriceValid && formattedMinPrice && (
            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1 font-medium">
                Prix minimum de vente calculé :
              </p>
              <p className="text-lg font-mono font-semibold text-gray-700">
                {formattedMinPrice} € HT
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Formule: (prix d&apos;achat + éco-taxe) × (1 + marge%)
              </p>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Input
              id="selling-price"
              type="number"
              step="0.01"
              min="0"
              value={formData.custom_price_ht ?? ''}
              onChange={e => handleChange('custom_price_ht', e.target.value)}
              className={cn(
                'font-mono text-lg',
                !isPriceValid && 'border-amber-300 focus:border-amber-500'
              )}
              placeholder="Prix de vente..."
            />
            <span className="text-muted-foreground">€</span>
          </div>
          {!isPriceValid && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Non validé - Copiez ou saisissez un prix de vente
            </p>
          )}
        </div>

        {/* ============================================= */}
        {/* PRIX CLIENT LINKME (CALCULÉ AUTOMATIQUEMENT) */}
        {/* Se met à jour en temps réel quand commission change */}
        {/* ============================================= */}
        <div className="space-y-2">
          <Label className="font-medium flex items-center gap-2 text-purple-700">
            <Users className="h-4 w-4" />
            Prix client LinkMe (calculé)
            <Badge
              variant="outline"
              className="text-xs bg-purple-50 text-purple-700 border-purple-200"
            >
              Auto
            </Badge>
          </Label>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            {customerPriceHT !== null ? (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-purple-700">
                    {customerPriceHT.toFixed(2)} €
                  </span>
                  <span className="text-sm text-purple-600">HT</span>
                </div>
                <p className="text-xs text-purple-600 mt-2 flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  Prix affilié ({formData.custom_price_ht?.toFixed(2)}€) +
                  Commission LinkMe ({formData.channel_commission_rate ?? 0}%)
                </p>
              </>
            ) : (
              <p className="text-sm text-purple-500">
                Renseignez un prix de vente pour voir le prix client
              </p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            C&apos;est ce prix que le client final paiera. La marge disponible
            est calculée entre ce prix et le tarif public.
          </p>
        </div>

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

        {/* Limites de marge pour affiliés */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">
              Paramètres de marge affiliés
            </Label>
            {isMinMarginValid && isMaxMarginValid && isSuggestedMarginValid ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label
                htmlFor="min-margin"
                className="text-xs flex items-center gap-1"
              >
                Marge min (%)
                {isMinMarginValid && (
                  <Check className="h-3 w-3 text-green-600" />
                )}
              </Label>
              <Input
                id="min-margin"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.min_margin_rate ?? ''}
                disabled
                className="font-mono bg-muted cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="suggested-margin"
                className="text-xs flex items-center gap-1"
              >
                Marge suggérée (%)
                {isSuggestedMarginValid && (
                  <Check className="h-3 w-3 text-green-600" />
                )}
              </Label>
              <Input
                id="suggested-margin"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.suggested_margin_rate ?? ''}
                disabled
                className="font-mono bg-muted cursor-not-allowed"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="max-margin"
                className="text-xs flex items-center gap-1"
              >
                Marge max (%)
                {isMaxMarginValid && (
                  <Check className="h-3 w-3 text-green-600" />
                )}
              </Label>
              <Input
                id="max-margin"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={formData.max_margin_rate ?? ''}
                disabled
                className="font-mono bg-muted cursor-not-allowed"
              />
            </div>
          </div>

          {(!isMinMarginValid ||
            !isMaxMarginValid ||
            !isSuggestedMarginValid) && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Renseignez les 3 taux de marge pour valider cette section
            </p>
          )}

          {/* Curseur coloré des zones de marge */}
          {marginResult && marginResult.isProductSellable && (
            <div className="pt-3 border-t">
              <Label className="text-xs text-muted-foreground mb-2 block">
                Zones de marge (calculées automatiquement)
              </Label>
              <MarginSlider
                marginResult={marginResult}
                readOnly
                className="mt-2"
              />
            </div>
          )}

          {/* Message si produit non vendable */}
          {marginResult && !marginResult.isProductSellable && (
            <div className="pt-3 border-t">
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Marge insuffisante - Vérifiez le tarif public et la commission
              </p>
            </div>
          )}
        </div>

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

        {/* Bouton sauvegarde */}
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
